import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./Dashboard";
import { useIsSetupCompleted } from "@/hooks/useSetupWizard";

const Index = () => {
  const navigate = useNavigate();
  const { data: isSetupCompleted, isLoading } = useIsSetupCompleted();

  useEffect(() => {
    // If setup is not completed, redirect to setup wizard
    if (!isLoading && isSetupCompleted === false) {
      navigate("/setup");
    }
  }, [isSetupCompleted, isLoading, navigate]);

  // Show loading while checking setup status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
};

export default Index;
