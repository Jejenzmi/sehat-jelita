import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AppRole = "admin" | "dokter" | "perawat" | "kasir" | "farmasi" | "laboratorium" | "radiologi" | "pendaftaran";

export const ALL_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: "admin", label: "Administrator", description: "Akses penuh ke semua modul sistem" },
  { value: "dokter", label: "Dokter", description: "Pelayanan medis, rekam medis, telemedicine" },
  { value: "perawat", label: "Perawat", description: "Asistensi pelayanan medis, monitoring pasien" },
  { value: "kasir", label: "Kasir", description: "Billing, pembayaran, laporan keuangan" },
  { value: "farmasi", label: "Farmasi", description: "Pengelolaan obat, resep, inventory farmasi" },
  { value: "laboratorium", label: "Laboratorium", description: "Pemeriksaan lab, hasil lab" },
  { value: "radiologi", label: "Radiologi", description: "Pemeriksaan radiologi, hasil radiologi" },
  { value: "pendaftaran", label: "Pendaftaran", description: "Registrasi pasien, antrian, booking" },
];

export const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  dokter: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  perawat: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  kasir: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  farmasi: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  laboratorium: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  radiologi: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  pendaftaran: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

// Menu paths grouped by category
export const MENU_GROUPS = [
  {
    title: "Utama",
    menus: [
      { path: "/", label: "Dashboard" },
      { path: "/dashboard-executive", label: "Executive Dashboard" },
      { path: "/pendaftaran", label: "Pendaftaran" },
      { path: "/pasien", label: "Data Pasien" },
      { path: "/antrian", label: "Antrian" },
      { path: "/jadwal-dokter", label: "Booking/Jadwal" },
    ],
  },
  {
    title: "Pelayanan Medis",
    menus: [
      { path: "/rawat-jalan", label: "Rawat Jalan" },
      { path: "/rawat-inap", label: "Rawat Inap" },
      { path: "/igd", label: "IGD" },
      { path: "/kamar-operasi", label: "Kamar Operasi" },
      { path: "/icu", label: "ICU/NICU/PICU" },
      { path: "/telemedicine", label: "Telemedicine" },
      { path: "/rekam-medis", label: "Rekam Medis" },
    ],
  },
  {
    title: "Penunjang Medis",
    menus: [
      { path: "/farmasi", label: "Farmasi" },
      { path: "/laboratorium", label: "Laboratorium" },
      { path: "/radiologi", label: "Radiologi" },
      { path: "/hemodialisa", label: "Hemodialisa" },
      { path: "/bank-darah", label: "Bank Darah" },
      { path: "/gizi", label: "Gizi" },
      { path: "/rehabilitasi", label: "Rehabilitasi" },
      { path: "/mcu", label: "Medical Check Up" },
      { path: "/forensik", label: "Forensik" },
    ],
  },
  {
    title: "Keuangan & Integrasi",
    menus: [
      { path: "/billing", label: "Kasir/Billing" },
      { path: "/akuntansi", label: "Akuntansi" },
      { path: "/bpjs", label: "BPJS Kesehatan" },
      { path: "/asuransi", label: "Asuransi Lain" },
      { path: "/satu-sehat", label: "SATU SEHAT" },
    ],
  },
  {
    title: "Manajemen",
    menus: [
      { path: "/inventory", label: "Inventory" },
      { path: "/penunjang", label: "Penunjang" },
      { path: "/mutu", label: "Mutu & Akreditasi" },
      { path: "/sdm", label: "SDM/HRD" },
      { path: "/laporan", label: "Laporan" },
      { path: "/master-data", label: "Master Data" },
      { path: "/manajemen-user", label: "Manajemen User" },
      { path: "/pengaturan", label: "Pengaturan" },
    ],
  },
];

export interface UserFormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  nip: string;
  roles: AppRole[];
  menuAccess: Record<string, { can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }>;
}

export const initialUserFormData: UserFormData = {
  email: "",
  password: "",
  full_name: "",
  phone: "",
  nip: "",
  roles: [],
  menuAccess: {},
};

interface UserFormFieldsProps {
  data: UserFormData;
  onChange: (data: UserFormData) => void;
  isEditing?: boolean;
}

export function UserFormFields({ data, onChange, isEditing = false }: UserFormFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);

  const updateField = <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const handleRoleToggle = (role: AppRole) => {
    const newRoles = data.roles.includes(role)
      ? data.roles.filter((r) => r !== role)
      : [...data.roles, role];
    updateField("roles", newRoles);
  };

  const handleMenuAccessChange = (
    path: string,
    permission: "can_view" | "can_create" | "can_edit" | "can_delete",
    checked: boolean
  ) => {
    const currentAccess = data.menuAccess[path] || {
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    };

    // If disabling view, disable all other permissions
    if (permission === "can_view" && !checked) {
      updateField("menuAccess", {
        ...data.menuAccess,
        [path]: { can_view: false, can_create: false, can_edit: false, can_delete: false },
      });
    } else {
      // If enabling any other permission, also enable view
      const newAccess = {
        ...currentAccess,
        [permission]: checked,
        can_view: permission !== "can_view" && checked ? true : currentAccess.can_view,
      };
      updateField("menuAccess", { ...data.menuAccess, [path]: newAccess });
    }
  };

  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="account">Akun</TabsTrigger>
        <TabsTrigger value="roles">Role</TabsTrigger>
        <TabsTrigger value="menu">Akses Menu</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Nama lengkap pengguna"
              value={data.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>NIP/NIK Karyawan</Label>
            <Input
              placeholder="Nomor induk pegawai"
              value={data.nip}
              onChange={(e) => updateField("nip", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input
              type="email"
              placeholder="email@rumahsakit.com"
              value={data.email}
              onChange={(e) => updateField("email", e.target.value)}
              disabled={isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label>No. Telepon</Label>
            <Input
              placeholder="08xxxxxxxxxx"
              value={data.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
        </div>

        {!isEditing && (
          <div className="space-y-2">
            <Label>Password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={data.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="roles" className="mt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Pilih role untuk menentukan hak akses dasar pengguna. Role akan otomatis menetapkan akses menu sesuai template.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {ALL_ROLES.map((role) => (
            <div
              key={role.value}
              className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                data.roles.includes(role.value)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => handleRoleToggle(role.value)}
            >
              <Checkbox
                checked={data.roles.includes(role.value)}
                onCheckedChange={() => handleRoleToggle(role.value)}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{role.label}</span>
                  <Badge className={ROLE_COLORS[role.value]} variant="secondary">
                    {role.value}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
              </div>
            </div>
          ))}
        </div>

        {data.roles.length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Role terpilih:</p>
            <div className="flex flex-wrap gap-2">
              {data.roles.map((role) => (
                <Badge key={role} className={ROLE_COLORS[role]}>
                  {ALL_ROLES.find((r) => r.value === role)?.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="menu" className="mt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Atur akses menu secara manual. Ini akan menimpa akses default dari role yang dipilih.
        </p>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          {MENU_GROUPS.map((group) => (
            <div key={group.title} className="mb-6">
              <h4 className="font-semibold text-sm mb-3 text-primary">{group.title}</h4>
              <div className="space-y-2">
                {group.menus.map((menu) => {
                  const access = data.menuAccess[menu.path] || {
                    can_view: false,
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                  };
                  return (
                    <div
                      key={menu.path}
                      className="flex items-center justify-between p-2 rounded border bg-card"
                    >
                      <span className="text-sm font-medium">{menu.label}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1 text-xs">
                          <Checkbox
                            checked={access.can_view}
                            onCheckedChange={(checked) =>
                              handleMenuAccessChange(menu.path, "can_view", !!checked)
                            }
                          />
                          Lihat
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <Checkbox
                            checked={access.can_create}
                            onCheckedChange={(checked) =>
                              handleMenuAccessChange(menu.path, "can_create", !!checked)
                            }
                            disabled={!access.can_view}
                          />
                          Tambah
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <Checkbox
                            checked={access.can_edit}
                            onCheckedChange={(checked) =>
                              handleMenuAccessChange(menu.path, "can_edit", !!checked)
                            }
                            disabled={!access.can_view}
                          />
                          Edit
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <Checkbox
                            checked={access.can_delete}
                            onCheckedChange={(checked) =>
                              handleMenuAccessChange(menu.path, "can_delete", !!checked)
                            }
                            disabled={!access.can_view}
                          />
                          Hapus
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
