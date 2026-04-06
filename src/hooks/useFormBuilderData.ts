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

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  description?: string;
  width: "full" | "half";
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  fields: FormField[];
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useFormBuilderData() {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["custom-form-templates"],
    queryFn: () => apiFetch<FormTemplate[]>('/form-templates'),
  });

  const saveTemplate = useMutation({
    mutationFn: (template: { name: string; description: string; category: string; fields: FormField[] }) =>
      apiPost<FormTemplate>('/form-templates', template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-form-templates"] });
      toast.success("Template berhasil disimpan ke database!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API_BASE}/form-templates/${id}`, { ...FETCH_OPTS, method: 'DELETE' })
        .then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-form-templates"] });
      toast.success("Template dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { templates, isLoading, saveTemplate, deleteTemplate };
}
