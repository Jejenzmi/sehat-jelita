// E-Claim Medical Record Utilities
// Implements GZIP compression + AES-256-CBC encryption for BPJS eClaim

import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

/**
 * GZIP compression using CompressionStream (Deno built-in)
 */
export async function compressGzip(data: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const input = encoder.encode(data);
  
  // Use CompressionStream for gzip
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
  
  // Combine chunks
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

/**
 * Generate AES-256-CBC key and IV from concatenated string
 * Key = SHA-256(consumerID + consumerSecret + kodeRS)
 * IV = first 16 bytes of the hash
 */
export async function generateAESKey(keyString: string): Promise<{ key: CryptoKey; iv: Uint8Array }> {
  const encoder = new TextEncoder();
  
  // Hash the key string with SHA-256 to get 32 bytes for AES-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(keyString));
  const hashArray = new Uint8Array(hashBuffer);
  
  // IV is first 16 bytes of hash (same as BPJS decrypt pattern)
  const iv = hashArray.slice(0, 16);
  
  // Import key for AES-CBC encryption
  const key = await crypto.subtle.importKey(
    "raw",
    hashArray,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  
  return { key, iv };
}

/**
 * AES-256-CBC Encryption
 */
export async function encryptAES256CBC(data: Uint8Array, keyString: string): Promise<string> {
  const { key, iv } = await generateAESKey(keyString);
  
  // Create proper IV ArrayBuffer
  const ivBuffer = new ArrayBuffer(iv.length);
  new Uint8Array(ivBuffer).set(iv);
  
  // Create proper data ArrayBuffer
  const dataBuffer = new ArrayBuffer(data.length);
  new Uint8Array(dataBuffer).set(data);
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: ivBuffer },
    key,
    dataBuffer
  );
  
  // Return Base64 encoded
  return base64Encode(encrypted as ArrayBuffer);
}

/**
 * Encrypt Medical Record data for BPJS eClaim
 * Process: 1. JSON stringify -> 2. GZIP compress -> 3. AES-256-CBC encrypt -> 4. Base64 encode
 */
export async function encryptMedicalRecordData(
  data: any,
  consId: string,
  secretKey: string,
  kodeRS: string
): Promise<string> {
  const jsonString = JSON.stringify(data);
  const key = consId + secretKey + kodeRS;
  
  console.log("[eClaim MR] Processing data encryption...");
  console.log("[eClaim MR] Key pattern:", `${consId.substring(0, 4)}...+secret+${kodeRS}`);
  
  try {
    // Step 1: GZIP compress the JSON string
    const compressed = await compressGzip(jsonString);
    console.log(`[eClaim MR] Compressed: ${jsonString.length} bytes -> ${compressed.length} bytes`);
    
    // Step 2: AES-256-CBC encrypt with key = consid + secretkey + koders
    const encrypted = await encryptAES256CBC(compressed, key);
    console.log(`[eClaim MR] Encrypted data length: ${encrypted.length} chars`);
    
    return encrypted;
  } catch (error) {
    console.error("[eClaim MR] Encryption error:", error);
    throw new Error("Failed to encrypt medical record data");
  }
}

// ============================================
// Medical Record Bundle Interfaces (FHIR-Compliant)
// ============================================

export interface MRBundleEntry {
  resourceType: string;
  [key: string]: any;
}

export interface MedicalRecordBundle {
  identifier: string;
  entry: MRBundleEntry[];
}

// Patient resource structure
export interface PatientResource {
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: string;
  gender: string;
  birthDate: string;
  address?: string;
}

// Encounter resource structure  
export interface EncounterResource {
  id: string;
  status: string;
  class: string;
  period: {
    start: string;
    end?: string;
  };
  diagnosis?: Array<{
    condition: string;
    use: string;
  }>;
}

// Practitioner resource structure
export interface PractitionerResource {
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: string;
  qualification?: string;
}

// Organization resource structure
export interface OrganizationResource {
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: string;
  type?: string;
}

// Condition resource structure (FHIR-compliant for diagnoses)
export interface ConditionResource {
  id: string;
  clinicalStatus: string;
  verificationStatus: string;
  category: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string;
  };
  onsetDateTime?: string;
}

// Observation resource for DiagnosticReport results
export interface ObservationResource {
  resourceType: "Observation";
  id: string;
  status: string;
  text?: {
    status: string;
    div: string;
  };
  issued?: string;
  effectiveDateTime?: string;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  performer?: {
    reference: string;
    display: string;
  };
  image?: Array<{
    comment: string;
    link: {
      reference: string;
      display: string;
    };
  }>;
  conclusion?: string;
}

// DiagnosticReport resource structure (FHIR-compliant)
export interface DiagnosticReportResource {
  id: string;
  subject: {
    reference: string;
    display: string;
    noSep?: string;
  };
  category: {
    coding: {
      system: string;
      code: string;
      display: string;
    };
  };
  status: string;
  performer: Array<{
    reference: string;
    display: string;
  }>;
  result: ObservationResource[];
}

// Procedure resource structure (FHIR-compliant)
export interface ProcedureResource {
  id: string;
  text?: {
    status: string;
    div: string;
  };
  status: string;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
    display: string;
  };
  context?: {
    reference: string;
    display: string;
  };
  performedPeriod: {
    start: string;
    end: string;
  };
  performer: Array<{
    role?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    actor: {
      reference: string;
      display: string;
    };
  }>;
  reasonCode?: Array<{
    text: string;
  }>;
  bodySite?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  focalDevice?: Array<{
    action: {
      coding: Array<{
        system: string;
        code: string;
      }>;
    };
    manipulated: {
      reference: string;
    };
  }>;
  note?: Array<{
    text: string;
  }>;
}

// Device resource structure (FHIR-compliant)
export interface DeviceResource {
  id: string;
  text?: {
    status: string;
    div: string;
  };
  identifier: Array<{
    system: string;
    value: string;
  }>;
  type: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  lotNumber?: string;
  manufacturer?: string;
  manufactureDate?: string;
  expirationDate?: string;
  model?: string;
  patient: {
    reference: string;
  };
  contact?: Array<{
    system: string;
    value: string;
    use: string;
  }>;
}

// MedicationRequest resource structure
export interface MedicationRequestResource {
  id: string;
  status: string;
  medicationCodeableConcept: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  dosageInstruction?: Array<{
    text: string;
  }>;
}

/**
 * Build FHIR-like Medical Record Bundle for BPJS eClaim
 * Based on the diagram showing MR Bundle structure with entries:
 * - Composition, Patient, Encounter, MedicationRequest, Practitioner, Organization
 * - Condition, DiagnosticReport, Procedure, Device
 */
export function buildMedicalRecordBundle(params: {
  noSep: string;
  patient: PatientResource;
  encounter: EncounterResource;
  practitioner: PractitionerResource;
  organization: OrganizationResource;
  conditions?: ConditionResource[];
  diagnosticReports?: DiagnosticReportResource[];
  procedures?: ProcedureResource[];
  medications?: MedicationRequestResource[];
  devices?: DeviceResource[];
}): MedicalRecordBundle {
  const bundle: MedicalRecordBundle = {
    identifier: params.noSep,
    entry: [],
  };
  
  // Composition (main document)
  bundle.entry.push({
    resourceType: "Composition",
    id: params.noSep,
    status: "final",
    date: new Date().toISOString(),
    title: "Medical Record Bundle",
    type: {
      coding: [{
        system: "http://loinc.org",
        code: "11503-0",
        display: "Medical records"
      }]
    }
  });
  
  // Patient
  bundle.entry.push({
    resourceType: "Patient",
    ...params.patient,
  });
  
  // Encounter
  bundle.entry.push({
    resourceType: "Encounter",
    ...params.encounter,
  });
  
  // Practitioner
  bundle.entry.push({
    resourceType: "Practitioner",
    ...params.practitioner,
  });
  
  // Organization
  bundle.entry.push({
    resourceType: "Organization",
    ...params.organization,
  });
  
  // Conditions (Diagnoses with ICD-10) - FHIR compliant
  if (params.conditions) {
    for (const condition of params.conditions) {
      bundle.entry.push({
        resourceType: "Condition",
        ...condition,
      });
    }
  }
  
  // Diagnostic Reports - FHIR compliant with Observation results
  if (params.diagnosticReports) {
    for (const report of params.diagnosticReports) {
      bundle.entry.push({
        resourceType: "DiagnosticReport",
        ...report,
      });
    }
  }
  
  // Procedures (with ICD-9/SNOMED codes) - FHIR compliant
  if (params.procedures) {
    for (const procedure of params.procedures) {
      bundle.entry.push({
        resourceType: "Procedure",
        ...procedure,
      });
    }
  }
  
  // Medication Requests
  if (params.medications) {
    for (const medication of params.medications) {
      bundle.entry.push({
        resourceType: "MedicationRequest",
        ...medication,
      });
    }
  }
  
  // Devices - FHIR compliant
  if (params.devices) {
    for (const device of params.devices) {
      bundle.entry.push({
        resourceType: "Device",
        ...device,
      });
    }
  }
  
  return bundle;
}

/**
 * Create eClaim Medical Record request payload
 */
export async function createEClaimMRRequest(params: {
  noSep: string;
  jnsPelayanan: "1" | "2"; // 1=Rawat Inap, 2=Rawat Jalan
  bulan: string;
  tahun: string;
  mrBundle: MedicalRecordBundle;
  consId: string;
  secretKey: string;
  kodeRS: string;
}): Promise<{
  request: {
    noSep: string;
    jnsPelayanan: string;
    bulan: string;
    tahun: string;
    dataMR: string;
  };
}> {
  const encryptedData = await encryptMedicalRecordData(
    params.mrBundle,
    params.consId,
    params.secretKey,
    params.kodeRS
  );
  
  return {
    request: {
      noSep: params.noSep,
      jnsPelayanan: params.jnsPelayanan,
      bulan: params.bulan,
      tahun: params.tahun,
      dataMR: encryptedData,
    },
  };
}
