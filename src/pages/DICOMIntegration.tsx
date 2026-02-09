import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

// Connection statuses
const pacsConnections = [
  { name: "PACS Server Utama", host: "192.168.1.100", port: 4242, aeTitle: "SIMRS_ZEN", status: "connected", modalities: 12, studies: 45230 },
  { name: "PACS Backup", host: "192.168.1.101", port: 4242, aeTitle: "SIMRS_ZEN_BK", status: "disconnected", modalities: 0, studies: 0 },
];

const risConnections = [
  { name: "RIS Radiologi", host: "192.168.1.110", port: 8080, protocol: "HL7 v2.5", status: "connected", ordersToday: 28 },
];

const lisConnections = [
  { name: "LIS Laboratorium", host: "192.168.1.120", port: 8081, protocol: "HL7 v2.5", status: "connected", resultsToday: 156 },
  { name: "LIS Analyzer - Hematology", host: "192.168.1.121", port: 9001, protocol: "ASTM", status: "connected", resultsToday: 89 },
  { name: "LIS Analyzer - Chemistry", host: "192.168.1.122", port: 9002, protocol: "ASTM", status: "warning", resultsToday: 45 },
];

const recentStudies = [
  { id: "STD-2026-0001", patient: "Tn. Ahmad Suryadi", mrn: "RM-001234", modality: "CT", description: "CT Scan Thorax", date: "09 Feb 2026", status: "completed", images: 245 },
  { id: "STD-2026-0002", patient: "Ny. Fatimah Zahra", mrn: "RM-005678", modality: "MRI", description: "MRI Brain", date: "09 Feb 2026", status: "in_progress", images: 120 },
  { id: "STD-2026-0003", patient: "Tn. Joko Widodo", mrn: "RM-009012", modality: "CR", description: "X-Ray Chest PA", date: "09 Feb 2026", status: "completed", images: 2 },
  { id: "STD-2026-0004", patient: "Ny. Siti Nurhaliza", mrn: "RM-003456", modality: "US", description: "USG Abdomen", date: "08 Feb 2026", status: "completed", images: 18 },
  { id: "STD-2026-0005", patient: "Tn. Rizky Pratama", mrn: "RM-007890", modality: "MG", description: "Mammography", date: "08 Feb 2026", status: "completed", images: 4 },
];

const hl7Messages = [
  { time: "14:32:05", type: "ORM^O01", direction: "inbound", source: "RIS", status: "processed", desc: "Order CT Scan - Ahmad Suryadi" },
  { time: "14:30:12", type: "ORU^R01", direction: "outbound", source: "LIS", status: "sent", desc: "Lab Result - CBC - Fatimah Zahra" },
  { time: "14:28:45", type: "ADT^A01", direction: "inbound", source: "HIS", status: "processed", desc: "Patient Admit - Joko Widodo" },
  { time: "14:25:30", type: "ORU^R01", direction: "outbound", source: "LIS", status: "error", desc: "Lab Result - Chemistry Panel - Error" },
  { time: "14:22:15", type: "ORM^O01", direction: "inbound", source: "RIS", status: "processed", desc: "Order MRI Brain - Siti Nurhaliza" },
];

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "connected": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "disconnected": return <XCircle className="h-4 w-4 text-red-500" />;
    case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    default: return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function DICOMIntegration() {
  const [activeTab, setActiveTab] = useState("overview");

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
          <Button variant="outline" size="sm" onClick={() => toast.success("Semua koneksi di-refresh")}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh Status
          </Button>
          <Button size="sm">
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
              <p className="text-2xl font-bold">{pacsConnections.filter(c => c.status === "connected").length}/{pacsConnections.length}</p>
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
              <p className="text-2xl font-bold">{risConnections.filter(c => c.status === "connected").length}/{risConnections.length}</p>
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
              <p className="text-2xl font-bold">{lisConnections.filter(c => c.status === "connected").length}/{lisConnections.length}</p>
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
              <p className="text-2xl font-bold">{recentStudies.length}</p>
              <p className="text-xs text-muted-foreground">Studi Hari Ini</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">🖥️ Overview</TabsTrigger>
          <TabsTrigger value="pacs">📡 PACS / DICOM</TabsTrigger>
          <TabsTrigger value="hl7">🔗 HL7 Messages</TabsTrigger>
          <TabsTrigger value="viewer">🖼️ DICOM Viewer</TabsTrigger>
          <TabsTrigger value="config">⚙️ Konfigurasi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PACS Connections */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4" /> PACS Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pacsConnections.map((conn, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <StatusIcon status={conn.status} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{conn.name}</p>
                      <p className="text-xs text-muted-foreground">{conn.host}:{conn.port} • AE: {conn.aeTitle}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={conn.status === "connected" ? "default" : "destructive"} className="text-[10px]">{conn.status}</Badge>
                      {conn.status === "connected" && <p className="text-[10px] text-muted-foreground mt-1">{conn.studies.toLocaleString()} studi</p>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* RIS & LIS */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plug className="h-4 w-4" /> RIS & LIS Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[...risConnections, ...lisConnections].map((conn, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                    <StatusIcon status={conn.status} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{conn.name}</p>
                      <p className="text-xs text-muted-foreground">{conn.host}:{conn.port} • {conn.protocol}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={conn.status === "connected" ? "default" : conn.status === "warning" ? "secondary" : "destructive"} className="text-[10px]">{conn.status}</Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">{'resultsToday' in conn ? conn.resultsToday : ('ordersToday' in conn ? conn.ordersToday : 0)} hari ini</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Studies */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileImage className="h-4 w-4" /> Studi DICOM Terbaru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Study ID</TableHead>
                        <TableHead>Pasien</TableHead>
                        <TableHead>Modality</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Images</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentStudies.map(study => (
                        <TableRow key={study.id}>
                          <TableCell className="font-mono text-xs">{study.id}</TableCell>
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
                            <Badge variant={study.status === "completed" ? "default" : "secondary"} className="text-[10px]">
                              {study.status === "completed" ? "Selesai" : "Proses"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Membuka DICOM Viewer...")}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pacs">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">PACS Server Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pacsConnections.map((conn, i) => (
                  <div key={i} className="p-4 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon status={conn.status} />
                        <h3 className="font-semibold">{conn.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => toast.success("C-ECHO berhasil!")}>
                          <Zap className="h-3.5 w-3.5 mr-1" /> C-ECHO
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toast.info("Querying PACS...")}>
                          <Scan className="h-3.5 w-3.5 mr-1" /> C-FIND
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><Label className="text-xs text-muted-foreground">Host</Label><p>{conn.host}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Port</Label><p>{conn.port}</p></div>
                      <div><Label className="text-xs text-muted-foreground">AE Title</Label><p>{conn.aeTitle}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Total Studi</Label><p>{conn.studies.toLocaleString()}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hl7">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">HL7 Message Log</CardTitle>
                <Badge variant="outline">{hl7Messages.length} messages</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {hl7Messages.map((msg, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${msg.status === "error" ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                      <div className="flex items-center gap-2">
                        {msg.direction === "inbound" ? <Download className="h-4 w-4 text-blue-500" /> : <Upload className="h-4 w-4 text-emerald-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono">{msg.type}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{msg.source}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{msg.time}</span>
                        </div>
                        <p className="text-sm mt-1">{msg.desc}</p>
                      </div>
                      <Badge variant={msg.status === "processed" || msg.status === "sent" ? "default" : "destructive"} className="text-[10px]">{msg.status}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="viewer">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Monitor className="h-4 w-4" /> DICOM Viewer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-[500px] bg-black rounded-lg text-white">
                <FileImage className="h-20 w-20 opacity-30 mb-4" />
                <h3 className="text-lg font-semibold">DICOM Viewer</h3>
                <p className="text-sm text-white/60 mt-2">Pilih studi dari daftar untuk memulai viewing</p>
                <p className="text-xs text-white/40 mt-1">Mendukung: CT, MRI, CR, US, MG, DR, DX</p>
                <div className="flex items-center gap-3 mt-6">
                  <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                    <Scan className="h-4 w-4 mr-1" /> Window/Level
                  </Button>
                  <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                    <Eye className="h-4 w-4 mr-1" /> Zoom
                  </Button>
                  <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                    <Activity className="h-4 w-4 mr-1" /> Measure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Konfigurasi DICOM</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">AE Title (Lokal)</Label><Input defaultValue="SIMRS_ZEN" /></div>
                  <div><Label className="text-xs">DICOM Port</Label><Input defaultValue="4242" type="number" /></div>
                  <div><Label className="text-xs">Max PDU Size</Label><Input defaultValue="16384" type="number" /></div>
                  <div><Label className="text-xs">Timeout (detik)</Label><Input defaultValue="30" type="number" /></div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><Label className="text-sm">Auto-fetch worklist</Label><Switch defaultChecked /></div>
                  <div className="flex items-center justify-between"><Label className="text-sm">Auto-route hasil ke PACS</Label><Switch defaultChecked /></div>
                  <div className="flex items-center justify-between"><Label className="text-sm">Kompresi JPEG 2000</Label><Switch /></div>
                  <div className="flex items-center justify-between"><Label className="text-sm">TLS Encryption</Label><Switch defaultChecked /></div>
                </div>
                <Button className="w-full" onClick={() => toast.success("Konfigurasi DICOM disimpan!")}>
                  <Save className="h-4 w-4 mr-1" /> Simpan Konfigurasi
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Konfigurasi HL7</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">HL7 Listen Port</Label><Input defaultValue="2575" type="number" /></div>
                  <div><Label className="text-xs">HL7 Version</Label>
                    <Select defaultValue="2.5"><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2.3">HL7 v2.3</SelectItem>
                        <SelectItem value="2.5">HL7 v2.5</SelectItem>
                        <SelectItem value="2.5.1">HL7 v2.5.1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Character Encoding</Label><Input defaultValue="UTF-8" /></div>
                  <div><Label className="text-xs">Facility ID</Label><Input defaultValue="SIMRS_ZEN_001" /></div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><Label className="text-sm">Auto-ACK</Label><Switch defaultChecked /></div>
                  <div className="flex items-center justify-between"><Label className="text-sm">Message Logging</Label><Switch defaultChecked /></div>
                  <div className="flex items-center justify-between"><Label className="text-sm">Error Retry (3x)</Label><Switch defaultChecked /></div>
                </div>
                <Button className="w-full" onClick={() => toast.success("Konfigurasi HL7 disimpan!")}>
                  <Save className="h-4 w-4 mr-1" /> Simpan Konfigurasi
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Save({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  );
}
