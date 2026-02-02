import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SetupWizard from "@/components/setup/SetupWizard";
import { useIsSetupCompleted } from "@/hooks/useSetupWizard";
import { useAuth } from "@/hooks/useAuth";

export default function Setup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isSetupCompleted, isLoading } = useIsSetupCompleted();

  useEffect(() => {
    // If not logged in, redirect to auth
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // If setup is already completed, go to dashboard
    if (!isLoading && isSetupCompleted) {
      navigate("/dashboard");
    }
  }, [user, authLoading, isSetupCompleted, isLoading, navigate]);

  const handleComplete = () => {
    navigate("/dashboard");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <SetupWizard onComplete={handleComplete} />;
}
