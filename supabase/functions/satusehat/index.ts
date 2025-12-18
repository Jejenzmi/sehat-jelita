import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SATUSEHAT_CLIENT_ID = Deno.env.get('SATU_SEHAT_CLIENT_ID');
const SATUSEHAT_CLIENT_SECRET = Deno.env.get('SATU_SEHAT_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// SATU SEHAT API URLs
const STAGING_OAUTH_URL = 'https://api-satusehat-stg.dto.kemkes.go.id/oauth2/v1';
const STAGING_FHIR_URL = 'https://api-satusehat-stg.dto.kemkes.go.id/fhir-r4/v1';
const PRODUCTION_OAUTH_URL = 'https://api-satusehat.kemkes.go.id/oauth2/v1';
const PRODUCTION_FHIR_URL = 'https://api-satusehat.kemkes.go.id/fhir-r4/v1';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  issued_at: string;
}

// Get OAuth token from SATU SEHAT
async function getAccessToken(environment: string = 'staging'): Promise<TokenResponse> {
  const oauthUrl = environment === 'production' ? PRODUCTION_OAUTH_URL : STAGING_OAUTH_URL;
  
  console.log(`Getting access token from ${oauthUrl}`);
  
  const response = await fetch(`${oauthUrl}/accesstoken?grant_type=client_credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SATUSEHAT_CLIENT_ID!,
      client_secret: SATUSEHAT_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OAuth error:', errorText);
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Token obtained successfully');
  return data;
}

// Convert local patient to FHIR Patient resource
function patientToFHIR(patient: any, organizationId: string): any {
  return {
    resourceType: 'Patient',
    identifier: [
      {
        use: 'official',
        system: 'https://fhir.kemkes.go.id/id/nik',
        value: patient.nik,
      },
      ...(patient.bpjs_number ? [{
        use: 'official',
        system: 'https://fhir.kemkes.go.id/id/bpjs',
        value: patient.bpjs_number,
      }] : []),
    ],
    name: [
      {
        use: 'official',
        text: patient.full_name,
      },
    ],
    gender: patient.gender === 'L' ? 'male' : 'female',
    birthDate: patient.birth_date,
    address: patient.address ? [
      {
        use: 'home',
        line: [patient.address],
        city: patient.city || '',
        state: patient.province || '',
        postalCode: patient.postal_code || '',
        country: 'ID',
      },
    ] : undefined,
    telecom: [
      ...(patient.phone ? [{ system: 'phone', value: patient.phone, use: 'mobile' }] : []),
      ...(patient.email ? [{ system: 'email', value: patient.email }] : []),
    ],
    managingOrganization: {
      reference: `Organization/${organizationId}`,
    },
  };
}

// Convert local encounter/visit to FHIR Encounter resource
function visitToFHIREncounter(visit: any, patientSatuSehatId: string, organizationId: string): any {
  const statusMap: Record<string, string> = {
    'menunggu': 'planned',
    'dipanggil': 'arrived',
    'dilayani': 'in-progress',
    'selesai': 'finished',
    'batal': 'cancelled',
  };

  return {
    resourceType: 'Encounter',
    status: statusMap[visit.status] || 'planned',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: visit.visit_type === 'rawat_inap' ? 'IMP' : visit.visit_type === 'igd' ? 'EMER' : 'AMB',
      display: visit.visit_type === 'rawat_inap' ? 'inpatient encounter' : visit.visit_type === 'igd' ? 'emergency' : 'ambulatory',
    },
    subject: {
      reference: `Patient/${patientSatuSehatId}`,
    },
    period: {
      start: `${visit.visit_date}T${visit.visit_time}`,
    },
    serviceProvider: {
      reference: `Organization/${organizationId}`,
    },
    identifier: [
      {
        system: `https://fhir.kemkes.go.id/id/encounter/${organizationId}`,
        value: visit.visit_number,
      },
    ],
  };
}

// Convert diagnosis to FHIR Condition resource
function diagnosisToFHIRCondition(diagnosis: any, patientSatuSehatId: string, encounterSatuSehatId: string): any {
  return {
    resourceType: 'Condition',
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: 'active',
          display: 'Active',
        },
      ],
    },
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-category',
            code: 'encounter-diagnosis',
            display: 'Encounter Diagnosis',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/icd-10',
          code: diagnosis.icd10_code,
          display: diagnosis.description,
        },
      ],
    },
    subject: {
      reference: `Patient/${patientSatuSehatId}`,
    },
    encounter: {
      reference: `Encounter/${encounterSatuSehatId}`,
    },
  };
}

// Send FHIR resource to SATU SEHAT
async function sendFHIRResource(
  accessToken: string,
  resourceType: string,
  resource: any,
  environment: string = 'staging',
  method: string = 'POST',
  resourceId?: string
): Promise<any> {
  const fhirUrl = environment === 'production' ? PRODUCTION_FHIR_URL : STAGING_FHIR_URL;
  const url = resourceId 
    ? `${fhirUrl}/${resourceType}/${resourceId}`
    : `${fhirUrl}/${resourceType}`;

  console.log(`Sending ${resourceType} to ${url}`);

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/fhir+json',
    },
    body: JSON.stringify(resource),
  });

  const responseData = await response.json();

  if (!response.ok) {
    console.error('FHIR API error:', responseData);
    throw new Error(`FHIR API error: ${response.status} - ${JSON.stringify(responseData)}`);
  }

  console.log(`${resourceType} sent successfully:`, responseData.id);
  return responseData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, data } = await req.json();

    console.log(`Processing action: ${action}`);

    // Get config
    const { data: config } = await supabase
      .from('satusehat_config')
      .select('*')
      .single();

    const environment = config?.environment || 'staging';
    const organizationId = config?.organization_id || 'ORG_ID_NOT_SET';

    switch (action) {
      case 'test-connection': {
        const token = await getAccessToken(environment);
        return new Response(JSON.stringify({
          success: true,
          message: 'Connection successful',
          token_type: token.token_type,
          expires_in: token.expires_in,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync-patient': {
        const { patientId } = data;
        const token = await getAccessToken(environment);

        // Get patient data
        const { data: patient, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .single();

        if (error || !patient) {
          throw new Error(`Patient not found: ${patientId}`);
        }

        // Check if already synced
        const { data: existingMapping } = await supabase
          .from('satusehat_resource_mappings')
          .select('satusehat_id')
          .eq('resource_type', 'Patient')
          .eq('local_id', patientId)
          .single();

        const fhirPatient = patientToFHIR(patient, organizationId);
        let result;

        if (existingMapping) {
          // Update existing
          result = await sendFHIRResource(
            token.access_token,
            'Patient',
            fhirPatient,
            environment,
            'PUT',
            existingMapping.satusehat_id
          );
        } else {
          // Create new
          result = await sendFHIRResource(
            token.access_token,
            'Patient',
            fhirPatient,
            environment
          );

          // Save mapping
          await supabase.from('satusehat_resource_mappings').insert({
            resource_type: 'Patient',
            local_id: patientId,
            satusehat_id: result.id,
          });
        }

        // Log sync
        await supabase.from('satusehat_sync_logs').insert({
          resource_type: 'Patient',
          resource_id: patientId,
          local_table: 'patients',
          satusehat_id: result.id,
          action: existingMapping ? 'update' : 'create',
          status: 'synced',
          request_payload: fhirPatient,
          response_payload: result,
          synced_at: new Date().toISOString(),
        });

        return new Response(JSON.stringify({
          success: true,
          satusehat_id: result.id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync-encounter': {
        const { visitId } = data;
        const token = await getAccessToken(environment);

        // Get visit data with patient
        const { data: visit, error } = await supabase
          .from('visits')
          .select('*, patients!inner(*)')
          .eq('id', visitId)
          .single();

        if (error || !visit) {
          throw new Error(`Visit not found: ${visitId}`);
        }

        // Get patient SATU SEHAT ID
        const { data: patientMapping } = await supabase
          .from('satusehat_resource_mappings')
          .select('satusehat_id')
          .eq('resource_type', 'Patient')
          .eq('local_id', visit.patient_id)
          .single();

        if (!patientMapping) {
          throw new Error(`Patient not synced to SATU SEHAT: ${visit.patient_id}`);
        }

        const fhirEncounter = visitToFHIREncounter(visit, patientMapping.satusehat_id, organizationId);

        // Check if already synced
        const { data: existingMapping } = await supabase
          .from('satusehat_resource_mappings')
          .select('satusehat_id')
          .eq('resource_type', 'Encounter')
          .eq('local_id', visitId)
          .single();

        let result;
        if (existingMapping) {
          result = await sendFHIRResource(
            token.access_token,
            'Encounter',
            fhirEncounter,
            environment,
            'PUT',
            existingMapping.satusehat_id
          );
        } else {
          result = await sendFHIRResource(
            token.access_token,
            'Encounter',
            fhirEncounter,
            environment
          );

          await supabase.from('satusehat_resource_mappings').insert({
            resource_type: 'Encounter',
            local_id: visitId,
            satusehat_id: result.id,
          });
        }

        await supabase.from('satusehat_sync_logs').insert({
          resource_type: 'Encounter',
          resource_id: visitId,
          local_table: 'visits',
          satusehat_id: result.id,
          action: existingMapping ? 'update' : 'create',
          status: 'synced',
          request_payload: fhirEncounter,
          response_payload: result,
          synced_at: new Date().toISOString(),
        });

        return new Response(JSON.stringify({
          success: true,
          satusehat_id: result.id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-sync-stats': {
        // Get total counts from local tables
        const [patients, visits, diagnoses, prescriptions] = await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }),
          supabase.from('visits').select('id', { count: 'exact', head: true }),
          supabase.from('diagnoses').select('id', { count: 'exact', head: true }),
          supabase.from('prescriptions').select('id', { count: 'exact', head: true }),
        ]);

        // Get synced counts
        const { data: mappings } = await supabase
          .from('satusehat_resource_mappings')
          .select('resource_type');

        const syncedCounts: Record<string, number> = {};
        mappings?.forEach(m => {
          syncedCounts[m.resource_type] = (syncedCounts[m.resource_type] || 0) + 1;
        });

        // Get today's sync logs
        const today = new Date().toISOString().split('T')[0];
        const { data: todayLogs } = await supabase
          .from('satusehat_sync_logs')
          .select('status')
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`);

        const todayStats = {
          total: todayLogs?.length || 0,
          synced: todayLogs?.filter(l => l.status === 'synced').length || 0,
          failed: todayLogs?.filter(l => l.status === 'failed').length || 0,
          pending: todayLogs?.filter(l => l.status === 'pending').length || 0,
        };

        const stats = [
          { name: 'Patient', synced: syncedCounts['Patient'] || 0, total: patients.count || 0 },
          { name: 'Encounter', synced: syncedCounts['Encounter'] || 0, total: visits.count || 0 },
          { name: 'Condition', synced: syncedCounts['Condition'] || 0, total: diagnoses.count || 0 },
          { name: 'MedicationRequest', synced: syncedCounts['MedicationRequest'] || 0, total: prescriptions.count || 0 },
        ].map(s => ({
          ...s,
          percentage: s.total > 0 ? Math.round((s.synced / s.total) * 100 * 10) / 10 : 0,
        }));

        return new Response(JSON.stringify({
          stats,
          todayStats,
          successRate: todayStats.total > 0 
            ? Math.round((todayStats.synced / todayStats.total) * 100 * 10) / 10 
            : 100,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-sync-logs': {
        const { limit = 20 } = data || {};
        
        const { data: logs, error } = await supabase
          .from('satusehat_sync_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return new Response(JSON.stringify({ logs }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'save-config': {
        const { organizationId: orgId, environment: env, autoSyncEnabled } = data;

        const { data: existingConfig } = await supabase
          .from('satusehat_config')
          .select('id')
          .single();

        if (existingConfig) {
          await supabase
            .from('satusehat_config')
            .update({
              organization_id: orgId,
              environment: env,
              auto_sync_enabled: autoSyncEnabled,
            })
            .eq('id', existingConfig.id);
        } else {
          await supabase.from('satusehat_config').insert({
            organization_id: orgId,
            environment: env,
            auto_sync_enabled: autoSyncEnabled,
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-config': {
        const { data: configData } = await supabase
          .from('satusehat_config')
          .select('*')
          .single();

        return new Response(JSON.stringify({ config: configData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'bulk-sync-patients': {
        const token = await getAccessToken(environment);
        
        // Get unsynced patients
        const { data: allPatients } = await supabase.from('patients').select('id');
        const { data: syncedPatients } = await supabase
          .from('satusehat_resource_mappings')
          .select('local_id')
          .eq('resource_type', 'Patient');

        const syncedIds = new Set(syncedPatients?.map(p => p.local_id));
        const unsyncedIds = allPatients?.filter(p => !syncedIds.has(p.id)).map(p => p.id) || [];

        let synced = 0;
        let failed = 0;

        for (const patientId of unsyncedIds.slice(0, 50)) { // Limit to 50 per request
          try {
            const { data: patient } = await supabase
              .from('patients')
              .select('*')
              .eq('id', patientId)
              .single();

            if (patient) {
              const fhirPatient = patientToFHIR(patient, organizationId);
              const result = await sendFHIRResource(
                token.access_token,
                'Patient',
                fhirPatient,
                environment
              );

              await supabase.from('satusehat_resource_mappings').insert({
                resource_type: 'Patient',
                local_id: patientId,
                satusehat_id: result.id,
              });

              await supabase.from('satusehat_sync_logs').insert({
                resource_type: 'Patient',
                resource_id: patientId,
                local_table: 'patients',
                satusehat_id: result.id,
                action: 'create',
                status: 'synced',
                synced_at: new Date().toISOString(),
              });

              synced++;
            }
          } catch (error) {
            console.error(`Failed to sync patient ${patientId}:`, error);
            failed++;

            await supabase.from('satusehat_sync_logs').insert({
              resource_type: 'Patient',
              resource_id: patientId,
              local_table: 'patients',
              action: 'create',
              status: 'failed',
              error_message: error instanceof Error ? error.message : String(error),
            });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          synced,
          failed,
          remaining: unsyncedIds.length - 50,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
