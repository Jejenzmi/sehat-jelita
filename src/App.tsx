import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Pendaftaran from "./pages/Pendaftaran";
import Pasien from "./pages/Pasien";
import RawatJalan from "./pages/RawatJalan";
import Farmasi from "./pages/Farmasi";
import BPJS from "./pages/BPJS";
import SatuSehat from "./pages/SatuSehat";
import Billing from "./pages/Billing";
import IGD from "./pages/IGD";
import RekamMedis from "./pages/RekamMedis";
import Laporan from "./pages/Laporan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component for protected pages with layout
const ProtectedPageWithLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pendaftaran"
              element={
                <ProtectedPageWithLayout>
                  <Pendaftaran />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/pasien"
              element={
                <ProtectedPageWithLayout>
                  <Pasien />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/rawat-jalan"
              element={
                <ProtectedPageWithLayout>
                  <RawatJalan />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/igd"
              element={
                <ProtectedPageWithLayout>
                  <IGD />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/rekam-medis"
              element={
                <ProtectedPageWithLayout>
                  <RekamMedis />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/farmasi"
              element={
                <ProtectedPageWithLayout>
                  <Farmasi />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/bpjs"
              element={
                <ProtectedPageWithLayout>
                  <BPJS />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/satu-sehat"
              element={
                <ProtectedPageWithLayout>
                  <SatuSehat />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedPageWithLayout>
                  <Billing />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/laporan"
              element={
                <ProtectedPageWithLayout>
                  <Laporan />
                </ProtectedPageWithLayout>
              }
            />
            {/* Placeholder routes for other modules */}
            <Route
              path="/rawat-inap"
              element={
                <ProtectedPageWithLayout>
                  <div className="p-8 text-center"><h1 className="text-2xl font-bold">Modul Rawat Inap</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/laboratorium"
              element={
                <ProtectedPageWithLayout>
                  <div className="p-8 text-center"><h1 className="text-2xl font-bold">Modul Laboratorium</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/radiologi"
              element={
                <ProtectedPageWithLayout>
                  <div className="p-8 text-center"><h1 className="text-2xl font-bold">Modul Radiologi</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedPageWithLayout>
                  <div className="p-8 text-center"><h1 className="text-2xl font-bold">Inventory Management</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/sdm"
              element={
                <ProtectedPageWithLayout>
                  <div className="p-8 text-center"><h1 className="text-2xl font-bold">SDM / HRD</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/master-data"
              element={
                <ProtectedPageWithLayout>
                  <div className="p-8 text-center"><h1 className="text-2xl font-bold">Master Data</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/pengaturan"
              element={
                <ProtectedPageWithLayout>
                  <div className="p-8 text-center"><h1 className="text-2xl font-bold">Pengaturan Sistem</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/jadwal-dokter"
              element={
                <ProtectedPageWithLayout>
                  <div className="p-8 text-center"><h1 className="text-2xl font-bold">Jadwal Dokter</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
                </ProtectedPageWithLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
