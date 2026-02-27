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
      { icon: KeyRound, label: "Pendidikan", path: "/pendidikan" },
      { icon: UserCog, label: "SDM / HRD", path: "/sdm" },
      { icon: FileBarChart, label: "Laporan", path: "/laporan" },
      { icon: FileBarChart, label: "Kemenkes", path: "/laporan-kemenkes", badge: "RL" },
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
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: "var(--gradient-sidebar)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border bg-white/10 backdrop-blur-sm">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <img src={simrsZenLogo} alt="SIMRS ZEN" className="h-10 bg-white/90 rounded-lg px-1.5 py-0.5" />
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 mx-auto rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <HeartPulse className="h-6 w-6 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn("nav-item", isActive && "active")}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-current")} />
                        {!collapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sidebar-primary/20 text-sidebar-primary">
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
        <div className="hidden lg:block p-3 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
