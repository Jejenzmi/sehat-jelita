import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Search, CheckCircle, XCircle, Clock, ArrowRight, User } from "lucide-react";
import { toast } from "sonner";

const mockPRs = [
  {
    id: "PR-20260209-001", requestDate: "2026-02-09", requester: "Ns. Dewi (Farmasi)", department: "Farmasi",
    items: [{ name: "Paracetamol 500mg", qty: 500, unit: "Tab", est: 750000 }, { name: "Amoxicillin 500mg", qty: 200, unit: "Kaps", est: 600000 }],
    totalEstimate: 1350000, urgency: "normal", status: "pending_head", notes: "Stok menipis",
    approvalChain: [
      { role: "Kepala Unit", name: "apt. Rina", status: "pending", date: null },
      { role: "Manajer Logistik", name: "Budi S.", status: "waiting", date: null },
      { role: "Direktur/Keuangan", name: "dr. Ahmad", status: "waiting", date: null },
    ],
  },
  {
    id: "PR-20260208-003", requestDate: "2026-02-08", requester: "Dr. Clara (Lab)", department: "Laboratorium",
    items: [{ name: "Reagent CBC", qty: 10, unit: "Box", est: 5000000 }, { name: "Cuvette", qty: 1000, unit: "Pcs", est: 1200000 }],
    totalEstimate: 6200000, urgency: "urgent", status: "pending_manager", notes: "Reagent hampir habis",
    approvalChain: [
      { role: "Kepala Unit", name: "Dr. Budi", status: "approved", date: "2026-02-08 14:00" },
      { role: "Manajer Logistik", name: "Heru M.", status: "pending", date: null },
      { role: "Direktur/Keuangan", name: "dr. Ahmad", status: "waiting", date: null },
    ],
  },
  {
    id: "PR-20260207-002", requestDate: "2026-02-07", requester: "Pak Joko (Maintenance)", department: "Pemeliharaan",
    items: [{ name: "Filter AC", qty: 20, unit: "Pcs", est: 2000000 }],
    totalEstimate: 2000000, urgency: "normal", status: "approved", notes: "Penggantian rutin",
    approvalChain: [
      { role: "Kepala Unit", name: "Bambang T.", status: "approved", date: "2026-02-07 10:00" },
      { role: "Manajer Logistik", name: "Heru M.", status: "approved", date: "2026-02-07 15:00" },
      { role: "Direktur/Keuangan", name: "dr. Ahmad", status: "approved", date: "2026-02-08 09:00" },
    ],
  },
];

const urgencyMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" }> = {
  normal: { label: "Normal", variant: "outline" },
  urgent: { label: "Mendesak", variant: "destructive" },
};

const prStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending_head: { label: "Menunggu Kepala Unit", variant: "outline" },
  pending_manager: { label: "Menunggu Manajer", variant: "secondary" },
  pending_director: { label: "Menunggu Direktur", variant: "secondary" },
  approved: { label: "Disetujui", variant: "default" },
  rejected: { label: "Ditolak", variant: "destructive" },
};

export function PurchaseRequestApproval() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPR, setSelectedPR] = useState<typeof mockPRs[0] | null>(null);

  const filtered = mockPRs.filter(pr => {
    const matchSearch = pr.id.toLowerCase().includes(search.toLowerCase()) || pr.requester.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || pr.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Purchase Request & Approval</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Buat PR Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Buat Purchase Request</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Departemen</Label>
                <Select><SelectTrigger><SelectValue placeholder="Pilih departemen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmasi">Farmasi</SelectItem>
                    <SelectItem value="lab">Laboratorium</SelectItem>
                    <SelectItem value="radiologi">Radiologi</SelectItem>
                    <SelectItem value="maintenance">Pemeliharaan</SelectItem>
                    <SelectItem value="umum">Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Urgensi</Label>
                <Select><SelectTrigger><SelectValue placeholder="Pilih urgensi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Mendesak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Item yang Diminta</Label><Textarea placeholder="Daftar item, jumlah, dan estimasi harga..." rows={4} /></div>
              <div><Label>Catatan / Justifikasi</Label><Textarea placeholder="Alasan permintaan pembelian" /></div>
              <Button className="w-full" onClick={() => toast.success("Purchase Request berhasil dibuat")}>Kirim PR</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Cari PR..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending_head">Menunggu Kepala Unit</SelectItem>
            <SelectItem value="pending_manager">Menunggu Manajer</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. PR</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Pemohon</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Estimasi</TableHead>
              <TableHead>Urgensi</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Approval Chain</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(pr => (
              <TableRow key={pr.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPR(pr)}>
                <TableCell className="font-mono text-sm">{pr.id}</TableCell>
                <TableCell>{pr.requestDate}</TableCell>
                <TableCell><p className="font-medium">{pr.requester}</p><p className="text-xs text-muted-foreground">{pr.department}</p></TableCell>
                <TableCell>{pr.items.length} item</TableCell>
                <TableCell className="font-medium">Rp {pr.totalEstimate.toLocaleString("id-ID")}</TableCell>
                <TableCell><Badge variant={urgencyMap[pr.urgency]?.variant}>{urgencyMap[pr.urgency]?.label}</Badge></TableCell>
                <TableCell><Badge variant={prStatusMap[pr.status]?.variant}>{prStatusMap[pr.status]?.label}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {pr.approvalChain.map((a, i) => (
                      <div key={i} className="flex items-center gap-1">
                        {a.status === "approved" && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {a.status === "pending" && <Clock className="h-4 w-4 text-orange-500" />}
                        {a.status === "waiting" && <Clock className="h-4 w-4 text-muted-foreground/30" />}
                        {a.status === "rejected" && <XCircle className="h-4 w-4 text-red-600" />}
                        {i < pr.approvalChain.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/30" />}
                      </div>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedPR} onOpenChange={() => setSelectedPR(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detail Purchase Request {selectedPR?.id}</DialogTitle></DialogHeader>
          {selectedPR && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Pemohon:</span> <span className="font-medium">{selectedPR.requester}</span></div>
                <div><span className="text-muted-foreground">Tanggal:</span> {selectedPR.requestDate}</div>
                <div><span className="text-muted-foreground">Departemen:</span> {selectedPR.department}</div>
                <div><span className="text-muted-foreground">Catatan:</span> {selectedPR.notes}</div>
              </div>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Item</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Qty</TableHead><TableHead>Satuan</TableHead><TableHead>Estimasi</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedPR.items.map((item, i) => (
                        <TableRow key={i}><TableCell>{item.name}</TableCell><TableCell>{item.qty}</TableCell><TableCell>{item.unit}</TableCell><TableCell>Rp {item.est.toLocaleString("id-ID")}</TableCell></TableRow>
                      ))}
                      <TableRow><TableCell colSpan={3} className="font-bold text-right">Total</TableCell><TableCell className="font-bold">Rp {selectedPR.totalEstimate.toLocaleString("id-ID")}</TableCell></TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Approval Chain</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedPR.approvalChain.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <div className="flex-shrink-0">
                          {a.status === "approved" && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {a.status === "pending" && <Clock className="h-5 w-5 text-orange-500 animate-pulse" />}
                          {a.status === "waiting" && <Clock className="h-5 w-5 text-muted-foreground/30" />}
                          {a.status === "rejected" && <XCircle className="h-5 w-5 text-red-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{a.role}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{a.name}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">{a.date || "-"}</div>
                        {a.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { toast.error("PR ditolak"); setSelectedPR(null); }}><XCircle className="h-3 w-3 mr-1" />Tolak</Button>
                            <Button size="sm" onClick={() => { toast.success("PR disetujui"); setSelectedPR(null); }}><CheckCircle className="h-3 w-3 mr-1" />Setujui</Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
