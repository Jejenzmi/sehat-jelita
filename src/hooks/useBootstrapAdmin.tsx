import { useState } from "react";
import { useAuth } from "./useAuth";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
      const res = await fetch(`${API_BASE}/admin/bootstrap`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || res.statusText);
        return false;
      }

      window.location.reload();
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const needsBootstrap = !!user && roles.length === 0;

  return { bootstrapAdmin, loading, error, needsBootstrap };
}
