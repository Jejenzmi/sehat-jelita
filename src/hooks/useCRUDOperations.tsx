import { useState } from "react";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Generic CRUD operations without strict typing to avoid complexity errors
export function useCRUDOperations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const create = async (
    table: string,
    data: Record<string, unknown>,
    options?: {
      invalidateQueries?: string[];
      successMessage?: string;
    }
  ): Promise<{ data: Record<string, unknown> | null; error: Error | null }> => {
    setIsLoading(true);
    try {
      const { data: result, error } = await (db as any)
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }

      toast({
        title: "Berhasil",
        description: options?.successMessage || "Data berhasil ditambahkan",
      });

      return { data: result, error: null };
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message || "Gagal menambah data",
      });
      return { data: null, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const update = async (
    table: string,
    id: string,
    data: Record<string, unknown>,
    options?: {
      invalidateQueries?: string[];
      successMessage?: string;
    }
  ): Promise<{ data: Record<string, unknown> | null; error: Error | null }> => {
    setIsLoading(true);
    try {
      const { data: result, error } = await (db as any)
        .from(table)
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }

      toast({
        title: "Berhasil",
        description: options?.successMessage || "Data berhasil diperbarui",
      });

      return { data: result, error: null };
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message || "Gagal memperbarui data",
      });
      return { data: null, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (
    table: string,
    id: string,
    options?: {
      invalidateQueries?: string[];
      successMessage?: string;
    }
  ): Promise<{ success: boolean; error: Error | null }> => {
    setIsLoading(true);
    try {
      const { error } = await (db as any).from(table).delete().eq("id", id);

      if (error) throw error;

      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }

      toast({
        title: "Berhasil",
        description: options?.successMessage || "Data berhasil dihapus",
      });

      return { success: true, error: null };
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message || "Gagal menghapus data",
      });
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const bulkCreate = async (
    table: string,
    dataArray: Record<string, unknown>[],
    options?: {
      invalidateQueries?: string[];
      successMessage?: string;
    }
  ): Promise<{ data: Record<string, unknown>[]; error: Error | null }> => {
    setIsLoading(true);
    try {
      const { data: result, error } = await (db as any)
        .from(table)
        .insert(dataArray)
        .select();

      if (error) throw error;

      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
      }

      toast({
        title: "Berhasil",
        description: options?.successMessage || `${dataArray.length} data berhasil ditambahkan`,
      });

      return { data: result || [], error: null };
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message || "Gagal menambah data",
      });
      return { data: [], error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    create,
    update,
    remove,
    bulkCreate,
    isLoading,
  };
}
