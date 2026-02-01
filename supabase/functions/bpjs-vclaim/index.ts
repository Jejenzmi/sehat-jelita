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

// Generate BPJS Signature: HMAC-SHA256(consumerID&timestamp, consumerSecret) -> Base64
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

// Get BPJS auth headers
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

// Get BPJS config from system_settings
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

// Get base URL
function getBaseUrl(environment: string): string {
  return environment === "production"
    ? "https://apijkn.bpjs-kesehatan.go.id/vclaim-rest"
    : "https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev";
}

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
      // ==================== PESERTA ====================
      case "get_peserta_by_nokartu": {
        const { noKartu, tglSep } = data;
        const response = await fetch(
          `${baseUrl}/Peserta/nokartu/${noKartu}/tglSEP/${tglSep}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "get_peserta_by_nik": {
        const { nik, tglSep } = data;
        const response = await fetch(
          `${baseUrl}/Peserta/nik/${nik}/tglSEP/${tglSep}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      // ==================== SEP ====================
      case "create_sep": {
        const response = await fetch(`${baseUrl}/SEP/2.0/insert`, {
          method: "POST",
          headers,
          body: JSON.stringify({ request: data }),
        });
        result = await response.json();
        break;
      }

      case "update_sep": {
        const response = await fetch(`${baseUrl}/SEP/2.0/update`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ request: data }),
        });
        result = await response.json();
        break;
      }

      case "delete_sep": {
        const { noSep, user } = data;
        const response = await fetch(`${baseUrl}/SEP/2.0/delete`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ request: { t_sep: { noSep, user } } }),
        });
        result = await response.json();
        break;
      }

      case "get_sep": {
        const { noSep } = data;
        const response = await fetch(`${baseUrl}/SEP/${noSep}`, {
          method: "GET",
          headers,
        });
        result = await response.json();
        break;
      }

      // ==================== LPK (Lembar Pengajuan Klaim) ====================
      case "insert_lpk": {
        const response = await fetch(`${baseUrl}/LPK/insert`, {
          method: "POST",
          headers,
          body: JSON.stringify({ request: { t_lpk: data } }),
        });
        result = await response.json();
        break;
      }

      case "update_lpk": {
        const response = await fetch(`${baseUrl}/LPK/update`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ request: { t_lpk: data } }),
        });
        result = await response.json();
        break;
      }

      case "delete_lpk": {
        const { noSep } = data;
        const response = await fetch(`${baseUrl}/LPK/delete`, {
          method: "DELETE",
          headers,
          body: JSON.stringify({ request: { t_lpk: { noSep } } }),
        });
        result = await response.json();
        break;
      }

      case "get_lpk": {
        const { tglMasuk, jnsPelayanan } = data;
        const response = await fetch(
          `${baseUrl}/LPK/TglMasuk/${tglMasuk}/JnsPelayanan/${jnsPelayanan}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      // ==================== MONITORING ====================
      case "monitoring_kunjungan": {
        const { tanggal, jnsPelayanan } = data;
        const response = await fetch(
          `${baseUrl}/Monitoring/Kunjungan/Tanggal/${tanggal}/JnsPelayanan/${jnsPelayanan}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "monitoring_klaim": {
        const { tanggal, jnsPelayanan, status } = data;
        const response = await fetch(
          `${baseUrl}/Monitoring/Klaim/Tanggal/${tanggal}/JnsPelayanan/${jnsPelayanan}/Status/${status}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "monitoring_histori_pelayanan": {
        const { noKartu, tglMulai, tglAkhir } = data;
        const response = await fetch(
          `${baseUrl}/monitoring/HistoriPelayanan/NoKartu/${noKartu}/tglMulai/${tglMulai}/tglAkhir/${tglAkhir}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "monitoring_jasa_raharja": {
        const { jnsPelayanan, tglMulai, tglAkhir } = data;
        const response = await fetch(
          `${baseUrl}/monitoring/JasaRaharja/JnsPelayanan/${jnsPelayanan}/tglMulai/${tglMulai}/tglAkhir/${tglAkhir}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      // ==================== REFERENSI ====================
      case "ref_diagnosa": {
        const { keyword } = data;
        const response = await fetch(
          `${baseUrl}/referensi/diagnosa/${keyword}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "ref_prosedur": {
        const { keyword } = data;
        const response = await fetch(
          `${baseUrl}/referensi/procedure/${keyword}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "ref_poli": {
        const { keyword } = data;
        const response = await fetch(
          `${baseUrl}/referensi/poli/${keyword}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "ref_faskes": {
        const { keyword, jenisFaskes } = data;
        const response = await fetch(
          `${baseUrl}/referensi/faskes/${keyword}/${jenisFaskes}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "ref_dokter": {
        const { jnsPelayanan, tglPelayanan, spesialisasi } = data;
        const response = await fetch(
          `${baseUrl}/referensi/dokter/pelayanan/${jnsPelayanan}/tglPelayanan/${tglPelayanan}/Spesialis/${spesialisasi}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "ref_ruang_rawat": {
        const response = await fetch(
          `${baseUrl}/referensi/ruangrawat`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "ref_cara_keluar": {
        const response = await fetch(
          `${baseUrl}/referensi/carakeluar`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "ref_kondisi_pulang": {
        const response = await fetch(
          `${baseUrl}/referensi/pascapulang`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Log API call
    await supabase.from("audit_logs").insert({
      table_name: "bpjs_vclaim",
      action: action.toUpperCase(),
      new_data: { action, timestamp, response_code: result?.metaData?.code },
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("BPJS VClaim error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
