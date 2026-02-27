import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["custom-form-templates"],
    queryFn: async () => {
      const { data, error } = await db
        .from("custom_form_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        fields: (t.fields as any) || [],
      })) as FormTemplate[];
    },
  });

  const saveTemplate = useMutation({
    mutationFn: async (template: { name: string; description: string; category: string; fields: FormField[] }) => {
      const { data, error } = await db
        .from("custom_form_templates")
        .insert({
          name: template.name,
          description: template.description,
          category: template.category,
          fields: template.fields as any,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-form-templates"] });
      toast.success("Template berhasil disimpan ke database!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("custom_form_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-form-templates"] });
      toast.success("Template dihapus");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { templates, isLoading, saveTemplate, deleteTemplate };
}
