import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "./use-toast";

// Accreditation Hooks
export function useAccreditationStandards() {
  return useQuery({
    queryKey: ["accreditation-standards"],
    queryFn: async () => {
      const { data, error } = await db
        .from("accreditation_standards")
        .select("*")
        .order("standard_code");
      if (error) throw error;
      return data;
    },
  });
}

export function useAccreditationElements(standardId?: string) {
  return useQuery({
    queryKey: ["accreditation-elements", standardId],
    queryFn: async () => {
      let query = db
        .from("accreditation_elements")
        .select("*, standard:accreditation_standards(standard_code, standard_name)")
        .order("element_code");
      
      if (standardId) {
        query = query.eq("standard_id", standardId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAccreditationAssessments() {
  return useQuery({
    queryKey: ["accreditation-assessments"],
    queryFn: async () => {
      const { data, error } = await db
        .from("accreditation_assessments")
        .select("*, element:accreditation_elements(element_code, element_name)")
        .order("assessment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Quality Indicator Hooks
export function useQualityIndicators() {
  return useQuery({
    queryKey: ["quality-indicators"],
    queryFn: async () => {
      const { data, error } = await db
        .from("quality_indicators")
        .select("*")
        .order("indicator_code");
      if (error) throw error;
      return data;
    },
  });
}

export function useQualityMeasurements(indicatorId?: string) {
  return useQuery({
    queryKey: ["quality-measurements", indicatorId],
    queryFn: async () => {
      let query = db
        .from("quality_measurements")
        .select("*, indicator:quality_indicators(indicator_code, indicator_name)")
        .order("measurement_period", { ascending: false });
      
      if (indicatorId) {
        query = query.eq("indicator_id", indicatorId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useQualityImprovementActions() {
  return useQuery({
    queryKey: ["quality-improvement-actions"],
    queryFn: async () => {
      const { data, error } = await db
        .from("quality_improvement_actions")
        .select("*, indicator:quality_indicators(indicator_code, indicator_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Safety Incident Hooks
export function useSafetyIncidents() {
  return useQuery({
    queryKey: ["safety-incidents"],
    queryFn: async () => {
      const { data, error } = await db
        .from("safety_incidents")
        .select("*, department:departments(name), patient:patients(full_name)")
        .order("incident_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Consent Hooks
export function useConsentTemplates() {
  return useQuery({
    queryKey: ["consent-templates"],
    queryFn: async () => {
      const { data, error } = await db
        .from("consent_templates")
        .select("*")
        .order("template_name");
      if (error) throw error;
      return data;
    },
  });
}

export function usePatientConsents(patientId?: string) {
  return useQuery({
    queryKey: ["patient-consents", patientId],
    queryFn: async () => {
      let query = db
        .from("patient_consents")
        .select("*, patient:patients(full_name), template:consent_templates(template_name), doctor:doctors(full_name)")
        .order("created_at", { ascending: false });
      
      if (patientId) {
        query = query.eq("patient_id", patientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// INA-DRG Hooks
export function useINADRGCodes() {
  return useQuery({
    queryKey: ["inadrg-codes"],
    queryFn: async () => {
      const { data, error } = await db
        .from("inadrg_codes")
        .select("*")
        .order("drg_code");
      if (error) throw error;
      return data;
    },
  });
}

export function useDiagnosisDRGMapping() {
  return useQuery({
    queryKey: ["diagnosis-drg-mapping"],
    queryFn: async () => {
      const { data, error } = await db
        .from("diagnosis_drg_mapping")
        .select("*, drg:inadrg_codes(drg_code, drg_name)")
        .order("icd10_code");
      if (error) throw error;
      return data;
    },
  });
}

// Insurance Provider Hooks
export function useInsuranceProviders() {
  return useQuery({
    queryKey: ["insurance-providers"],
    queryFn: async () => {
      const { data, error } = await db
        .from("insurance_providers")
        .select("*")
        .order("provider_name");
      if (error) throw error;
      return data;
    },
  });
}
