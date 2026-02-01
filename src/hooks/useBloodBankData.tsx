import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type BloodType = Database['public']['Enums']['blood_type'];
type BloodProductType = Database['public']['Enums']['blood_product_type'];
type BloodStatus = Database['public']['Enums']['blood_status'];
type CrossmatchResult = Database['public']['Enums']['crossmatch_result'];
type TransfusionReactionSeverity = Database['public']['Enums']['transfusion_reaction_severity'];

// Types
export interface BloodInventory {
  id: string;
  bag_number: string;
  blood_type: BloodType;
  product_type: BloodProductType;
  volume: number | null;
  collection_date: string;
  expiry_date: string;
  source_blood_bank: string | null;
  status: BloodStatus | null;
  storage_location: string | null;
  hiv_status: string | null;
  hbsag_status: string | null;
  hcv_status: string | null;
  reserved_for_patient_id: string | null;
  notes: string | null;
}

export interface TransfusionRequest {
  id: string;
  request_number: string;
  patient_id: string;
  visit_id: string | null;
  requesting_doctor_id: string | null;
  department: string | null;
  request_date: string;
  urgency: string | null;
  product_type: BloodProductType;
  units_requested: number;
  indication: string;
  patient_blood_type: BloodType | null;
  patient_hemoglobin: number | null;
  status: string | null;
  notes: string | null;
  patients?: { full_name: string; medical_record_number: string } | null;
  doctors?: { full_name: string } | null;
}

export interface CrossmatchTest {
  id: string;
  request_id: string | null;
  patient_id: string;
  blood_bag_id: string;
  test_date: string;
  major_crossmatch: CrossmatchResult | null;
  minor_crossmatch: CrossmatchResult | null;
  is_compatible: boolean | null;
  valid_until: string | null;
  blood_inventory?: { bag_number: string; blood_type: BloodType; product_type: BloodProductType } | null;
  patients?: { full_name: string } | null;
}

export interface TransfusionReaction {
  id: string;
  transfusion_id: string;
  patient_id: string;
  reaction_type: string;
  severity: TransfusionReactionSeverity;
  reaction_time: string;
  outcome: string | null;
}

// Blood Inventory
export function useBloodInventory(status?: BloodStatus) {
  return useQuery({
    queryKey: ["blood-inventory", status],
    queryFn: async () => {
      let query = supabase
        .from("blood_inventory")
        .select("*")
        .order("expiry_date", { ascending: true });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BloodInventory[];
    },
  });
}

// Available Blood
export function useAvailableBlood() {
  return useBloodInventory("available");
}

// Blood Inventory Statistics
export function useBloodInventoryStats() {
  return useQuery({
    queryKey: ["blood-inventory-stats"],
    queryFn: async () => {
      const { data: inventory } = await supabase
        .from("blood_inventory")
        .select("blood_type, product_type, status, expiry_date")
        .eq("status", "available");

      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

      // Count by blood type
      const byBloodType: Record<string, number> = {
        'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 
        'AB+': 0, 'AB-': 0, 'O+': 0, 'O-': 0,
      };

      // Count by product type
      const byProductType: Record<string, number> = {
        'whole_blood': 0, 'prc': 0, 'ffp': 0, 
        'tc': 0, 'cryoprecipitate': 0, 'platelets': 0,
      };

      let expiringCount = 0;

      inventory?.forEach(item => {
        byBloodType[item.blood_type] = (byBloodType[item.blood_type] || 0) + 1;
        byProductType[item.product_type] = (byProductType[item.product_type] || 0) + 1;
        
        if (new Date(item.expiry_date) <= threeDaysFromNow) {
          expiringCount++;
        }
      });

      // Get pending requests count
      const { count: pendingRequests } = await supabase
        .from("transfusion_requests")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pending");

      // Get today's transfusions
      const todayStr = today.toISOString().split('T')[0];
      const { count: todayTransfusions } = await supabase
        .from("transfusion_records")
        .select("*", { count: 'exact', head: true })
        .gte("transfusion_date", todayStr);

      return {
        totalAvailable: inventory?.length || 0,
        byBloodType,
        byProductType,
        expiringCount,
        pendingRequests: pendingRequests || 0,
        todayTransfusions: todayTransfusions || 0,
      };
    },
  });
}

// Transfusion Requests
export function useTransfusionRequests(status?: string) {
  return useQuery({
    queryKey: ["transfusion-requests", status],
    queryFn: async () => {
      let query = supabase
        .from("transfusion_requests")
        .select(`
          *,
          patients(full_name, medical_record_number),
          doctors(full_name)
        `)
        .order("request_date", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as unknown as TransfusionRequest[];
    },
  });
}

// Crossmatch Tests
export function useCrossmatchTests(requestId?: string) {
  return useQuery({
    queryKey: ["crossmatch-tests", requestId],
    queryFn: async () => {
      let query = supabase
        .from("crossmatch_tests")
        .select(`
          *,
          blood_inventory(bag_number, blood_type, product_type),
          patients(full_name)
        `)
        .order("test_date", { ascending: false });

      if (requestId) {
        query = query.eq("request_id", requestId);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as unknown as CrossmatchTest[];
    },
  });
}

// Transfusion Reactions
export function useTransfusionReactions() {
  return useQuery({
    queryKey: ["transfusion-reactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transfusion_reactions")
        .select(`
          *,
          patients(full_name),
          blood_inventory(bag_number, blood_type)
        `)
        .order("reaction_time", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as unknown as TransfusionReaction[];
    },
  });
}

// Mutations
export function useUpdateBloodInventory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Database['public']['Tables']['blood_inventory']['Update']) => {
      const { error } = await supabase.from("blood_inventory").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blood-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["blood-inventory-stats"] });
      toast({ title: "Blood bag updated" });
    },
  });
}

export function useCreateTransfusionRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Database['public']['Tables']['transfusion_requests']['Insert']) => {
      const { error } = await supabase.from("transfusion_requests").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfusion-requests"] });
      queryClient.invalidateQueries({ queryKey: ["blood-inventory-stats"] });
      toast({ title: "Transfusion request created" });
    },
  });
}

export function useUpdateTransfusionRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Database['public']['Tables']['transfusion_requests']['Update']) => {
      const { error } = await supabase.from("transfusion_requests").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfusion-requests"] });
      toast({ title: "Request updated" });
    },
  });
}
