import { Users, Stethoscope, BedDouble, CreditCard, ShieldCheck, Loader2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { ServiceChart } from "@/components/dashboard/ServiceChart";
import { BPJSStatus } from "@/components/dashboard/BPJSStatus";
import { SatuSehatStatus } from "@/components/dashboard/SatuSehatStatus";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { BedOccupancy } from "@/components/dashboard/BedOccupancy";
import { RoleDashboardContent } from "@/components/dashboard/RoleDashboardContent";
import { useDashboardStats } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { useBootstrapAdmin } from "@/hooks/useBootstrapAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useMenuAccess } from "@/hooks/useMenuAccess";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { needsBootstrap, bootstrapAdmin, loading: bootstrapLoading, error: bootstrapError } = useBootstrapAdmin();
  const { user, roles } = useAuth();
  const { canViewPath, menuAccess, isLoading: loadingAccess } = useMenuAccess();

  // Determine visibility based on menu access (not hardcoded roles)
  const isAdmin = roles.includes("admin");
  
  // Stats visibility based on accessible paths
  const canViewClinical = canViewPath("/rawat-jalan") || canViewPath("/rawat-inap") || canViewPath("/igd");
  const canViewFinance = canViewPath("/billing") || canViewPath("/akuntansi");
  const canViewBedOccupancy = canViewPath("/rawat-inap");
  const canViewBPJS = canViewPath("/bpjs");
  const canViewSatuSehat = canViewPath("/satu-sehat");
  const canViewPatients = canViewPath("/pasien") || canViewPath("/pendaftaran") || canViewClinical;
  const canViewExecutive = canViewPath("/dashboard-executive") || canViewPath("/laporan");

  // Determine if user has minimal access (show at least something)
  const hasAnyAccess = menuAccess.length > 0 || isAdmin;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate grid columns based on visible stats
  const visibleStats = [
    canViewClinical || isAdmin, // Total visits
    canViewClinical, // Outpatient
    canViewBedOccupancy, // Inpatient
    canViewFinance, // Revenue
  ].filter(Boolean).length;

  const gridCols = visibleStats === 4 ? "lg:grid-cols-4" : 
                   visibleStats === 3 ? "lg:grid-cols-3" : 
                   visibleStats === 2 ? "lg:grid-cols-2" : "";

  return (
    <div className="space-y-6">
      {/* Bootstrap Admin Alert - shown if user has no role */}
      {needsBootstrap && (
        <Card className="border-warning bg-warning/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-warning" />
              Setup Admin Pertama
            </CardTitle>
            <CardDescription>
              Anda belum memiliki role. Klik tombol di bawah untuk menjadi admin pertama.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {bootstrapError && (
              <Alert variant="destructive">
                <AlertTitle>Gagal</AlertTitle>
                <AlertDescription>{bootstrapError}</AlertDescription>
              </Alert>
            )}
            <Button onClick={bootstrapAdmin} disabled={bootstrapLoading}>
              {bootstrapLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Jadikan Saya Admin
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Role Info Card */}
      <RoleDashboardContent />

      {/* Page Header / Welcome Banner LMS Style */}
      <div className="animate-fade-in relative">
        <div className="bg-[#1B4332] text-white rounded-[24px] p-8 md:p-12 flex justify-between items-center relative overflow-hidden shadow-lg border border-[#2D6A4F]/30">
          {/* Background abstract shapes */}
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 z-0 pointer-events-none"></div>
          <div className="absolute left-10 bottom-0 w-64 h-64 bg-[#2D6A4F]/50 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 z-0 pointer-events-none"></div>
          
          <div className="z-10 relative">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">
              Selamat datang kembali, {user?.fullName || roles[0]?.toUpperCase() || 'Admin'}! 👋
            </h1>
            <p className="text-white/80 max-w-xl text-base md:text-lg leading-relaxed font-medium">
              Pantau laporan operasional hari ini. Mulai dari jumlah kunjungan, status rawat inap pasien, hingga statistik pendapatan secara real-time.
            </p>
          </div>
          
          <div className="hidden lg:flex items-center justify-center z-10 mr-4">
            <div className="relative w-40 h-40 bg-white/5 rounded-[30px] flex items-center justify-center border border-white/20 backdrop-blur-md transform rotate-3 shadow-2xl">
               <ShieldCheck className="w-20 h-20 text-white/90 transform -rotate-3" />
               <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-[#2D6A4F] rounded-2xl flex items-center justify-center border border-white/20 shadow-lg transform -rotate-6">
                 <Users className="w-6 h-6 text-white" />
               </div>
               <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-md shadow-lg transform rotate-12">
                 <Stethoscope className="w-6 h-6 text-white" />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview - Show based on menu access */}
      {visibleStats > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-4`}>
          {/* Total Visits - Show to clinical staff, admin, management */}
          {(canViewClinical || isAdmin) && (
            <div className="animate-slide-up delay-100">
              {isLoading ? (
                <Skeleton className="h-32" />
              ) : (
                <StatCard
                  title="Total Kunjungan Hari Ini"
                  value={stats?.totalVisitsToday?.toString() || "0"}
                  subtitle="Semua layanan"
                  icon={Users}
                  variant="primary"
                />
              )}
            </div>
          )}
          
          {/* Outpatient - Show to clinical staff */}
          {canViewClinical && (
            <div className="animate-slide-up delay-200">
              {isLoading ? (
                <Skeleton className="h-32" />
              ) : (
                <StatCard
                  title="Rawat Jalan"
                  value={stats?.outpatientToday?.toString() || "0"}
                  subtitle="Hari ini"
                  icon={Stethoscope}
                  variant="success"
                />
              )}
            </div>
          )}
          
          {/* Inpatient - Show to those with rawat-inap access */}
          {canViewBedOccupancy && (
            <div className="animate-slide-up delay-300">
              {isLoading ? (
                <Skeleton className="h-32" />
              ) : (
                <StatCard
                  title="Rawat Inap"
                  value={stats?.inpatientCount?.toString() || "0"}
                  subtitle={`${stats?.occupancyRate || 0}% okupansi`}
                  icon={BedDouble}
                  variant="warning"
                />
              )}
            </div>
          )}
          
          {/* Revenue - Show only to finance staff */}
          {canViewFinance && (
            <div className="animate-slide-up delay-400">
              {isLoading ? (
                <Skeleton className="h-32" />
              ) : (
                <StatCard
                  title="Pendapatan Hari Ini"
                  value={formatCurrency(stats?.revenueToday || 0)}
                  subtitle="BPJS & Umum"
                  icon={CreditCard}
                  variant="default"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions - Always show, filtered internally */}
      <div className="animate-slide-up delay-500">
        <QuickActions />
      </div>

      {/* Main Content Grid - Adaptive based on accessible features */}
      {hasAnyAccess && (
        <div className={`grid grid-cols-1 ${(canViewBPJS || canViewSatuSehat || canViewBedOccupancy) ? 'lg:grid-cols-3' : ''} gap-6`}>
          {/* Left Column - Charts & Tables */}
          <div className={`${(canViewBPJS || canViewSatuSehat || canViewBedOccupancy) ? 'lg:col-span-2' : ''} space-y-6`}>
            {/* Service Chart - Show to executive/management and clinical staff */}
            {(canViewExecutive || canViewClinical) && <ServiceChart />}
            
            {/* Recent Patients - Show to clinical staff & registration */}
            {canViewPatients && <RecentPatients />}
          </div>

          {/* Right Column - Status Cards (only if user has access to any) */}
          {(canViewBPJS || canViewSatuSehat || canViewBedOccupancy) && (
            <div className="space-y-6">
              {canViewBPJS && <BPJSStatus />}
              {canViewSatuSehat && <SatuSehatStatus />}
              {canViewBedOccupancy && <BedOccupancy />}
            </div>
          )}
        </div>
      )}

      {/* Empty state for users with no accessible features */}
      {!hasAnyAccess && !loadingAccess && !needsBootstrap && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Anda belum memiliki akses ke modul manapun. Silakan hubungi administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
