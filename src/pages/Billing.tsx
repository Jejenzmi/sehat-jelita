import { CreditCard, Receipt, TrendingUp, Clock, CheckCircle, Search, Filter, Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const billingData = [
  { id: "INV-2024-001234", patient: "Ahmad Hidayat", rm: "RM-001234", type: "BPJS", amount: 0, status: "Lunas", date: "2024-01-15", items: 5 },
  { id: "INV-2024-001235", patient: "Siti Aminah", rm: "RM-001235", type: "Umum", amount: 850000, status: "Pending", date: "2024-01-15", items: 3 },
  { id: "INV-2024-001236", patient: "Budi Santoso", rm: "RM-001236", type: "BPJS", amount: 150000, status: "Lunas", date: "2024-01-14", items: 8 },
  { id: "INV-2024-001237", patient: "Dewi Lestari", rm: "RM-001237", type: "Umum", amount: 1250000, status: "Pending", date: "2024-01-14", items: 4 },
  { id: "INV-2024-001238", patient: "Rahmat Wijaya", rm: "RM-001238", type: "Asuransi", amount: 0, status: "Lunas", date: "2024-01-13", items: 12 },
];

const statusColors: Record<string, string> = {
  "Lunas": "bg-success/10 text-success border-success/20",
  "Pending": "bg-warning/10 text-warning border-warning/20",
  "Batal": "bg-destructive/10 text-destructive border-destructive/20",
};

const typeColors: Record<string, string> = {
  "BPJS": "bg-primary/10 text-primary",
  "Umum": "bg-muted text-muted-foreground",
  "Asuransi": "bg-medical-purple/10 text-medical-purple",
};

export default function Billing() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kasir / Billing</h1>
          <p className="text-muted-foreground">Manajemen pembayaran dan tagihan</p>
        </div>
        <Button className="gradient-primary shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Buat Tagihan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Pendapatan Hari Ini</span>
          </div>
          <p className="text-2xl font-bold">Rp 125.8jt</p>
          <p className="text-sm text-success flex items-center gap-1 mt-1">
            <TrendingUp className="h-4 w-4" />
            +15% vs kemarin
          </p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Transaksi Selesai</span>
          </div>
          <p className="text-2xl font-bold">156</p>
          <p className="text-sm text-muted-foreground mt-1">Hari ini</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Menunggu Pembayaran</span>
          </div>
          <p className="text-2xl font-bold">23</p>
          <p className="text-sm text-muted-foreground mt-1">Rp 45.2jt</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-info/10">
              <Receipt className="h-5 w-5 text-info" />
            </div>
            <span className="text-sm text-muted-foreground">Rata-rata Transaksi</span>
          </div>
          <p className="text-2xl font-bold">Rp 806rb</p>
          <p className="text-sm text-muted-foreground mt-1">Per pasien</p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="module-card">
          <h4 className="font-semibold mb-4">BPJS Kesehatan</h4>
          <p className="text-3xl font-bold text-primary">Rp 85.2jt</p>
          <p className="text-sm text-muted-foreground">68% dari total</p>
          <div className="h-2 bg-muted rounded-full mt-4">
            <div className="h-2 bg-primary rounded-full" style={{ width: "68%" }} />
          </div>
        </div>
        <div className="module-card">
          <h4 className="font-semibold mb-4">Pasien Umum</h4>
          <p className="text-3xl font-bold text-medical-coral">Rp 32.1jt</p>
          <p className="text-sm text-muted-foreground">26% dari total</p>
          <div className="h-2 bg-muted rounded-full mt-4">
            <div className="h-2 bg-medical-coral rounded-full" style={{ width: "26%" }} />
          </div>
        </div>
        <div className="module-card">
          <h4 className="font-semibold mb-4">Asuransi Lain</h4>
          <p className="text-3xl font-bold text-medical-purple">Rp 8.5jt</p>
          <p className="text-sm text-muted-foreground">6% dari total</p>
          <div className="h-2 bg-muted rounded-full mt-4">
            <div className="h-2 bg-medical-purple rounded-full" style={{ width: "6%" }} />
          </div>
        </div>
      </div>

      {/* Billing Table */}
      <div className="module-card">
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="paid">Lunas</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Cari tagihan..." className="pl-10 w-64" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="all">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Invoice</th>
                    <th>Pasien</th>
                    <th>Jenis Bayar</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {billingData.map((bill) => (
                    <tr key={bill.id}>
                      <td className="font-mono text-sm font-medium">{bill.id}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {bill.patient.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{bill.patient}</p>
                            <p className="text-xs text-muted-foreground">{bill.rm}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant="secondary" className={typeColors[bill.type]}>
                          {bill.type}
                        </Badge>
                      </td>
                      <td>{bill.items} item</td>
                      <td className="font-medium">
                        {bill.amount === 0
                          ? "-"
                          : new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              minimumFractionDigits: 0,
                            }).format(bill.amount)}
                      </td>
                      <td>
                        <Badge variant="outline" className={statusColors[bill.status]}>
                          {bill.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {bill.status === "Pending" ? (
                            <Button size="sm">Bayar</Button>
                          ) : (
                            <Button size="sm" variant="outline">
                              <Printer className="h-4 w-4 mr-1" />
                              Cetak
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="pending">
            <p className="text-center text-muted-foreground py-8">
              Menampilkan tagihan pending
            </p>
          </TabsContent>

          <TabsContent value="paid">
            <p className="text-center text-muted-foreground py-8">
              Menampilkan tagihan lunas
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
