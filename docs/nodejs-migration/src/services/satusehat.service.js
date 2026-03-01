/**
 * SIMRS ZEN - SATU SEHAT Service
 * Integration with Indonesia's National Health Information Exchange
 * FHIR R4 Compliant
 * 
 * Migrated from Supabase Edge Function: satusehat
 */

import axios from 'axios';

class SatuSehatService {
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

  get baseUrl() {
    return this.baseUrls[this.env] || this.baseUrls.sandbox;
  }

  get authUrl() {
    return this.authUrls[this.env] || this.authUrls.sandbox;
  }

  /**
   * Get OAuth2 Access Token
   */
  async getAccessToken() {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
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
      console.error('SATU SEHAT Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with SATU SEHAT');
    }
  }

  /**
   * Make authenticated API request
   */
  async request(endpoint, method = 'GET', data = null) {
    const token = await this.getAccessToken();

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/fhir+json'
    };

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers,
        data
      });

      return response.data;
    } catch (error) {
      console.error('SATU SEHAT API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // ==========================================
  // PATIENT RESOURCE
  // ==========================================

  /**
   * Get Patient by NIK
   */
  async getPatientByNIK(nik) {
    return this.request(`/Patient?identifier=https://fhir.kemkes.go.id/id/nik|${nik}`);
  }

  /**
   * Get Patient by IHS Number
   */
  async getPatientByIHS(ihsNumber) {
    return this.request(`/Patient/${ihsNumber}`);
  }

  /**
   * Create/Update Patient
   */
  async upsertPatient(patientResource) {
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
  async getPractitionerByNIK(nik) {
    return this.request(`/Practitioner?identifier=https://fhir.kemkes.go.id/id/nik|${nik}`);
  }

  // ==========================================
  // ENCOUNTER RESOURCE
  // ==========================================

  /**
   * Create Encounter (Kunjungan)
   */
  async createEncounter(encounterData) {
    const encounter = this.buildEncounterResource(encounterData);
    return this.request('/Encounter', 'POST', encounter);
  }

  /**
   * Update Encounter
   */
  async updateEncounter(encounterId, encounterData) {
    const encounter = this.buildEncounterResource(encounterData);
    encounter.id = encounterId;
    return this.request(`/Encounter/${encounterId}`, 'PUT', encounter);
  }

  /**
   * Build FHIR Encounter Resource
   */
  buildEncounterResource(data) {
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
  async createCondition(conditionData) {
    const condition = {
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
  async createObservation(observationData) {
    const observation = {
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
  async createMedicationRequest(medicationData) {
    const medicationRequest = {
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
   * Save SATU SEHAT Configuration
   */
  async saveConfiguration(config) {
    const { org_id, environment, client_id, client_secret } = config;

    const validEnvironments = ['sandbox', 'staging', 'production'];
    if (!validEnvironments.includes(environment)) {
      throw new Error('environment tidak valid, harus salah satu dari: sandbox, staging, production');
    }

    process.env.SATU_SEHAT_ORG_ID = org_id;
    process.env.SATU_SEHAT_ENV = environment;
    process.env.SATU_SEHAT_CLIENT_ID = client_id;
    process.env.SATU_SEHAT_CLIENT_SECRET = client_secret;

    // Update instance properties
    this.orgId = org_id;
    this.env = environment;
    this.clientId = client_id;
    this.clientSecret = client_secret;

    // Invalidate cached token when credentials change
    this.accessToken = null;
    this.tokenExpiry = null;

    return { org_id, environment, client_id };
  }

  /**
   * Get SATU SEHAT Configuration (without sensitive credentials)
   */
  async getConfiguration() {
    const orgId = process.env.SATU_SEHAT_ORG_ID || null;
    const environment = process.env.SATU_SEHAT_ENV || null;
    const clientId = process.env.SATU_SEHAT_CLIENT_ID || null;

    if (!orgId || !environment || !clientId) {
      return null;
    }

    return {
      org_id: orgId,
      environment: environment || 'sandbox',
      client_id: clientId,
    };
  }

  // ==========================================
  // BUNDLE RESOURCE (BATCH OPERATIONS)
  // ==========================================

  /**
   * Submit Bundle Transaction
   */
  async submitBundle(entries) {
    const bundle = {
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
}

// Export singleton instance
export const satuSehat = new SatuSehatService();
export default SatuSehatService;
