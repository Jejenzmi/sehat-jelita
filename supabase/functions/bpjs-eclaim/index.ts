// BPJS E-Claim Edge Function
// Handles Medical Record submission to BPJS E-Rekam Medis endpoint
// Implements FHIR Bundle structure with GZIP compression + AES-256-CBC encryption

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BPJSConfig {
  consumer_id: string;
  consumer_secret: string;
  user_key: string;
  provider_code: string;
  environment: string;
}

// ============================================
// BPJS Security Functions
// ============================================

async function generateSignature(consumerId: string, consumerSecret: string, timestamp: string): Promise<string> {
  const encoder = new TextEncoder();
  const message = `${consumerId}&${timestamp}`;
  
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(consumerSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64Encode(signature);
}

async function getBPJSHeaders(config: BPJSConfig): Promise<{ headers: Record<string, string>; timestamp: string }> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await generateSignature(config.consumer_id, config.consumer_secret, timestamp);
  
  return {
    headers: {
      "Content-Type": "application/json",
      "X-cons-id": config.consumer_id,
      "X-timestamp": timestamp,
      "X-signature": signature,
      "user_key": config.user_key,
    },
    timestamp,
  };
}

// ============================================
// GZIP Compression
// ============================================

async function compressGzip(data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const input = encoder.encode(data);
  
  const compressedStream = new Blob([input]).stream().pipeThrough(
    new CompressionStream("gzip")
  );
  
  const chunks: Uint8Array[] = [];
  const reader = compressedStream.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

// ============================================
// AES-256-CBC Encryption for E-Claim
// ============================================

async function generateAESKey(keyString: string): Promise<{ key: CryptoKey; iv: Uint8Array }> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(keyString));
  const hashArray = new Uint8Array(hashBuffer);
  const iv = hashArray.slice(0, 16);
  
  const key = await crypto.subtle.importKey(
    "raw",
    hashArray,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  
  return { key, iv };
}

async function encryptAES256CBC(data: Uint8Array, keyString: string): Promise<string> {
  const { key, iv } = await generateAESKey(keyString);
  
  const ivBuffer = new ArrayBuffer(iv.length);
  new Uint8Array(ivBuffer).set(iv);
  
  const dataBuffer = new ArrayBuffer(data.length);
  new Uint8Array(dataBuffer).set(data);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: ivBuffer },
    key,
    dataBuffer
  );
  
  return base64Encode(encrypted as ArrayBuffer);
}

async function encryptMedicalRecordData(
  data: any,
  consId: string,
  secretKey: string,
  kodeRS: string
): Promise<string> {
  const jsonString = JSON.stringify(data);
  const key = consId + secretKey + kodeRS;
  
  console.log("[eClaim] Processing data encryption...");
  console.log("[eClaim] Key pattern:", `${consId.substring(0, 4)}...+secret+${kodeRS}`);
  
  // Step 1: GZIP compress
  const compressed = await compressGzip(jsonString);
  console.log(`[eClaim] Compressed: ${jsonString.length} bytes -> ${compressed.length} bytes`);
  
  // Step 2: AES-256-CBC encrypt
  const encrypted = await encryptAES256CBC(compressed, key);
  console.log(`[eClaim] Encrypted data length: ${encrypted.length} chars`);
  
  return encrypted;
}

// ============================================
// Get BPJS Config
// ============================================

async function getBPJSConfig(supabase: any): Promise<BPJSConfig | null> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "bpjs_config")
    .single();

  if (error || !data) return null;
  
  const config = data.value;
  if (!config.is_enabled) return null;
  
  return {
    consumer_id: config.consumer_id,
    consumer_secret: config.consumer_secret,
    user_key: config.user_key,
    provider_code: config.provider_code,
    environment: config.environment || "development",
  };
}

function getBaseUrl(environment: string): string {
  return environment === "production"
    ? "https://apijkn.bpjs-kesehatan.go.id/erekammedis"
    : "https://apijkn-dev.bpjs-kesehatan.go.id/erekammedis_dev";
}

// ============================================
// Main Handler
// ============================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, data } = await req.json();
    
    const config = await getBPJSConfig(supabase);
    if (!config) {
      return new Response(
        JSON.stringify({ error: "BPJS integration not configured or disabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = getBaseUrl(config.environment);
    const { headers, timestamp } = await getBPJSHeaders(config);
    
    let result;

    switch (action) {
      // ==================== INSERT MEDICAL RECORD ====================
      case "insert_medical_record": {
        const { noSep, jnsPelayanan, bulan, tahun, mrBundle } = data;
        
        console.log(`[eClaim] Insert MR for SEP: ${noSep}`);
        
        // Encrypt the medical record bundle
        const encryptedData = await encryptMedicalRecordData(
          mrBundle,
          config.consumer_id,
          config.consumer_secret,
          config.provider_code
        );
        
        const requestPayload = {
          request: {
            noSep,
            jnsPelayanan,
            bulan,
            tahun,
            dataMR: encryptedData,
          },
        };
        
        console.log(`[eClaim] Sending to ${baseUrl}/insert`);
        
        const response = await fetch(`${baseUrl}/insert`, {
          method: "POST",
          headers,
          body: JSON.stringify(requestPayload),
        });
        
        result = await response.json();
        console.log("[eClaim] Response:", JSON.stringify(result));
        break;
      }

      // ==================== UPDATE MEDICAL RECORD ====================
      case "update_medical_record": {
        const { noSep, jnsPelayanan, bulan, tahun, mrBundle } = data;
        
        console.log(`[eClaim] Update MR for SEP: ${noSep}`);
        
        const encryptedData = await encryptMedicalRecordData(
          mrBundle,
          config.consumer_id,
          config.consumer_secret,
          config.provider_code
        );
        
        const requestPayload = {
          request: {
            noSep,
            jnsPelayanan,
            bulan,
            tahun,
            dataMR: encryptedData,
          },
        };
        
        const response = await fetch(`${baseUrl}/update`, {
          method: "PUT",
          headers,
          body: JSON.stringify(requestPayload),
        });
        
        result = await response.json();
        break;
      }

      // ==================== DELETE MEDICAL RECORD ====================
      case "delete_medical_record": {
        const { noSep } = data;
        
        console.log(`[eClaim] Delete MR for SEP: ${noSep}`);
        
        const response = await fetch(`${baseUrl}/delete`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ request: { noSep } }),
        });
        
        result = await response.json();
        break;
      }

      // ==================== GET MEDICAL RECORD STATUS ====================
      case "get_medical_record": {
        const { noSep } = data;
        
        console.log(`[eClaim] Get MR status for SEP: ${noSep}`);
        
        const response = await fetch(`${baseUrl}/${noSep}`, {
          method: "GET",
          headers,
        });
        
        result = await response.json();
        break;
      }

      // ==================== GET MR BY DATE RANGE ====================
      case "get_medical_records_by_date": {
        const { tglMulai, tglAkhir, jnsPelayanan } = data;
        
        console.log(`[eClaim] Get MR list: ${tglMulai} - ${tglAkhir}`);
        
        const response = await fetch(
          `${baseUrl}/tglMulai/${tglMulai}/tglAkhir/${tglAkhir}/jnsPelayanan/${jnsPelayanan}`,
          { method: "GET", headers }
        );
        
        result = await response.json();
        break;
      }

      // ==================== GET MR PENDING (BELUM VERIFIKASI) ====================
      case "get_pending_medical_records": {
        const { bulan, tahun, jnsPelayanan } = data;
        
        console.log(`[eClaim] Get pending MR: ${bulan}/${tahun}`);
        
        const response = await fetch(
          `${baseUrl}/pending/bulan/${bulan}/tahun/${tahun}/jnsPelayanan/${jnsPelayanan}`,
          { method: "GET", headers }
        );
        
        result = await response.json();
        break;
      }

      // ==================== MONITORING E-CLAIM ====================
      case "monitoring_eclaim": {
        const { bulan, tahun, jnsPelayanan, status } = data;
        
        console.log(`[eClaim] Monitoring: ${bulan}/${tahun}, status: ${status}`);
        
        const response = await fetch(
          `${baseUrl}/monitoring/bulan/${bulan}/tahun/${tahun}/jnsPelayanan/${jnsPelayanan}/status/${status}`,
          { method: "GET", headers }
        );
        
        result = await response.json();
        break;
      }

      // ==================== REFERENSI ICD-10 (DIAGNOSA) ====================
      case "ref_icd10": {
        const { keyword } = data;
        
        const response = await fetch(
          `${baseUrl}/referensi/diagnosa/${encodeURIComponent(keyword)}`,
          { method: "GET", headers }
        );
        
        result = await response.json();
        break;
      }

      // ==================== REFERENSI ICD-9 (PROSEDUR) ====================
      case "ref_icd9": {
        const { keyword } = data;
        
        const response = await fetch(
          `${baseUrl}/referensi/procedure/${encodeURIComponent(keyword)}`,
          { method: "GET", headers }
        );
        
        result = await response.json();
        break;
      }

      // ==================== REFERENSI TARIF RS ====================
      case "ref_tarif_rs": {
        const { kodeInacbg } = data;
        
        const response = await fetch(
          `${baseUrl}/referensi/tarifrs/${kodeInacbg}`,
          { method: "GET", headers }
        );
        
        result = await response.json();
        break;
      }

      // ==================== GROUPING TARIF (INA-CBG) ====================
      case "grouping_tarif": {
        const { noSep } = data;
        
        console.log(`[eClaim] Grouping tarif for SEP: ${noSep}`);
        
        const response = await fetch(`${baseUrl}/grouper/${noSep}`, {
          method: "GET",
          headers,
        });
        
        result = await response.json();
        break;
      }

      // ==================== FINALISASI KLAIM ====================
      case "finalisasi_klaim": {
        const { noSep, coder } = data;
        
        console.log(`[eClaim] Finalisasi klaim SEP: ${noSep}`);
        
        const response = await fetch(`${baseUrl}/finalisasi`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            request: {
              noSep,
              coder: coder || "SYSTEM",
            },
          }),
        });
        
        result = await response.json();
        break;
      }

      // ==================== BATAL FINALISASI ====================
      case "batal_finalisasi": {
        const { noSep } = data;
        
        console.log(`[eClaim] Batal finalisasi SEP: ${noSep}`);
        
        const response = await fetch(`${baseUrl}/finalisasi/batal`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ request: { noSep } }),
        });
        
        result = await response.json();
        break;
      }

      // ==================== GET KLAIM FINAL ====================
      case "get_klaim_final": {
        const { bulan, tahun, jnsPelayanan } = data;
        
        const response = await fetch(
          `${baseUrl}/klaim/bulan/${bulan}/tahun/${tahun}/jnsPelayanan/${jnsPelayanan}`,
          { method: "GET", headers }
        );
        
        result = await response.json();
        break;
      }

      // ==================== SPECIAL CASE: CMG (CASE MIX GROUP) ====================
      case "get_cmg": {
        const { noSep } = data;
        
        const response = await fetch(`${baseUrl}/cmg/${noSep}`, {
          method: "GET",
          headers,
        });
        
        result = await response.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[eClaim] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
