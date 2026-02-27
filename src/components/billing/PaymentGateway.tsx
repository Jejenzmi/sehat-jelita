import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, QrCode, Globe, CheckCircle, Settings, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";

const gateways = [
  { id: "midtrans", name: "Midtrans", logo: "🏦", methods: ["QRIS", "VA BCA", "VA Mandiri", "VA BNI", "GoPay", "OVO", "Dana", "Kartu Kredit"], status: "active" },
  { id: "xendit", name: "Xendit", logo: "💳", methods: ["VA", "E-Wallet", "Kartu Kredit", "Retail Outlet"], status: "inactive" },
  { id: "doku", name: "DOKU", logo: "🔒", methods: ["VA", "E-Wallet", "Kartu Kredit"], status: "inactive" },
];

const payStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid: { label: "Berhasil", variant: "default" },
  pending: { label: "Menunggu", variant: "outline" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  partial: { label: "Sebagian", variant: "secondary" },
};

export function PaymentGateway() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"transactions" | "settings">("transactions");

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payment-gateway-transactions"],
    queryFn: async () => {
      const { data, error } = await db
        .from("billings")
        .select("id, invoice_number, total, status, payment_method, payment_date, billing_date, paid_amount, patients(full_name)")
        .order("billing_date", { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return (data || []).map((b: any) => ({
        id: b.id,
        invoice: b.invoice_number,
        patient: b.patients?.full_name || "-",
        amount: b.total || 0,
        method: b.payment_method || "Tunai",
        status: b.status as string,
        paidAt: b.payment_date,
        billingDate: b.billing_date,
      }));
    },
  });

  const filtered = payments.filter(p =>
    p.patient.toLowerCase().includes(search.toLowerCase()) || p.invoice.toLowerCase().includes(search.toLowerCase())
  );

  const totalSuccess = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);

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
          <p className="text-2xl font-bold">{payments.length}</p>
          <p className="text-sm text-muted-foreground">Total Transaksi</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-600" />
          <p className="text-2xl font-bold">{payments.filter(p => p.status === "paid").length}</p>
          <p className="text-sm text-muted-foreground">Berhasil</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <CreditCard className="h-6 w-6 mx-auto mb-1 text-blue-600" />
          <p className="text-2xl font-bold">Rp {(totalSuccess / 1000000).toFixed(1)}jt</p>
          <p className="text-sm text-muted-foreground">Volume Berhasil</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6 text-center">
          <Smartphone className="h-6 w-6 mx-auto mb-1 text-orange-600" />
          <p className="text-2xl font-bold">{payments.filter(p => p.status === "pending").length}</p>
          <p className="text-sm text-muted-foreground">Menunggu Bayar</p>
        </CardContent></Card>
      </div>

      {activeTab === "transactions" && (
        <div className="space-y-4">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Cari transaksi..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <Card>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu Bayar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {search ? "Tidak ada transaksi yang cocok" : "Belum ada data transaksi pembayaran"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">{p.invoice}</TableCell>
                        <TableCell className="font-medium">{p.patient}</TableCell>
                        <TableCell><Badge variant="outline">{p.method}</Badge></TableCell>
                        <TableCell className="font-medium">Rp {p.amount.toLocaleString("id-ID")}</TableCell>
                        <TableCell><Badge variant={payStatusMap[p.status]?.variant || "outline"}>{payStatusMap[p.status]?.label || p.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.paidAt || p.billingDate || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
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
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">{gw.status === "active" ? "Aktif" : "Nonaktif"}</Label>
                    <Switch checked={gw.status === "active"} onCheckedChange={() => toast.info(`Konfigurasi ${gw.name} memerlukan API Key yang dikonfigurasi di Pengaturan`)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
