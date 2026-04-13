/**
 * SIMRS ZEN - SATU SEHAT Service
 * Integration with Indonesia's National Health Information Exchange
 * FHIR R4 Compliant
 *
 * Satu Sehat service
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { satusehatBreaker } from '../utils/circuit-breaker.js';

export interface SatuSehatConfig {
  org_id: string | null;
  environment: string;
  client_id: string | null;
  client_secret: string | null;
  enabled?: boolean;
}

export interface SatuSehatSaveConfig {
  org_id: string;
  environment: string;
  client_id: string;
  client_secret: string;
}

export interface EncounterParticipant {
  ihsNumber: string;
  name: string;
}

export interface EncounterData {
  status?: string;
  classCode?: string;
  classDisplay?: string;
  patientIHS: string;
  patientName: string;
  practitioners?: EncounterParticipant[];
  startTime?: string;
  endTime?: string;
  locationIHS?: string;
  locationName?: string;
}

export interface ConditionData {
  clinicalStatus?: string;
  icdCode: string;
  icdDisplay: string;
  patientIHS: string;
  patientName: string;
  encounterIHS: string;
  recordedDate?: string;
}

export interface ObservationData {
  status?: string;
  category?: string;
  categoryDisplay?: string;
  loincCode: string;
  loincDisplay: string;
  patientIHS: string;
  encounterIHS: string;
  effectiveDateTime?: string;
  value?: number;
  unit?: string;
  unitCode?: string;
}

export interface MedicationData {
  kfaCode: string;
  medicationName: string;
  patientIHS: string;
  patientName: string;
  encounterIHS: string;
  doctorIHS: string;
  doctorName: string;
  dosageText?: string;
  frequency?: number;
  doseValue?: number;
  doseUnit?: string;
  quantity?: number;
  quantityUnit?: string;
}

export interface BundleEntry {
  fullUrl?: string;
  resource: Record<string, unknown>;
  method?: string;
  url: string;
}

class SatuSehatService {
  public clientId: string | undefined;
  public clientSecret: string | undefined;
  public orgId: string | undefined;
  public env: string;

  private baseUrls: Record<string, string>;
  private authUrls: Record<string, string>;

  private accessToken: string | null;
  private tokenExpiry: number | null;

  constructor() {
    this.clientId = process.env.SATU_SEHAT_CLIENT_ID;
    this.clientSecret = process.env.SATU_SEHAT_CLIENT_SECRET;
    this.orgId = process.env.SATU_SEHAT_ORG_ID;
    this.env = process.env.SATU_SEHAT_ENV || 'sandbox';

    this.baseUrls = {
      sandbox: 'https://api-satusehat.kemkes.go.id/fhir-r4/v1',
      staging: 'https://api-satusehat-stg.kemkes.go.id/fhir-r4/v1',
      production: 'https://api-satusehat.kemkes.go.id/fhir-r4/v1'
    };

    this.authUrls = {
      sandbox: 'https://api-satusehat.kemkes.go.id/oauth2/v1/accesstoken',
      staging: 'https://api-satusehat-stg.kemkes.go.id/oauth2/v1/accesstoken',
      production: 'https://api-satusehat.kemkes.go.id/oauth2/v1/accesstoken'
    };

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  get baseUrl(): string {
    return this.baseUrls[this.env] || this.baseUrls.sandbox;
  }

  get authUrl(): string {
    return this.authUrls[this.env] || this.authUrls.sandbox;
  }

  /**
   * Get OAuth2 Access Token
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Lazy-load credentials from DB if not set from env vars
    if (!this.clientId || !this.clientSecret) {
      const config = await this.getConfiguration();
      if (config) {
        this.clientId = config.client_id;
        this.clientSecret = config.client_secret;
        this.orgId = config.org_id || undefined;
        this.env = config.environment || 'production';
      }
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Kredensial SATU SEHAT belum dikonfigurasi. Silakan isi di menu Pengaturan -> Integrasi Eksternal.');
    }

    try {
      const response: AxiosResponse = await axios.post(
        `${this.authUrl}?grant_type=client_credentials`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry 5 minutes before actual expiry
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('SATU SEHAT Auth Error:', (error as any).response?.data || (error as Error).message);
      throw new Error('Failed to authenticate with SATU SEHAT');
    }
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint: string, method: string = 'GET', data: Record<string, unknown> | null = null): Promise<unknown> {
    const token = await this.getAccessToken();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/fhir+json'
    };

    try {
      const response = await satusehatBreaker.fire<AxiosResponse>(() => axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers,
        data,
        timeout: 15000,
      }));

      return response.data;
    } catch (error) {
      console.error('SATU SEHAT API Error:', (error as any).response?.data || (error as Error).message);
      throw error;
    }
  }

  // ==========================================
  // PATIENT RESOURCE
  // ==========================================

  /**
   * Get Patient by NIK
   */
  async getPatientByNIK(nik: string): Promise<unknown> {
    return this.request(`/Patient?identifier=https://fhir.kemkes.go.id/id/nik|${nik}`);
  }

  /**
   * Get Patient by IHS Number
   */
  async getPatientByIHS(ihsNumber: string): Promise<unknown> {
    return this.request(`/Patient/${ihsNumber}`);
  }

  /**
   * Create/Update Patient
   */
  async upsertPatient(patientResource: Record<string, unknown>): Promise<unknown> {
    if (patientResource.id) {
      return this.request(`/Patient/${patientResource.id}`, 'PUT', patientResource);
    }
    return this.request('/Patient', 'POST', patientResource);
  }

  // ==========================================
  // PRACTITIONER RESOURCE
  // ==========================================

  /**
   * Get Practitioner by NIK
   */
  async getPractitionerByNIK(nik: string): Promise<unknown> {
    return this.request(`/Practitioner?identifier=https://fhir.kemkes.go.id/id/nik|${nik}`);
  }

  // ==========================================
  // ENCOUNTER RESOURCE
  // ==========================================

  /**
   * Create Encounter (Kunjungan)
   */
  async createEncounter(encounterData: EncounterData): Promise<unknown> {
    const encounter = this.buildEncounterResource(encounterData);
    return this.request('/Encounter', 'POST', encounter);
  }

  /**
   * Update Encounter
   */
  async updateEncounter(encounterId: string, encounterData: EncounterData): Promise<unknown> {
    const encounter = this.buildEncounterResource(encounterData);
    encounter.id = encounterId;
    return this.request(`/Encounter/${encounterId}`, 'PUT', encounter);
  }

  /**
   * Build FHIR Encounter Resource
   */
  buildEncounterResource(data: EncounterData): Record<string, unknown> {
    return {
      resourceType: 'Encounter',
      status: data.status || 'arrived',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: data.classCode || 'AMB',
        display: data.classDisplay || 'ambulatory'
      },
      subject: {
        reference: `Patient/${data.patientIHS}`,
        display: data.patientName
      },
      participant: data.practitioners?.map(p => ({
        type: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
            code: 'ATND',
            display: 'attender'
          }]
        }],
        individual: {
          reference: `Practitioner/${p.ihsNumber}`,
          display: p.name
        }
      })) || [],
      period: {
        start: data.startTime,
        end: data.endTime
      },
      location: data.locationIHS ? [{
        location: {
          reference: `Location/${data.locationIHS}`,
          display: data.locationName
        }
      }] : [],
      serviceProvider: {
        reference: `Organization/${this.orgId}`
      }
    };
  }

  // ==========================================
  // CONDITION RESOURCE (DIAGNOSIS)
  // ==========================================

  /**
   * Create Condition (Diagnosis)
   */
  async createCondition(conditionData: ConditionData): Promise<unknown> {
    const condition: Record<string, unknown> = {
      resourceType: 'Condition',
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: conditionData.clinicalStatus || 'active',
          display: conditionData.clinicalStatus || 'Active'
        }]
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'encounter-diagnosis',
          display: 'Encounter Diagnosis'
        }]
      }],
      code: {
        coding: [{
          system: 'http://hl7.org/fhir/sid/icd-10',
          code: conditionData.icdCode,
          display: conditionData.icdDisplay
        }]
      },
      subject: {
        reference: `Patient/${conditionData.patientIHS}`,
        display: conditionData.patientName
      },
      encounter: {
        reference: `Encounter/${conditionData.encounterIHS}`
      },
      recordedDate: conditionData.recordedDate || new Date().toISOString()
    };

    return this.request('/Condition', 'POST', condition);
  }

  // ==========================================
  // OBSERVATION RESOURCE (VITAL SIGNS, LAB)
  // ==========================================

  /**
   * Create Observation (Vital Signs / Lab Results)
   */
  async createObservation(observationData: ObservationData): Promise<unknown> {
    const observation: Record<string, unknown> = {
      resourceType: 'Observation',
      status: observationData.status || 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: observationData.category || 'vital-signs',
          display: observationData.categoryDisplay || 'Vital Signs'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: observationData.loincCode,
          display: observationData.loincDisplay
        }]
      },
      subject: {
        reference: `Patient/${observationData.patientIHS}`
      },
      encounter: {
        reference: `Encounter/${observationData.encounterIHS}`
      },
      effectiveDateTime: observationData.effectiveDateTime || new Date().toISOString(),
      valueQuantity: observationData.value ? {
        value: observationData.value,
        unit: observationData.unit,
        system: 'http://unitsofmeasure.org',
        code: observationData.unitCode
      } : undefined
    };

    return this.request('/Observation', 'POST', observation);
  }

  // ==========================================
  // MEDICATION REQUEST RESOURCE
  // ==========================================

  /**
   * Create MedicationRequest (Resep)
   */
  async createMedicationRequest(medicationData: MedicationData): Promise<unknown> {
    const medicationRequest: Record<string, unknown> = {
      resourceType: 'MedicationRequest',
      status: 'active',
      intent: 'order',
      medicationCodeableConcept: {
        coding: [{
          system: 'http://sys-ids.kemkes.go.id/kfa',
          code: medicationData.kfaCode,
          display: medicationData.medicationName
        }]
      },
      subject: {
        reference: `Patient/${medicationData.patientIHS}`,
        display: medicationData.patientName
      },
      encounter: {
        reference: `Encounter/${medicationData.encounterIHS}`
      },
      authoredOn: new Date().toISOString(),
      requester: {
        reference: `Practitioner/${medicationData.doctorIHS}`,
        display: medicationData.doctorName
      },
      dosageInstruction: [{
        text: medicationData.dosageText,
        timing: {
          repeat: {
            frequency: medicationData.frequency,
            period: 1,
            periodUnit: 'd'
          }
        },
        doseAndRate: [{
          doseQuantity: {
            value: medicationData.doseValue,
            unit: medicationData.doseUnit
          }
        }]
      }],
      dispenseRequest: {
        quantity: {
          value: medicationData.quantity,
          unit: medicationData.quantityUnit
        }
      }
    };

    return this.request('/MedicationRequest', 'POST', medicationRequest);
  }

  // ==========================================
  // CONFIGURATION MANAGEMENT
  // ==========================================

  /**
   * Save SATU SEHAT Configuration to database AND update service instance
   */
  async saveConfiguration(config: SatuSehatSaveConfig): Promise<{ org_id: string; environment: string; client_id: string }> {
    const { org_id, environment, client_id, client_secret } = config;

    const validEnvironments = ['sandbox', 'staging', 'production'];
    if (!validEnvironments.includes(environment)) {
      throw new Error('environment tidak valid, harus salah satu dari: sandbox, staging, production');
    }

    // Persist to database so credentials survive restarts
    const { prisma } = await import('../config/database.js');
    await prisma.system_settings.upsert({
      where: { setting_key: 'integration_satusehat' },
      update: { setting_value: JSON.stringify({ enabled: true, org_id, environment, client_id, client_secret }) },
      create: { setting_key: 'integration_satusehat', setting_value: JSON.stringify({ enabled: true, org_id, environment, client_id, client_secret }) }
    });

    // Update instance so current request uses new credentials immediately
    this.orgId = org_id;
    this.env = environment;
    this.clientId = client_id;
    this.clientSecret = client_secret;

    // Invalidate cached token so next call re-authenticates with new credentials
    this.accessToken = null;
    this.tokenExpiry = null;

    return { org_id, environment, client_id };
  }

  /**
   * Get SATU SEHAT Configuration -- reads from DB first, falls back to env vars
   */
  async getConfiguration(): Promise<SatuSehatConfig | null> {
    try {
      const { prisma } = await import('../config/database.js');
      const setting = await prisma.system_settings.findUnique({
        where: { setting_key: 'integration_satusehat' }
      });
      if (setting?.setting_value) {
        const config = JSON.parse(setting.setting_value) as SatuSehatConfig;
        if (config.client_id && config.client_secret) return config;
      }
    } catch { /* fall through to env vars */ }

    // Fallback: env vars
    const orgId = process.env.SATU_SEHAT_ORG_ID || null;
    const environment = process.env.SATU_SEHAT_ENV || null;
    const clientId = process.env.SATU_SEHAT_CLIENT_ID || null;
    const clientSecret = process.env.SATU_SEHAT_CLIENT_SECRET || null;

    if (!clientId || !clientSecret) return null;
    return { org_id: orgId, environment: environment || 'production', client_id: clientId, client_secret: clientSecret };
  }

  // ==========================================
  // BUNDLE RESOURCE (BATCH OPERATIONS)
  // ==========================================

  /**
   * Submit Bundle Transaction
   */
  async submitBundle(entries: BundleEntry[]): Promise<unknown> {
    const bundle: Record<string, unknown> = {
      resourceType: 'Bundle',
      type: 'transaction',
      entry: entries.map(entry => ({
        fullUrl: entry.fullUrl,
        resource: entry.resource,
        request: {
          method: entry.method || 'POST',
          url: entry.url
        }
      }))
    };

    return this.request('/', 'POST', bundle);
  }

  // ==========================================
  // ADDITIONAL STUB METHODS
  // ==========================================

  async getPatientById(id: string): Promise<unknown> {
    throw new Error('Method not implemented - use getPatientByNIK instead');
  }

  async getOrganizationById(id: string): Promise<unknown> {
    return { error: 'Not implemented' };
  }

  async getLocationById(id: string): Promise<unknown> {
    return { error: 'Not implemented' };
  }

  async createLocation(data: Record<string, unknown>): Promise<unknown> {
    return { error: 'Not implemented' };
  }

  async getEncounterById(id: string): Promise<unknown> {
    return { error: 'Not implemented' };
  }

  async createProcedure(data: Record<string, unknown>): Promise<unknown> {
    return { error: 'Not implemented' };
  }

  async createMedicationDispense(data: Record<string, unknown>): Promise<unknown> {
    return { error: 'Not implemented' };
  }

  async createComposition(data: Record<string, unknown>): Promise<unknown> {
    return { error: 'Not implemented' };
  }

  async createAllergyIntolerance(data: Record<string, unknown>): Promise<unknown> {
    return { error: 'Not implemented' };
  }

  async createServiceRequest(data: Record<string, unknown>): Promise<unknown> {
    return { error: 'Not implemented' };
  }

  async createSpecimen(data: Record<string, unknown>): Promise<unknown> {
    return { error: 'Not implemented' };
  }

  async createDiagnosticReport(data: Record<string, unknown>): Promise<unknown> {
    return { error: 'Not implemented' };
  }
}

// Export singleton instance
export const satuSehat = new SatuSehatService();
export default SatuSehatService;
