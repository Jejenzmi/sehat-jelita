import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Monitor,
  Server,
  Plug,
  Activity,
  Settings2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scan,
  FileImage,
  Database,
  ArrowRightLeft,
  Shield,
  Wifi,
  Eye,
  Download,
  Upload,
  Clock,
  Zap,
  Loader2,
  Navigation,
  Radar,
  Plus,
  Trash2,
} from "lucide-react";
import {
  usePACSStudies,
  useQueryStudies,
  useTestPACSConnection,
  usePACSStatistics,
  useGetViewerUrl,
  useGetSeries,
  useGetInstances,
  useDiscoverModalities,
  useAddModality,
  useRemoveModality,
  useModalityEcho,
} from "@/hooks/usePACSIntegration";
import { useExternalIntegrations } from "@/hooks/useExternalIntegrations";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "connected": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "disconnected": return <XCircle className="h-4 w-4 text-red-500" />;
    case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default: return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

interface StudyData {
  id: string;
  name?: string;
  main_dicom_tags?: {
    PatientName?: string;
    PatientID?: string;
    StudyDate?: string;
    Modality?: string;
    StudyDescription?: string;
  };
  instances_count?: number;
}

export default function DICOMIntegration() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalityName, setDeleteModalityName] = useState<string | null>(null);
  const [newModality, setNewModality] = useState({ name: "", ae_title: "", host: "", port: 104 });

  // PACS Hooks
  const testConnection = useTestPACSConnection();
  const { data: statistics, isLoading: statsLoading } = usePACSStatistics();
  const { data: studiesData, isLoading: studiesLoading, refetch: refetchStudies } = usePACSStudies({ limit: 50 });
  const queryStudies = useQueryStudies();
  const getViewerUrl = useGetViewerUrl();
  const getSeries = useGetSeries();
  const getInstances = useGetInstances();
  const discoverModalities = useDiscoverModalities();
  const addModality = useAddModality();
  const removeModality = useRemoveModality();
  const modalityEcho = useModalityEcho();

  // Integration Settings
  const { integrations, getIntegrationStatus } = useExternalIntegrations();
  const pacStatus = getIntegrationStatus().find(s => s.code === "pacs");
  const pacsEnabled = integrations?.pacs?.enabled;

  // Format studies data
  const studies = Array.isArray(studiesData) 
    ? studiesData.map((study: StudyData) => ({
        id: study.id,
        patient: study.main_dicom_tags?.PatientName || "Unknown",
        mrn: study.main_dicom_tags?.PatientID || "N/A",
        modality: study.main_dicom_tags?.Modality || "Unknown",
        description: study.main_dicom_tags?.StudyDescription || "No description",
        date: study.main_dicom_tags?.StudyDate || new Date().toLocaleDateString(),
        status: "completed",
        images: study.instances_count || 0,
      }))
    : [];

  // Handle test connection
  const handleTestConnection = async () => {
    testConnection.mutate(undefined, {
      onSuccess: (data) => {
        toast.success(`Terhubung ke ${data.server || "PACS"}`);
        refetchStudies();
      },
      onError: (err: any) => {
        toast.error(`Koneksi gagal: ${err.message}`);
      },
    });
  };

  // Handle open viewer
  const handleOpenViewer = async (studyId: string) => {
    getViewerUrl.mutate(studyId, {
      onSuccess: (data) => {
        if (data.ohif_viewer) {
          window.open(data.ohif_viewer, "_blank");
        }
      },
      onError: (err: any) => {
        toast.error(`Error membuka viewer: ${err.message}`);
      },
    });
  };

  // Handle search studies
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Masukkan nama pasien atau ID untuk pencarian");
      return;
    }

    queryStudies.mutate(
      { patient_name: searchQuery },
      {
        onSuccess: (data) => {
          toast.success(`Ditemukan ${Array.isArray(data) ? data.length : 0} studi`);
        },
        onError: (err: any) => {
          toast.error(`Pencarian gagal: ${err.message}`);
        },
      }
    );
  };

  // Load studies on mount
  useEffect(() => {
    if (pacsEnabled) {
      refetchStudies();
    }
  }, [pacsEnabled, refetchStudies]);

  if (!pacsEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">PACS Belum Dikonfigurasi</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Silakan konfigurasi integrasi PACS di Pengaturan &gt; Integrasi Eksternal untuk menggunakan fitur ini.
            </p>
            <Button asChild>
              <a href="/pengaturan">Buka Pengaturan</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
            HL7 / DICOM / PACS Integration
          </h1>
          <p className="text-muted-foreground text-sm">Integrasi standar imaging & interoperabilitas medis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestConnection}
            disabled={testConnection.isPending}
          >
            {testConnection.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Test Koneksi
          </Button>
          <Button variant="outline" size="sm">
            <Settings2 className="h-4 w-4 mr-1" /> Pengaturan
          </Button>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
              <Server className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pacStatus?.status === 'connected' ? '1' : '0'}/1</p>
              <p className="text-xs text-muted-foreground">PACS Server</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <Scan className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">0/1</p>
              <p className="text-xs text-muted-foreground">RIS Online</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">0/3</p>
              <p className="text-xs text-muted-foreground">LIS Online</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950">
              <FileImage className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{studies.length}</p>
              <p className="text-xs text-muted-foreground">Studi Tersimpan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">🖥️ Overview</TabsTrigger>
          <TabsTrigger value="pacs">📡 PACS / DICOM</TabsTrigger>
          <TabsTrigger value="modalities">
            <Radar className="h-3.5 w-3.5 mr-1" /> Modalitas
          </TabsTrigger>
          <TabsTrigger value="viewer">🖼️ DICOM Viewer</TabsTrigger>
          <TabsTrigger value="search">🔍 Pencarian Studi</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PACS Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4" /> Status PACS Server
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pacStatus ? (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <StatusIcon status={pacStatus.status} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{pacStatus.name}</p>
                        <p className="text-xs text-muted-foreground">PACS Server Utama</p>
                      </div>
                      <Badge variant={pacStatus.status === 'connected' ? 'default' : 'destructive'} className="text-[10px]">
                        {pacStatus.status}
                      </Badge>
                    </div>
                    {statistics && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-xs text-muted-foreground">Total Studies</p>
                          <p className="font-semibold">{statistics.total_disk_size || 'N/A'}</p>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-xs text-muted-foreground">Disk Usage</p>
                          <p className="font-semibold">{statistics.disk_size_mb || 'N/A'} MB</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">PACS belum dikonfigurasi</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Studies */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileImage className="h-4 w-4" /> Studi DICOM Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studiesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : studies.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {studies.slice(0, 5).map(study => (
                      <div key={study.id} className="p-2 rounded border hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedStudy(study.id)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{study.patient}</p>
                            <p className="text-xs text-muted-foreground">{study.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{study.date} • {study.images} images</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] ml-2">{study.modality}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada studi ditemukan</p>
                )}
              </CardContent>
            </Card>

            {/* Full Studies Table */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileImage className="h-4 w-4" /> Daftar Studi DICOM
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Study ID</TableHead>
                        <TableHead>Pasien</TableHead>
                        <TableHead>Modality</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Images</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studiesLoading ? (
                        [...Array(3)].map((_, i) => (
                          <TableRow key={i}>
                            {[...Array(7)].map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : studies.length > 0 ? (
                        studies.map(study => (
                          <TableRow key={study.id}>
                            <TableCell className="font-mono text-xs">{study.id.substring(0, 8)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{study.patient}</p>
                                <p className="text-xs text-muted-foreground">{study.mrn}</p>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{study.modality}</Badge></TableCell>
                            <TableCell className="text-sm">{study.description}</TableCell>
                            <TableCell className="text-sm">{study.date}</TableCell>
                            <TableCell>{study.images}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => handleOpenViewer(study.id)}
                                disabled={getViewerUrl.isPending}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                            Tidak ada studi ditemukan
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PACS Tab */}
        <TabsContent value="pacs">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">PACS Server Management</CardTitle>
            </CardHeader>
            <CardContent>
              {pacStatus && (
                <div className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={pacStatus.status} />
                      <h3 className="font-semibold">{pacStatus.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleTestConnection}
                        disabled={testConnection.isPending}
                      >
                        {testConnection.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Zap className="h-3.5 w-3.5 mr-1" />
                        )}
                        C-ECHO
                      </Button>
                    </div>
                  </div>
                  {statistics && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Server Type</Label>
                        <p className="font-medium">{integrations?.pacs?.server_type || 'Unknown'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <p className="font-medium capitalize">{pacStatus.status}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Studi</Label>
                        <p className="font-medium">{statistics.studies_count || 0}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Disk Used</Label>
                        <p className="font-medium">{statistics.disk_size_mb || 0} MB</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modalitas Tab - Auto Discovery */}
        <TabsContent value="modalities">
          <div className="space-y-4">
            {/* Stats Cards */}
            {discoverModalities.data?.success && (
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{discoverModalities.data.total}</p>
                    <p className="text-xs text-muted-foreground">Total Modalitas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{discoverModalities.data.online}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{discoverModalities.data.offline}</p>
                    <p className="text-xs text-muted-foreground">Offline</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Scan Button & Add Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Radar className="h-4 w-4" /> Scan & Discovery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Scan otomatis semua modalitas (CT, MRI, X-Ray, dll) yang terdaftar di server PACS dan verifikasi status koneksi masing-masing.
                  </p>
                  <Button
                    onClick={() => discoverModalities.mutate()}
                    disabled={discoverModalities.isPending}
                    className="w-full"
                  >
                    {discoverModalities.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Radar className="h-4 w-4 mr-2" />
                    )}
                    {discoverModalities.isPending ? "Scanning modalitas..." : "Scan Modalitas"}
                  </Button>
                  {discoverModalities.isPending && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground text-center">Menjalankan C-ECHO ke setiap modalitas...</p>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Tambah Modalitas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Nama</Label>
                      <Input
                        placeholder="CT_SCANNER"
                        value={newModality.name}
                        onChange={(e) => setNewModality(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">AE Title</Label>
                      <Input
                        placeholder="CT_AET"
                        value={newModality.ae_title}
                        onChange={(e) => setNewModality(p => ({ ...p, ae_title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Host / IP</Label>
                      <Input
                        placeholder="192.168.1.50"
                        value={newModality.host}
                        onChange={(e) => setNewModality(p => ({ ...p, host: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Port</Label>
                      <Input
                        type="number"
                        placeholder="104"
                        value={newModality.port}
                        onChange={(e) => setNewModality(p => ({ ...p, port: parseInt(e.target.value) || 104 }))}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={addModality.isPending || !newModality.name || !newModality.ae_title || !newModality.host}
                    onClick={() => {
                      addModality.mutate(newModality, {
                        onSuccess: () => {
                          setNewModality({ name: "", ae_title: "", host: "", port: 104 });
                          discoverModalities.mutate();
                        },
                      });
                    }}
                  >
                    {addModality.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Tambah Modalitas
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Modalities Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> Daftar Modalitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>AE Title</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Port</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discoverModalities.isPending ? (
                        [...Array(3)].map((_, i) => (
                          <TableRow key={i}>
                            {[...Array(6)].map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : discoverModalities.data?.modalities?.length > 0 ? (
                        discoverModalities.data.modalities.map((mod: any) => (
                          <TableRow key={mod.name}>
                            <TableCell className="font-medium">{mod.name}</TableCell>
                            <TableCell className="font-mono text-xs">{mod.ae_title}</TableCell>
                            <TableCell className="font-mono text-xs">{mod.host}</TableCell>
                            <TableCell>{mod.port}</TableCell>
                            <TableCell>
                              <Badge
                                variant={mod.status === "online" ? "default" : "destructive"}
                                className="text-[10px]"
                              >
                                {mod.status === "online" ? (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {mod.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="C-ECHO Test"
                                  onClick={() => modalityEcho.mutate(mod.name)}
                                  disabled={modalityEcho.isPending}
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  title="Hapus Modalitas"
                                  onClick={() => setDeleteModalityName(mod.name)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            {discoverModalities.data ? "Tidak ada modalitas ditemukan" : "Klik 'Scan Modalitas' untuk memulai discovery"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <ConfirmationDialog
            open={!!deleteModalityName}
            onOpenChange={(open) => !open && setDeleteModalityName(null)}
            title="Hapus Modalitas"
            description={`Yakin ingin menghapus modalitas "${deleteModalityName}" dari konfigurasi PACS?`}
            type="delete"
            confirmLabel="Hapus"
            isLoading={removeModality.isPending}
            onConfirm={() => {
              if (deleteModalityName) {
                removeModality.mutate(deleteModalityName, {
                  onSuccess: () => {
                    setDeleteModalityName(null);
                    discoverModalities.mutate();
                  },
                });
              }
            }}
          />
        </TabsContent>

        {/* Viewer Tab */}
        <TabsContent value="viewer">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4" /> DICOM Viewer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedStudy ? (
                <div className="flex flex-col items-center justify-center h-[500px] bg-black rounded-lg text-white">
                  <FileImage className="h-20 w-20 opacity-30 mb-4" />
                  <h3 className="text-lg font-semibold">DICOM Viewer</h3>
                  <p className="text-sm text-white/60 mt-2">Study: {selectedStudy}</p>
                  <p className="text-xs text-white/40 mt-1">Terintegrasi dengan OHIF Viewer</p>
                  <Button 
                    className="mt-6" 
                    onClick={() => handleOpenViewer(selectedStudy)}
                    disabled={getViewerUrl.isPending}
                  >
                    {getViewerUrl.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4 mr-2" />
                    )}
                    Buka Viewer
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[500px] bg-muted rounded-lg text-muted-foreground">
                  <FileImage className="h-20 w-20 opacity-30 mb-4" />
                  <h3 className="text-lg font-semibold">DICOM Viewer</h3>
                  <p className="text-sm mt-2">Pilih studi dari daftar untuk memulai viewing</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pencarian Studi DICOM</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Cari berdasarkan nama pasien atau ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  onClick={handleSearch}
                  disabled={queryStudies.isPending}
                >
                  {queryStudies.isPending ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Scan className="h-4 w-4 mr-1" />
                  )}
                  Cari
                </Button>
              </div>
              {queryStudies.isPending && (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
