import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface ReportColumn {
  id: string;
  sourceColumn: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  aggregation?: string;
}

export interface ReportFilter {
  id: string;
  column: string;
  operator: string;
  value: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  data_source: string;
  columns: ReportColumn[];
  filters: ReportFilter[];
  chart_type: string;
  created_by: string | null;
  created_at: string;
}

export function useReportBuilderData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["custom-report-templates"],
    queryFn: async () => {
      const { data, error } = await db
        .from("custom_report_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        columns: (t.columns as any) || [],
        filters: (t.filters as any) || [],
      })) as ReportTemplate[];
    },
  });

  const saveTemplate = useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      data_source: string;
      columns: ReportColumn[];
      filters: ReportFilter[];
      chart_type: string;
    }) => {
      const { data, error } = await db
        .from("custom_report_templates")
        .insert({
          name: template.name,
          description: template.description || null,
          data_source: template.data_source,
          columns: template.columns as any,
          filters: template.filters as any,
          chart_type: template.chart_type,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-report-templates"] });
      toast.success("Laporan berhasil disimpan ke database!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("custom_report_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-report-templates"] });
      toast.success("Template laporan dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { templates, isLoading, saveTemplate, deleteTemplate };
}

// Hook to fetch real data for report preview
export function useReportData(dataSource: string) {
  return useQuery({
    queryKey: ["report-data", dataSource],
    queryFn: async () => {
      switch (dataSource) {
        case "visits": {
          const { data, error } = await db
            .from("visits")
            .select("*, patients(full_name), doctors(full_name), departments(name)")
            .order("visit_date", { ascending: false })
            .limit(100);
          if (error) throw error;
          return (data || []).map((v: any) => ({
            visit_date: v.visit_date,
            patient_name: v.patients?.full_name || "-",
            doctor_name: v.doctors?.full_name || "-",
            department: v.departments?.name || "-",
            visit_type: v.visit_type || "-",
            status: v.status || "-",
            payment_type: v.payment_type || "-",
            diagnosis: v.chief_complaint || "-",
          }));
        }
        case "billing": {
          const { data, error } = await db
            .from("billings")
            .select("*, patients(full_name)")
            .order("billing_date", { ascending: false })
            .limit(100);
          if (error) throw error;
          return (data || []).map((b: any) => ({
            invoice_number: b.invoice_number,
            billing_date: b.billing_date,
            patient_name: b.patients?.full_name || "-",
            total: b.total,
            paid_amount: b.paid_amount || 0,
            payment_type: b.payment_type || "-",
            status: b.status || "-",
          }));
        }
        case "pharmacy": {
          const { data, error } = await db
            .from("prescriptions")
            .select("*, patients(full_name)")
            .order("prescription_date", { ascending: false })
            .limit(100);
          if (error) throw error;
          return (data || []).map((p: any) => ({
            prescription_date: p.prescription_date,
            patient_name: p.patients?.full_name || "-",
            medicine_name: "-",
            quantity: 0,
            status: p.status || "-",
          }));
        }
        case "lab": {
          const { data, error } = await db
            .from("lab_results")
            .select("*, patients(full_name)")
            .order("order_date", { ascending: false })
            .limit(100);
          if (error) throw error;
          return (data || []).map((l: any) => ({
            order_date: l.order_date,
            patient_name: l.patients?.full_name || "-",
            test_name: l.test_name || "-",
            result: l.result_value || "-",
            status: l.status || "-",
          }));
        }
        case "employees": {
          const { data, error } = await db
            .from("employees")
            .select("*, departments(name)")
            .order("full_name")
            .limit(100);
          if (error) throw error;
          return (data || []).map((e: any) => ({
            employee_name: e.full_name,
            department: e.departments?.name || "-",
            position: e.position || "-",
            status: e.employment_status || "-",
            join_date: e.join_date || "-",
          }));
        }
        case "inventory": {
          const { data, error } = await db
            .from("medicines")
            .select("*")
            .order("name")
            .limit(100);
          if (error) throw error;
          return (data || []).map((m: any) => ({
            item_name: m.name,
            category: m.category || "-",
            stock: m.stock_quantity || 0,
            unit: m.unit || "-",
            min_stock: m.minimum_stock || 0,
            expiry_date: "-",
          }));
        }
        case "bpjs": {
          const { data, error } = await db
            .from("bpjs_claims")
            .select("*, patients(full_name)")
            .order("claim_date", { ascending: false })
            .limit(100);
          if (error) throw error;
          return (data || []).map((c: any) => ({
            claim_date: c.claim_date,
            sep_number: c.sep_number,
            patient_name: c.patients?.full_name || "-",
            claim_amount: c.claim_amount,
            approved_amount: c.approved_amount || 0,
            status: c.status || "-",
          }));
        }
        default:
          return [];
      }
    },
    staleTime: 1000 * 60 * 2,
  });
}
