import { Users, Stethoscope, BedDouble, CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { ServiceChart } from "@/components/dashboard/ServiceChart";
import { BPJSStatus } from "@/components/dashboard/BPJSStatus";
import { SatuSehatStatus } from "@/components/dashboard/SatuSehatStatus";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { BedOccupancy } from "@/components/dashboard/BedOccupancy";
import { useDashboardStats } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `Rp ${(amount / 1000000000).toFixed(1)}M`;
    }
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    }
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di Sistem Informasi Manajemen Rumah Sakit
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

      {/* Quick Actions */}
      <div className="animate-slide-up delay-500">
        <QuickActions />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Tables */}
        <div className="lg:col-span-2 space-y-6">
          <ServiceChart />
          <RecentPatients />
        </div>

        {/* Right Column - Status Cards */}
        <div className="space-y-6">
          <BPJSStatus />
          <SatuSehatStatus />
          <BedOccupancy />
        </div>
      </div>
    </div>
  );
}
