import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsSetupCompleted } from "@/hooks/useSetupWizard";
import { isNodeMode } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Set to true for routes that should NOT redirect to /setup even if setup is incomplete */
  skipSetupCheck?: boolean;
}

export function ProtectedRoute({ children, skipSetupCheck = false }: ProtectedRouteProps) {
  const { user, loading: authLoading, session } = useAuth();
  const location = useLocation();

  // Only check setup status when user is authenticated
  const isAuthenticated = isNodeMode() ? !!user : !!(user && session);
  const { data: isSetupCompleted, isLoading: setupLoading } = useIsSetupCompleted();

  // Show loading while auth OR setup status is determined
  const isLoading = authLoading || (isAuthenticated && setupLoading && !skipSetupCheck);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated but setup not done, redirect to /setup
  // (except if we're already on /setup to avoid loops)
  if (
    !skipSetupCheck &&
    isSetupCompleted === false &&
    location.pathname !== "/setup"
  ) {
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
