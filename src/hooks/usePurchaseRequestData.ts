import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PurchaseRequest {
  id: string;
  pr_number: string;
  request_date: string;
  requester_id: string | null;
  requester_name: string;
  department: string;
  urgency: string;
  status: string;
  total_estimate: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: PurchaseRequestItem[];
  approvals?: PurchaseRequestApproval[];
}

export interface PurchaseRequestItem {
  id: string;
  pr_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  estimated_price: number;
  notes: string | null;
}

export interface PurchaseRequestApproval {
  id: string;
  pr_id: string;
  approval_level: number;
  role_name: string;
  approver_name: string | null;
  approver_id: string | null;
  status: string;
  approved_at: string | null;
  rejection_reason: string | null;
}

export function usePurchaseRequests() {
  return useQuery({
    queryKey: ["purchase-requests"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("purchase_requests")
        .select("*, purchase_request_items(*), purchase_request_approvals(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((pr) => ({
        ...pr,
        items: pr.purchase_request_items || [],
        approvals: (pr.purchase_request_approvals || []).sort(
          (a: any, b: any) => a.approval_level - b.approval_level
        ),
      })) as PurchaseRequest[];
    },
  });
}

export function useCreatePurchaseRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      pr: Omit<PurchaseRequest, "id" | "created_at" | "updated_at" | "items" | "approvals">;
      items: Omit<PurchaseRequestItem, "id" | "pr_id">[];
    }) => {
      // Create PR
      const { data: pr, error: prErr } = await (supabase as any)
        .from("purchase_requests")
        .insert(input.pr)
        .select()
        .single();
      if (prErr) throw prErr;

      // Create items
      if (input.items.length > 0) {
        const itemsWithPrId = input.items.map((i) => ({ ...i, pr_id: pr.id }));
        const { error: itemErr } = await (supabase as any)
          .from("purchase_request_items")
          .insert(itemsWithPrId);
        if (itemErr) throw itemErr;
      }

      // Create default 3-level approval chain
      const approvals = [
        { pr_id: pr.id, approval_level: 1, role_name: "Kepala Unit", status: "pending" },
        { pr_id: pr.id, approval_level: 2, role_name: "Manajer Logistik", status: "waiting" },
        { pr_id: pr.id, approval_level: 3, role_name: "Direktur/Keuangan", status: "waiting" },
      ];
      const { error: appErr } = await (supabase as any)
        .from("purchase_request_approvals")
        .insert(approvals);
      if (appErr) throw appErr;

      return pr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-requests"] });
      toast.success("Purchase Request berhasil dibuat");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApprovePR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ approvalId, prId, level }: { approvalId: string; prId: string; level: number }) => {
      // Approve current level
      await (supabase as any)
        .from("purchase_request_approvals")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", approvalId);

      // Activate next level
      const { data: nextApproval } = await (supabase as any)
        .from("purchase_request_approvals")
        .select("id")
        .eq("pr_id", prId)
        .eq("approval_level", level + 1)
        .single();

      if (nextApproval) {
        await (supabase as any)
          .from("purchase_request_approvals")
          .update({ status: "pending" })
          .eq("id", nextApproval.id);

        // Update PR status
        const statusMap: Record<number, string> = { 1: "pending_manager", 2: "pending_director" };
        await (supabase as any)
          .from("purchase_requests")
          .update({ status: statusMap[level] || "pending_director" })
          .eq("id", prId);
      } else {
        // Final approval
        await (supabase as any)
          .from("purchase_requests")
          .update({ status: "approved" })
          .eq("id", prId);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-requests"] });
      toast.success("PR disetujui");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRejectPR() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ approvalId, prId, reason }: { approvalId: string; prId: string; reason?: string }) => {
      await (supabase as any)
        .from("purchase_request_approvals")
        .update({ status: "rejected", rejection_reason: reason || null, approved_at: new Date().toISOString() })
        .eq("id", approvalId);

      await (supabase as any)
        .from("purchase_requests")
        .update({ status: "rejected" })
        .eq("id", prId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-requests"] });
      toast.error("PR ditolak");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function generatePRNumber(): Promise<string> {
  const { data, error } = await (supabase as any).rpc("generate_pr_number");
  if (error) throw error;
  return data;
}
