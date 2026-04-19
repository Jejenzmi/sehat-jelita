import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Hook to bootstrap the first admin user.
 * The RLS policy "Bootstrap first admin" allows any authenticated user to
 * insert themselves as admin ONLY when no roles exist in user_roles yet.
 */
export function useBootstrapAdmin() {
  const { user, roles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bootstrapAdmin = async (): Promise<boolean> => {
    if (!user) {
      setError("User not authenticated");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: insertErr } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "admin",
      });

      if (insertErr) {
        // Likely roles already exist (policy blocks insertion)
        setError(insertErr.message);
        return false;
      }

      // Reload page to refresh auth roles
      window.location.reload();
      return true;
    } catch (e: any) {
      setError(e.message || "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // User needs bootstrap if logged in but has no roles
  const needsBootstrap = !!user && roles.length === 0;

  return { bootstrapAdmin, loading, error, needsBootstrap };
}
