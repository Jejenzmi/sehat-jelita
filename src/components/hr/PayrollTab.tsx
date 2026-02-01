import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { 
  usePayroll, 
  useEmployees, 
  useCreatePayroll,
  useUpdatePayroll,
  useSalaryComponents,
  calculatePPh21,
  calculateBPJS,
  PayrollRecord
} from "@/hooks/useHRData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Calculator, 
  Wallet, 
  Download, 
  Eye,
  CheckCircle,
  FileText
} from "lucide-react";

const months = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export function PayrollTab() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(currentYear);
  
  const { data: payroll, isLoading } = usePayroll(selectedMonth, selectedYear);
  const { data: employees } = useEmployees();
  const { data: salaryComponents } = useSalaryComponents();
  const createPayroll = useCreatePayroll();
  const updatePayroll = useUpdatePayroll();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleGeneratePayroll = () => {
    const activeEmployees = employees?.filter(e => e.status === "active" && e.salary);
    
    if (!activeEmployees || activeEmployees.length === 0) {
      return;
    }

    // Generate payroll for each employee
    activeEmployees.forEach(emp => {
      const baseSalary = emp.salary || 0;
      const taxStatus = emp.tax_status || "TK/0";
      
      // Calculate allowances
      const allowances: Record<string, number> = {};
      const allowanceComponents = salaryComponents?.filter(c => c.component_type === "allowance" && c.is_active);
      
      let totalAllowances = 0;
      allowanceComponents?.forEach(comp => {
        let amount = 0;
        if (comp.calculation_type === "fixed") {
          amount = comp.base_amount;
        } else if (comp.calculation_type === "percentage") {
          amount = (baseSalary * comp.percentage) / 100;
        }
        if (amount > 0) {
          allowances[comp.component_name] = amount;
          totalAllowances += amount;
        }
      });

      const grossSalary = baseSalary + totalAllowances;
      
      // Calculate deductions
      const bpjs = calculateBPJS(baseSalary);
      const pph21 = calculatePPh21(grossSalary, taxStatus);
      
      const deductions: Record<string, number> = {
        "BPJS Kesehatan": bpjs.kesehatan,
        "BPJS JHT": bpjs.jht,
        "BPJS JP": bpjs.jp,
        "PPh 21": pph21,
      };
      
      const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
      const netSalary = grossSalary - totalDeductions;

      createPayroll.mutate({
        employee_id: emp.id,
        period_month: generateMonth,
        period_year: generateYear,
        basic_salary: baseSalary,
        allowances,
        deductions,
        gross_salary: grossSalary,
        tax_amount: pph21,
        net_salary: netSalary,
        status: "pending",
      });
    });

    setIsGenerateOpen(false);
  };

  const handleApprove = (payrollRecord: PayrollRecord) => {
    updatePayroll.mutate({
      id: payrollRecord.id,
      status: "approved",
    });
  };

  const handlePay = (payrollRecord: PayrollRecord) => {
    updatePayroll.mutate({
      id: payrollRecord.id,
      status: "paid",
      payment_date: format(new Date(), "yyyy-MM-dd"),
      payment_method: "transfer",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Dibayar</Badge>;
      case "approved":
        return <Badge className="bg-blue-500">Disetujui</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalGross = payroll?.reduce((sum, p) => sum + p.gross_salary, 0) || 0;
  const totalNet = payroll?.reduce((sum, p) => sum + p.net_salary, 0) || 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gaji Bruto</p>
                <p className="text-xl font-bold">{formatCurrency(totalGross)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-xl">
                <Calculator className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gaji Neto</p>
                <p className="text-xl font-bold">{formatCurrency(totalNet)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-xl">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jumlah Slip Gaji</p>
                <p className="text-xl font-bold">{payroll?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Penggajian / Payroll
              </CardTitle>
              <CardDescription>
                Periode: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Payroll
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Payroll</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Sistem akan menghitung gaji untuk semua karyawan aktif berdasarkan 
                      komponen gaji yang telah dikonfigurasi.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bulan</Label>
                        <Select 
                          value={generateMonth.toString()} 
                          onValueChange={(v) => setGenerateMonth(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tahun</Label>
                        <Select 
                          value={generateYear.toString()} 
                          onValueChange={(v) => setGenerateYear(parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      <p><strong>Komponen yang akan dihitung:</strong></p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                        <li>Gaji Pokok</li>
                        <li>Tunjangan (Jabatan, Transport, Makan, dll)</li>
                        <li>Potongan BPJS Kesehatan (1%)</li>
                        <li>Potongan BPJS JHT (2%)</li>
                        <li>Potongan BPJS JP (1%)</li>
                        <li>Potongan PPh 21 (sesuai tarif progresif)</li>
                      </ul>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleGeneratePayroll} disabled={createPayroll.isPending}>
                      {createPayroll.isPending ? "Memproses..." : "Generate"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead className="text-right">Gaji Pokok</TableHead>
                  <TableHead className="text-right">Tunjangan</TableHead>
                  <TableHead className="text-right">Potongan</TableHead>
                  <TableHead className="text-right">Gaji Bersih</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payroll?.map((p) => {
                  const totalAllowances = p.allowances 
                    ? Object.values(p.allowances as Record<string, number>).reduce((a, b) => a + b, 0) 
                    : 0;
                  const totalDeductions = p.deductions 
                    ? Object.values(p.deductions as Record<string, number>).reduce((a, b) => a + b, 0) 
                    : 0;
                  
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">
                        {(p.employees as any)?.employee_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {(p.employees as any)?.full_name}
                      </TableCell>
                      <TableCell>
                        {(p.employees as any)?.departments?.name || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(p.basic_salary)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        +{formatCurrency(totalAllowances)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        -{formatCurrency(totalDeductions)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(p.net_salary)}
                      </TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedPayroll(p);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {p.status === "pending" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-blue-600"
                              onClick={() => handleApprove(p)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {p.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePay(p)}
                            >
                              Bayar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {payroll?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Belum ada data payroll untuk periode ini
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Slip Gaji Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Slip Gaji</DialogTitle>
          </DialogHeader>
          {selectedPayroll && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Karyawan</p>
                    <p className="font-medium">{(selectedPayroll.employees as any)?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">NIP</p>
                    <p className="font-medium">{(selectedPayroll.employees as any)?.employee_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Periode</p>
                    <p className="font-medium">
                      {months.find(m => m.value === selectedPayroll.period_month)?.label} {selectedPayroll.period_year}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    {getStatusBadge(selectedPayroll.status)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Pendapatan</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Gaji Pokok</span>
                    <span>{formatCurrency(selectedPayroll.basic_salary)}</span>
                  </div>
                  {selectedPayroll.allowances && Object.entries(selectedPayroll.allowances as Record<string, number>).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-muted-foreground">
                      <span>{key}</span>
                      <span>+{formatCurrency(value)}</span>
                    </div>
                  ))}
                  {selectedPayroll.overtime_amount && selectedPayroll.overtime_amount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Lembur ({selectedPayroll.overtime_hours} jam)</span>
                      <span>+{formatCurrency(selectedPayroll.overtime_amount)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>Total Pendapatan</span>
                  <span>{formatCurrency(selectedPayroll.gross_salary)}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Potongan</h4>
                <div className="space-y-1 text-sm">
                  {selectedPayroll.deductions && Object.entries(selectedPayroll.deductions as Record<string, number>).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-red-600">
                      <span>{key}</span>
                      <span>-{formatCurrency(value)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t text-red-600">
                  <span>Total Potongan</span>
                  <span>-{formatCurrency(
                    selectedPayroll.deductions 
                      ? Object.values(selectedPayroll.deductions as Record<string, number>).reduce((a, b) => a + b, 0) 
                      : 0
                  )}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Gaji Bersih (Take Home Pay)</span>
                <span className="text-primary">{formatCurrency(selectedPayroll.net_salary)}</span>
              </div>

              {selectedPayroll.payment_date && (
                <p className="text-sm text-muted-foreground">
                  Dibayar pada: {format(new Date(selectedPayroll.payment_date), "dd MMMM yyyy", { locale: id })}
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Tutup
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
