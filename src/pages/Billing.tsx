import { useState, useEffect } from "react";
import { CreditCard, Receipt, TrendingUp, Clock, CheckCircle, Search, Filter, Plus, Printer, Eye, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PaymentGateway } from "@/components/billing/PaymentGateway";

type BillingStatus = "pending" | "partial" | "paid" | "cancelled" | "refunded";
type PaymentType = "umum" | "bpjs" | "asuransi";

interface Billing {
  id: string;
  invoice_number: string;
  patient_id: string;
  visit_id: string;
  billing_date: string;
  payment_type: PaymentType;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  status: BillingStatus;
  payment_method: string | null;
  payment_date: string | null;
  notes: string | null;
  patients?: {
    full_name: string;
    medical_record_number: string;
  };
  billing_items?: BillingItem[];
}

interface BillingItem {
  id: string;
  item_type: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const statusColors: Record<string, string> = {
  paid: "bg-success/10 text-success border-success/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-info/10 text-info border-info/20",
  refunded: "bg-muted/10 text-muted-foreground border-muted/20",
};

const statusLabels: Record<string, string> = {
  paid: "Lunas",
  pending: "Pending",
  cancelled: "Batal",
  partial: "Sebagian",
  refunded: "Dikembalikan",
};

const typeColors: Record<string, string> = {
  bpjs: "bg-primary/10 text-primary",
  umum: "bg-muted text-muted-foreground",
  asuransi: "bg-medical-purple/10 text-medical-purple",
};

export default function Billing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [payAmount, setPayAmount] = useState("");

  // Fetch billings
  const { data: billings = [], isLoading } = useQuery({
    queryKey: ["billings", statusFilter],
    queryFn: async () => {
      let query = db
        .from("billings")
        .select(`
          *,
          patients (full_name, medical_record_number),
          billing_items (*)
        `)
        .order("billing_date", { ascending: false });

      if (statusFilter !== "all" && statusFilter !== "pending" && statusFilter !== "paid") {
        // Skip filter for special tabs
      } else if (statusFilter === "pending") {
        query = query.eq("status", "pending");
      } else if (statusFilter === "paid") {
        query = query.eq("status", "paid");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Billing[];
    },
  });

  // Calculate stats
  const todayBillings = billings.filter(b => {
    const billingDate = new Date(b.billing_date);
    return billingDate.toDateString() === new Date().toDateString();
  });
  const todayRevenue = todayBillings.reduce((sum, b) => sum + (b.paid_amount || 0), 0);
  const completedToday = todayBillings.filter(b => b.status === "paid").length;
  const pendingBillings = billings.filter(b => b.status === "pending");
  const pendingTotal = pendingBillings.reduce((sum, b) => sum + b.total, 0);

  // Revenue by payment type
  const bpjsRevenue = billings.filter(b => b.payment_type === "bpjs" && b.status === "paid")
    .reduce((sum, b) => sum + b.total, 0);
  const umumRevenue = billings.filter(b => b.payment_type === "umum" && b.status === "paid")
    .reduce((sum, b) => sum + b.total, 0);
  const asuransiRevenue = billings.filter(b => b.payment_type === "asuransi" && b.status === "paid")
    .reduce((sum, b) => sum + b.total, 0);
  const totalRevenue = bpjsRevenue + umumRevenue + asuransiRevenue;

  // Process payment mutation
  const processPayment = useMutation({
    mutationFn: async ({ billingId, amount, method }: { billingId: string; amount: number; method: string }) => {
      const billing = billings.find(b => b.id === billingId);
      if (!billing) throw new Error("Billing not found");

      const newPaidAmount = (billing.paid_amount || 0) + amount;
      const newStatus = newPaidAmount >= billing.total ? "paid" : "partial";

      const { error } = await db
        .from("billings")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
          payment_method: method,
          payment_date: new Date().toISOString(),
        })
        .eq("id", billingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billings"] });
      setIsPaymentOpen(false);
      setSelectedBilling(null);
      setPaymentMethod("");
      setPayAmount("");
      toast({
        title: "Pembayaran Berhasil",
        description: "Status tagihan telah diperbarui",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProcessPayment = () => {
    if (!selectedBilling || !paymentMethod || !payAmount) return;
    
    processPayment.mutate({
      billingId: selectedBilling.id,
      amount: parseFloat(payAmount),
      method: paymentMethod,
    });
  };

  const filteredBillings = billings.filter(b => 
    b.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.patients?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.patients?.medical_record_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const [mainTab, setMainTab] = useState("billing");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Kasir / Billing</h1>
          <p className="text-muted-foreground">Manajemen pembayaran dan tagihan</p>
        </div>
        <div className="flex gap-2">
          <Button variant={mainTab === "billing" ? "default" : "outline"} onClick={() => setMainTab("billing")}>
            <CreditCard className="h-4 w-4 mr-2" />Billing
          </Button>
          <Button variant={mainTab === "gateway" ? "default" : "outline"} onClick={() => setMainTab("gateway")}>
            <Globe className="h-4 w-4 mr-2" />Payment Gateway
          </Button>
        </div>
      </div>

      {mainTab === "gateway" ? (
        <PaymentGateway />
      ) : (
      <>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Pendapatan Hari Ini</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
          <p className="text-sm text-success flex items-center gap-1 mt-1">
            <TrendingUp className="h-4 w-4" />
            {todayBillings.length} transaksi
          </p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Transaksi Selesai</span>
          </div>
          <p className="text-2xl font-bold">{completedToday}</p>
          <p className="text-sm text-muted-foreground mt-1">Hari ini</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Menunggu Pembayaran</span>
          </div>
          <p className="text-2xl font-bold">{pendingBillings.length}</p>
          <p className="text-sm text-muted-foreground mt-1">{formatCurrency(pendingTotal)}</p>
        </div>
        <div className="module-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-info/10">
              <Receipt className="h-5 w-5 text-info" />
            </div>
            <span className="text-sm text-muted-foreground">Total Pendapatan</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-muted-foreground mt-1">Semua waktu</p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="module-card">
          <h4 className="font-semibold mb-4">BPJS Kesehatan</h4>
          <p className="text-3xl font-bold text-primary">{formatCurrency(bpjsRevenue)}</p>
          <p className="text-sm text-muted-foreground">
            {totalRevenue > 0 ? ((bpjsRevenue / totalRevenue) * 100).toFixed(1) : 0}% dari total
          </p>
          <div className="h-2 bg-muted rounded-full mt-4">
            <div 
              className="h-2 bg-primary rounded-full" 
              style={{ width: `${totalRevenue > 0 ? (bpjsRevenue / totalRevenue) * 100 : 0}%` }} 
            />
          </div>
        </div>
        <div className="module-card">
          <h4 className="font-semibold mb-4">Pasien Umum</h4>
          <p className="text-3xl font-bold text-medical-coral">{formatCurrency(umumRevenue)}</p>
          <p className="text-sm text-muted-foreground">
            {totalRevenue > 0 ? ((umumRevenue / totalRevenue) * 100).toFixed(1) : 0}% dari total
          </p>
          <div className="h-2 bg-muted rounded-full mt-4">
            <div 
              className="h-2 bg-medical-coral rounded-full" 
              style={{ width: `${totalRevenue > 0 ? (umumRevenue / totalRevenue) * 100 : 0}%` }} 
            />
          </div>
        </div>
        <div className="module-card">
          <h4 className="font-semibold mb-4">Asuransi Lain</h4>
          <p className="text-3xl font-bold text-medical-purple">{formatCurrency(asuransiRevenue)}</p>
          <p className="text-sm text-muted-foreground">
            {totalRevenue > 0 ? ((asuransiRevenue / totalRevenue) * 100).toFixed(1) : 0}% dari total
          </p>
          <div className="h-2 bg-muted rounded-full mt-4">
            <div 
              className="h-2 bg-medical-purple rounded-full" 
              style={{ width: `${totalRevenue > 0 ? (asuransiRevenue / totalRevenue) * 100 : 0}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Billing Table */}
      <div className="module-card">
        <Tabs defaultValue="all" onValueChange={(v) => setStatusFilter(v)}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="paid">Lunas</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari tagihan..." 
                  className="pl-10 w-64" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
            ) : filteredBillings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">Tidak ada data tagihan</div>
            ) : (
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
                    {filteredBillings.map((bill) => (
                      <tr key={bill.id}>
                        <td className="font-mono text-sm font-medium">{bill.invoice_number}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {bill.patients?.full_name?.split(" ").map((n) => n[0]).join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{bill.patients?.full_name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{bill.patients?.medical_record_number}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant="secondary" className={typeColors[bill.payment_type]}>
                            {bill.payment_type.toUpperCase()}
                          </Badge>
                        </td>
                        <td>{bill.billing_items?.length || 0} item</td>
                        <td className="font-medium">
                          {bill.payment_type === "bpjs" ? "-" : formatCurrency(bill.total)}
                        </td>
                        <td>
                          <Badge variant="outline" className={statusColors[bill.status]}>
                            {statusLabels[bill.status]}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setSelectedBilling(bill)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {bill.status === "pending" && bill.payment_type !== "bpjs" && (
                              <Button 
                                size="sm"
                                onClick={() => {
                                  setSelectedBilling(bill);
                                  setIsPaymentOpen(true);
                                  setPayAmount(bill.total.toString());
                                }}
                              >
                                Bayar
                              </Button>
                            )}
                            {bill.status === "paid" && (
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
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            {/* Same table structure, filtered by status */}
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Invoice</th>
                    <th>Pasien</th>
                    <th>Jenis Bayar</th>
                    <th>Total</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBillings.filter(b => b.status === "pending").map((bill) => (
                    <tr key={bill.id}>
                      <td className="font-mono text-sm font-medium">{bill.invoice_number}</td>
                      <td>{bill.patients?.full_name}</td>
                      <td>
                        <Badge variant="secondary" className={typeColors[bill.payment_type]}>
                          {bill.payment_type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="font-medium">{formatCurrency(bill.total)}</td>
                      <td>
                        {bill.payment_type !== "bpjs" && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedBilling(bill);
                              setIsPaymentOpen(true);
                              setPayAmount(bill.total.toString());
                            }}
                          >
                            Bayar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="paid" className="mt-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Invoice</th>
                    <th>Pasien</th>
                    <th>Jenis Bayar</th>
                    <th>Total</th>
                    <th>Tanggal Bayar</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBillings.filter(b => b.status === "paid").map((bill) => (
                    <tr key={bill.id}>
                      <td className="font-mono text-sm font-medium">{bill.invoice_number}</td>
                      <td>{bill.patients?.full_name}</td>
                      <td>
                        <Badge variant="secondary" className={typeColors[bill.payment_type]}>
                          {bill.payment_type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="font-medium">{formatCurrency(bill.total)}</td>
                      <td>{bill.payment_date ? new Date(bill.payment_date).toLocaleDateString("id-ID") : "-"}</td>
                      <td>
                        <Button size="sm" variant="outline">
                          <Printer className="h-4 w-4 mr-1" />
                          Cetak
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proses Pembayaran</DialogTitle>
            <DialogDescription>
              Invoice: {selectedBilling?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pasien</Label>
              <p className="font-medium">{selectedBilling?.patients?.full_name}</p>
            </div>
            <div className="space-y-2">
              <Label>Total Tagihan</Label>
              <p className="text-2xl font-bold">{formatCurrency(selectedBilling?.total || 0)}</p>
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="debit">Kartu Debit</SelectItem>
                  <SelectItem value="credit">Kartu Kredit</SelectItem>
                  <SelectItem value="transfer">Transfer Bank</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jumlah Bayar</Label>
              <Input 
                type="number" 
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Batal</Button>
            <Button 
              onClick={handleProcessPayment}
              disabled={!paymentMethod || !payAmount || processPayment.isPending}
            >
              {processPayment.isPending ? "Memproses..." : "Proses Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBilling && !isPaymentOpen} onOpenChange={() => setSelectedBilling(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Tagihan</DialogTitle>
            <DialogDescription>
              {selectedBilling?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Pasien</Label>
                <p className="font-medium">{selectedBilling?.patients?.full_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">No. RM</Label>
                <p className="font-medium">{selectedBilling?.patients?.medical_record_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Jenis Pembayaran</Label>
                <p className="font-medium">{selectedBilling?.payment_type.toUpperCase()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <Badge className={statusColors[selectedBilling?.status || "pending"]}>
                  {statusLabels[selectedBilling?.status || "pending"]}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Item Tagihan</Label>
              <div className="mt-2 border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 text-sm">Item</th>
                      <th className="text-center p-2 text-sm">Qty</th>
                      <th className="text-right p-2 text-sm">Harga</th>
                      <th className="text-right p-2 text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBilling?.billing_items?.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2 text-sm">{item.item_name}</td>
                        <td className="p-2 text-sm text-center">{item.quantity}</td>
                        <td className="p-2 text-sm text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="p-2 text-sm text-right font-medium">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted">
                    <tr>
                      <td colSpan={3} className="p-2 text-right font-medium">Total</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(selectedBilling?.total || 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}
