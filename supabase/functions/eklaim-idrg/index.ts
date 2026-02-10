// E-Klaim IDRG Edge Function
// Full bridging implementation for all 31 E-Klaim IDRG API endpoints
// Endpoint: http://server/E-Klaim/ws.php
// Uses symmetric encryption (AES-256-CBC) for request/response

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EklaimConfig {
  base_url: string;       // e.g., http://192.168.1.100
  encryption_key: string; // Generated from E-Klaim app
  kode_tarif: string;     // Kode tarif RS
  debug_mode: boolean;
}

// ============================================
// Encryption / Decryption (E-Klaim symmetric)
// ============================================

async function eklaimEncrypt(plaintext: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyHash = await crypto.subtle.digest("SHA-256", encoder.encode(key));
  const keyBytes = new Uint8Array(keyHash);
  const iv = keyBytes.slice(0, 16);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv }, cryptoKey, encoder.encode(plaintext)
  );

  return base64Encode(encrypted as ArrayBuffer);
}

async function eklaimDecrypt(ciphertext: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const keyHash = await crypto.subtle.digest("SHA-256", encoder.encode(key));
  const keyBytes = new Uint8Array(keyHash);
  const iv = keyBytes.slice(0, 16);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "AES-CBC" }, false, ["decrypt"]
  );

  const encryptedData = base64Decode(ciphertext);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv }, cryptoKey, encryptedData
  );

  return decoder.decode(decrypted);
}

// ============================================
// Send request to E-Klaim ws.php
// ============================================

async function sendToEklaim(config: EklaimConfig, method: string, data: Record<string, any>): Promise<any> {
  const jsonRequest = JSON.stringify({ metadata: { method }, data });
  const debugParam = config.debug_mode ? "?mode=debug" : "";
  const url = `${config.base_url}/E-Klaim/ws.php${debugParam}`;

  let body: string;
  if (config.debug_mode) {
    body = jsonRequest;
  } else {
    body = await eklaimEncrypt(jsonRequest, config.encryption_key);
  }

  console.log(`[eKlaim-IDRG] ${method} -> ${url}`);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const responseText = await response.text();

  if (config.debug_mode) {
    try {
      return JSON.parse(responseText);
    } catch {
      return { raw: responseText };
    }
  }

  // Decrypt response
  try {
    const cleaned = responseText
      .replace("----BEGIN ENCRYPTED DATA------", "")
      .replace("----END ENCRYPTED DATA------", "")
      .trim();
    const decrypted = await eklaimDecrypt(cleaned, config.encryption_key);
    return JSON.parse(decrypted);
  } catch (e) {
    console.error("[eKlaim-IDRG] Decrypt error:", e);
    return { raw: responseText, error: "Failed to decrypt response" };
  }
}

// ============================================
// Get E-Klaim Config from DB
// ============================================

async function getEklaimConfig(supabase: any): Promise<EklaimConfig | null> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "eklaim_config")
    .single();

  if (error || !data) {
    // Fallback to bpjs_config
    const { data: bpjsData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "bpjs_config")
      .single();

    if (!bpjsData?.value?.eklaim_base_url) return null;

    return {
      base_url: bpjsData.value.eklaim_base_url,
      encryption_key: bpjsData.value.eklaim_key || "",
      kode_tarif: bpjsData.value.kode_tarif || "",
      debug_mode: bpjsData.value.eklaim_debug || false,
    };
  }

  const cfg = data.value;
  return {
    base_url: cfg.base_url,
    encryption_key: cfg.encryption_key,
    kode_tarif: cfg.kode_tarif || "",
    debug_mode: cfg.debug_mode || false,
  };
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

    const config = await getEklaimConfig(supabase);
    if (!config) {
      return new Response(
        JSON.stringify({ error: "E-Klaim belum dikonfigurasi. Silakan atur di Pengaturan > Integrasi Eksternal." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: any;

    switch (action) {
      // ==================== #00 NEW CLAIM ====================
      case "new_claim": {
        const { nomor_kartu, nomor_sep, nomor_rm, nama_pasien, tgl_lahir, gender } = data;
        result = await sendToEklaim(config, "new_claim", {
          nomor_kartu,
          nomor_sep,
          nomor_rm,
          nama_pasien,
          tgl_lahir,
          gender, // 1=L, 2=P
        });
        break;
      }

      // ==================== #01 SET CLAIM DATA ====================
      case "set_claim_data": {
        result = await sendToEklaim(config, "set_claim_data", {
          nomor_sep: data.nomor_sep,
          nomor_kartu: data.nomor_kartu,
          tgl_masuk: data.tgl_masuk,
          tgl_pulang: data.tgl_pulang,
          cara_masuk: data.cara_masuk,
          jenis_rawat: data.jenis_rawat, // 1=RI, 2=RJ
          kelas_rawat: data.kelas_rawat, // 1,2,3
          adl_sub_acute: data.adl_sub_acute || 0,
          adl_chronic: data.adl_chronic || 0,
          icu_indikator: data.icu_indikator || 0,
          icu_los: data.icu_los || 0,
          ventilator_hour: data.ventilator_hour || 0,
          upgrade_class_ind: data.upgrade_class_ind || 0,
          upgrade_class_class: data.upgrade_class_class || "",
          upgrade_class_los: data.upgrade_class_los || 0,
          add_payment_pct: data.add_payment_pct || 0,
          birth_weight: data.birth_weight || 0,
          discharge_status: data.discharge_status,
          diagnosa_awal: data.diagnosa_awal || "",
          sistole: data.sistole || 0,
          diastole: data.diastole || 0,
          heart_rate: data.heart_rate || 0,
          respiratory_rate: data.respiratory_rate || 0,
          temperature: data.temperature || 0,
          nama_dokter: data.nama_dokter || "",
          kode_tarif: data.kode_tarif || config.kode_tarif,
          payor_id: data.payor_id || 3, // 1=JKN, 2=Non-JKN, 3=JKN
          payor_cd: data.payor_cd || "JKN",
          coder_nik: data.coder_nik || "",
        });
        break;
      }

      // ==================== #02 IDRG DIAGNOSA SET ====================
      case "set_diagnosa_idrg": {
        // diagnosa format: "A00.0#B00.1#C00.2" (separated by #)
        result = await sendToEklaim(config, "set_diagnosa_idrg", {
          nomor_sep: data.nomor_sep,
          diagnosa: data.diagnosa, // string separated by #
        });
        break;
      }

      // ==================== #03 IDRG DIAGNOSA GET ====================
      case "get_diagnosa_idrg": {
        result = await sendToEklaim(config, "get_diagnosa_idrg", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #04 IDRG PROCEDURE SET ====================
      case "set_procedure_idrg": {
        // procedure format: "00.01#00.02" (separated by #)
        result = await sendToEklaim(config, "set_procedure_idrg", {
          nomor_sep: data.nomor_sep,
          procedure: data.procedure, // string separated by #
        });
        break;
      }

      // ==================== #05 IDRG PROCEDURE GET ====================
      case "get_procedure_idrg": {
        result = await sendToEklaim(config, "get_procedure_idrg", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #06 GROUPING IDRG ====================
      case "grouper_idrg": {
        result = await sendToEklaim(config, "grouper_idrg", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #07 FINAL IDRG ====================
      case "final_idrg": {
        result = await sendToEklaim(config, "final_idrg", {
          nomor_sep: data.nomor_sep,
          coder_nik: data.coder_nik || "",
        });
        break;
      }

      // ==================== #08 RE-EDIT IDRG ====================
      case "reedit_idrg": {
        result = await sendToEklaim(config, "reedit_idrg", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #09 IDRG TO INACBG IMPORT ====================
      case "idrg_to_inacbg": {
        result = await sendToEklaim(config, "idrg_to_inacbg", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #10 INACBG DIAGNOSA SET ====================
      case "set_diagnosa": {
        result = await sendToEklaim(config, "set_diagnosa", {
          nomor_sep: data.nomor_sep,
          diagnosa: data.diagnosa,
        });
        break;
      }

      // ==================== #11 INACBG DIAGNOSA GET ====================
      case "get_diagnosa": {
        result = await sendToEklaim(config, "get_diagnosa", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #12 INACBG PROCEDURE SET ====================
      case "set_procedure": {
        result = await sendToEklaim(config, "set_procedure", {
          nomor_sep: data.nomor_sep,
          procedure: data.procedure,
        });
        break;
      }

      // ==================== #13 INACBG PROCEDURE GET ====================
      case "get_procedure": {
        result = await sendToEklaim(config, "get_procedure", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #14 GROUPING INACBG STAGE 1 ====================
      case "grouper": {
        result = await sendToEklaim(config, "grouper", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #15 GROUPING INACBG STAGE 2 ====================
      case "grouper_stage2": {
        result = await sendToEklaim(config, "grouper_stage2", {
          nomor_sep: data.nomor_sep,
          special_subacute: data.special_subacute || 0,
          special_chronic: data.special_chronic || 0,
          special_top_up: data.special_top_up || [],
          special_procedure: data.special_procedure || [],
        });
        break;
      }

      // ==================== #16 FINAL INACBG ====================
      case "final_inacbg": {
        result = await sendToEklaim(config, "final", {
          nomor_sep: data.nomor_sep,
          coder_nik: data.coder_nik || "",
        });
        break;
      }

      // ==================== #17 RE-EDIT INACBG ====================
      case "reedit_inacbg": {
        result = await sendToEklaim(config, "reedit", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #18 CLAIM FINAL ====================
      case "claim_final": {
        result = await sendToEklaim(config, "claim_final", {
          nomor_sep: data.nomor_sep,
          coder_nik: data.coder_nik || "",
        });
        break;
      }

      // ==================== #19 CLAIM RE-EDIT ====================
      case "claim_reedit": {
        result = await sendToEklaim(config, "claim_reedit", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #20 CLAIM SEND ====================
      case "claim_send": {
        result = await sendToEklaim(config, "claim_send", {
          nomor_sep: data.nomor_sep,
          coder_nik: data.coder_nik || "",
        });
        break;
      }

      // ==================== #21 GET CLAIM DATA ====================
      case "get_claim_data": {
        result = await sendToEklaim(config, "get_claim_data", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== #22 IDRG SEARCH DIAGNOSA ====================
      case "search_diagnosa_idrg": {
        result = await sendToEklaim(config, "search_diagnosa_idrg", {
          keyword: data.keyword,
        });
        break;
      }

      // ==================== #23 IDRG SEARCH PROCEDURES ====================
      case "search_procedure_idrg": {
        result = await sendToEklaim(config, "search_procedure_idrg", {
          keyword: data.keyword,
        });
        break;
      }

      // ==================== #24 INACBG SEARCH DIAGNOSA ====================
      case "search_diagnosa": {
        result = await sendToEklaim(config, "search_diagnosa", {
          keyword: data.keyword,
        });
        break;
      }

      // ==================== #25 INACBG SEARCH PROCEDURES ====================
      case "search_procedure": {
        result = await sendToEklaim(config, "search_procedure", {
          keyword: data.keyword,
        });
        break;
      }

      // ==================== #26 CETAK KLAIM ====================
      case "cetak_klaim": {
        result = await sendToEklaim(config, "cetak_klaim", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== UTILS: UPDATE PATIENT ====================
      case "update_patient": {
        result = await sendToEklaim(config, "update_patient", {
          nomor_sep: data.nomor_sep,
          nomor_kartu: data.nomor_kartu,
          nomor_rm: data.nomor_rm,
          nama_pasien: data.nama_pasien,
          tgl_lahir: data.tgl_lahir,
          gender: data.gender,
        });
        break;
      }

      // ==================== UTILS: DELETE PATIENT ====================
      case "delete_patient": {
        result = await sendToEklaim(config, "delete_patient", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== UTILS: DELETE CLAIM DATA ====================
      case "delete_claim_data": {
        result = await sendToEklaim(config, "delete_claim_data", {
          nomor_sep: data.nomor_sep,
        });
        break;
      }

      // ==================== SET ENCOUNTER RME ====================
      case "set_encounter_rme": {
        result = await sendToEklaim(config, "set_encounter_rme", {
          nomor_sep: data.nomor_sep,
          nomor_kartu: data.nomor_kartu,
          tgl_masuk: data.tgl_masuk,
          tgl_pulang: data.tgl_pulang,
          jenis_rawat: data.jenis_rawat,
          kelas_rawat: data.kelas_rawat,
          nama_dokter: data.nama_dokter,
          diagnosa: data.diagnosa,
          procedure: data.procedure,
          discharge_status: data.discharge_status,
        });
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}. Available actions: new_claim, set_claim_data, set_diagnosa_idrg, get_diagnosa_idrg, set_procedure_idrg, get_procedure_idrg, grouper_idrg, final_idrg, reedit_idrg, idrg_to_inacbg, set_diagnosa, get_diagnosa, set_procedure, get_procedure, grouper, grouper_stage2, final_inacbg, reedit_inacbg, claim_final, claim_reedit, claim_send, get_claim_data, search_diagnosa_idrg, search_procedure_idrg, search_diagnosa, search_procedure, cetak_klaim, update_patient, delete_patient, delete_claim_data, set_encounter_rme` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[eKlaim-IDRG] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
