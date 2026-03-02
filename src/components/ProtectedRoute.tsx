import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isNodeMode } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, session } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // In Node.js mode session is always null; only user is set after login
  const isAuthenticated = isNodeMode() ? !!user : !!(user && session);

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    // Use element directly without wrapping in fragment to avoid ref warning
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
