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
  const { roles } = useAuth();
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
    if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(1)}M`;
    }
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    }
    return `Rp ${amount.toLocaleString("id-ID")}`;
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

      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di SIMRS ZEN⁺
        </p>
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
