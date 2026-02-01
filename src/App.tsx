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
import PatientAuth from "./pages/PatientAuth";
import PatientPortal from "./pages/PatientPortal";
import Pendaftaran from "./pages/Pendaftaran";
import Pasien from "./pages/Pasien";
import RawatJalan from "./pages/RawatJalan";
import Farmasi from "./pages/Farmasi";
import BPJS from "./pages/BPJS";
import Asuransi from "./pages/Asuransi";
import SatuSehat from "./pages/SatuSehat";
import Billing from "./pages/Billing";
import IGD from "./pages/IGD";
import RekamMedis from "./pages/RekamMedis";
import Laporan from "./pages/Laporan";
import Laboratorium from "./pages/Laboratorium";
import RawatInap from "./pages/RawatInap";
import Radiologi from "./pages/Radiologi";
import Antrian from "./pages/Antrian";
import DashboardExecutive from "./pages/DashboardExecutive";
import Booking from "./pages/Booking";
import Telemedicine from "./pages/Telemedicine";
import Inventory from "./pages/Inventory";
import SDM from "./pages/SDM";
import MasterData from "./pages/MasterData";
import ManajemenUser from "./pages/ManajemenUser";
import Pengaturan from "./pages/Pengaturan";
import KamarOperasi from "./pages/KamarOperasi";
import ICU from "./pages/ICU";
import Hemodialisa from "./pages/Hemodialisa";
import BankDarah from "./pages/BankDarah";
import Gizi from "./pages/Gizi";
import Rehabilitasi from "./pages/Rehabilitasi";
import MCU from "./pages/MCU";
import Forensik from "./pages/Forensik";
import Penunjang from "./pages/Penunjang";
import Mutu from "./pages/Mutu";
import Akuntansi from "./pages/Akuntansi";
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
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/patient-auth" element={<PatientAuth />} />
            <Route path="/patient-portal" element={<PatientPortal />} />
            
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
              path="/asuransi"
              element={
                <ProtectedPageWithLayout>
                  <Asuransi />
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
                  <RawatInap />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/laboratorium"
              element={
                <ProtectedPageWithLayout>
                  <Laboratorium />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/radiologi"
              element={
                <ProtectedPageWithLayout>
                  <Radiologi />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/antrian"
              element={
                <ProtectedPageWithLayout>
                  <Antrian />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedPageWithLayout>
                  <Inventory />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/sdm"
              element={
                <ProtectedPageWithLayout>
                  <SDM />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/master-data"
              element={
                <ProtectedPageWithLayout>
                  <MasterData />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/manajemen-user"
              element={
                <ProtectedPageWithLayout>
                  <ManajemenUser />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/pengaturan"
              element={
                <ProtectedPageWithLayout>
                  <Pengaturan />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/jadwal-dokter"
              element={
                <ProtectedPageWithLayout>
                  <Booking />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/dashboard-executive"
              element={
                <ProtectedPageWithLayout>
                  <DashboardExecutive />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/telemedicine"
              element={
                <ProtectedPageWithLayout>
                  <Telemedicine />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/kamar-operasi"
              element={
                <ProtectedPageWithLayout>
                  <KamarOperasi />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/icu"
              element={
                <ProtectedPageWithLayout>
                  <ICU />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/hemodialisa"
              element={
                <ProtectedPageWithLayout>
                  <Hemodialisa />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/bank-darah"
              element={
                <ProtectedPageWithLayout>
                  <BankDarah />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/gizi"
              element={
                <ProtectedPageWithLayout>
                  <Gizi />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/rehabilitasi"
              element={
                <ProtectedPageWithLayout>
                  <Rehabilitasi />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/mcu"
              element={
                <ProtectedPageWithLayout>
                  <MCU />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/forensik"
              element={
                <ProtectedPageWithLayout>
                  <Forensik />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/penunjang"
              element={
                <ProtectedPageWithLayout>
                  <Penunjang />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/mutu"
              element={
                <ProtectedPageWithLayout>
                  <Mutu />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/akuntansi"
              element={
                <ProtectedPageWithLayout>
                  <Akuntansi />
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
