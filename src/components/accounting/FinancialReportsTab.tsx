import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  useIncomeStatement,
  useBalanceSheet,
  useCashFlowStatement,
} from "@/hooks/useAccountingData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  Banknote,
  Download,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const months = [
  { value: 0, label: "Tahunan" },
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

export function FinancialReportsTab() {
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [balanceSheetDate, setBalanceSheetDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: incomeStatement, isLoading: incomeLoading } = useIncomeStatement(
    selectedYear,
    selectedMonth || undefined
  );
  const { data: balanceSheet, isLoading: balanceLoading } = useBalanceSheet(balanceSheetDate);
  const { data: cashFlow, isLoading: cashFlowLoading } = useCashFlowStatement(
    selectedYear,
    selectedMonth || undefined
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Tabs defaultValue="income" className="space-y-4">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="income" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Laba Rugi
          </TabsTrigger>
          <TabsTrigger value="balance" className="gap-2">
            <Scale className="h-4 w-4" />
            Neraca
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="gap-2">
            <Banknote className="h-4 w-4" />
            Arus Kas
          </TabsTrigger>
        </TabsList>
      </div>

      {/* LAPORAN LABA RUGI */}
      <TabsContent value="income">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Laporan Laba Rugi (Income Statement)
                </CardTitle>
                <CardDescription>
                  Periode: {selectedMonth ? months.find((m) => m.value === selectedMonth)?.label : "Tahun"} {selectedYear}
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {incomeLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <div className="space-y-6">
                {/* Pendapatan */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">PENDAPATAN</h3>
                  <Table>
                    <TableBody>
                      {incomeStatement?.revenue.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono w-[100px]">{item.account_code}</TableCell>
                          <TableCell>{item.account_name}</TableCell>
                          <TableCell className="text-right font-mono w-[180px]">
                            {formatCurrency(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-primary/5">
                        <TableCell colSpan={2}>Total Pendapatan</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(incomeStatement?.totalRevenue || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Beban */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-destructive">BEBAN</h3>
                  <Table>
                    <TableBody>
                      {incomeStatement?.expenses.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono w-[100px]">{item.account_code}</TableCell>
                          <TableCell>{item.account_name}</TableCell>
                          <TableCell className="text-right font-mono w-[180px]">
                            ({formatCurrency(item.amount)})
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-destructive/5">
                        <TableCell colSpan={2}>Total Beban</TableCell>
                        <TableCell className="text-right font-mono">
                          ({formatCurrency(incomeStatement?.totalExpense || 0)})
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Laba/Rugi Bersih */}
                <div className={`p-4 rounded-lg ${(incomeStatement?.netIncome || 0) >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(incomeStatement?.netIncome || 0) >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-600" />
                      )}
                      <span className="font-semibold text-lg">
                        {(incomeStatement?.netIncome || 0) >= 0 ? "LABA BERSIH" : "RUGI BERSIH"}
                      </span>
                    </div>
                    <span className={`text-2xl font-bold ${(incomeStatement?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(incomeStatement?.netIncome || 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* NERACA */}
      <TabsContent value="balance">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Neraca (Balance Sheet)
                </CardTitle>
                <CardDescription>
                  Per tanggal: {format(new Date(balanceSheetDate), "dd MMMM yyyy", { locale: id })}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={balanceSheetDate}
                  onChange={(e) => setBalanceSheetDate(e.target.value)}
                  className="w-auto"
                />
                {balanceSheet && (
                  <Badge variant={balanceSheet.isBalanced ? "default" : "destructive"} className="gap-1">
                    {balanceSheet.isBalanced ? (
                      <>
                        <CheckCircle className="h-3 w-3" /> Balance
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3" /> Tidak Balance
                      </>
                    )}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Aset */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">ASET</h3>
                  <Table>
                    <TableBody>
                      {balanceSheet?.assets.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono w-[80px]">{item.account_code}</TableCell>
                          <TableCell>{item.account_name}</TableCell>
                          <TableCell className="text-right font-mono w-[140px]">
                            {formatCurrency(item.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-primary/5">
                        <TableCell colSpan={2}>Total Aset</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(balanceSheet?.totalAssets || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Liabilitas & Ekuitas */}
                <div className="space-y-6">
                  {/* Liabilitas */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-destructive">LIABILITAS</h3>
                    <Table>
                      <TableBody>
                        {balanceSheet?.liabilities.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono w-[80px]">{item.account_code}</TableCell>
                            <TableCell>{item.account_name}</TableCell>
                            <TableCell className="text-right font-mono w-[140px]">
                              {formatCurrency(item.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold bg-destructive/5">
                          <TableCell colSpan={2}>Total Liabilitas</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(balanceSheet?.totalLiabilities || 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Ekuitas */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-purple-600">EKUITAS</h3>
                    <Table>
                      <TableBody>
                        {balanceSheet?.equity.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-mono w-[80px]">{item.account_code}</TableCell>
                            <TableCell>{item.account_name}</TableCell>
                            <TableCell className="text-right font-mono w-[140px]">
                              {formatCurrency(item.balance)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="font-semibold bg-purple-50 dark:bg-purple-950">
                          <TableCell colSpan={2}>Total Ekuitas</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(balanceSheet?.totalEquity || 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total Liabilitas + Ekuitas */}
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="flex justify-between font-semibold">
                      <span>Total Liabilitas + Ekuitas</span>
                      <span className="font-mono">
                        {formatCurrency((balanceSheet?.totalLiabilities || 0) + (balanceSheet?.totalEquity || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* LAPORAN ARUS KAS */}
      <TabsContent value="cashflow">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Laporan Arus Kas (Cash Flow Statement)
                </CardTitle>
                <CardDescription>
                  Periode: {selectedMonth ? months.find((m) => m.value === selectedMonth)?.label : "Tahun"} {selectedYear}
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
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {cashFlowLoading ? (
              <Skeleton className="h-[400px] w-full" />
            ) : (
              <div className="space-y-6">
                {/* Aktivitas Operasi */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-primary">
                    ARUS KAS DARI AKTIVITAS OPERASI
                  </h3>
                  <Table>
                    <TableBody>
                      {cashFlow?.operating.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className={`text-right font-mono w-[180px] ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.amount >= 0 ? formatCurrency(item.amount) : `(${formatCurrency(Math.abs(item.amount))})`}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold bg-primary/5">
                        <TableCell>Arus Kas Bersih dari Aktivitas Operasi</TableCell>
                        <TableCell className={`text-right font-mono ${(cashFlow?.totalOperating || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cashFlow?.totalOperating || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Aktivitas Investasi */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-orange-600">
                    ARUS KAS DARI AKTIVITAS INVESTASI
                  </h3>
                  <Table>
                    <TableBody>
                      {cashFlow?.investing.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-muted-foreground text-center">
                            Tidak ada transaksi investasi
                          </TableCell>
                        </TableRow>
                      ) : (
                        cashFlow?.investing.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className={`text-right font-mono w-[180px] ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.amount >= 0 ? formatCurrency(item.amount) : `(${formatCurrency(Math.abs(item.amount))})`}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="font-semibold bg-orange-50 dark:bg-orange-950">
                        <TableCell>Arus Kas Bersih dari Aktivitas Investasi</TableCell>
                        <TableCell className={`text-right font-mono ${(cashFlow?.totalInvesting || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cashFlow?.totalInvesting || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Aktivitas Pendanaan */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-purple-600">
                    ARUS KAS DARI AKTIVITAS PENDANAAN
                  </h3>
                  <Table>
                    <TableBody>
                      {cashFlow?.financing.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-muted-foreground text-center">
                            Tidak ada transaksi pendanaan
                          </TableCell>
                        </TableRow>
                      ) : (
                        cashFlow?.financing.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className={`text-right font-mono w-[180px] ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.amount >= 0 ? formatCurrency(item.amount) : `(${formatCurrency(Math.abs(item.amount))})`}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="font-semibold bg-purple-50 dark:bg-purple-950">
                        <TableCell>Arus Kas Bersih dari Aktivitas Pendanaan</TableCell>
                        <TableCell className={`text-right font-mono ${(cashFlow?.totalFinancing || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(cashFlow?.totalFinancing || 0)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Total Arus Kas Bersih */}
                <div className={`p-4 rounded-lg ${(cashFlow?.netCashFlow || 0) >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-6 w-6" />
                      <span className="font-semibold text-lg">KENAIKAN (PENURUNAN) BERSIH KAS</span>
                    </div>
                    <span className={`text-2xl font-bold ${(cashFlow?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(cashFlow?.netCashFlow || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
