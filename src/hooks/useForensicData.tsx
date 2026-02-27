import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Database } from "@/types/database";
import { toast } from "sonner";

type MortuaryCase = Database["public"]["Tables"]["mortuary_cases"]["Row"];
type AutopsyRecord = Database["public"]["Tables"]["autopsy_records"]["Row"];
type VisumReport = Database["public"]["Tables"]["visum_reports"]["Row"];
type DeathCertificate = Database["public"]["Tables"]["death_certificates"]["Row"];

export function useForensicData() {
  const queryClient = useQueryClient();

  // Fetch mortuary cases
  const { data: mortuaryCases, isLoading: loadingCases } = useQuery({
    queryKey: ["mortuary-cases"],
    queryFn: async () => {
      const { data, error } = await db
        .from("mortuary_cases")
        .select(`
          *,
          patients:deceased_id (medical_record_number)
        `)
        .order("admission_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch active mortuary cases (not released)
  const { data: activeCases, isLoading: loadingActiveCases } = useQuery({
    queryKey: ["active-mortuary-cases"],
    queryFn: async () => {
      const { data, error } = await db
        .from("mortuary_cases")
        .select("*")
        .neq("status", "released")
        .order("admission_date", { ascending: false });
      if (error) throw error;
      return data as MortuaryCase[];
    },
  });

  // Fetch autopsy records
  const { data: autopsyRecords, isLoading: loadingAutopsies } = useQuery({
    queryKey: ["autopsy-records"],
    queryFn: async () => {
      const { data, error } = await db
        .from("autopsy_records")
        .select(`
          *,
          mortuary_cases:case_id (case_number, deceased_name),
          doctors:pathologist_id (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch visum reports
  const { data: visumReports, isLoading: loadingVisums } = useQuery({
    queryKey: ["visum-reports"],
    queryFn: async () => {
      const { data, error } = await db
        .from("visum_reports")
        .select(`
          *,
          patients:patient_id (full_name, medical_record_number),
          doctors:examiner_id (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch death certificates
  const { data: deathCertificates, isLoading: loadingCertificates } = useQuery({
    queryKey: ["death-certificates"],
    queryFn: async () => {
      const { data, error } = await db
        .from("death_certificates")
        .select(`
          *,
          doctors:certifying_doctor_id (full_name)
        `)
        .order("certification_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Create mortuary case
  const createMortuaryCase = useMutation({
    mutationFn: async (caseData: Database["public"]["Tables"]["mortuary_cases"]["Insert"]) => {
      const { data, error } = await db
        .from("mortuary_cases")
        .insert(caseData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mortuary-cases"] });
      queryClient.invalidateQueries({ queryKey: ["active-mortuary-cases"] });
      toast.success("Kasus kamar jenazah berhasil dicatat");
    },
    onError: (error) => {
      toast.error("Gagal mencatat kasus: " + error.message);
    },
  });

  // Update mortuary case
  const updateMortuaryCase = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<MortuaryCase>) => {
      const { data, error } = await db
        .from("mortuary_cases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mortuary-cases"] });
      queryClient.invalidateQueries({ queryKey: ["active-mortuary-cases"] });
      toast.success("Kasus berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui kasus: " + error.message);
    },
  });

  // Create autopsy record
  const createAutopsyRecord = useMutation({
    mutationFn: async (record: Database["public"]["Tables"]["autopsy_records"]["Insert"]) => {
      const { data, error } = await db
        .from("autopsy_records")
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["autopsy-records"] });
      toast.success("Catatan otopsi berhasil dibuat");
    },
    onError: (error) => {
      toast.error("Gagal membuat catatan otopsi: " + error.message);
    },
  });

  // Create visum report
  const createVisumReport = useMutation({
    mutationFn: async (report: Database["public"]["Tables"]["visum_reports"]["Insert"]) => {
      const { data, error } = await db
        .from("visum_reports")
        .insert(report)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visum-reports"] });
      toast.success("Visum et Repertum berhasil dibuat");
    },
    onError: (error) => {
      toast.error("Gagal membuat visum: " + error.message);
    },
  });

  // Create death certificate
  const createDeathCertificate = useMutation({
    mutationFn: async (cert: Database["public"]["Tables"]["death_certificates"]["Insert"]) => {
      const { data, error } = await db
        .from("death_certificates")
        .insert(cert)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["death-certificates"] });
      toast.success("Sertifikat kematian berhasil dibuat");
    },
    onError: (error) => {
      toast.error("Gagal membuat sertifikat: " + error.message);
    },
  });

  // Release body
  const releaseBody = useMutation({
    mutationFn: async ({ id, releasedTo, releasedBy }: { id: string; releasedTo: string; releasedBy: string }) => {
      const { data, error } = await db
        .from("mortuary_cases")
        .update({
          status: "released",
          release_authorized: true,
          release_date: new Date().toISOString(),
          released_to: releasedTo,
          released_by: releasedBy,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mortuary-cases"] });
      queryClient.invalidateQueries({ queryKey: ["active-mortuary-cases"] });
      toast.success("Jenazah berhasil diserahkan");
    },
    onError: (error) => {
      toast.error("Gagal menyerahkan jenazah: " + error.message);
    },
  });

  return {
    mortuaryCases,
    activeCases,
    autopsyRecords,
    visumReports,
    deathCertificates,
    loadingCases,
    loadingActiveCases,
    loadingAutopsies,
    loadingVisums,
    loadingCertificates,
    createMortuaryCase,
    updateMortuaryCase,
    createAutopsyRecord,
    createVisumReport,
    createDeathCertificate,
    releaseBody,
  };
}
