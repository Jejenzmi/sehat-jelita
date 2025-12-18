import { Users, Stethoscope, BedDouble, CreditCard, TrendingUp, Activity } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentPatients } from "@/components/dashboard/RecentPatients";
import { ServiceChart } from "@/components/dashboard/ServiceChart";
import { BPJSStatus } from "@/components/dashboard/BPJSStatus";
import { SatuSehatStatus } from "@/components/dashboard/SatuSehatStatus";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { BedOccupancy } from "@/components/dashboard/BedOccupancy";

export default function Dashboard() {
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
          <StatCard
            title="Total Kunjungan Hari Ini"
            value="247"
            subtitle="Semua layanan"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            variant="primary"
          />
        </div>
        <div className="animate-slide-up delay-200">
          <StatCard
            title="Rawat Jalan"
            value="156"
            subtitle="8 Poliklinik aktif"
            icon={Stethoscope}
            trend={{ value: 8, isPositive: true }}
            variant="success"
          />
        </div>
        <div className="animate-slide-up delay-300">
          <StatCard
            title="Rawat Inap"
            value="103"
            subtitle="84% okupansi"
            icon={BedDouble}
            trend={{ value: 3, isPositive: false }}
            variant="warning"
          />
        </div>
        <div className="animate-slide-up delay-400">
          <StatCard
            title="Pendapatan Hari Ini"
            value="Rp 125.8jt"
            subtitle="BPJS & Umum"
            icon={CreditCard}
            trend={{ value: 15, isPositive: true }}
            variant="default"
          />
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
