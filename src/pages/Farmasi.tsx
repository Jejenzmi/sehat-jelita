import { useState } from "react";
import { Search, Filter, Pill, Package, AlertTriangle, TrendingUp, Plus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const prescriptions = [
  { id: "RX-001", patient: "Ahmad H.", doctor: "dr. Sari", items: 3, status: "Menunggu", time: "09:30", type: "BPJS" },
  { id: "RX-002", patient: "Siti A.", doctor: "dr. Maya", items: 5, status: "Diproses", time: "09:25", type: "BPJS" },
  { id: "RX-003", patient: "Budi S.", doctor: "dr. Andi", items: 2, status: "Siap Diambil", time: "09:15", type: "Umum" },
  { id: "RX-004", patient: "Dewi L.", doctor: "dr. Lisa", items: 4, status: "Menunggu", time: "09:35", type: "BPJS" },
  { id: "RX-005", patient: "Rahmat W.", doctor: "dr. Budi", items: 6, status: "Diproses", time: "09:20", type: "Umum" },
];

const lowStockMeds = [
  { name: "Paracetamol 500mg", stock: 50, min: 100, unit: "tablet" },
  { name: "Amoxicillin 500mg", stock: 30, min: 80, unit: "kapsul" },
  { name: "Omeprazole 20mg", stock: 25, min: 60, unit: "kapsul" },
  { name: "Metformin 500mg", stock: 40, min: 100, unit: "tablet" },
];

const statusColors: Record<string, string> = {
  "Menunggu": "bg-warning/10 text-warning border-warning/20",
  "Diproses": "bg-info/10 text-info border-info/20",
  "Siap Diambil": "bg-success/10 text-success border-success/20",
};

export default function Farmasi() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Farmasi</h1>
          <p className="text-muted-foreground">Manajemen resep dan stok obat</p>
        </div>
        <Button className="gradient-primary shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          Resep Baru
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Pill className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">45</p>
            <p className="text-sm text-muted-foreground">Resep Hari Ini</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Package className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">12</p>
            <p className="text-sm text-muted-foreground">Menunggu Diproses</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">28</p>
            <p className="text-sm text-muted-foreground">Selesai</p>
          </div>
        </div>
        <div className="module-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold">4</p>
            <p className="text-sm text-muted-foreground">Stok Menipis</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescriptions */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="queue" className="space-y-4">
            <TabsList>
              <TabsTrigger value="queue">Antrian Resep</TabsTrigger>
              <TabsTrigger value="history">Riwayat</TabsTrigger>
            </TabsList>

            <TabsContent value="queue">
              <div className="module-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Antrian Resep</h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Cari resep..." className="pl-10 w-48" />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Pill className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{rx.id}</p>
                            <Badge variant="secondary" className={rx.type === "BPJS" ? "bg-primary/10 text-primary" : ""}>
                              {rx.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rx.patient} • {rx.doctor} • {rx.items} item
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant="outline" className={statusColors[rx.status]}>
                            {rx.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">{rx.time}</p>
                        </div>
                        <Button size="sm" variant={rx.status === "Siap Diambil" ? "default" : "outline"}>
                          {rx.status === "Siap Diambil" ? "Serahkan" : "Proses"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="module-card">
                <p className="text-center text-muted-foreground py-8">
                  Riwayat resep akan ditampilkan di sini
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Low Stock Alert */}
          <div className="module-card border-destructive/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">Stok Menipis</h3>
                <p className="text-sm text-muted-foreground">Perlu restock segera</p>
              </div>
            </div>

            <div className="space-y-3">
              {lowStockMeds.map((med) => (
                <div key={med.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{med.name}</span>
                    <span className="text-destructive font-medium">
                      {med.stock} {med.unit}
                    </span>
                  </div>
                  <Progress
                    value={(med.stock / med.min) * 100}
                    className="h-1.5"
                  />
                  <p className="text-xs text-muted-foreground">
                    Min. stok: {med.min} {med.unit}
                  </p>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4" size="sm">
              Buat Permintaan Stok
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="module-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">Statistik Hari Ini</h3>
                <p className="text-sm text-muted-foreground">Performa farmasi</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rata-rata waktu proses</span>
                <span className="font-medium">8 menit</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total item obat</span>
                <span className="font-medium">156 item</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Resep BPJS</span>
                <span className="font-medium">32 (71%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Resep Umum</span>
                <span className="font-medium">13 (29%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
