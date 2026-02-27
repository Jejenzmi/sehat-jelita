import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { api, isNodeMode } from "@/lib/api-client";

type AppRole = "admin" | "dokter" | "perawat" | "kasir" | "farmasi" | "laboratorium" | "radiologi" | "pendaftaran" | "keuangan" | "gizi" | "icu" | "bedah" | "rehabilitasi" | "mcu" | "forensik" | "cssd" | "manajemen" | "bank_darah";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: build a minimal User-compatible object from Node.js backend response
function buildNodeUser(userData: { id: string; email: string; fullName?: string }): User {
  const now = new Date().toISOString();
  return {
    id: userData.id,
    email: userData.email,
    role: "authenticated",
    app_metadata: {},
    user_metadata: { full_name: userData.fullName ?? "" },
    aud: "authenticated",
    created_at: now,
    updated_at: now,
    confirmed_at: now,
  } as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const lastRolesUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (isNodeMode()) {
      // Node.js backend mode: restore session from stored JWT
      const initialize = async () => {
        try {
          const response = await api.auth.getCurrentUser() as { success: boolean; data: { id: string; email: string; fullName: string; roles: string[] } };
          if (!cancelled && response?.success && response.data) {
            const nodeUser = buildNodeUser(response.data);
            setUser(nodeUser);
            setRoles((response.data.roles ?? []) as AppRole[]);
          }
        } catch (err) {
          // No valid token stored or network error — user is treated as logged out
          console.debug("[Auth] Session restore failed:", (err as Error).message);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      initialize();
      return () => { cancelled = true; };
    }

    // Supabase mode (original behaviour)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    const initialize = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        let validatedSession: Session | null = initialSession;
        let validatedUser: User | null = initialSession?.user ?? null;

        if (initialSession) {
          const {
            data: { user: verifiedUser },
            error,
          } = await supabase.auth.getUser();

          if (error || !verifiedUser) {
            validatedSession = null;
            validatedUser = null;
          } else {
            validatedUser = verifiedUser;
          }
        }

        if (cancelled) return;

        setSession(validatedSession);
        setUser(validatedUser);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initialize();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch roles when user changes — Supabase mode only
  useEffect(() => {
    if (isNodeMode()) return; // roles come from login response in Node.js mode

    if (!user) {
      lastRolesUserIdRef.current = null;
      setRoles([]);
      return;
    }

    if (lastRolesUserIdRef.current === user.id) return;
    lastRolesUserIdRef.current = user.id;

    const id = user.id;
    setTimeout(() => {
      fetchUserRoles(id);
    }, 0);
  }, [user]);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      
      if (error) throw error;
      setRoles(data?.map(r => r.role as AppRole) || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role) || roles.includes("admin");
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (isNodeMode()) {
        const response = await api.auth.login(email, password) as { success: boolean; data: { user: { id: string; email: string; fullName: string; roles: string[] } } };
        if (response?.success && response.data) {
          const nodeUser = buildNodeUser(response.data.user);
          setUser(nodeUser);
          setRoles((response.data.user.roles ?? []) as AppRole[]);
        }
        return { error: null };
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      if (isNodeMode()) {
        await api.auth.register(email, password, fullName);
        return { error: null };
      }
      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName },
        },
      });
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (isNodeMode()) {
      await api.auth.logout();
      setUser(null);
      setSession(null);
      setRoles([]);
      return;
    }
    await supabase.auth.signOut();
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, hasRole, signIn, signUp, signOut }}>
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
