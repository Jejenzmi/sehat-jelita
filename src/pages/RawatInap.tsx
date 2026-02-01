import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Bed, Users, Calendar, Clock, CheckCircle, LogOut, Building2, Plus, Search, FileText, AlertTriangle, RefreshCw, Cloud } from "lucide-react";
import { useRooms, useInpatientAdmissions, useDischargeQueue, useDischargePatient } from "@/hooks/useInpatientData";
import { useSyncBedsToBPJS } from "@/hooks/useBPJSiCare";
import { differenceInDays, format } from "date-fns";

const getClassBadge = (roomClass: string) => {
  const colors: Record<string, string> = {
    "VIP": "bg-purple-500",
    "Kelas 1": "bg-blue-500",
    "Kelas 2": "bg-green-500",
    "Kelas 3": "bg-gray-500",
    "ICU": "bg-red-500",
    "NICU": "bg-yellow-500",
  };
  return <Badge className={colors[roomClass] || "bg-gray-500"}>{roomClass}</Badge>;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-500">Aktif</Badge>;
    case "critical":
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Kritis</Badge>;
    case "discharged":
      return <Badge variant="secondary">Pulang</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function RawatInap() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDischargeOpen, setIsDischargeOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [dischargeSummary, setDischargeSummary] = useState("");

  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: admissions = [], isLoading: admissionsLoading } = useInpatientAdmissions();
  const { data: dischargeQueue = [] } = useDischargeQueue();
  const dischargePatient = useDischargePatient();
  const syncBedsToBPJS = useSyncBedsToBPJS();

  // Calculate stats from real data
  const totalBeds = rooms.reduce((acc, room) => acc + (room.beds?.length || 0), 0);
  const occupiedBeds = rooms.reduce((acc, room) => 
    acc + (room.beds?.filter(b => b.status === "terisi").length || 0), 0);
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : "0";

  const filteredAdmissions = admissions.filter(admission => 
    admission.patients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admission.patients?.medical_record_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admission.rooms?.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDischarge = () => {
    if (!selectedAdmission) return;
    
    dischargePatient.mutate({
      admissionId: selectedAdmission.id,
      bedId: selectedAdmission.bed_id,
      dischargeSummary,
      dischargeType: "pulang",
    }, {
      onSuccess: () => {
        setIsDischargeOpen(false);
        setSelectedAdmission(null);
        setDischargeSummary("");
      }
    });
  };

  const isLoading = roomsLoading || admissionsLoading;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rawat Inap</h1>
          <p className="text-muted-foreground">Manajemen pasien rawat inap dan kamar</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => syncBedsToBPJS.mutate()}
            disabled={syncBedsToBPJS.isPending}
          >
            {syncBedsToBPJS.isPending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4 mr-2" />
            )}
            Sync ke BPJS
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Admisi Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Admisi Pasien Baru</DialogTitle>
                <DialogDescription>Daftarkan pasien untuk rawat inap</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Untuk admisi pasien baru, silakan daftarkan terlebih dahulu melalui modul Pendaftaran.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline">Tutup</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bed</CardTitle>
            <Bed className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{totalBeds}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bed Terisi</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{occupiedBeds}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bed Kosong</CardTitle>
            <Bed className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold text-green-600">{availableBeds}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-2xl font-bold">{occupancyRate}%</div>
                <Progress value={parseFloat(occupancyRate)} className="mt-2" />
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Rencana Pulang</CardTitle>
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dischargeQueue.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="patients">
        <TabsList>
          <TabsTrigger value="patients">Pasien Rawat Inap</TabsTrigger>
          <TabsTrigger value="rooms">Manajemen Kamar</TabsTrigger>
          <TabsTrigger value="discharge">Discharge Planning</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Pasien Rawat Inap</CardTitle>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Cari pasien..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
                </div>
              ) : filteredAdmissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada pasien rawat inap
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. RM</TableHead>
                      <TableHead>Nama Pasien</TableHead>
                      <TableHead>Kamar</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Tgl Masuk</TableHead>
                      <TableHead>LOS</TableHead>
                      <TableHead>DPJP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmissions.map((admission) => {
                      const los = differenceInDays(new Date(), new Date(admission.admission_date));
                      return (
                        <TableRow key={admission.id}>
                          <TableCell className="font-medium">{admission.patients?.medical_record_number}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{admission.patients?.full_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>{admission.rooms?.code} - {admission.beds?.bed_number || "-"}</TableCell>
                          <TableCell>{getClassBadge(admission.rooms?.room_class || "")}</TableCell>
                          <TableCell>{format(new Date(admission.admission_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>{los} hari</TableCell>
                          <TableCell>{admission.doctors?.full_name || "-"}</TableCell>
                          <TableCell>{getStatusBadge(admission.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedAdmission(admission);
                                  setIsDischargeOpen(true);
                                }}
                              >
                                <LogOut className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          {roomsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data kamar
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => {
                const roomAvailableBeds = room.beds?.filter(b => b.status === "tersedia").length || 0;
                const roomTotalBeds = room.beds?.length || 0;
                return (
                  <Card key={room.id} className={roomAvailableBeds === 0 ? "border-red-200 bg-red-50" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{room.name}</CardTitle>
                        {getClassBadge(room.room_class)}
                      </div>
                      <CardDescription>Kode: {room.code}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Kapasitas:</span>
                          <span className="font-medium">{roomTotalBeds} bed</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tersedia:</span>
                          <span className={`font-medium ${roomAvailableBeds === 0 ? "text-red-600" : "text-green-600"}`}>
                            {roomAvailableBeds} bed
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tarif/hari:</span>
                          <span className="font-medium">Rp {room.daily_rate.toLocaleString()}</span>
                        </div>
                        <Progress value={roomTotalBeds > 0 ? ((roomTotalBeds - roomAvailableBeds) / roomTotalBeds * 100) : 0} />
                        <div className="flex gap-2 flex-wrap">
                          {room.beds?.map((bed, idx) => (
                            <div 
                              key={bed.id}
                              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${
                                bed.status === "terisi"
                                  ? "bg-red-100 text-red-700 border border-red-300" 
                                  : "bg-green-100 text-green-700 border border-green-300"
                              }`}
                            >
                              {idx + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discharge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Antrian Discharge</CardTitle>
              <CardDescription>Pasien yang akan dipulangkan</CardDescription>
            </CardHeader>
            <CardContent>
              {dischargeQueue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada pasien dalam antrian discharge
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pasien</TableHead>
                      <TableHead>No. RM</TableHead>
                      <TableHead>Kamar</TableHead>
                      <TableHead>Rencana Pulang</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dischargeQueue.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.patients?.full_name}</TableCell>
                        <TableCell>{item.patients?.medical_record_number}</TableCell>
                        <TableCell>{item.rooms?.room_number}</TableCell>
                        <TableCell>{item.planned_discharge_date ? format(new Date(item.planned_discharge_date), "dd/MM/yyyy") : "-"}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedAdmission(item);
                              setIsDischargeOpen(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Proses Pulang
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Discharge Dialog */}
      <Dialog open={isDischargeOpen} onOpenChange={setIsDischargeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Discharge Pasien</DialogTitle>
            <DialogDescription>
              Pulangkan pasien {selectedAdmission?.patients?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ringkasan Discharge</Label>
              <Textarea 
                placeholder="Masukkan ringkasan kondisi pasien saat pulang..."
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDischargeOpen(false)}>Batal</Button>
            <Button onClick={handleDischarge} disabled={dischargePatient.isPending}>
              {dischargePatient.isPending ? "Memproses..." : "Pulangkan Pasien"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
