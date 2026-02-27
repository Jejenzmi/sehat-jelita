import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { api } from "@/lib/api-client";

type AppRole = "admin" | "dokter" | "perawat" | "kasir" | "farmasi" | "laboratorium" | "radiologi" | "pendaftaran" | "keuangan" | "gizi" | "icu" | "bedah" | "rehabilitasi" | "mcu" | "forensik" | "cssd" | "manajemen" | "bank_darah";

interface AppUser {
  id: string;
  email: string;
  fullName?: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: null;
  loading: boolean;
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const lastRolesUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      try {
        const response = await api.auth.getCurrentUser() as { success: boolean; data: { id: string; email: string; fullName: string; roles: string[] } };
        if (!cancelled && response?.success && response.data) {
          setUser({ id: response.data.id, email: response.data.email, fullName: response.data.fullName });
          setRoles((response.data.roles ?? []) as AppRole[]);
          lastRolesUserIdRef.current = response.data.id;
        }
      } catch (err) {
        console.debug("[Auth] Session restore failed:", (err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    initialize();
    return () => { cancelled = true; };
  }, []);

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role) || roles.includes("admin");
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.auth.login(email, password) as { success: boolean; data: { user: { id: string; email: string; fullName: string; roles: string[] } } };
      if (response?.success && response.data) {
        setUser({ id: response.data.user.id, email: response.data.user.email, fullName: response.data.user.fullName });
        setRoles((response.data.user.roles ?? []) as AppRole[]);
      }
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await api.auth.register(email, password, fullName);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await api.auth.logout();
    setUser(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, session: null, loading, roles, hasRole, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
