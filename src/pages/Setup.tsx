import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SetupWizard from "@/components/setup/SetupWizard";
import { useIsSetupCompleted } from "@/hooks/useSetupWizard";
import { useAuth } from "@/hooks/useAuth";

export default function Setup() {
  const navigate = useNavigate();
  const [isReloading, setIsReloading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { data: isSetupCompleted, isLoading } = useIsSetupCompleted();

  useEffect(() => {
    // If not logged in, redirect to auth
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // If setup is already completed, go directly to dashboard
    if (!isLoading && isSetupCompleted === true) {
      navigate("/");
    }
  }, [user, authLoading, isSetupCompleted, isLoading, navigate]);

  const handleComplete = () => {
    setIsReloading(true);
    // Setup selesai → langsung masuk dashboard dengan full page reload.
    // Hal ini bertujuan untuk mereset cache memory dari React Query (staleTime 30s)
    // sehingga ProtectedRoute mendeteksi status setup yang baru (true) dari server.
    setTimeout(() => {
      window.location.replace("/");
    }, 500);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Memeriksa konfigurasi sistem...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Jika setup sudah selesai atau sedang proses reload, tampilkan loading
  if (isSetupCompleted === true || isReloading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Masuk ke dashboard...</p>
        </div>
      </div>
    );
  }

  return <SetupWizard onComplete={handleComplete} />;
}
