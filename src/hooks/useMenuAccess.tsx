import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useAuth } from "./useAuth";

export interface MenuAccess {
  menu_path: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function useMenuAccess() {
  const { user, roles } = useAuth();

  const { data: menuAccess = [], isLoading } = useQuery({
    queryKey: ["menu-access", user?.id],
    queryFn: async (): Promise<MenuAccess[]> => {
      if (!user?.id) return [];

      // Admin has full access
      if (roles.includes("admin")) {
        return [
          { menu_path: "/", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/pendaftaran", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/pasien", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/rawat-jalan", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/rawat-inap", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/igd", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/rekam-medis", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/farmasi", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/laboratorium", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/radiologi", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/billing", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/bpjs", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/asuransi", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/satu-sehat", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/inventory", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/sdm", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/laporan", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/master-data", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/pengaturan", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/antrian", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/jadwal-dokter", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/telemedicine", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/dashboard-executive", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/akuntansi", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/icu", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/kamar-operasi", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/hemodialisa", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/bank-darah", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/gizi", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/rehabilitasi", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/mcu", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/forensik", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/penunjang", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/mutu", can_view: true, can_create: true, can_edit: true, can_delete: true },
          { menu_path: "/manajemen-user", can_view: true, can_create: true, can_edit: true, can_delete: true },
        ];
      }

      const { data, error } = await db.rpc("get_user_menu_access", {
        _user_id: user.id,
      });

      if (error) {
        console.error("Error fetching menu access:", error);
        return [];
      }

      return (data || []) as MenuAccess[];
    },
    enabled: !!user?.id,
  });

  const canViewPath = (path: string): boolean => {
    if (roles.includes("admin")) return true;
    const access = menuAccess.find((m) => m.menu_path === path);
    return access?.can_view ?? false;
  };

  const canCreateInPath = (path: string): boolean => {
    if (roles.includes("admin")) return true;
    const access = menuAccess.find((m) => m.menu_path === path);
    return access?.can_create ?? false;
  };

  const canEditInPath = (path: string): boolean => {
    if (roles.includes("admin")) return true;
    const access = menuAccess.find((m) => m.menu_path === path);
    return access?.can_edit ?? false;
  };

  const canDeleteInPath = (path: string): boolean => {
    if (roles.includes("admin")) return true;
    const access = menuAccess.find((m) => m.menu_path === path);
    return access?.can_delete ?? false;
  };

  const getAccessiblePaths = (): string[] => {
    if (roles.includes("admin")) {
      return menuAccess.map((m) => m.menu_path);
    }
    return menuAccess.filter((m) => m.can_view).map((m) => m.menu_path);
  };

  return {
    menuAccess,
    isLoading,
    canViewPath,
    canCreateInPath,
    canEditInPath,
    canDeleteInPath,
    getAccessiblePaths,
  };
}
