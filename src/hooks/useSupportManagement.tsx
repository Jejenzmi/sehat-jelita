import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

// CSSD Hooks
export function useSterilizationItems() {
  return useQuery({
    queryKey: ["sterilization-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sterilization_items")
        .select("*")
        .order("item_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useSterilizationBatches() {
  return useQuery({
    queryKey: ["sterilization-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sterilization_batches")
        .select("*, operator:employees(full_name)")
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Linen/Laundry Hooks
export function useLinenInventory() {
  return useQuery({
    queryKey: ["linen-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("linen_inventory")
        .select("*, department:departments(name)")
        .order("linen_code");
      if (error) throw error;
      return data;
    },
  });
}

export function useLaundryBatches() {
  return useQuery({
    queryKey: ["laundry-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("laundry_batches")
        .select("*")
        .order("collection_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Maintenance Hooks
export function useMaintenanceAssets() {
  return useQuery({
    queryKey: ["maintenance-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_assets")
        .select("*, department:departments(name)")
        .order("asset_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useMaintenanceRequests() {
  return useQuery({
    queryKey: ["maintenance-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select("*, asset:maintenance_assets(asset_name, asset_code)")
        .order("request_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Waste Management Hooks
export function useWasteCategories() {
  return useQuery({
    queryKey: ["waste-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waste_categories")
        .select("*")
        .order("code");
      if (error) throw error;
      return data;
    },
  });
}

export function useWasteCollections() {
  return useQuery({
    queryKey: ["waste-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waste_collections")
        .select("*, category:waste_categories(name, color_code), department:departments(name)")
        .order("collection_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useWasteDisposals() {
  return useQuery({
    queryKey: ["waste-disposals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waste_disposals")
        .select("*, category:waste_categories(name)")
        .order("disposal_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

// Vendor Hooks
export function useVendors() {
  return useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("vendor_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useVendorContracts() {
  return useQuery({
    queryKey: ["vendor-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_contracts")
        .select("*, vendor:vendors(vendor_name)")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useVendorEvaluations() {
  return useQuery({
    queryKey: ["vendor-evaluations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_evaluations")
        .select("*, vendor:vendors(vendor_name)")
        .order("evaluation_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
