import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  BedDouble,
  Ambulance as AmbulanceIcon,
  Pill,
  FlaskConical,
  Radio,
  Syringe,
  CreditCard,
  HeartPulse as HeartPulseIcon,
  Droplet,
  Shield,
  HeartPulse,
  Package,
  UserCog,
  FileBarChart,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  Menu,
  ListOrdered,
  CalendarDays,
  Video,
  BarChart3,
  UtensilsCrossed,
  Activity,
  ClipboardCheck,
  Skull,
  Wrench,
  Award,
  KeyRound,
  Paintbrush,
  BarChart2,
  Tv,
  ArrowRightLeft,
  Home,
  Truck,
  BarChart,
  Boxes,
  AlertTriangle,
  HeartHandshake,
  ArrowLeftRight,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import simrsZenLogo from "@/assets/simrs-zen-logo.png";
import { useMenuAccess } from "@/hooks/useMenuAccess";
import { useModuleVisibility } from "@/hooks/useModuleVisibility";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const allNavigationGroups: NavGroup[] = [
  {
    title: "Utama",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: BarChart3, label: "Executive", path: "/dashboard-executive" },
      { icon: UserPlus, label: "Pendaftaran", path: "/pendaftaran" },
      { icon: Users, label: "Pasien", path: "/pasien" },
      { icon: ListOrdered, label: "Antrian", path: "/antrian" },
      { icon: CalendarDays, label: "Booking", path: "/jadwal-dokter" },
    ],
  },
  {
    title: "Pelayanan Medis",
    items: [
      { icon: Stethoscope, label: "Rawat Jalan", path: "/rawat-jalan" },
      { icon: BedDouble, label: "Rawat Inap", path: "/rawat-inap" },
      { icon: AmbulanceIcon, label: "IGD", path: "/igd", badge: "24H" },
      { icon: Syringe, label: "Kamar Operasi", path: "/kamar-operasi" },
      { icon: HeartPulseIcon, label: "ICU/NICU/PICU", path: "/icu", badge: "ICU" },
      { icon: Video, label: "Telemedicine", path: "/telemedicine" },
      { icon: HeartPulse, label: "Rekam Medis", path: "/rekam-medis" },
    ],
  },
  {
    title: "Penunjang",
    items: [
      { icon: Pill, label: "Farmasi", path: "/farmasi" },
      { icon: FlaskConical, label: "Laboratorium", path: "/laboratorium" },
      { icon: Radio, label: "Radiologi", path: "/radiologi" },
      { icon: Droplet, label: "Hemodialisa", path: "/hemodialisa" },
      { icon: Droplet, label: "Bank Darah", path: "/bank-darah", badge: "BDRS" },
      { icon: UtensilsCrossed, label: "Gizi", path: "/gizi" },
      { icon: Activity, label: "Rehabilitasi", path: "/rehabilitasi" },
      { icon: ClipboardCheck, label: "Medical Check Up", path: "/mcu" },
      { icon: Skull, label: "Forensik", path: "/forensik" },
      { icon: Home, label: "Home Care", path: "/home-care", badge: "NEW" },
    ],
  },
  {
    title: "Keuangan & Integrasi",
    items: [
      { icon: CreditCard, label: "Kasir / Billing", path: "/billing" },
      { icon: FileBarChart, label: "Akuntansi", path: "/akuntansi" },
      { icon: Shield, label: "BPJS Kesehatan", path: "/bpjs", badge: "API" },
      { icon: Building2, label: "Asuransi Lain", path: "/asuransi" },
      { icon: Building2, label: "SATU SEHAT", path: "/satu-sehat", badge: "API" },
    ],
  },
  {
    title: "Manajemen",
    items: [
      { icon: Package, label: "Inventory", path: "/inventory" },
      { icon: Truck, label: "Ambulance Center", path: "/ambulance-center", badge: "NEW" },
      { icon: Wrench, label: "Penunjang", path: "/penunjang" },
      { icon: Award, label: "Mutu & Akreditasi", path: "/mutu" },
      { icon: AlertTriangle, label: "Insiden Keselamatan", path: "/insiden-keselamatan", badge: "IKP" },
      { icon: Boxes, label: "ASPAK Aset RS", path: "/aspak", badge: "NEW" },
      { icon: HeartHandshake, label: "Tanda Vital", path: "/tanda-vital", badge: "NEW" },
      { icon: BarChart, label: "Analytics KPI", path: "/analytics", badge: "NEW" },
      { icon: KeyRound, label: "Pendidikan", path: "/pendidikan" },
      { icon: UserCog, label: "SDM / HRD", path: "/sdm" },
      { icon: GraduationCap, label: "Sertifikasi & Pelatihan", path: "/staff-certifications", badge: "NEW" },
      { icon: ArrowLeftRight, label: "SISRUTE Rujukan", path: "/sisrute", badge: "NEW" },
      { icon: FileBarChart, label: "Laporan", path: "/laporan" },
      { icon: FileBarChart, label: "Kemenkes", path: "/laporan-kemenkes", badge: "RL" },
      { icon: FileBarChart, label: "INACBG History", path: "/inacbg-history", badge: "CBG" },
      { icon: Database, label: "Master Data", path: "/master-data" },
      { icon: Shield, label: "Manajemen User", path: "/manajemen-user", badge: "RBAC" },
      { icon: Paintbrush, label: "Form Builder", path: "/form-builder", badge: "NEW" },
      { icon: BarChart2, label: "Report Builder", path: "/report-builder", badge: "NEW" },
      { icon: Tv, label: "Smart Display", path: "/smart-display", badge: "NEW" },
      { icon: ArrowRightLeft, label: "DICOM/PACS", path: "/dicom", badge: "NEW" },
      { icon: Settings, label: "Pengaturan", path: "/pengaturan" },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { canViewPath, isLoading: loadingAccess, menuAccess } = useMenuAccess();
  const { isModuleAvailable, isLoading: loadingModules } = useModuleVisibility();

  // Filter navigation based on user access AND hospital type module configuration
  const navigationGroups = useMemo(() => {
    // While loading, show skeleton/empty state
    if (loadingAccess || loadingModules) return [];
    
    // If user has no menu access (no role assigned), show only dashboard
    if (menuAccess.length === 0) {
      return [{
        title: "Utama",
        items: [{ icon: allNavigationGroups[0].items[0].icon, label: "Dashboard", path: "/" }]
      }];
    }
    
    // Filter navigation items based on:
    // 1. User role-based menu access
    // 2. Hospital type module availability
    return allNavigationGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => 
          canViewPath(item.path) && isModuleAvailable(item.path)
        ),
      }))
      .filter(group => group.items.length > 0);
  }, [canViewPath, loadingAccess, menuAccess, isModuleAvailable, loadingModules]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#1B4332] transition-all duration-300 ease-in-out rounded-r-3xl overflow-hidden shadow-lg",
          collapsed ? "w-[68px]" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{}}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-3 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2 animate-fade-in">
              <img src={simrsZenLogo} alt="SIMRS ZEN" className="h-8 bg-white/90 rounded-lg px-1 py-0.5" />
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 mx-auto rounded-xl bg-white/15 flex items-center justify-center">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <h3 className="px-3 mb-1.5 text-[10px] font-bold text-white/35 uppercase tracking-widest">
                  {group.title}
                </h3>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 text-white/60 hover:text-white hover:bg-white/10 text-sm",
                          isActive && "bg-white/20 text-white font-semibold"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive && "text-white")} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-white/20 text-white">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse Button */}
        <div className="hidden lg:block p-2 border-t border-white/10">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
