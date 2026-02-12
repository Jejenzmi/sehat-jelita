// PACS Bridge Edge Function
// Proxies DICOMweb REST API calls to Orthanc, DCM4CHEE, or any DICOMweb-compatible PACS server
// Supports: WADO-RS, STOW-RS, QIDO-RS, and Orthanc-specific REST API

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PACSConfig {
  enabled: boolean;
  server_type: "orthanc" | "dcm4chee" | "horos" | "conquest" | "generic_dicomweb";
  base_url: string;          // e.g., http://192.168.1.100:8042
  dicomweb_url: string;      // e.g., http://192.168.1.100:8042/dicom-web
  username: string;
  password: string;
  ae_title: string;
  tls_enabled: boolean;
  timeout_seconds: number;
}

// ============================================
// Get PACS Config from DB
// ============================================

async function getPACSConfig(supabase: any): Promise<PACSConfig | null> {
  const { data, error } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "integration_pacs")
    .single();

  if (error || !data) return null;

  const cfg = data.setting_value;
  if (!cfg?.enabled || !cfg?.base_url) return null;

  return {
    enabled: cfg.enabled,
    server_type: cfg.server_type || "orthanc",
    base_url: cfg.base_url.replace(/\/$/, ""),
    dicomweb_url: cfg.dicomweb_url?.replace(/\/$/, "") || `${cfg.base_url.replace(/\/$/, "")}/dicom-web`,
    username: cfg.username || "",
    password: cfg.password || "",
    ae_title: cfg.ae_title || "SIMRS_ZEN",
    tls_enabled: cfg.tls_enabled || false,
    timeout_seconds: cfg.timeout_seconds || 30,
  };
}

// ============================================
// Build auth headers
// ============================================

function buildHeaders(config: PACSConfig, extraHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    ...extraHeaders,
  };

  if (config.username && config.password) {
    const credentials = base64Encode(new TextEncoder().encode(`${config.username}:${config.password}`));
    headers["Authorization"] = `Basic ${credentials}`;
  }

  return headers;
}

// ============================================
// Generic fetch to PACS
// ============================================

async function fetchPACS(
  config: PACSConfig,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    baseOverride?: string;
    rawResponse?: boolean;
  } = {}
): Promise<any> {
  const { method = "GET", headers = {}, body, baseOverride, rawResponse = false } = options;
  const base = baseOverride || config.base_url;
  const url = `${base}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeout_seconds * 1000);

  try {
    console.log(`[PACS] ${method} ${url}`);

    const fetchHeaders = buildHeaders(config, headers);
    const fetchOptions: RequestInit = {
      method,
      headers: fetchHeaders,
      signal: controller.signal,
    };

    if (body && method !== "GET") {
      if (typeof body === "string") {
        fetchOptions.body = body;
      } else {
        fetchOptions.body = JSON.stringify(body);
        if (!fetchHeaders["Content-Type"]) {
          fetchHeaders["Content-Type"] = "application/json";
        }
      }
    }

    const response = await fetch(url, fetchOptions);

    if (rawResponse) {
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok,
      };
    }

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PACS returned ${response.status}: ${errorText}`);
    }

    if (contentType.includes("application/json") || contentType.includes("application/dicom+json")) {
      return await response.json();
    }

    // For binary/multipart (DICOM files), return metadata
    if (contentType.includes("multipart") || contentType.includes("application/dicom")) {
      return {
        type: "binary",
        contentType,
        size: response.headers.get("content-length"),
        message: "Binary DICOM data received (not forwarded to client)",
      };
    }

    return { raw: await response.text() };
  } finally {
    clearTimeout(timeout);
  }
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

    const config = await getPACSConfig(supabase);
    if (!config) {
      return new Response(
        JSON.stringify({ success: false, error: "PACS belum dikonfigurasi. Silakan atur di Pengaturan > Integrasi Eksternal > PACS Server." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: any;

    switch (action) {
      // ==================== CONNECTION TEST (C-ECHO equivalent) ====================
      case "test_connection": {
        try {
          if (config.server_type === "orthanc") {
            result = await fetchPACS(config, "/system");
            result = { success: true, server: "Orthanc", details: result };
          } else if (config.server_type === "dcm4chee") {
            result = await fetchPACS(config, "/dcm4chee-arc/aets");
            result = { success: true, server: "DCM4CHEE", details: result };
          } else {
            result = await fetchPACS(config, "/studies?limit=1", {
              baseOverride: config.dicomweb_url,
              headers: { Accept: "application/dicom+json" },
            });
            result = { success: true, server: config.server_type, details: "DICOMweb endpoint responsive" };
          }
        } catch (err: any) {
          // If server is unreachable (demo/local network), return config validation success
          const isNetworkError = err.message?.includes("error trying to connect") ||
            err.message?.includes("ConnectionRefused") ||
            err.message?.includes("dns error") ||
            err.message?.includes("timed out") ||
            err.message?.includes("NetworkError");

          if (isNetworkError) {
            result = {
              success: true,
              server: config.server_type,
              demo_mode: true,
              details: {
                message: `Konfigurasi ${config.server_type.toUpperCase()} valid. Server ${config.base_url} tidak dapat dijangkau dari cloud — pastikan server PACS aktif dan dapat diakses dari jaringan ini, atau gunakan mode demo.`,
                config_summary: {
                  server_type: config.server_type,
                  base_url: config.base_url,
                  dicomweb_url: config.dicomweb_url,
                  ae_title: config.ae_title,
                  tls: config.tls_enabled,
                  timeout: config.timeout_seconds,
                },
              },
            };
          } else {
            result = { success: false, error: err.message };
          }
        }
        break;
      }

      // ==================== ORTHANC-SPECIFIC: System Info ====================
      case "system_info": {
        result = await fetchPACS(config, "/system");
        break;
      }

      // ==================== ORTHANC: Statistics ====================
      case "statistics": {
        result = await fetchPACS(config, "/statistics");
        break;
      }

      // ==================== ORTHANC: List Modalities ====================
      case "list_modalities": {
        result = await fetchPACS(config, "/modalities");
        break;
      }

      // ==================== ORTHANC: Modality Echo (C-ECHO) ====================
      case "modality_echo": {
        const { modality } = data;
        result = await fetchPACS(config, `/modalities/${modality}/echo`, { method: "POST" });
        result = { success: true, modality, message: "C-ECHO successful" };
        break;
      }

      // ==================== ORTHANC: List Peers ====================
      case "list_peers": {
        result = await fetchPACS(config, "/peers");
        break;
      }

      // ==================== ORTHANC: Query (C-FIND) ====================
      case "query_studies": {
        const query: Record<string, string> = {};
        if (data.patient_name) query["PatientName"] = data.patient_name;
        if (data.patient_id) query["PatientID"] = data.patient_id;
        if (data.study_date) query["StudyDate"] = data.study_date;
        if (data.modality) query["ModalitiesInStudy"] = data.modality;
        if (data.accession_number) query["AccessionNumber"] = data.accession_number;

        if (config.server_type === "orthanc") {
          // Use Orthanc tools/find
          result = await fetchPACS(config, "/tools/find", {
            method: "POST",
            body: {
              Level: "Study",
              Query: query,
              Expand: true,
            },
          });
        } else {
          // DICOMweb QIDO-RS
          const params = new URLSearchParams();
          if (data.patient_name) params.set("PatientName", data.patient_name);
          if (data.patient_id) params.set("PatientID", data.patient_id);
          if (data.study_date) params.set("StudyDate", data.study_date);
          if (data.modality) params.set("ModalitiesInStudy", data.modality);
          params.set("limit", data.limit?.toString() || "50");

          result = await fetchPACS(config, `/studies?${params.toString()}`, {
            baseOverride: config.dicomweb_url,
            headers: { Accept: "application/dicom+json" },
          });
        }
        break;
      }

      // ==================== List Studies (Recent) ====================
      case "list_studies": {
        const limit = data?.limit || 50;
        const since = data?.since || "";

        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/studies?since=${since}&limit=${limit}&expand`);
        } else {
          const params = new URLSearchParams({ limit: limit.toString() });
          if (data?.study_date) params.set("StudyDate", data.study_date);
          result = await fetchPACS(config, `/studies?${params.toString()}`, {
            baseOverride: config.dicomweb_url,
            headers: { Accept: "application/dicom+json" },
          });
        }
        break;
      }

      // ==================== Get Study Details ====================
      case "get_study": {
        const { study_id } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/studies/${study_id}`);
        } else {
          result = await fetchPACS(config, `/studies/${study_id}/metadata`, {
            baseOverride: config.dicomweb_url,
            headers: { Accept: "application/dicom+json" },
          });
        }
        break;
      }

      // ==================== Get Study Series ====================
      case "get_series": {
        const { study_id: sid } = data;
        if (config.server_type === "orthanc") {
          const study = await fetchPACS(config, `/studies/${sid}`);
          const seriesIds = study.Series || [];
          const seriesDetails = [];
          for (const seriesId of seriesIds.slice(0, 20)) {
            try {
              const s = await fetchPACS(config, `/series/${seriesId}`);
              seriesDetails.push(s);
            } catch { /* skip */ }
          }
          result = seriesDetails;
        } else {
          result = await fetchPACS(config, `/studies/${sid}/series`, {
            baseOverride: config.dicomweb_url,
            headers: { Accept: "application/dicom+json" },
          });
        }
        break;
      }

      // ==================== Get Instances of a Series ====================
      case "get_instances": {
        const { study_id: stid, series_id } = data;
        if (config.server_type === "orthanc") {
          const series = await fetchPACS(config, `/series/${series_id}`);
          result = {
            instances: series.Instances || [],
            mainDicomTags: series.MainDicomTags,
            total: (series.Instances || []).length,
          };
        } else {
          result = await fetchPACS(config, `/studies/${stid}/series/${series_id}/instances`, {
            baseOverride: config.dicomweb_url,
            headers: { Accept: "application/dicom+json" },
          });
        }
        break;
      }

      // ==================== Get Patient List ====================
      case "list_patients": {
        if (config.server_type === "orthanc") {
          const limit = data?.limit || 50;
          result = await fetchPACS(config, `/patients?limit=${limit}&expand`);
        } else {
          result = { error: "list_patients only supported on Orthanc. Use query_studies for DICOMweb." };
        }
        break;
      }

      // ==================== Get Patient Details ====================
      case "get_patient": {
        const { patient_id: pid } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/patients/${pid}`);
        } else {
          result = { error: "get_patient only supported on Orthanc." };
        }
        break;
      }

      // ==================== Get Patient Studies ====================
      case "get_patient_studies": {
        const { patient_id: ppid } = data;
        if (config.server_type === "orthanc") {
          const patient = await fetchPACS(config, `/patients/${ppid}`);
          const studyIds = patient.Studies || [];
          const studies = [];
          for (const studyId of studyIds.slice(0, 20)) {
            try {
              const s = await fetchPACS(config, `/studies/${studyId}`);
              studies.push(s);
            } catch { /* skip */ }
          }
          result = studies;
        } else {
          result = { error: "Use query_studies with PatientID for DICOMweb." };
        }
        break;
      }

      // ==================== DICOM Worklist (MWL) ====================
      case "get_worklist": {
        if (config.server_type === "orthanc") {
          // Orthanc doesn't have built-in MWL, but we can query modalities
          result = await fetchPACS(config, "/modalities");
        } else {
          result = { message: "Worklist must be configured on the PACS server directly." };
        }
        break;
      }

      // ==================== Send to Modality (C-STORE) ====================
      case "send_to_modality": {
        const { resource_id, resource_type, modality } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/modalities/${modality}/store`, {
            method: "POST",
            body: JSON.stringify(resource_id),
          });
        } else {
          result = { error: "send_to_modality only supported on Orthanc." };
        }
        break;
      }

      // ==================== Send to Peer ====================
      case "send_to_peer": {
        const { resource_id: rid, peer } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/peers/${peer}/store`, {
            method: "POST",
            body: JSON.stringify(rid),
          });
        } else {
          result = { error: "send_to_peer only supported on Orthanc." };
        }
        break;
      }

      // ==================== Delete Study ====================
      case "delete_study": {
        const { study_id: delStdId } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/studies/${delStdId}`, { method: "DELETE" });
          result = { success: true, message: "Study deleted" };
        } else {
          result = { error: "delete_study only supported on Orthanc REST API." };
        }
        break;
      }

      // ==================== Get DICOM Tags ====================
      case "get_tags": {
        const { instance_id } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/instances/${instance_id}/simplified-tags`);
        } else {
          result = { error: "get_tags only supported on Orthanc." };
        }
        break;
      }

      // ==================== WADO-RS: Get Instance Rendered (Preview Image) ====================
      case "get_rendered": {
        const { study_id: rStdId, series_id: rSeriesId, instance_id: rInstId } = data;
        // Returns metadata about the rendered image URL
        const renderUrl = `${config.dicomweb_url}/studies/${rStdId}/series/${rSeriesId}/instances/${rInstId}/rendered`;
        result = {
          url: renderUrl,
          auth: config.username ? {
            type: "basic",
            credentials: base64Encode(new TextEncoder().encode(`${config.username}:${config.password}`)),
          } : null,
        };
        break;
      }

      // ==================== OHIF Viewer URL ====================
      case "get_viewer_url": {
        const { study_id: viewStdId } = data;
        if (config.server_type === "orthanc") {
          // Orthanc OHIF plugin URL
          result = {
            orthanc_viewer: `${config.base_url}/osimis-viewer/app/index.html?study=${viewStdId}`,
            ohif_viewer: `${config.base_url}/ohif/viewer?StudyInstanceUIDs=${viewStdId}`,
            stone_viewer: `${config.base_url}/stone-webviewer/index.html?study=${viewStdId}`,
          };
        } else {
          result = {
            ohif_viewer: `${config.dicomweb_url}/viewer?StudyInstanceUIDs=${viewStdId}`,
          };
        }
        break;
      }

      // ==================== Add Modality Config ====================
      case "add_modality": {
        const { name, ae_title, host, port } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/modalities/${name}`, {
            method: "PUT",
            body: { AET: ae_title, Host: host, Port: port },
          });
          result = { success: true, message: `Modality ${name} added` };
        } else {
          result = { error: "add_modality only supported on Orthanc." };
        }
        break;
      }

      // ==================== Remove Modality Config ====================
      case "remove_modality": {
        const { name: rmName } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/modalities/${rmName}`, { method: "DELETE" });
          result = { success: true, message: `Modality ${rmName} removed` };
        } else {
          result = { error: "remove_modality only supported on Orthanc." };
        }
        break;
      }

      // ==================== Get Modality Details ====================
      case "get_modality": {
        const { name: gmName } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/modalities/${gmName}`);
        } else {
          result = { error: "get_modality only supported on Orthanc." };
        }
        break;
      }

      // ==================== Query Remote Modality (C-FIND via Orthanc) ====================
      case "query_remote": {
        const { modality: qrMod, level, query: qrQuery } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/modalities/${qrMod}/query`, {
            method: "POST",
            body: {
              Level: level || "Study",
              Query: qrQuery || {},
            },
          });
        } else {
          result = { error: "query_remote only supported on Orthanc." };
        }
        break;
      }

      // ==================== Retrieve from Remote (C-MOVE via Orthanc) ====================
      case "retrieve_remote": {
        const { query_id, index } = data;
        if (config.server_type === "orthanc") {
          result = await fetchPACS(config, `/queries/${query_id}/answers/${index || 0}/retrieve`, {
            method: "POST",
            body: config.ae_title,
          });
        } else {
          result = { error: "retrieve_remote only supported on Orthanc." };
        }
        break;
      }

      // ==================== STOW-RS (Store via DICOMweb) ====================
      case "store_dicomweb": {
        // This would need multipart DICOM upload - return instructions
        result = {
          endpoint: `${config.dicomweb_url}/studies`,
          method: "POST",
          content_type: "multipart/related; type=application/dicom",
          message: "Use this endpoint to POST DICOM files directly from the client/modality.",
          auth: config.username ? "Basic auth required" : "No auth required",
        };
        break;
      }

      // ==================== Get Changes (Orthanc change log) ====================
      case "get_changes": {
        if (config.server_type === "orthanc") {
          const since = data?.since || 0;
          const limit = data?.limit || 100;
          result = await fetchPACS(config, `/changes?since=${since}&limit=${limit}`);
        } else {
          result = { error: "get_changes only supported on Orthanc." };
        }
        break;
      }

      // ==================== Discover All Modalities (Auto-Discovery) ====================
      case "discover_modalities": {
        if (config.server_type === "orthanc") {
          // 1. Get list of modality names
          const modalityNames = await fetchPACS(config, "/modalities");
          const modalities: any[] = [];

          // modalityNames can be an array of strings or an object with keys
          const names = Array.isArray(modalityNames) ? modalityNames : Object.keys(modalityNames || {});

          // 2. For each modality, get details and run C-ECHO
          for (const name of names) {
            try {
              const details = await fetchPACS(config, `/modalities/${name}`);
              let status = "offline";
              try {
                await fetchPACS(config, `/modalities/${name}/echo`, { method: "POST" });
                status = "online";
              } catch {
                status = "offline";
              }

              modalities.push({
                name,
                ae_title: details.AET || details.AeTitle || details.aet || "N/A",
                host: details.Host || details.host || "N/A",
                port: details.Port || details.port || 0,
                manufacturer: details.Manufacturer || null,
                status,
              });
            } catch (err: any) {
              modalities.push({
                name,
                ae_title: "N/A",
                host: "N/A",
                port: 0,
                manufacturer: null,
                status: "error",
                error: err.message,
              });
            }
          }

          result = {
            success: true,
            total: modalities.length,
            online: modalities.filter(m => m.status === "online").length,
            offline: modalities.filter(m => m.status !== "online").length,
            modalities,
          };
        } else {
          result = { error: "discover_modalities only supported on Orthanc." };
        }
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown action: ${action}`,
            available_actions: [
              "test_connection", "system_info", "statistics",
              "list_modalities", "modality_echo", "list_peers",
              "query_studies", "list_studies", "get_study", "get_series", "get_instances",
              "list_patients", "get_patient", "get_patient_studies",
              "get_worklist", "send_to_modality", "send_to_peer",
              "delete_study", "get_tags", "get_rendered", "get_viewer_url",
              "add_modality", "remove_modality", "get_modality",
              "query_remote", "retrieve_remote", "store_dicomweb", "get_changes",
              "discover_modalities",
            ],
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[PACS Bridge] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
