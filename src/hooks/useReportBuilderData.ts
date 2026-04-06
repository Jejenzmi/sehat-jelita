import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

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
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["custom-report-templates"],
    queryFn: () => apiFetch<ReportTemplate[]>('/report-templates'),
  });

  const saveTemplate = useMutation({
    mutationFn: (template: {
      name: string; description?: string; data_source: string;
      columns: ReportColumn[]; filters: ReportFilter[]; chart_type: string;
    }) => apiPost<ReportTemplate>('/report-templates', template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-report-templates"] });
      toast.success("Laporan berhasil disimpan ke database!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_BASE}/report-templates/${id}`, { ...FETCH_OPTS, method: 'DELETE' })
        .then(r => r.json()),
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
    queryFn: () => apiFetch<Record<string, unknown>[]>(`/report-templates/data/${dataSource}`),
    staleTime: 1000 * 60 * 2,
    enabled: !!dataSource,
  });
}
