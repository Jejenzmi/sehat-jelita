import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { toast } from "sonner";

export interface OperatingRoom {
  id: string;
  room_number: string;
  name: string;
  room_type: string;
  equipment: string[];
  is_available: boolean;
  is_active: boolean;
  notes: string | null;
}

export interface Surgery {
  id: string;
  surgery_number: string;
  patient_id: string;
  visit_id: string | null;
  operating_room_id: string | null;
  scheduled_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string | null;
  actual_start_time: string | null;
  actual_end_time: string | null;
  preoperative_diagnosis: string;
  postoperative_diagnosis: string | null;
  procedure_name: string;
  procedure_code: string | null;
  procedure_type: string;
  wound_class: string;
  status: 'scheduled' | 'preparation' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  cancellation_reason: string | null;
  anesthesia_type: 'general' | 'regional' | 'local' | 'sedation' | 'combined' | null;
  asa_classification: 'ASA_I' | 'ASA_II' | 'ASA_III' | 'ASA_IV' | 'ASA_V' | 'ASA_VI' | null;
  preoperative_notes: string | null;
  operative_notes: string | null;
  postoperative_notes: string | null;
  complications: string | null;
  blood_loss_ml: number | null;
  consent_signed: boolean;
  consent_signed_at: string | null;
  consent_signed_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  patient?: {
    full_name: string;
    medical_record_number: string;
    birth_date: string;
    gender: string;
  };
  operating_room?: OperatingRoom;
}

export interface SurgeryTeamMember {
  id: string;
  surgery_id: string;
  staff_id: string | null;
  staff_name: string;
  role: string;
  is_primary: boolean;
  notes: string | null;
}

export interface SurgicalSafetyChecklist {
  id: string;
  surgery_id: string;
  sign_in_completed: boolean;
  sign_in_time: string | null;
  sign_in_by: string | null;
  time_out_completed: boolean;
  time_out_time: string | null;
  time_out_by: string | null;
  sign_out_completed: boolean;
  sign_out_time: string | null;
  sign_out_by: string | null;
  // ... other checklist fields
}

export function useSurgeryData() {
  const queryClient = useQueryClient();

  // Fetch operating rooms
  const { data: operatingRooms = [], isLoading: loadingRooms } = useQuery({
    queryKey: ["operating-rooms"],
    queryFn: async () => {
      const { data, error } = await db
        .from("operating_rooms")
        .select("*")
        .eq("is_active", true)
        .order("room_number");

      if (error) throw error;
      return data as OperatingRoom[];
    },
  });

  // Fetch surgeries with patient and room data
  const { data: surgeries = [], isLoading: loadingSurgeries, refetch: refetchSurgeries } = useQuery({
    queryKey: ["surgeries"],
    queryFn: async () => {
      const { data, error } = await db
        .from("surgeries")
        .select(`
          *,
          patient:patients(full_name, medical_record_number, birth_date, gender),
          operating_room:operating_rooms(*)
        `)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_start_time", { ascending: true });

      if (error) throw error;
      return data as Surgery[];
    },
  });

  // Fetch today's surgeries
  const { data: todaySurgeries = [], isLoading: loadingToday } = useQuery({
    queryKey: ["surgeries-today"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await db
        .from("surgeries")
        .select(`
          *,
          patient:patients(full_name, medical_record_number, birth_date, gender),
          operating_room:operating_rooms(*)
        `)
        .eq("scheduled_date", today)
        .order("scheduled_start_time", { ascending: true });

      if (error) throw error;
      return data as Surgery[];
    },
  });

  // Create surgery
  const createSurgery = useMutation({
    mutationFn: async (surgeryData: Partial<Surgery>) => {
      // Generate surgery number
      const { data: surgeryNumber } = await db.rpc("generate_surgery_number");
      
      const insertData = {
        patient_id: surgeryData.patient_id!,
        scheduled_date: surgeryData.scheduled_date!,
        scheduled_start_time: surgeryData.scheduled_start_time!,
        preoperative_diagnosis: surgeryData.preoperative_diagnosis!,
        procedure_name: surgeryData.procedure_name!,
        surgery_number: surgeryNumber as string,
        visit_id: surgeryData.visit_id || null,
        operating_room_id: surgeryData.operating_room_id || null,
        scheduled_end_time: surgeryData.scheduled_end_time || null,
        procedure_code: surgeryData.procedure_code || null,
        procedure_type: surgeryData.procedure_type || 'elective',
        wound_class: surgeryData.wound_class || 'clean',
        anesthesia_type: surgeryData.anesthesia_type || null,
        asa_classification: surgeryData.asa_classification || null,
        preoperative_notes: surgeryData.preoperative_notes || null,
      };
      
      const { data, error } = await db
        .from("surgeries")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["surgeries-today"] });
      toast.success("Jadwal operasi berhasil dibuat");
    },
    onError: (error: Error) => {
      toast.error(`Gagal membuat jadwal: ${error.message}`);
    },
  });

  // Update surgery
  const updateSurgery = useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Surgery> & { id: string }) => {
      const { data, error } = await db
        .from("surgeries")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["surgeries-today"] });
      toast.success("Data operasi berhasil diperbarui");
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui: ${error.message}`);
    },
  });

  // Update surgery status
  const updateSurgeryStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: Surgery['status']; notes?: string }) => {
      const updateData: Partial<Surgery> = { status };
      
      if (status === 'in_progress') {
        updateData.actual_start_time = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.actual_end_time = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancellation_reason = notes;
      }

      const { data, error } = await db
        .from("surgeries")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["surgeries-today"] });
      toast.success("Status operasi diperbarui");
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui status: ${error.message}`);
    },
  });

  // Surgery team operations
  const addTeamMember = useMutation({
    mutationFn: async (member: Omit<SurgeryTeamMember, 'id'>) => {
      const { data, error } = await db
        .from("surgery_teams")
        .insert(member)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surgery-team"] });
      toast.success("Anggota tim ditambahkan");
    },
  });

  // Fetch surgery team
  const fetchSurgeryTeam = async (surgeryId: string) => {
    const { data, error } = await db
      .from("surgery_teams")
      .select("*")
      .eq("surgery_id", surgeryId);

    if (error) throw error;
    return data as SurgeryTeamMember[];
  };

  // Create/update safety checklist
  const updateSafetyChecklist = useMutation({
    mutationFn: async ({ surgeryId, ...checklistData }: Partial<SurgicalSafetyChecklist> & { surgeryId: string }) => {
      // Check if checklist exists
      const { data: existing } = await db
        .from("surgical_safety_checklists")
        .select("id")
        .eq("surgery_id", surgeryId)
        .single();

      if (existing) {
        const { data, error } = await db
          .from("surgical_safety_checklists")
          .update(checklistData)
          .eq("surgery_id", surgeryId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await db
          .from("surgical_safety_checklists")
          .insert({ surgery_id: surgeryId, ...checklistData })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success("Checklist diperbarui");
    },
  });

  // Statistics
  const stats = {
    totalToday: todaySurgeries.length,
    scheduled: todaySurgeries.filter(s => s.status === 'scheduled').length,
    inProgress: todaySurgeries.filter(s => s.status === 'in_progress').length,
    completed: todaySurgeries.filter(s => s.status === 'completed').length,
    cancelled: todaySurgeries.filter(s => s.status === 'cancelled').length,
    availableRooms: operatingRooms.filter(r => r.is_available).length,
  };

  return {
    operatingRooms,
    surgeries,
    todaySurgeries,
    stats,
    isLoading: loadingRooms || loadingSurgeries || loadingToday,
    createSurgery,
    updateSurgery,
    updateSurgeryStatus,
    addTeamMember,
    fetchSurgeryTeam,
    updateSafetyChecklist,
    refetchSurgeries,
  };
}
