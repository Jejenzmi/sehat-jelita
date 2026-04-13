import { Users, Stethoscope, BedDouble, CreditCard, ShieldCheck, Loader2, TrendingUp, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { ServiceChart } from "@/components/dashboard/ServiceChart";
import { BPJSStatus } from "@/components/dashboard/BPJSStatus";
import { SatuSehatStatus } from "@/components/dashboard/SatuSehatStatus";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { BedOccupancy } from "@/components/dashboard/BedOccupancy";
import { useDashboardStats } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { useBootstrapAdmin } from "@/hooks/useBootstrapAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useMenuAccess } from "@/hooks/useMenuAccess";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { needsBootstrap, bootstrapAdmin, loading: bootstrapLoading, error: bootstrapError } = useBootstrapAdmin();
  const { user, roles } = useAuth();
  const { canViewPath, menuAccess, isLoading: loadingAccess } = useMenuAccess();

  const isAdmin = roles.includes("admin");
  const canViewClinical = canViewPath("/rawat-jalan") || canViewPath("/rawat-inap") || canViewPath("/igd");
  const canViewFinance = canViewPath("/billing") || canViewPath("/akuntansi");
  const canViewBedOccupancy = canViewPath("/rawat-inap");
  const canViewBPJS = canViewPath("/bpjs");
  const canViewSatuSehat = canViewPath("/satu-sehat");
  const canViewPatients = canViewPath("/pasien") || canViewPath("/pendaftaran") || canViewClinical;
  const canViewExecutive = canViewPath("/dashboard-executive") || canViewPath("/laporan");
  const hasAnyAccess = menuAccess.length > 0 || isAdmin;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const visibleStats = [
    canViewClinical || isAdmin,
    canViewClinical,
    canViewBedOccupancy,
    canViewFinance,
  ].filter(Boolean).length;

  const gridCols = visibleStats === 4 ? "lg:grid-cols-4" : visibleStats === 3 ? "lg:grid-cols-3" : visibleStats === 2 ? "lg:grid-cols-2" : "";

  return (
    <div className="space-y-4">
      {/* Bootstrap Admin Alert */}
      {needsBootstrap && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              Setup Admin Pertama
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {bootstrapError && (
              <Alert variant="destructive">
                <AlertTitle>Gagal</AlertTitle>
                <AlertDescription>{bootstrapError}</AlertDescription>
              </Alert>
            )}
            <Button size="sm" onClick={bootstrapAdmin} disabled={bootstrapLoading}>
              {bootstrapLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Jadikan Saya Admin
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ─── Compact Welcome Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1B4332] px-6 py-5 shadow-md">
        {/* Background blobs */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-6 left-20 h-32 w-32 rounded-full bg-[#2D6A4F]/60 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-white/50 mb-1">
              SIMRS ZEN • {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="text-xl font-bold text-white">
              Selamat datang, {user?.fullName?.split(" ")[0] || roles[0]?.toUpperCase() || "Admin"}! 👋
            </h1>
            <p className="mt-1 text-sm text-white/60 max-w-md">
              Pantau laporan operasional, kunjungan, dan statistik pendapatan secara real-time.
            </p>
            <div className="mt-3 flex gap-2 flex-wrap">
              {roles.map(r => (
                <Badge key={r} className="bg-white/15 text-white border-0 text-xs hover:bg-white/20">
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white/80" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] border border-white/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white/80" />
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white/90" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats Grid ─── */}
      {visibleStats > 0 && (
        <div className={`grid grid-cols-2 ${gridCols} gap-3`}>
          {(canViewClinical || isAdmin) && (
            isLoading ? <Skeleton className="h-28 rounded-2xl" /> : (
              <StatCard title="Total Kunjungan" value={stats?.totalVisitsToday?.toString() || "0"} subtitle="Hari ini" icon={Users} variant="primary" />
            )
          )}
          {canViewClinical && (
            isLoading ? <Skeleton className="h-28 rounded-2xl" /> : (
              <StatCard title="Rawat Jalan" value={stats?.outpatientToday?.toString() || "0"} subtitle="Poliklinik" icon={Stethoscope} variant="success" />
            )
          )}
          {canViewBedOccupancy && (
            isLoading ? <Skeleton className="h-28 rounded-2xl" /> : (
              <StatCard title="Rawat Inap" value={stats?.inpatientCount?.toString() || "0"} subtitle={`${stats?.occupancyRate || 0}% BOR`} icon={BedDouble} variant="warning" />
            )
          )}
          {canViewFinance && (
            isLoading ? <Skeleton className="h-28 rounded-2xl" /> : (
              <StatCard title="Pendapatan" value={formatCurrency(stats?.revenueToday || 0)} subtitle="BPJS & Umum" icon={CreditCard} variant="default" />
            )
          )}
        </div>
      )}

      {/* ─── Quick Actions ─── */}
      <QuickActions />

      {/* ─── Main Content Grid ─── */}
      {hasAnyAccess && (
        <div className={`grid grid-cols-1 ${(canViewBPJS || canViewSatuSehat || canViewBedOccupancy) ? "lg:grid-cols-3" : ""} gap-4`}>
          <div className={`${(canViewBPJS || canViewSatuSehat || canViewBedOccupancy) ? "lg:col-span-2" : ""} space-y-4`}>
            {(canViewExecutive || canViewClinical) && <ServiceChart />}
            {canViewPatients && <RecentPatients />}
          </div>
          {(canViewBPJS || canViewSatuSehat || canViewBedOccupancy) && (
            <div className="space-y-4">
              {canViewBPJS && <BPJSStatus />}
              {canViewSatuSehat && <SatuSehatStatus />}
              {canViewBedOccupancy && <BedOccupancy />}
            </div>
          )}
        </div>
      )}

      {!hasAnyAccess && !loadingAccess && !needsBootstrap && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Anda belum memiliki akses ke modul manapun. Silakan hubungi administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
