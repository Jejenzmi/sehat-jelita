import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type MCUPackage = Database["public"]["Tables"]["mcu_packages"]["Row"];
type MCURegistration = Database["public"]["Tables"]["mcu_registrations"]["Row"];
type MCUResult = Database["public"]["Tables"]["mcu_results"]["Row"];
type CorporateClient = Database["public"]["Tables"]["corporate_clients"]["Row"];

export function useMCUData() {
  const queryClient = useQueryClient();

  // Fetch MCU packages
  const { data: packages, isLoading: loadingPackages } = useQuery({
    queryKey: ["mcu-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcu_packages")
        .select(`
          *,
          mcu_package_items (*)
        `)
        .eq("is_active", true)
        .order("base_price");
      if (error) throw error;
      return data;
    },
  });

  // Fetch corporate clients
  const { data: corporateClients, isLoading: loadingClients } = useQuery({
    queryKey: ["corporate-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("corporate_clients")
        .select("*")
        .eq("is_active", true)
        .order("company_name");
      if (error) throw error;
      return data as CorporateClient[];
    },
  });

  // Fetch MCU registrations
  const { data: registrations, isLoading: loadingRegistrations } = useQuery({
    queryKey: ["mcu-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcu_registrations")
        .select(`
          *,
          patients:patient_id (full_name, medical_record_number, gender, birth_date),
          mcu_packages:package_id (package_name, package_code, category),
          corporate_clients:corporate_client_id (company_name)
        `)
        .order("registration_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Fetch today's MCU schedule
  const { data: todaySchedule, isLoading: loadingSchedule } = useQuery({
    queryKey: ["today-mcu-schedule"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("mcu_registrations")
        .select(`
          *,
          patients:patient_id (full_name, medical_record_number, gender),
          mcu_packages:package_id (package_name, category)
        `)
        .eq("examination_date", today)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  // Fetch MCU summary reports
  const { data: summaryReports, isLoading: loadingReports } = useQuery({
    queryKey: ["mcu-summary-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mcu_summary_reports")
        .select(`
          *,
          mcu_registrations:registration_id (
            registration_number,
            patients:patient_id (full_name)
          )
        `)
        .order("report_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Create MCU registration
  const createRegistration = useMutation({
    mutationFn: async (registration: Database["public"]["Tables"]["mcu_registrations"]["Insert"]) => {
      const { data, error } = await supabase
        .from("mcu_registrations")
        .insert(registration)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcu-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["today-mcu-schedule"] });
      toast.success("Pendaftaran MCU berhasil");
    },
    onError: (error) => {
      toast.error("Gagal mendaftar MCU: " + error.message);
    },
  });

  // Update registration status
  const updateRegistrationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("mcu_registrations")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcu-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["today-mcu-schedule"] });
      toast.success("Status MCU berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui status: " + error.message);
    },
  });

  // Record MCU result
  const recordResult = useMutation({
    mutationFn: async (result: Database["public"]["Tables"]["mcu_results"]["Insert"]) => {
      const { data, error } = await supabase
        .from("mcu_results")
        .insert(result)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcu-registrations"] });
      toast.success("Hasil pemeriksaan berhasil dicatat");
    },
    onError: (error) => {
      toast.error("Gagal mencatat hasil: " + error.message);
    },
  });

  // Create corporate client
  const createCorporateClient = useMutation({
    mutationFn: async (client: Database["public"]["Tables"]["corporate_clients"]["Insert"]) => {
      const { data, error } = await supabase
        .from("corporate_clients")
        .insert(client)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-clients"] });
      toast.success("Klien korporat berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambah klien: " + error.message);
    },
  });

  return {
    packages,
    corporateClients,
    registrations,
    todaySchedule,
    summaryReports,
    loadingPackages,
    loadingClients,
    loadingRegistrations,
    loadingSchedule,
    loadingReports,
    createRegistration,
    updateRegistrationStatus,
    recordResult,
    createCorporateClient,
  };
}
