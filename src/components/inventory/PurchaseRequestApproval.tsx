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
import { usePurchaseRequests, useCreatePurchaseRequest, useApprovePR, useRejectPR, generatePRNumber, type PurchaseRequest } from "@/hooks/usePurchaseRequestData";

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
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ department: "", urgency: "normal", items_text: "", notes: "", requester_name: "" });

  const { data: prs = [], isLoading } = usePurchaseRequests();
  const createPR = useCreatePurchaseRequest();
  const approvePR = useApprovePR();
  const rejectPR = useRejectPR();

  const filtered = prs.filter(pr => {
    const matchSearch = pr.pr_number.toLowerCase().includes(search.toLowerCase()) || pr.requester_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || pr.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    const prNumber = await generatePRNumber();
    // Parse items from text (simple: "Item - Qty Unit - Harga" per line)
    const lines = form.items_text.split("\n").filter(l => l.trim());
    const items = lines.map(line => {
      const parts = line.split("-").map(s => s.trim());
      return {
        item_name: parts[0] || line,
        quantity: parseInt(parts[1]) || 1,
        unit: parts[2] || "Pcs",
        estimated_price: parseInt(parts[3]?.replace(/\D/g, "")) || 0,
        notes: null,
      };
    });
    const totalEstimate = items.reduce((s, i) => s + i.estimated_price * i.quantity, 0);

    createPR.mutate({
      pr: {
        pr_number: prNumber,
        request_date: new Date().toISOString().split("T")[0],
        requester_id: null,
        requester_name: form.requester_name,
        department: form.department,
        urgency: form.urgency,
        status: "pending_head",
        total_estimate: totalEstimate,
        notes: form.notes || null,
      },
      items,
    }, {
      onSuccess: () => {
        setCreateOpen(false);
        setForm({ department: "", urgency: "normal", items_text: "", notes: "", requester_name: "" });
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Purchase Request & Approval</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Buat PR Baru</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Buat Purchase Request</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nama Pemohon</Label><Input placeholder="Nama pemohon" value={form.requester_name} onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))} /></div>
              <div><Label>Departemen</Label>
                <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih departemen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Farmasi">Farmasi</SelectItem>
                    <SelectItem value="Laboratorium">Laboratorium</SelectItem>
                    <SelectItem value="Radiologi">Radiologi</SelectItem>
                    <SelectItem value="Pemeliharaan">Pemeliharaan</SelectItem>
                    <SelectItem value="Umum">Umum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Urgensi</Label>
                <Select value={form.urgency} onValueChange={v => setForm(f => ({ ...f, urgency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Mendesak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Item (per baris: Nama - Qty - Satuan - Harga)</Label><Textarea placeholder="Paracetamol 500mg - 500 - Tab - 750000" rows={4} value={form.items_text} onChange={e => setForm(f => ({ ...f, items_text: e.target.value }))} /></div>
              <div><Label>Catatan / Justifikasi</Label><Textarea placeholder="Alasan permintaan" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={handleCreate} disabled={createPR.isPending || !form.requester_name || !form.department}>
                {createPR.isPending ? "Menyimpan..." : "Kirim PR"}
              </Button>
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
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Memuat data...</div>
        ) : (
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
                <TableHead>Approval</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Belum ada Purchase Request</TableCell></TableRow>
              ) : filtered.map(pr => (
                <TableRow key={pr.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedPR(pr)}>
                  <TableCell className="font-mono text-sm">{pr.pr_number}</TableCell>
                  <TableCell>{pr.request_date}</TableCell>
                  <TableCell><p className="font-medium">{pr.requester_name}</p><p className="text-xs text-muted-foreground">{pr.department}</p></TableCell>
                  <TableCell>{pr.items?.length || 0} item</TableCell>
                  <TableCell className="font-medium">Rp {Number(pr.total_estimate).toLocaleString("id-ID")}</TableCell>
                  <TableCell><Badge variant={urgencyMap[pr.urgency]?.variant}>{urgencyMap[pr.urgency]?.label}</Badge></TableCell>
                  <TableCell><Badge variant={prStatusMap[pr.status]?.variant}>{prStatusMap[pr.status]?.label || pr.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {pr.approvals?.map((a, i) => (
                        <div key={a.id} className="flex items-center gap-1">
                          {a.status === "approved" && <CheckCircle className="h-4 w-4 text-green-600" />}
                          {a.status === "pending" && <Clock className="h-4 w-4 text-orange-500" />}
                          {a.status === "waiting" && <Clock className="h-4 w-4 text-muted-foreground/30" />}
                          {a.status === "rejected" && <XCircle className="h-4 w-4 text-red-600" />}
                          {i < (pr.approvals?.length || 0) - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/30" />}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={!!selectedPR} onOpenChange={() => setSelectedPR(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detail Purchase Request {selectedPR?.pr_number}</DialogTitle></DialogHeader>
          {selectedPR && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Pemohon:</span> <span className="font-medium">{selectedPR.requester_name}</span></div>
                <div><span className="text-muted-foreground">Tanggal:</span> {selectedPR.request_date}</div>
                <div><span className="text-muted-foreground">Departemen:</span> {selectedPR.department}</div>
                <div><span className="text-muted-foreground">Catatan:</span> {selectedPR.notes || "-"}</div>
              </div>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Item</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Qty</TableHead><TableHead>Satuan</TableHead><TableHead>Estimasi</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {selectedPR.items?.map((item) => (
                        <TableRow key={item.id}><TableCell>{item.item_name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{item.unit}</TableCell><TableCell>Rp {Number(item.estimated_price).toLocaleString("id-ID")}</TableCell></TableRow>
                      ))}
                      <TableRow><TableCell colSpan={3} className="font-bold text-right">Total</TableCell><TableCell className="font-bold">Rp {Number(selectedPR.total_estimate).toLocaleString("id-ID")}</TableCell></TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Approval Chain</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedPR.approvals?.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <div className="flex-shrink-0">
                          {a.status === "approved" && <CheckCircle className="h-5 w-5 text-green-600" />}
                          {a.status === "pending" && <Clock className="h-5 w-5 text-orange-500 animate-pulse" />}
                          {a.status === "waiting" && <Clock className="h-5 w-5 text-muted-foreground/30" />}
                          {a.status === "rejected" && <XCircle className="h-5 w-5 text-red-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{a.role_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{a.approver_name || "Belum ditentukan"}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">{a.approved_at ? new Date(a.approved_at).toLocaleString("id-ID") : "-"}</div>
                        {a.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => { rejectPR.mutate({ approvalId: a.id, prId: selectedPR.id }); setSelectedPR(null); }}><XCircle className="h-3 w-3 mr-1" />Tolak</Button>
                            <Button size="sm" onClick={() => { approvePR.mutate({ approvalId: a.id, prId: selectedPR.id, level: a.approval_level }); setSelectedPR(null); }}><CheckCircle className="h-3 w-3 mr-1" />Setujui</Button>
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
