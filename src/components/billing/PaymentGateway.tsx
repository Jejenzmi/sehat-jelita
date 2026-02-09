import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, QrCode, Globe, CheckCircle, Settings, Search, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

const gateways = [
  { id: "midtrans", name: "Midtrans", logo: "🏦", methods: ["QRIS", "VA BCA", "VA Mandiri", "VA BNI", "GoPay", "OVO", "Dana", "Kartu Kredit"], status: "active", transactions: 1250, volume: 845000000 },
  { id: "xendit", name: "Xendit", logo: "💳", methods: ["VA", "E-Wallet", "Kartu Kredit", "Retail Outlet"], status: "inactive", transactions: 0, volume: 0 },
  { id: "doku", name: "DOKU", logo: "🔒", methods: ["VA", "E-Wallet", "Kartu Kredit"], status: "inactive", transactions: 0, volume: 0 },
];

const mockOnlinePayments = [
  { id: "PAY-001", invoice: "INV-20260209-001", patient: "Siti Rahayu", amount: 1500000, method: "QRIS", gateway: "Midtrans", status: "success", paidAt: "2026-02-09 10:30", expiredAt: null },
  { id: "PAY-002", invoice: "INV-20260209-002", patient: "Hadi Santoso", amount: 3200000, method: "VA BCA", gateway: "Midtrans", status: "pending", paidAt: null, expiredAt: "2026-02-09 22:00" },
  { id: "PAY-003", invoice: "INV-20260208-005", patient: "Aminah Wati", amount: 750000, method: "GoPay", gateway: "Midtrans", status: "success", paidAt: "2026-02-08 14:15", expiredAt: null },
  { id: "PAY-004", invoice: "INV-20260208-006", patient: "Bambang P.", amount: 2100000, method: "VA Mandiri", gateway: "Midtrans", status: "expired", paidAt: null, expiredAt: "2026-02-08 23:59" },
];

const payStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  success: { label: "Berhasil", variant: "default" },
  pending: { label: "Menunggu", variant: "outline" },
  expired: { label: "Kedaluwarsa", variant: "destructive" },
  failed: { label: "Gagal", variant: "destructive" },
};

export function PaymentGateway() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"transactions" | "settings">("transactions");

  const filtered = mockOnlinePayments.filter(p =>
    p.patient.toLowerCase().includes(search.toLowerCase()) || p.invoice.toLowerCase().includes(search.toLowerCase())
  );

  const totalSuccess = mockOnlinePayments.filter(p => p.status === "success").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Globe className="h-5 w-5" /> Payment Gateway</h2>
        <div className="flex gap-2">
          <Button variant={activeTab === "transactions" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("transactions")}>Transaksi</Button>
          <Button variant={activeTab === "settings" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("settings")}><Settings className="h-4 w-4 mr-1" />Konfigurasi</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center">
          <QrCode className="h-6 w-6 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{mockOnlinePayments.length}</p>
          <p className="text-sm text-muted-foreground">Total Transaksi</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-600" />
          <p className="text-2xl font-bold">{mockOnlinePayments.filter(p => p.status === "success").length}</p>
          <p className="text-sm text-muted-foreground">Berhasil</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <CreditCard className="h-6 w-6 mx-auto mb-1 text-blue-600" />
          <p className="text-2xl font-bold">Rp {(totalSuccess / 1000000).toFixed(1)}jt</p>
          <p className="text-sm text-muted-foreground">Volume Berhasil</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <Smartphone className="h-6 w-6 mx-auto mb-1 text-orange-600" />
          <p className="text-2xl font-bold">{mockOnlinePayments.filter(p => p.status === "pending").length}</p>
          <p className="text-sm text-muted-foreground">Menunggu Bayar</p>
        </CardContent></Card>
      </div>

      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Cari transaksi..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Pasien</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu Bayar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm">{p.id}</TableCell>
                    <TableCell className="font-mono text-sm">{p.invoice}</TableCell>
                    <TableCell className="font-medium">{p.patient}</TableCell>
                    <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                    <TableCell className="font-medium">Rp {p.amount.toLocaleString("id-ID")}</TableCell>
                    <TableCell><Badge variant={payStatusMap[p.status]?.variant}>{payStatusMap[p.status]?.label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.paidAt || p.expiredAt || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          {gateways.map(gw => (
            <Card key={gw.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{gw.logo}</span>
                    <div>
                      <h3 className="font-semibold text-lg">{gw.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {gw.methods.map(m => <Badge key={m} variant="outline" className="text-xs">{m}</Badge>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {gw.status === "active" && (
                      <div className="text-right text-sm">
                        <p><span className="text-muted-foreground">Transaksi:</span> {gw.transactions.toLocaleString()}</p>
                        <p><span className="text-muted-foreground">Volume:</span> Rp {(gw.volume / 1000000).toFixed(0)}jt</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">{gw.status === "active" ? "Aktif" : "Nonaktif"}</Label>
                      <Switch checked={gw.status === "active"} onCheckedChange={() => toast.info(`Konfigurasi ${gw.name} memerlukan API Key`)} />
                    </div>
                  </div>
                </div>
                {gw.status === "active" && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 grid grid-cols-2 gap-4">
                    <div><Label className="text-xs">Server Key</Label><Input type="password" value="SB-Mid-server-xxxx" disabled className="mt-1" /></div>
                    <div><Label className="text-xs">Client Key</Label><Input type="password" value="SB-Mid-client-xxxx" disabled className="mt-1" /></div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
