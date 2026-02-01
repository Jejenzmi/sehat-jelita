import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useGeneralLedger } from "@/hooks/useAccountingData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { BookText, TrendingUp, TrendingDown } from "lucide-react";

const months = [
  { value: 0, label: "Semua Bulan" },
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

const accountTypeLabels: Record<string, string> = {
  asset: "Aset",
  liability: "Liabilitas",
  equity: "Ekuitas",
  revenue: "Pendapatan",
  expense: "Beban",
};

export function GeneralLedgerTab() {
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: ledger, isLoading } = useGeneralLedger(
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

  // Group by account type
  const groupedLedger = ledger?.reduce((acc, entry) => {
    const type = entry.account?.account_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(entry);
    return acc;
  }, {} as Record<string, typeof ledger>);

  const totalDebit = ledger?.reduce((sum, e) => sum + e.total_debit, 0) || 0;
  const totalCredit = ledger?.reduce((sum, e) => sum + e.total_credit, 0) || 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Debit</p>
                <p className="text-xl font-bold">{formatCurrency(totalDebit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <TrendingDown className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Kredit</p>
                <p className="text-xl font-bold">{formatCurrency(totalCredit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <BookText className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jumlah Akun Aktif</p>
                <p className="text-xl font-bold">{ledger?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookText className="h-5 w-5" />
                Buku Besar (General Ledger)
              </CardTitle>
              <CardDescription>
                Periode: {selectedMonth ? months.find((m) => m.value === selectedMonth)?.label : "Semua Bulan"} {selectedYear}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="w-[150px]">
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
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {groupedLedger &&
                Object.entries(groupedLedger).map(([type, entries]) => (
                  <div key={type} className="space-y-2">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Badge variant="outline">{accountTypeLabels[type] || type}</Badge>
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px]">Kode</TableHead>
                            <TableHead>Nama Akun</TableHead>
                            <TableHead className="text-right w-[150px]">Saldo Awal</TableHead>
                            <TableHead className="text-right w-[150px]">Debit</TableHead>
                            <TableHead className="text-right w-[150px]">Kredit</TableHead>
                            <TableHead className="text-right w-[150px]">Saldo Akhir</TableHead>
                            <TableHead className="text-center w-[80px]">Transaksi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entries?.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-mono">
                                {entry.account?.account_code}
                              </TableCell>
                              <TableCell>{entry.account?.account_name}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(entry.opening_balance)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-blue-600">
                                {entry.total_debit > 0 ? formatCurrency(entry.total_debit) : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-red-600">
                                {entry.total_credit > 0 ? formatCurrency(entry.total_credit) : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                {formatCurrency(entry.closing_balance)}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary">{entry.transaction_count}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          {entries?.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                                Tidak ada transaksi
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}

              {(!ledger || ledger.length === 0) && (
                <div className="text-center text-muted-foreground py-12">
                  Tidak ada data buku besar untuk periode ini
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
