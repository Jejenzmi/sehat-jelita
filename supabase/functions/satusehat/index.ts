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

// Convert doctor to FHIR Practitioner resource
function doctorToFHIRPractitioner(doctor: any): any {
  return {
    resourceType: 'Practitioner',
    identifier: [
      {
        use: 'official',
        system: 'https://fhir.kemkes.go.id/id/nik',
        value: doctor.nik || '',
      },
      {
        use: 'official',
        system: 'https://fhir.kemkes.go.id/id/sip',
        value: doctor.sip_number,
      },
    ],
    name: [
      {
        use: 'official',
        text: doctor.full_name,
      },
    ],
    qualification: doctor.specialization ? [
      {
        code: {
          coding: [
            {
              system: 'http://terminology.kemkes.go.id/CodeSystem/practitioner-qualification',
              code: doctor.specialization,
              display: doctor.specialization,
            },
          ],
        },
      },
    ] : undefined,
  };
}

// Convert department/room to FHIR Location resource
function locationToFHIR(location: any, organizationId: string, locationType: string): any {
  return {
    resourceType: 'Location',
    identifier: [
      {
        system: `https://fhir.kemkes.go.id/id/location/${organizationId}`,
        value: location.code || location.room_number,
      },
    ],
    status: 'active',
    name: location.name || location.room_number,
    description: location.description || location.room_type,
    mode: 'instance',
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-RoleCode',
            code: locationType,
            display: locationType,
          },
        ],
      },
    ],
    physicalType: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/location-physical-type',
          code: locationType === 'HOSP' ? 'bu' : 'ro',
          display: locationType === 'HOSP' ? 'Building' : 'Room',
        },
      ],
    },
    managingOrganization: {
      reference: `Organization/${organizationId}`,
    },
  };
}

// Convert local encounter/visit to FHIR Encounter resource
function visitToFHIREncounter(visit: any, patientSatuSehatId: string, organizationId: string, practitionerId?: string, locationId?: string): any {
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
      ...(visit.end_time ? { end: `${visit.visit_date}T${visit.end_time}` } : {}),
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
    ...(practitionerId ? {
      participant: [
        {
          type: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                  code: 'ATND',
                  display: 'attender',
                },
              ],
            },
          ],
          individual: {
            reference: `Practitioner/${practitionerId}`,
          },
        },
      ],
    } : {}),
    ...(locationId ? {
      location: [
        {
          location: {
            reference: `Location/${locationId}`,
          },
        },
      ],
    } : {}),
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

// Convert lab result to FHIR Observation resource
function labResultToFHIRObservation(labResult: any, patientSatuSehatId: string, encounterSatuSehatId?: string): any {
  return {
    resourceType: 'Observation',
    status: labResult.status === 'selesai' ? 'final' : 'preliminary',
    category: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'laboratory',
            display: 'Laboratory',
          },
        ],
      },
    ],
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: labResult.loinc_code || 'unknown',
          display: labResult.test_name,
        },
      ],
      text: labResult.test_name,
    },
    subject: {
      reference: `Patient/${patientSatuSehatId}`,
    },
    ...(encounterSatuSehatId ? {
      encounter: {
        reference: `Encounter/${encounterSatuSehatId}`,
      },
    } : {}),
    effectiveDateTime: labResult.result_date || labResult.created_at,
    valueString: labResult.result_value,
    referenceRange: labResult.normal_range ? [
      {
        text: labResult.normal_range,
      },
    ] : undefined,
  };
}

// Convert prescription to FHIR MedicationRequest resource
function prescriptionToFHIRMedicationRequest(prescription: any, patientSatuSehatId: string, encounterSatuSehatId?: string, practitionerId?: string): any {
  return {
    resourceType: 'MedicationRequest',
    status: prescription.status === 'selesai' ? 'completed' : prescription.status === 'batal' ? 'cancelled' : 'active',
    intent: 'order',
    medicationCodeableConcept: {
      coding: [
        {
          system: 'http://sys-ids.kemkes.go.id/kfa',
          code: prescription.medicine_code || 'unknown',
          display: prescription.medicine_name,
        },
      ],
      text: prescription.medicine_name,
    },
    subject: {
      reference: `Patient/${patientSatuSehatId}`,
    },
    ...(encounterSatuSehatId ? {
      encounter: {
        reference: `Encounter/${encounterSatuSehatId}`,
      },
    } : {}),
    authoredOn: prescription.created_at,
    ...(practitionerId ? {
      requester: {
        reference: `Practitioner/${practitionerId}`,
      },
    } : {}),
    dosageInstruction: [
      {
        text: prescription.dosage || '',
        timing: {
          code: {
            text: prescription.frequency || '',
          },
        },
        doseAndRate: [
          {
            doseQuantity: {
              value: prescription.quantity || 1,
              unit: prescription.unit || 'unit',
            },
          },
        ],
      },
    ],
  };
}

// Convert procedure to FHIR Procedure resource
function procedureToFHIR(procedure: any, patientSatuSehatId: string, encounterSatuSehatId?: string): any {
  return {
    resourceType: 'Procedure',
    status: procedure.status === 'selesai' ? 'completed' : 'in-progress',
    category: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '387713003',
          display: 'Surgical procedure',
        },
      ],
    },
    code: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/icd-9-cm',
          code: procedure.icd9cm_code || 'unknown',
          display: procedure.procedure_name,
        },
      ],
      text: procedure.procedure_name,
    },
    subject: {
      reference: `Patient/${patientSatuSehatId}`,
    },
    ...(encounterSatuSehatId ? {
      encounter: {
        reference: `Encounter/${encounterSatuSehatId}`,
      },
    } : {}),
    performedPeriod: {
      start: procedure.start_time,
      end: procedure.end_time,
    },
  };
}

// Convert allergy to FHIR AllergyIntolerance resource
function allergyToFHIRAllergyIntolerance(allergy: any, patientSatuSehatId: string): any {
  return {
    resourceType: 'AllergyIntolerance',
    clinicalStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
          code: 'active',
          display: 'Active',
        },
      ],
    },
    verificationStatus: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
          code: 'confirmed',
          display: 'Confirmed',
        },
      ],
    },
    type: allergy.allergy_type === 'obat' ? 'allergy' : 'intolerance',
    category: [allergy.allergy_type === 'obat' ? 'medication' : 'food'],
    code: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          display: allergy.allergen,
        },
      ],
      text: allergy.allergen,
    },
    patient: {
      reference: `Patient/${patientSatuSehatId}`,
    },
    recordedDate: allergy.created_at,
    reaction: allergy.reaction ? [
      {
        manifestation: [
          {
            coding: [
              {
                system: 'http://snomed.info/sct',
                display: allergy.reaction,
              },
            ],
          },
        ],
        severity: allergy.severity || 'moderate',
      },
    ] : undefined,
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

// Fetch FHIR resource from SATU SEHAT
async function fetchFHIRResource(
  accessToken: string,
  resourceType: string,
  resourceId: string,
  environment: string = 'staging'
): Promise<any> {
  const fhirUrl = environment === 'production' ? PRODUCTION_FHIR_URL : STAGING_FHIR_URL;
  const url = `${fhirUrl}/${resourceType}/${resourceId}`;

  console.log(`Fetching ${resourceType} from ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/fhir+json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FHIR API error:', errorText);
    throw new Error(`FHIR API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Search FHIR resources from SATU SEHAT
async function searchFHIRResources(
  accessToken: string,
  resourceType: string,
  searchParams: Record<string, string>,
  environment: string = 'staging'
): Promise<any> {
  const fhirUrl = environment === 'production' ? PRODUCTION_FHIR_URL : STAGING_FHIR_URL;
  const queryString = new URLSearchParams(searchParams).toString();
  const url = `${fhirUrl}/${resourceType}?${queryString}`;

  console.log(`Searching ${resourceType} at ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/fhir+json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('FHIR API error:', errorText);
    throw new Error(`FHIR API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Get OAuth token with custom credentials
async function getAccessTokenWithConfig(
  clientId: string, 
  clientSecret: string, 
  environment: string = 'staging'
): Promise<TokenResponse> {
  const oauthUrl = environment === 'production' ? PRODUCTION_OAUTH_URL : STAGING_OAUTH_URL;
  
  console.log(`Getting access token from ${oauthUrl}`);
  
  const response = await fetch(`${oauthUrl}/accesstoken?grant_type=client_credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, data, config: customConfig } = await req.json();

    console.log(`Processing action: ${action}`);

    // Get config - use custom config if provided, otherwise fetch from system_settings
    let environment: string;
    let organizationId: string;
    let clientId: string | undefined;
    let clientSecret: string | undefined;
    
    if (customConfig) {
      // Use custom config passed from admin settings
      environment = customConfig.environment || 'staging';
      organizationId = customConfig.org_id || 'ORG_ID_NOT_SET';
      clientId = customConfig.client_id;
      clientSecret = customConfig.client_secret;
    } else {
      // Fetch from system_settings table
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'integration_satusehat')
        .single();
      
      const settings = settingsData?.setting_value || {};
      environment = settings.environment || 'staging';
      organizationId = settings.org_id || 'ORG_ID_NOT_SET';
      clientId = settings.client_id || SATUSEHAT_CLIENT_ID;
      clientSecret = settings.client_secret || SATUSEHAT_CLIENT_SECRET;
    }

    switch (action) {
      case 'test-connection': {
        if (!clientId || !clientSecret) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Client ID dan Client Secret harus diisi',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        try {
          const token = await getAccessTokenWithConfig(clientId, clientSecret, environment);
          return new Response(JSON.stringify({
            success: true,
            message: 'Connection successful',
            token_type: token.token_type,
            expires_in: token.expires_in,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (tokenError: any) {
          const errorMsg = tokenError.message || 'Unknown error';
          let userFriendlyError = 'Gagal terhubung ke SATU SEHAT API';
          
          if (errorMsg.includes('403')) {
            userFriendlyError = 'Akses ditolak (403). Pastikan: 1) Client ID & Secret valid, 2) IP server sudah di-whitelist di portal SATU SEHAT, 3) Environment sesuai dengan kredensial';
          } else if (errorMsg.includes('401')) {
            userFriendlyError = 'Autentikasi gagal (401). Client ID atau Client Secret tidak valid';
          } else if (errorMsg.includes('404')) {
            userFriendlyError = 'Endpoint tidak ditemukan (404). Periksa environment yang dipilih';
          } else if (errorMsg.includes('500')) {
            userFriendlyError = 'Server SATU SEHAT sedang bermasalah (500). Silakan coba lagi nanti';
          }
          
          console.error('Test connection error:', errorMsg);
          return new Response(JSON.stringify({
            success: false,
            error: userFriendlyError,
            detail: errorMsg,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'sync-patient': {
        const { patientId } = data;
        if (!clientId || !clientSecret) throw new Error('Client credentials not configured');
        const token = await getAccessTokenWithConfig(clientId, clientSecret, environment);

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
          result = await sendFHIRResource(
            token.access_token,
            'Patient',
            fhirPatient,
            environment,
            'PUT',
            existingMapping.satusehat_id
          );
        } else {
          result = await sendFHIRResource(
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
        }

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

      case 'sync-practitioner': {
        const { doctorId } = data;
        if (!clientId || !clientSecret) throw new Error('Client credentials not configured');
        const token = await getAccessTokenWithConfig(clientId, clientSecret, environment);

        const { data: doctor, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('id', doctorId)
          .single();

        if (error || !doctor) {
          throw new Error(`Doctor not found: ${doctorId}`);
        }

        const { data: existingMapping } = await supabase
          .from('satusehat_resource_mappings')
          .select('satusehat_id')
          .eq('resource_type', 'Practitioner')
          .eq('local_id', doctorId)
          .single();

        const fhirPractitioner = doctorToFHIRPractitioner(doctor);
        let result;

        if (existingMapping) {
          result = await sendFHIRResource(
            token.access_token,
            'Practitioner',
            fhirPractitioner,
            environment,
            'PUT',
            existingMapping.satusehat_id
          );
        } else {
          result = await sendFHIRResource(
            token.access_token,
            'Practitioner',
            fhirPractitioner,
            environment
          );

          await supabase.from('satusehat_resource_mappings').insert({
            resource_type: 'Practitioner',
            local_id: doctorId,
            satusehat_id: result.id,
          });

          // Update doctor with SATU SEHAT ID
          await supabase
            .from('doctors')
            .update({ satusehat_practitioner_id: result.id })
            .eq('id', doctorId);
        }

        await supabase.from('satusehat_sync_logs').insert({
          resource_type: 'Practitioner',
          resource_id: doctorId,
          local_table: 'doctors',
          satusehat_id: result.id,
          action: existingMapping ? 'update' : 'create',
          status: 'synced',
          synced_at: new Date().toISOString(),
        });

        return new Response(JSON.stringify({
          success: true,
          satusehat_id: result.id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'sync-location': {
        const { locationId, locationType } = data; // locationType: 'department' or 'room'
        if (!clientId || !clientSecret) throw new Error('Client credentials not configured');
        const token = await getAccessTokenWithConfig(clientId, clientSecret, environment);

        const tableName = locationType === 'department' ? 'departments' : 'rooms';
        const { data: location, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', locationId)
          .single();

        if (error || !location) {
          throw new Error(`Location not found: ${locationId}`);
        }

        const { data: existingMapping } = await supabase
          .from('satusehat_resource_mappings')
          .select('satusehat_id')
          .eq('resource_type', 'Location')
          .eq('local_id', locationId)
          .single();

        const fhirLocation = locationToFHIR(location, organizationId, locationType === 'department' ? 'HOSP' : 'RO');
        let result;

        if (existingMapping) {
          result = await sendFHIRResource(
            token.access_token,
            'Location',
            fhirLocation,
            environment,
            'PUT',
            existingMapping.satusehat_id
          );
        } else {
          result = await sendFHIRResource(
            token.access_token,
            'Location',
            fhirLocation,
            environment
          );

          await supabase.from('satusehat_resource_mappings').insert({
            resource_type: 'Location',
            local_id: locationId,
            satusehat_id: result.id,
          });

          await supabase
            .from(tableName)
            .update({ satusehat_location_id: result.id })
            .eq('id', locationId);
        }

        await supabase.from('satusehat_sync_logs').insert({
          resource_type: 'Location',
          resource_id: locationId,
          local_table: tableName,
          satusehat_id: result.id,
          action: existingMapping ? 'update' : 'create',
          status: 'synced',
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
        if (!clientId || !clientSecret) throw new Error('Client credentials not configured');
        const token = await getAccessTokenWithConfig(clientId, clientSecret, environment);

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

        // Get practitioner ID if available
        let practitionerId;
        if (visit.doctor_id) {
          const { data: practitionerMapping } = await supabase
            .from('satusehat_resource_mappings')
            .select('satusehat_id')
            .eq('resource_type', 'Practitioner')
            .eq('local_id', visit.doctor_id)
            .single();
          practitionerId = practitionerMapping?.satusehat_id;
        }

        const fhirEncounter = visitToFHIREncounter(visit, patientMapping.satusehat_id, organizationId, practitionerId);

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

      case 'sync-condition': {
        const { diagnosisId } = data;
        if (!clientId || !clientSecret) throw new Error('Client credentials not configured');
        const token = await getAccessTokenWithConfig(clientId, clientSecret, environment);

        const { data: diagnosis, error } = await supabase
          .from('diagnoses')
          .select('*, medical_records!inner(visit_id, visits!inner(patient_id))')
          .eq('id', diagnosisId)
          .single();

        if (error || !diagnosis) {
          throw new Error(`Diagnosis not found: ${diagnosisId}`);
        }

        const patientId = diagnosis.medical_records.visits.patient_id;
        const visitId = diagnosis.medical_records.visit_id;

        const { data: patientMapping } = await supabase
          .from('satusehat_resource_mappings')
          .select('satusehat_id')
          .eq('resource_type', 'Patient')
          .eq('local_id', patientId)
          .single();

        const { data: encounterMapping } = await supabase
          .from('satusehat_resource_mappings')
          .select('satusehat_id')
          .eq('resource_type', 'Encounter')
          .eq('local_id', visitId)
          .single();

        if (!patientMapping || !encounterMapping) {
          throw new Error('Patient or Encounter not synced');
        }

        const fhirCondition = diagnosisToFHIRCondition(
          diagnosis,
          patientMapping.satusehat_id,
          encounterMapping.satusehat_id
        );

        const result = await sendFHIRResource(
          token.access_token,
          'Condition',
          fhirCondition,
          environment
        );

        await supabase.from('satusehat_resource_mappings').insert({
          resource_type: 'Condition',
          local_id: diagnosisId,
          satusehat_id: result.id,
        });

        await supabase.from('satusehat_sync_logs').insert({
          resource_type: 'Condition',
          resource_id: diagnosisId,
          local_table: 'diagnoses',
          satusehat_id: result.id,
          action: 'create',
          status: 'synced',
          synced_at: new Date().toISOString(),
        });

        return new Response(JSON.stringify({
          success: true,
          satusehat_id: result.id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'search-patient-by-nik': {
        const { nik } = data;
        if (!clientId || !clientSecret) throw new Error('Client credentials not configured');
        const token = await getAccessTokenWithConfig(clientId, clientSecret, environment);

        const result = await searchFHIRResources(
          token.access_token,
          'Patient',
          { identifier: `https://fhir.kemkes.go.id/id/nik|${nik}` },
          environment
        );

        return new Response(JSON.stringify({
          success: true,
          data: result,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-patient-ihs': {
        const { nik } = data;
        if (!clientId || !clientSecret) throw new Error('Client credentials not configured');
        const token = await getAccessTokenWithConfig(clientId, clientSecret, environment);

        // Search for patient by NIK to get IHS Number
        const result = await searchFHIRResources(
          token.access_token,
          'Patient',
          { identifier: `https://fhir.kemkes.go.id/id/nik|${nik}` },
          environment
        );

        const ihsNumber = result.entry?.[0]?.resource?.id;

        return new Response(JSON.stringify({
          success: true,
          ihs_number: ihsNumber,
          data: result,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-sync-stats': {
        const [patients, visits, diagnoses, prescriptions, doctors, labResults] = await Promise.all([
          supabase.from('patients').select('id', { count: 'exact', head: true }),
          supabase.from('visits').select('id', { count: 'exact', head: true }),
          supabase.from('diagnoses').select('id', { count: 'exact', head: true }),
          supabase.from('prescriptions').select('id', { count: 'exact', head: true }),
          supabase.from('doctors').select('id', { count: 'exact', head: true }),
          supabase.from('lab_results').select('id', { count: 'exact', head: true }),
        ]);

        const { data: mappings } = await supabase
          .from('satusehat_resource_mappings')
          .select('resource_type');

        const syncedCounts: Record<string, number> = {};
        mappings?.forEach(m => {
          syncedCounts[m.resource_type] = (syncedCounts[m.resource_type] || 0) + 1;
        });

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
          { name: 'Practitioner', synced: syncedCounts['Practitioner'] || 0, total: doctors.count || 0 },
          { name: 'Encounter', synced: syncedCounts['Encounter'] || 0, total: visits.count || 0 },
          { name: 'Condition', synced: syncedCounts['Condition'] || 0, total: diagnoses.count || 0 },
          { name: 'MedicationRequest', synced: syncedCounts['MedicationRequest'] || 0, total: prescriptions.count || 0 },
          { name: 'Observation', synced: syncedCounts['Observation'] || 0, total: labResults.count || 0 },
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
        if (!clientId || !clientSecret) throw new Error('Client credentials not configured');
        const token = await getAccessTokenWithConfig(clientId, clientSecret, environment);
        
        const { data: allPatients } = await supabase.from('patients').select('id');
        const { data: syncedPatients } = await supabase
          .from('satusehat_resource_mappings')
          .select('local_id')
          .eq('resource_type', 'Patient');

        const syncedIds = new Set(syncedPatients?.map(p => p.local_id));
        const unsyncedIds = allPatients?.filter(p => !syncedIds.has(p.id)).map(p => p.id) || [];

        let synced = 0;
        let failed = 0;

        for (const patientId of unsyncedIds.slice(0, 50)) {
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

      case 'bulk-sync-practitioners': {
        if (!clientId || !clientSecret) throw new Error('Client credentials not configured');
        const token = await getAccessTokenWithConfig(clientId, clientSecret, environment);
        
        const { data: allDoctors } = await supabase.from('doctors').select('id');
        const { data: syncedDoctors } = await supabase
          .from('satusehat_resource_mappings')
          .select('local_id')
          .eq('resource_type', 'Practitioner');

        const syncedIds = new Set(syncedDoctors?.map(d => d.local_id));
        const unsyncedIds = allDoctors?.filter(d => !syncedIds.has(d.id)).map(d => d.id) || [];

        let synced = 0;
        let failed = 0;

        for (const doctorId of unsyncedIds.slice(0, 50)) {
          try {
            const { data: doctor } = await supabase
              .from('doctors')
              .select('*')
              .eq('id', doctorId)
              .single();

            if (doctor) {
              const fhirPractitioner = doctorToFHIRPractitioner(doctor);
              const result = await sendFHIRResource(
                token.access_token,
                'Practitioner',
                fhirPractitioner,
                environment
              );

              await supabase.from('satusehat_resource_mappings').insert({
                resource_type: 'Practitioner',
                local_id: doctorId,
                satusehat_id: result.id,
              });

              await supabase
                .from('doctors')
                .update({ satusehat_practitioner_id: result.id })
                .eq('id', doctorId);

              await supabase.from('satusehat_sync_logs').insert({
                resource_type: 'Practitioner',
                resource_id: doctorId,
                local_table: 'doctors',
                satusehat_id: result.id,
                action: 'create',
                status: 'synced',
                synced_at: new Date().toISOString(),
              });

              synced++;
            }
          } catch (error) {
            console.error(`Failed to sync doctor ${doctorId}:`, error);
            failed++;

            await supabase.from('satusehat_sync_logs').insert({
              resource_type: 'Practitioner',
              resource_id: doctorId,
              local_table: 'doctors',
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
