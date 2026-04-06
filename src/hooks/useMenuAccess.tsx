import { useMemo } from "react";
import { useAuth } from "./useAuth";

export interface MenuAccess {
  menu_path: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

// Role-to-menu mapping (replaces Supabase RPC get_user_menu_access)
const ROLE_MENU_MAP: Record<string, string[]> = {
  pendaftaran: ["/", "/pendaftaran", "/pasien", "/antrian", "/booking"],
  dokter: ["/", "/rawat-jalan", "/rawat-inap", "/igd", "/rekam-medis", "/kamar-operasi", "/icu", "/hemodialisa", "/pasien"],
  perawat: ["/", "/rawat-jalan", "/rawat-inap", "/igd", "/rekam-medis", "/icu", "/pasien", "/pendaftaran"],
  farmasi: ["/", "/farmasi", "/inventory"],
  laboratorium: ["/", "/laboratorium"],
  radiologi: ["/", "/radiologi"],
  kasir: ["/", "/billing", "/asuransi", "/bpjs"],
  keuangan: ["/", "/billing", "/akuntansi", "/laporan"],
  gizi: ["/", "/gizi"],
  icu: ["/", "/icu"],
  bedah: ["/", "/kamar-operasi"],
  rehabilitasi: ["/", "/rehabilitasi"],
  mcu: ["/", "/mcu"],
  forensik: ["/", "/forensik"],
  cssd: ["/", "/cssd"],
  bank_darah: ["/", "/bank-darah"],
  manajemen: ["/", "/laporan", "/dashboard-executive", "/sdm", "/akuntansi", "/master-data"],
  admin: [], // admin gets full access via canViewPath shortcut
};

const ALL_PATHS = [
  "/", "/pendaftaran", "/pasien", "/rawat-jalan", "/rawat-inap", "/igd", "/rekam-medis",
  "/farmasi", "/laboratorium", "/radiologi", "/billing", "/bpjs", "/asuransi", "/satu-sehat",
  "/inventory", "/sdm", "/laporan", "/master-data", "/pengaturan", "/antrian", "/jadwal-dokter",
  "/telemedicine", "/dashboard-executive", "/akuntansi", "/icu", "/kamar-operasi", "/hemodialisa",
  "/bank-darah", "/gizi", "/rehabilitasi", "/mcu", "/forensik", "/penunjang", "/mutu",
  "/manajemen-user", "/cssd", "/booking",
];

export function useMenuAccess() {
  const { user, roles } = useAuth();

  const menuAccess = useMemo((): MenuAccess[] => {
    if (!user?.id) return [];
    if (roles.includes("admin")) {
      return ALL_PATHS.map(path => ({
        menu_path: path,
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
      }));
    }

    // Build accessible paths from all user's roles
    const accessible = new Set<string>();
    for (const role of roles) {
      const paths = ROLE_MENU_MAP[role] || [];
      paths.forEach(p => accessible.add(p));
    }

    return Array.from(accessible).map(path => ({
      menu_path: path,
      can_view: true,
      can_create: true,
      can_edit: true,
      can_delete: false, // non-admins can't delete by default
    }));
  }, [user?.id, roles]);

  const canViewPath = (path: string): boolean => {
    if (roles.includes("admin")) return true;
    return menuAccess.some(m => m.menu_path === path && m.can_view);
  };

  const canCreateInPath = (path: string): boolean => {
    if (roles.includes("admin")) return true;
    return menuAccess.some(m => m.menu_path === path && m.can_create);
  };

  const canEditInPath = (path: string): boolean => {
    if (roles.includes("admin")) return true;
    return menuAccess.some(m => m.menu_path === path && m.can_edit);
  };

  const canDeleteInPath = (path: string): boolean => {
    if (roles.includes("admin")) return true;
    return menuAccess.some(m => m.menu_path === path && m.can_delete);
  };

  const getAccessiblePaths = (): string[] => {
    return menuAccess.filter(m => m.can_view).map(m => m.menu_path);
  };

  return {
    menuAccess,
    isLoading: false,
    canViewPath,
    canCreateInPath,
    canEditInPath,
    canDeleteInPath,
    getAccessiblePaths,
  };
}
