import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Monitor, Copy, ExternalLink, Tv } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useSmartDisplayDevices,
  useCreateSmartDisplayDevice,
  useUpdateSmartDisplayDevice,
  useDeleteSmartDisplayDevice,
  SmartDisplayDevice,
} from "@/hooks/useSmartDisplayDevices";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALL_MODULES = [
  { value: "lobby", label: "Lobby / Antrian" },
  { value: "ward", label: "Ward / Ruangan" },
  { value: "pharmacy", label: "Farmasi" },
  { value: "schedule", label: "Jadwal Dokter" },
];

function useDepartments() {
  return useQuery({
    queryKey: ["departments-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

export function DeviceManager({ open, onOpenChange }: Props) {
  const { data: devices = [], isLoading } = useSmartDisplayDevices();
  const { data: departments = [] } = useDepartments();
  const createDevice = useCreateSmartDisplayDevice();
  const updateDevice = useUpdateSmartDisplayDevice();
  const deleteDevice = useDeleteSmartDisplayDevice();

  const [adding, setAdding] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_code: "",
    device_name: "",
    location: "",
    description: "",
    enabled_modules: ["lobby"] as string[],
    display_type: "lobby",
    is_active: true,
    auto_rotate: false,
    rotate_interval: 30,
    department_id: null as string | null,
  });

  const baseUrl = window.location.origin;

  const handleAdd = () => {
    if (!newDevice.device_code || !newDevice.device_name || !newDevice.location) {
      toast.error("Kode, nama, dan lokasi wajib diisi");
      return;
    }
    createDevice.mutate(newDevice, {
      onSuccess: () => {
        setAdding(false);
        setNewDevice({
          device_code: "", device_name: "", location: "", description: "",
          enabled_modules: ["lobby"], display_type: "lobby", is_active: true, auto_rotate: false, rotate_interval: 30,
          department_id: null,
        });
      },
    });
  };

  const copyUrl = (code: string) => {
    navigator.clipboard.writeText(`${baseUrl}/smart-display?device=${code}`);
    toast.success("URL display berhasil dicopy");
  };

  const toggleModule = (device: SmartDisplayDevice, mod: string) => {
    const current = device.enabled_modules || [];
    const updated = current.includes(mod) ? current.filter((m) => m !== mod) : [...current, mod];
    if (updated.length === 0) { toast.error("Minimal 1 modul harus aktif"); return; }
    updateDevice.mutate({ id: device.id, enabled_modules: updated });
  };

  const getDeptName = (deptId: string | null) => {
    if (!deptId) return "Semua Poli";
    return departments.find(d => d.id === deptId)?.name || "—";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-primary" />
            Manajemen Device Display
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Daftarkan TV/monitor dan atur modul & poli yang ditampilkan per device</p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <Card key={device.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Monitor className={`h-8 w-8 shrink-0 ${device.is_active ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{device.device_name}</p>
                        <Badge variant="outline" className="text-[10px]">{device.device_code}</Badge>
                        {!device.is_active && <Badge variant="destructive" className="text-[10px]">Nonaktif</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{device.location}</p>
                      <p className="text-xs text-primary font-medium">{getDeptName(device.department_id)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={device.is_active}
                      onCheckedChange={(v) => updateDevice.mutate({ id: device.id, is_active: v })} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyUrl(device.device_code)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => window.open(`${baseUrl}/smart-display?device=${device.device_code}`, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => deleteDevice.mutate(device.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Department selector */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs shrink-0">Poli/Departemen:</Label>
                  <Select
                    value={device.department_id || "all"}
                    onValueChange={(v) => updateDevice.mutate({ id: device.id, department_id: v === "all" ? null : v })}
                  >
                    <SelectTrigger className="h-8 text-xs w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Poli (Lobby Umum)</SelectItem>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Module toggles */}
                <div className="flex flex-wrap gap-2">
                  {ALL_MODULES.map((mod) => (
                    <button key={mod.value}
                      onClick={() => toggleModule(device, mod.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        device.enabled_modules?.includes(mod.value)
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/50 border-muted text-muted-foreground"
                      }`}>
                      {mod.label}
                    </button>
                  ))}
                </div>

                {/* Auto Rotate */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Checkbox checked={device.auto_rotate}
                      onCheckedChange={(v) => updateDevice.mutate({ id: device.id, auto_rotate: !!v })} />
                    <span>Auto Rotate Modul</span>
                  </div>
                  {device.auto_rotate && (
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Interval:</span>
                      <Input type="number" min={10} max={120} className="w-16 h-6 text-xs"
                        defaultValue={device.rotate_interval}
                        onBlur={(e) => updateDevice.mutate({ id: device.id, rotate_interval: parseInt(e.target.value) || 30 })} />
                      <span className="text-muted-foreground">detik</span>
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {baseUrl}/smart-display?device={device.device_code}
                  </p>
                </div>
              </Card>
            ))}

            {devices.length === 0 && !adding && (
              <div className="text-center py-8 text-muted-foreground">
                <Tv className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Belum ada device terdaftar</p>
              </div>
            )}

            {adding ? (
              <Card className="p-4 space-y-3 border-primary/30">
                <p className="font-semibold text-sm">Tambah Device Baru</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Kode Device *</Label>
                    <Input placeholder="POLI-ANAK-01" value={newDevice.device_code}
                      onChange={(e) => setNewDevice(d => ({ ...d, device_code: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Nama Device *</Label>
                    <Input placeholder="TV Poli Anak" value={newDevice.device_name}
                      onChange={(e) => setNewDevice(d => ({ ...d, device_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Lokasi *</Label>
                    <Input placeholder="Ruang Tunggu Poli Anak" value={newDevice.location}
                      onChange={(e) => setNewDevice(d => ({ ...d, location: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Poli / Departemen</Label>
                    <Select
                      value={newDevice.department_id || "all"}
                      onValueChange={(v) => setNewDevice(d => ({ ...d, department_id: v === "all" ? null : v }))}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Poli (Lobby Umum)</SelectItem>
                        {departments.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-2 block">Modul Aktif</Label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_MODULES.map((mod) => (
                      <button key={mod.value}
                        onClick={() => {
                          setNewDevice(d => ({
                            ...d,
                            enabled_modules: d.enabled_modules.includes(mod.value)
                              ? d.enabled_modules.filter(m => m !== mod.value)
                              : [...d.enabled_modules, mod.value],
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          newDevice.enabled_modules.includes(mod.value)
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-muted/50 border-muted text-muted-foreground"
                        }`}>
                        {mod.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdd} disabled={createDevice.isPending} size="sm">
                    {createDevice.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    Simpan
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Batal</Button>
                </div>
              </Card>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4 mr-2" /> Tambah Device Baru
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
