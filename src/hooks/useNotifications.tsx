import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface Notification {
  id: string;
  type: "low_stock" | "queue_update" | "lab_result" | "emergency" | "general";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  target_roles?: string[];
  target_user_id?: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const { user, roles } = useAuth();

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    const { data, error } = await db
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
      return;
    }

    // Filter by roles or user
    const filtered = (data || []).filter((n) => {
      if (n.target_user_id && n.target_user_id === user.id) return true;
      if (!n.target_user_id && (!n.target_roles || n.target_roles.length === 0)) return true;
      if (n.target_roles && roles.some((r) => n.target_roles?.includes(r))) return true;
      return false;
    });

    setNotifications(filtered as Notification[]);
    setUnreadCount(filtered.filter((n) => !n.is_read).length);
  }, [user, roles]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    const { error } = await db
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await db
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = db
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Check if notification is for this user
          const isForUser = 
            (newNotification.target_user_id && newNotification.target_user_id === user.id) ||
            (!newNotification.target_user_id && (!newNotification.target_roles || newNotification.target_roles.length === 0)) ||
            (newNotification.target_roles && roles.some((r) => newNotification.target_roles?.includes(r)));

          if (isForUser) {
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show toast for important notifications
            if (newNotification.type === "emergency" || newNotification.type === "low_stock") {
              toast({
                title: newNotification.title,
                description: newNotification.message,
                variant: newNotification.type === "emergency" ? "destructive" : "default",
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [user, roles, fetchNotifications, toast]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}

// Hook for real-time medicine stock alerts
export function useMedicineStockAlerts() {
  const { toast } = useToast();

  useEffect(() => {
    const channel = db
      .channel("medicine-stock-channel")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "medicines",
        },
        (payload) => {
          const medicine = payload.new as { name: string; stock: number; min_stock: number };
          
          if (medicine.stock <= medicine.min_stock) {
            toast({
              title: "Peringatan Stok Rendah!",
              description: `Stok ${medicine.name} tersisa ${medicine.stock} unit (minimum: ${medicine.min_stock})`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [toast]);
}

// Hook for real-time queue updates
export function useQueueUpdates(onUpdate?: (visit: unknown) => void) {
  const { toast } = useToast();

  useEffect(() => {
    const channel = db
      .channel("queue-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visits",
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const visit = payload.new as { status: string; queue_number: number };
            
            if (visit.status === "dipanggil") {
              toast({
                title: "Nomor Antrian Dipanggil",
                description: `Nomor antrian ${visit.queue_number} sedang dipanggil`,
              });
            }
          }

          onUpdate?.(payload.new);
        }
      )
      .subscribe();

    return () => {
      db.removeChannel(channel);
    };
  }, [toast, onUpdate]);
}
