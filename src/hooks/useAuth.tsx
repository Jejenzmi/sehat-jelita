import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const lastRolesUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Listener FIRST (synchronous state updates only)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    // THEN validate existing session before releasing loading state
    const initialize = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        let validatedSession: Session | null = initialSession;
        let validatedUser: User | null = initialSession?.user ?? null;

        // If there is a stored session, validate it (prevents UI "flash" on expired tokens)
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

  // Fetch roles when user changes (keeps auth listener callback clean)
  useEffect(() => {
    if (!user) {
      lastRolesUserIdRef.current = null;
      setRoles([]);
      return;
    }

    if (lastRolesUserIdRef.current === user.id) return;
    lastRolesUserIdRef.current = user.id;

    // Defer DB call to avoid coupling with auth state updates
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
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
