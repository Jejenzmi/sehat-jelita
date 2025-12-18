import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Pendaftaran from "./pages/Pendaftaran";
import Pasien from "./pages/Pasien";
import RawatJalan from "./pages/RawatJalan";
import Farmasi from "./pages/Farmasi";
import BPJS from "./pages/BPJS";
import SatuSehat from "./pages/SatuSehat";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component for pages that need the layout
const PageWithLayout = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/pendaftaran"
            element={
              <PageWithLayout>
                <Pendaftaran />
              </PageWithLayout>
            }
          />
          <Route
            path="/pasien"
            element={
              <PageWithLayout>
                <Pasien />
              </PageWithLayout>
            }
          />
          <Route
            path="/rawat-jalan"
            element={
              <PageWithLayout>
                <RawatJalan />
              </PageWithLayout>
            }
          />
          <Route
            path="/farmasi"
            element={
              <PageWithLayout>
                <Farmasi />
              </PageWithLayout>
            }
          />
          <Route
            path="/bpjs"
            element={
              <PageWithLayout>
                <BPJS />
              </PageWithLayout>
            }
          />
          <Route
            path="/satu-sehat"
            element={
              <PageWithLayout>
                <SatuSehat />
              </PageWithLayout>
            }
          />
          <Route
            path="/billing"
            element={
              <PageWithLayout>
                <Billing />
              </PageWithLayout>
            }
          />
          {/* Placeholder routes for other modules */}
          <Route
            path="/rawat-inap"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">Modul Rawat Inap</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route
            path="/igd"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">Modul IGD</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route
            path="/rekam-medis"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">Rekam Medis Elektronik</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route
            path="/laboratorium"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">Modul Laboratorium</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route
            path="/radiologi"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">Modul Radiologi</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">Inventory Management</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route
            path="/sdm"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">SDM / HRD</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route
            path="/laporan"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">Laporan & Analitik</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route
            path="/master-data"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">Master Data</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route
            path="/pengaturan"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">Pengaturan Sistem</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route
            path="/jadwal-dokter"
            element={
              <PageWithLayout>
                <div className="p-8 text-center"><h1 className="text-2xl font-bold">Jadwal Dokter</h1><p className="text-muted-foreground mt-2">Coming soon...</p></div>
              </PageWithLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
