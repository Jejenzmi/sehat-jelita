import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const PatientAuth = lazy(() => import("./pages/PatientAuth"));
const PatientPortal = lazy(() => import("./pages/PatientPortal"));
const Setup = lazy(() => import("./pages/Setup"));
const Pendaftaran = lazy(() => import("./pages/Pendaftaran"));
const Pasien = lazy(() => import("./pages/Pasien"));
const RawatJalan = lazy(() => import("./pages/RawatJalan"));
const Farmasi = lazy(() => import("./pages/Farmasi"));
const BPJS = lazy(() => import("./pages/BPJS"));
const Asuransi = lazy(() => import("./pages/Asuransi"));
const SatuSehat = lazy(() => import("./pages/SatuSehat"));
const Billing = lazy(() => import("./pages/Billing"));
const IGD = lazy(() => import("./pages/IGD"));
const RekamMedis = lazy(() => import("./pages/RekamMedis"));
const Laporan = lazy(() => import("./pages/Laporan"));
const Laboratorium = lazy(() => import("./pages/Laboratorium"));
const RawatInap = lazy(() => import("./pages/RawatInap"));
const Radiologi = lazy(() => import("./pages/Radiologi"));
const Antrian = lazy(() => import("./pages/Antrian"));
const DashboardExecutive = lazy(() => import("./pages/DashboardExecutive"));
const Booking = lazy(() => import("./pages/Booking"));
const Telemedicine = lazy(() => import("./pages/Telemedicine"));
const Inventory = lazy(() => import("./pages/Inventory"));
const SDM = lazy(() => import("./pages/SDM"));
const MasterData = lazy(() => import("./pages/MasterData"));
const ManajemenUser = lazy(() => import("./pages/ManajemenUser"));
const Pengaturan = lazy(() => import("./pages/Pengaturan"));
const KamarOperasi = lazy(() => import("./pages/KamarOperasi"));
const ICU = lazy(() => import("./pages/ICU"));
const Hemodialisa = lazy(() => import("./pages/Hemodialisa"));
const BankDarah = lazy(() => import("./pages/BankDarah"));
const Gizi = lazy(() => import("./pages/Gizi"));
const Rehabilitasi = lazy(() => import("./pages/Rehabilitasi"));
const MCU = lazy(() => import("./pages/MCU"));
const Forensik = lazy(() => import("./pages/Forensik"));
const Penunjang = lazy(() => import("./pages/Penunjang"));
const Mutu = lazy(() => import("./pages/Mutu"));
const Akuntansi = lazy(() => import("./pages/Akuntansi"));
const Pendidikan = lazy(() => import("./pages/Pendidikan"));
const LaporanKemenkes = lazy(() => import("./pages/LaporanKemenkes"));
const Kiosk = lazy(() => import("./pages/Kiosk"));
const MigrasiData = lazy(() => import("./pages/MigrasiData"));
const Presentasi = lazy(() => import("./pages/Presentasi"));
const DokumentasiSistem = lazy(() => import("./pages/DokumentasiSistem"));
const PanduanPenggunaan = lazy(() => import("./pages/PanduanPenggunaan"));
const FormBuilder = lazy(() => import("./pages/FormBuilder"));
const ReportBuilder = lazy(() => import("./pages/ReportBuilder"));
const SmartDisplay = lazy(() => import("./pages/SmartDisplay"));
const DICOMIntegration = lazy(() => import("./pages/DICOMIntegration"));
const HomeCare = lazy(() => import("./pages/HomeCare"));
const AmbulanceCenter = lazy(() => import("./pages/AmbulanceCenter"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ASPAK = lazy(() => import("./pages/ASPAK"));
const InsidenKeselamatan = lazy(() => import("./pages/InsidenKeselamatan"));
const TandaVital = lazy(() => import("./pages/TandaVital"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const BedManagement = lazy(() => import("./pages/BedManagement"));
const ShiftCalendar = lazy(() => import("./pages/ShiftCalendar"));
const Sisrute = lazy(() => import("./pages/Sisrute"));
const StaffCertifications = lazy(() => import("./pages/StaffCertifications"));
const INACBGHistory = lazy(() => import("./pages/INACBGHistory"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on every mount — reduces DB load significantly
      staleTime: 30 * 1000,       // Data fresh for 30 seconds
      gcTime:    5 * 60 * 1000,   // Keep in cache 5 minutes (was cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (auth/validation), only on network/5xx
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Don't spam server on tab focus
    },
    mutations: {
      retry: 0, // Never retry mutations automatically
    },
  },
});

// Wrapper component for protected pages with layout + per-page error boundary
const ProtectedPageWithLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/patient-auth" element={<PatientAuth />} />
            <Route path="/patient-portal" element={<PatientPortal />} />
            <Route path="/kiosk" element={<Kiosk />} />
            <Route path="/presentasi" element={<Presentasi />} />
            <Route path="/dokumentasi-sistem" element={<DokumentasiSistem />} />
            <Route path="/panduan" element={<PanduanPenggunaan />} />
            <Route
              path="/setup"
              element={
                <ProtectedRoute skipSetupCheck={true}>
                  <Setup />
                </ProtectedRoute>
              }
            />
            
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
              path="/dashboard"
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
            <Route
              path="/pendidikan"
              element={
                <ProtectedPageWithLayout>
                  <Pendidikan />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/laporan-kemenkes"
              element={
                <ProtectedPageWithLayout>
                  <LaporanKemenkes />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/migrasi-data"
              element={
                <ProtectedPageWithLayout>
                  <MigrasiData />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/form-builder"
              element={
                <ProtectedPageWithLayout>
                  <FormBuilder />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/report-builder"
              element={
                <ProtectedPageWithLayout>
                  <ReportBuilder />
                </ProtectedPageWithLayout>
              }
            />
            <Route path="/smart-display" element={<SmartDisplay />} />
            <Route
              path="/dicom"
              element={
                <ProtectedPageWithLayout>
                  <DICOMIntegration />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/home-care"
              element={
                <ProtectedPageWithLayout>
                  <HomeCare />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/ambulance-center"
              element={
                <ProtectedPageWithLayout>
                  <AmbulanceCenter />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedPageWithLayout>
                  <Analytics />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/aspak"
              element={
                <ProtectedPageWithLayout>
                  <ASPAK />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/insiden-keselamatan"
              element={
                <ProtectedPageWithLayout>
                  <InsidenKeselamatan />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/tanda-vital"
              element={
                <ProtectedPageWithLayout>
                  <TandaVital />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <ProtectedPageWithLayout>
                  <AuditLogs />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/bed-management"
              element={
                <ProtectedPageWithLayout>
                  <BedManagement />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/shift-calendar"
              element={
                <ProtectedPageWithLayout>
                  <ShiftCalendar />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/sisrute"
              element={
                <ProtectedPageWithLayout>
                  <Sisrute />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/staff-certifications"
              element={
                <ProtectedPageWithLayout>
                  <StaffCertifications />
                </ProtectedPageWithLayout>
              }
            />
            <Route
              path="/inacbg-history"
              element={
                <ProtectedPageWithLayout>
                  <INACBGHistory />
                </ProtectedPageWithLayout>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
