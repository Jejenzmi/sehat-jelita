import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useToast } from "./use-toast";

// Medical Equipment
export function useMedicalEquipment(filters?: {
  status?: string;
  category?: string;
  departmentId?: string;
}) {
  return useQuery({
    queryKey: ["medical-equipment", filters],
    queryFn: async () => {
      let query = db
        .from("medical_equipment")
        .select("*, department:departments(name), vendor:vendors(name)")
        .order("equipment_code");
      
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.departmentId) {
        query = query.eq("department_id", filters.departmentId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Equipment needing calibration
export function useEquipmentNeedingCalibration() {
  return useQuery({
    queryKey: ["equipment-needing-calibration"],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data, error } = await db
        .from("medical_equipment")
        .select("*, department:departments(name)")
        .eq("calibration_required", true)
        .lte("next_calibration_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .order("next_calibration_date");
      
      if (error) throw error;
      return data;
    },
  });
}

// Equipment needing maintenance
export function useEquipmentNeedingMaintenance() {
  return useQuery({
    queryKey: ["equipment-needing-maintenance"],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data, error } = await db
        .from("medical_equipment")
        .select("*, department:departments(name)")
        .not("next_maintenance_date", "is", null)
        .lte("next_maintenance_date", thirtyDaysFromNow.toISOString().split("T")[0])
        .order("next_maintenance_date");
      
      if (error) throw error;
      return data;
    },
  });
}

// Equipment Calibrations
export function useEquipmentCalibrations(equipmentId?: string) {
  return useQuery({
    queryKey: ["equipment-calibrations", equipmentId],
    queryFn: async () => {
      let query = db
        .from("equipment_calibrations")
        .select("*, equipment:medical_equipment(equipment_code, equipment_name)")
        .order("calibration_date", { ascending: false });
      
      if (equipmentId) {
        query = query.eq("equipment_id", equipmentId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Equipment Maintenance
export function useEquipmentMaintenance(equipmentId?: string) {
  return useQuery({
    queryKey: ["equipment-maintenance", equipmentId],
    queryFn: async () => {
      let query = db
        .from("equipment_maintenance")
        .select("*, equipment:medical_equipment(equipment_code, equipment_name)")
        .order("maintenance_date", { ascending: false });
      
      if (equipmentId) {
        query = query.eq("equipment_id", equipmentId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Equipment Categories
export function useEquipmentCategories() {
  return useQuery({
    queryKey: ["equipment-categories"],
    queryFn: async () => {
      const { data, error } = await db
        .from("equipment_categories")
        .select("*")
        .eq("is_active", true)
        .order("category_name");
      if (error) throw error;
      return data;
    },
  });
}

// ASPAK Sync Logs
export function useASPAKSyncLogs() {
  return useQuery({
    queryKey: ["aspak-sync-logs"],
    queryFn: async () => {
      const { data, error } = await db
        .from("aspak_sync_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

// Create Equipment
export function useCreateEquipment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipment: {
      equipment_code: string;
      equipment_name: string;
      brand?: string;
      model?: string;
      serial_number?: string;
      category?: string;
      risk_class?: string;
      department_id?: string;
      location?: string;
      purchase_date?: string;
      purchase_price?: number;
      calibration_required?: boolean;
      calibration_interval_months?: number;
      maintenance_interval_months?: number;
    }) => {
      const { data, error } = await db
        .from("medical_equipment")
        .insert(equipment)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-equipment"] });
      toast({
        title: "Berhasil",
        description: "Alat kesehatan berhasil ditambahkan",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Update Equipment
export function useUpdateEquipment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await db
        .from("medical_equipment")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-equipment"] });
      toast({
        title: "Berhasil",
        description: "Data alat kesehatan berhasil diperbarui",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Equipment Statistics
export function useEquipmentStats() {
  return useQuery({
    queryKey: ["equipment-stats"],
    queryFn: async () => {
      const { data, error } = await db
        .from("medical_equipment")
        .select("status, category, risk_class");
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        operational: data.filter(e => e.status === "operational").length,
        maintenance: data.filter(e => e.status === "maintenance").length,
        broken: data.filter(e => e.status === "broken").length,
        disposed: data.filter(e => e.status === "disposed").length,
        byCategory: {} as Record<string, number>,
        byRiskClass: {} as Record<string, number>,
      };
      
      data.forEach(e => {
        if (e.category) {
          stats.byCategory[e.category] = (stats.byCategory[e.category] || 0) + 1;
        }
        if (e.risk_class) {
          stats.byRiskClass[e.risk_class] = (stats.byRiskClass[e.risk_class] || 0) + 1;
        }
      });
      
      return stats;
    },
  });
}
