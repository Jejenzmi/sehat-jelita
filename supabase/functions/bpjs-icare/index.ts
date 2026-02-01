import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BPJS iCare Base URL (Development)
const ICARE_BASE_URL = "https://apijkn-dev.bpjs-kesehatan.go.id/ihs_dev";

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
async function getBPJSHeaders(config: BPJSConfig): Promise<Record<string, string>> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await generateSignature(config.consumer_id, config.consumer_secret, timestamp);
  
  return {
    "Content-Type": "application/json",
    "X-cons-id": config.consumer_id,
    "X-timestamp": timestamp,
    "X-signature": signature,
    "user_key": config.user_key,
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

// Map room class to BPJS kelas code
function mapRoomClassToBPJS(roomClass: string): string {
  const mapping: Record<string, string> = {
    "VIP": "VIP",
    "VVIP": "VVP",
    "Kelas 1": "KL1",
    "Kelas 2": "KL2", 
    "Kelas 3": "KL3",
    "ICU": "ICU",
    "NICU": "NIC",
    "PICU": "PIC",
    "HCU": "HCU",
    "Isolasi": "ISO",
  };
  return mapping[roomClass] || "NON";
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

    // Get BPJS config
    const config = await getBPJSConfig(supabase);
    if (!config) {
      return new Response(
        JSON.stringify({ error: "BPJS integration not configured or disabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const headers = await getBPJSHeaders(config);
    let result;

    switch (action) {
      case "get_room_classes": {
        // GET referensi kelas kamar
        const response = await fetch(`${ICARE_BASE_URL}/aplicaresws/rest/ref/kelas`, {
          method: "GET",
          headers,
        });
        result = await response.json();
        break;
      }

      case "read_beds": {
        // GET data ketersediaan kamar
        const { start = 1, limit = 100 } = data || {};
        const response = await fetch(
          `${ICARE_BASE_URL}/aplicaresws/rest/bed/read/${config.provider_code}/${start}/${limit}`,
          { method: "GET", headers }
        );
        result = await response.json();
        break;
      }

      case "sync_beds": {
        // Sync semua kamar dari SIMRS ke BPJS
        const { data: rooms, error: roomsError } = await supabase
          .from("rooms")
          .select("*, beds(*)")
          .eq("is_active", true);

        if (roomsError) throw roomsError;

        const syncResults = [];
        
        for (const room of rooms || []) {
          const totalBeds = room.beds?.length || 0;
          const availableBeds = room.beds?.filter((b: any) => b.status === "tersedia").length || 0;
          
          const bedData = {
            kodekelas: mapRoomClassToBPJS(room.room_class),
            koderuang: room.code,
            namaruang: room.name,
            kapasitas: totalBeds.toString(),
            tersedia: availableBeds.toString(),
            tersediapria: "0",
            tersediawanita: "0",
            tersediapriawanita: availableBeds.toString(),
          };

          // Try update first, if fails then create
          const updateResponse = await fetch(
            `${ICARE_BASE_URL}/aplicaresws/rest/bed/update/${config.provider_code}`,
            {
              method: "POST",
              headers,
              body: JSON.stringify(bedData),
            }
          );
          
          const updateResult = await updateResponse.json();
          
          if (updateResult.metadata?.code !== 1) {
            // Try create if update fails
            const createResponse = await fetch(
              `${ICARE_BASE_URL}/aplicaresws/rest/bed/create/${config.provider_code}`,
              {
                method: "POST",
                headers,
                body: JSON.stringify(bedData),
              }
            );
            const createResult = await createResponse.json();
            syncResults.push({
              room: room.code,
              action: "create",
              result: createResult,
            });
          } else {
            syncResults.push({
              room: room.code,
              action: "update",
              result: updateResult,
            });
          }
        }

        // Log sync activity
        await supabase.from("audit_logs").insert({
          table_name: "bpjs_icare_sync",
          action: "SYNC_BEDS",
          new_data: { rooms_synced: syncResults.length, results: syncResults },
        });

        result = {
          metadata: { code: 1, message: "Sync completed" },
          response: { synced: syncResults.length, details: syncResults },
        };
        break;
      }

      case "update_bed": {
        // Update single room availability
        const { room_code, room_class, room_name, capacity, available } = data;
        
        const bedData = {
          kodekelas: mapRoomClassToBPJS(room_class),
          koderuang: room_code,
          namaruang: room_name,
          kapasitas: capacity.toString(),
          tersedia: available.toString(),
          tersediapria: "0",
          tersediawanita: "0",
          tersediapriawanita: available.toString(),
        };

        const response = await fetch(
          `${ICARE_BASE_URL}/aplicaresws/rest/bed/update/${config.provider_code}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(bedData),
          }
        );
        result = await response.json();
        break;
      }

      case "create_bed": {
        // Create new room in BPJS
        const { room_code, room_class, room_name, capacity, available } = data;
        
        const bedData = {
          kodekelas: mapRoomClassToBPJS(room_class),
          koderuang: room_code,
          namaruang: room_name,
          kapasitas: capacity.toString(),
          tersedia: available.toString(),
          tersediapria: "0",
          tersediawanita: "0",
          tersediapriawanita: available.toString(),
        };

        const response = await fetch(
          `${ICARE_BASE_URL}/aplicaresws/rest/bed/create/${config.provider_code}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(bedData),
          }
        );
        result = await response.json();
        break;
      }

      case "delete_bed": {
        // Delete room from BPJS
        const { room_code, room_class } = data;
        
        const response = await fetch(
          `${ICARE_BASE_URL}/aplicaresws/rest/bed/delete/${config.provider_code}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              kodekelas: mapRoomClassToBPJS(room_class),
              koderuang: room_code,
            }),
          }
        );
        result = await response.json();
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("BPJS iCare error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
