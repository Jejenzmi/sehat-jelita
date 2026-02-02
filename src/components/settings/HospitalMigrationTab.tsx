import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  ArrowRight,
  Plus,
  Minus,
  AlertTriangle,
  Check,
  History,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useHospitalProfile } from "@/hooks/useSetupWizard";
import {
  usePreviewMigration,
  useMigrateHospitalType,
  useMigrationLogs,
  HospitalType,
  ModuleInfo,
} from "@/hooks/useHospitalMigration";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const HOSPITAL_TYPES: { value: HospitalType; label: string; description: string }[] = [
  { value: "A", label: "Tipe A", description: "RS Pendidikan Utama" },
  { value: "B", label: "Tipe B", description: "RS Pendidikan" },
  { value: "C", label: "Tipe C", description: "RS Umum" },
  { value: "D", label: "Tipe D", description: "RS Pratama" },
  { value: "FKTP", label: "Klinik/FKTP", description: "Fasilitas Kesehatan Tingkat Pertama" },
];

export default function HospitalMigrationTab() {
  const [selectedType, setSelectedType] = useState<HospitalType | null>(null);
  const [migrationNotes, setMigrationNotes] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);

  const { data: hospitalProfile, isLoading: profileLoading } = useHospitalProfile();
  const { data: preview, isLoading: previewLoading } = usePreviewMigration(selectedType);
  const { data: migrationLogs } = useMigrationLogs();
  const migrateHospital = useMigrateHospitalType();

  const currentType = hospitalProfile?.facility_level as HospitalType | undefined;
  const currentTypeInfo = HOSPITAL_TYPES.find((t) => t.value === currentType);

  const handleMigrate = async () => {
    if (!selectedType) return;
    
    await migrateHospital.mutateAsync({
      newType: selectedType,
      notes: migrationNotes || undefined,
    });
    
    setShowConfirmDialog(false);
    setSelectedType(null);
    setMigrationNotes("");
  };

  const groupByCategory = (modules: ModuleInfo[]) => {
    return modules.reduce((acc, mod) => {
      if (!acc[mod.category]) acc[mod.category] = [];
      acc[mod.category].push(mod);
      return acc;
    }, {} as Record<string, ModuleInfo[]>);
  };

  const categoryLabels: Record<string, string> = {
    core: "Modul Inti",
    clinical: "Pelayanan Klinis",
    support: "Penunjang Medis",
    admin: "Administrasi",
    integration: "Integrasi",
    reporting: "Pelaporan",
    education: "Pendidikan",
    quality: "Mutu & Akreditasi",
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Status Tipe Fasilitas Saat Ini
          </CardTitle>
          <CardDescription>
            Tipe fasilitas yang sedang aktif menentukan modul yang tersedia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-lg px-4 py-2">
                  {currentTypeInfo?.label || currentType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {currentTypeInfo?.description}
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowLogsDialog(true)}>
              <History className="h-4 w-4 mr-2" />
              Riwayat Migrasi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Migration Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Wizard Migrasi Tipe RS
          </CardTitle>
          <CardDescription>
            Pilih tipe RS baru untuk melihat preview perubahan modul
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {HOSPITAL_TYPES.filter((t) => t.value !== currentType).map((type) => (
              <Button
                key={type.value}
                variant={selectedType === type.value ? "default" : "outline"}
                className="flex flex-col h-auto py-3"
                onClick={() => setSelectedType(type.value)}
              >
                <span className="font-semibold">{type.label}</span>
                <span className="text-xs opacity-70">{type.description}</span>
              </Button>
            ))}
          </div>

          {/* Preview Section */}
          {selectedType && (
            <div className="mt-6 space-y-4">
              <Separator />
              
              <div className="flex items-center gap-4 justify-center py-4">
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {currentTypeInfo?.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Saat ini</p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {HOSPITAL_TYPES.find((t) => t.value === selectedType)?.label}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Tujuan</p>
                </div>
              </div>

              {previewLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Memuat preview...</span>
                </div>
              ) : preview ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Modules Added */}
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Plus className="h-4 w-4" />
                        Modul Ditambahkan ({preview.modules_added?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {preview.modules_added?.length > 0 ? (
                        <ScrollArea className="h-40">
                          <div className="space-y-1">
                            {preview.modules_added.map((mod) => (
                              <div
                                key={mod.code}
                                className="text-sm p-2 rounded bg-green-100 dark:bg-green-900/30"
                              >
                                {mod.name}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({categoryLabels[mod.category] || mod.category})
                                </span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <p className="text-sm text-muted-foreground">Tidak ada modul baru</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Modules Removed */}
                  <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Minus className="h-4 w-4" />
                        Modul Dihapus ({preview.modules_removed?.length || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {preview.modules_removed?.length > 0 ? (
                        <ScrollArea className="h-40">
                          <div className="space-y-1">
                            {preview.modules_removed.map((mod) => (
                              <div
                                key={mod.code}
                                className="text-sm p-2 rounded bg-red-100 dark:bg-red-900/30"
                              >
                                {mod.name}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({categoryLabels[mod.category] || mod.category})
                                </span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <p className="text-sm text-muted-foreground">Tidak ada modul dihapus</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {preview?.modules_removed?.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Perhatian:</strong> Modul yang dihapus tidak akan tersedia di menu,
                    namun data historis tetap tersimpan di database.
                  </AlertDescription>
                </Alert>
              )}

              {/* Migration Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan Migrasi (opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Alasan migrasi, misalnya: Upgrade dari RS Tipe C ke Tipe B karena penambahan layanan spesialisasi..."
                  value={migrationNotes}
                  onChange={(e) => setMigrationNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedType(null)}>
                  Batal
                </Button>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!preview || migrateHospital.isPending}
                >
                  Lanjut Migrasi
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Migrasi Tipe RS</DialogTitle>
            <DialogDescription>
              Anda akan mengubah tipe fasilitas dari{" "}
              <strong>{currentTypeInfo?.label}</strong> ke{" "}
              <strong>{HOSPITAL_TYPES.find((t) => t.value === selectedType)?.label}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {preview?.modules_added?.length > 0 && (
              <div className="text-sm">
                <span className="text-green-600 font-medium">
                  +{preview.modules_added.length} modul akan ditambahkan
                </span>
              </div>
            )}
            {preview?.modules_removed?.length > 0 && (
              <div className="text-sm">
                <span className="text-red-600 font-medium">
                  -{preview.modules_removed.length} modul akan dihapus dari menu
                </span>
              </div>
            )}

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Perubahan ini akan langsung aktif. Data historis tetap tersimpan.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleMigrate} disabled={migrateHospital.isPending}>
              {migrateHospital.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Konfirmasi Migrasi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Migration Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Riwayat Migrasi Tipe RS</DialogTitle>
            <DialogDescription>
              Log perubahan tipe fasilitas kesehatan
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-96">
            {migrationLogs?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Belum ada riwayat migrasi
              </p>
            ) : (
              <div className="space-y-4">
                {migrationLogs?.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{log.from_type}</Badge>
                        <ArrowRight className="h-4 w-4" />
                        <Badge variant="default">{log.to_type}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {log.modules_added?.length > 0 && (
                          <div className="text-green-600">
                            +{log.modules_added.length} modul ditambahkan
                          </div>
                        )}
                        {log.modules_removed?.length > 0 && (
                          <div className="text-red-600">
                            -{log.modules_removed.length} modul dihapus
                          </div>
                        )}
                      </div>
                      {log.migration_notes && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{log.migration_notes}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
