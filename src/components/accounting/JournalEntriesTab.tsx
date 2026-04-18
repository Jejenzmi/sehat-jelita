import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  useJournalEntries,
  useJournalEntryWithLines,
  useCreateJournalEntry,
  usePostJournal,
  useVoidJournal,
  useChartOfAccounts,
  JournalEntry,
  JournalEntryLine,
} from "@/hooks/useAccountingData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  BookOpen,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
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

interface JournalLineInput {
  account_id: string;
  account_code?: string;
  account_name?: string;
  description: string;
  debit_amount: number;
  credit_amount: number;
}

export function JournalEntriesTab() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [voidReason, setVoidReason] = useState("");

  // Form state for new journal
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");
  const [journalLines, setJournalLines] = useState<JournalLineInput[]>([
    { account_id: "", description: "", debit_amount: 0, credit_amount: 0 },
    { account_id: "", description: "", debit_amount: 0, credit_amount: 0 },
  ]);

  const { data: journals, isLoading } = useJournalEntries(selectedMonth, selectedYear);
  const { data: accounts } = useChartOfAccounts();
  const { data: journalDetail } = useJournalEntryWithLines(selectedJournal?.id || "");
  const createJournal = useCreateJournalEntry();
  const postJournal = usePostJournal();
  const voidJournal = useVoidJournal();

  const transactionAccounts = accounts?.filter((a) => !a.is_header && a.is_active) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted":
        return <Badge className="bg-green-500">Posted</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "voided":
        return <Badge variant="destructive">Void</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalDebit = journalLines.reduce((sum, l) => sum + (l.debit_amount || 0), 0);
  const totalCredit = journalLines.reduce((sum, l) => sum + (l.credit_amount || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const addLine = () => {
    setJournalLines([
      ...journalLines,
      { account_id: "", description: "", debit_amount: 0, credit_amount: 0 },
    ]);
  };

  const removeLine = (index: number) => {
    if (journalLines.length > 2) {
      setJournalLines(journalLines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, field: keyof JournalLineInput, value: string | number) => {
    const newLines = [...journalLines];
    if (field === "account_id") {
      const account = transactionAccounts.find((a) => a.id === value);
      newLines[index] = {
        ...newLines[index],
        account_id: value as string,
        account_code: account?.account_code,
        account_name: account?.account_name,
      };
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    setJournalLines(newLines);
  };

  const handleCreateJournal = () => {
    if (!description.trim()) {
      return;
    }

    if (!isBalanced) {
      return;
    }

    const validLines = journalLines.filter(
      (l) => l.account_id && (l.debit_amount > 0 || l.credit_amount > 0)
    );

    if (validLines.length < 2) {
      return;
    }

    createJournal.mutate(
      {
        entry: {
          entry_date: entryDate,
          description: description,
          status: "DRAFT",
        },
        lines: validLines.map((l, idx) => ({
          account_id: l.account_id,
          description: l.description,
          debit_amount: l.debit_amount || 0,
          credit_amount: l.credit_amount || 0,
          line_number: idx + 1,
        })),
      },
      {
        onSuccess: () => {
          setIsAddOpen(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setEntryDate(format(new Date(), "yyyy-MM-dd"));
    setDescription("");
    setJournalLines([
      { account_id: "", description: "", debit_amount: 0, credit_amount: 0 },
      { account_id: "", description: "", debit_amount: 0, credit_amount: 0 },
    ]);
  };

  const handlePost = (journal: JournalEntry) => {
    postJournal.mutate(journal.id);
  };

  const handleVoid = () => {
    if (selectedJournal && voidReason) {
      voidJournal.mutate(
        { id: selectedJournal.id, reason: voidReason },
        {
          onSuccess: () => {
            setIsVoidOpen(false);
            setSelectedJournal(null);
            setVoidReason("");
          },
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Jurnal Umum (General Journal)
              </CardTitle>
              <CardDescription>
                Periode: {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
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
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Jurnal Baru
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Buat Jurnal Baru</DialogTitle>
                    <DialogDescription>
                      Pastikan total debit sama dengan total kredit
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tanggal *</Label>
                          <Input
                            type="date"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan *</Label>
                          <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Deskripsi transaksi"
                          />
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Detail Jurnal</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addLine}>
                            <Plus className="h-4 w-4 mr-1" />
                            Tambah Baris
                          </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[250px]">Akun</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="w-[150px] text-right">Debit</TableHead>
                                <TableHead className="w-[150px] text-right">Kredit</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {journalLines.map((line, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <Select
                                      value={line.account_id}
                                      onValueChange={(v) => updateLine(idx, "account_id", v)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih akun" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {transactionAccounts.map((acc) => (
                                          <SelectItem key={acc.id} value={acc.id}>
                                            {acc.account_code} - {acc.account_name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={line.description}
                                      onChange={(e) =>
                                        updateLine(idx, "description", e.target.value)
                                      }
                                      placeholder="Keterangan"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={line.debit_amount || ""}
                                      onChange={(e) =>
                                        updateLine(idx, "debit_amount", parseFloat(e.target.value) || 0)
                                      }
                                      className="text-right"
                                      disabled={line.credit_amount > 0}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={line.credit_amount || ""}
                                      onChange={(e) =>
                                        updateLine(idx, "credit_amount", parseFloat(e.target.value) || 0)
                                      }
                                      className="text-right"
                                      disabled={line.debit_amount > 0}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeLine(idx)}
                                      disabled={journalLines.length <= 2}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-muted/50 font-semibold">
                                <TableCell colSpan={2} className="text-right">
                                  Total
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        {!isBalanced && totalDebit > 0 && (
                          <div className="flex items-center gap-2 text-destructive text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Jurnal tidak seimbang! Selisih: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                      Batal
                    </Button>
                    <Button
                      onClick={handleCreateJournal}
                      disabled={!isBalanced || !description || createJournal.isPending}
                    >
                      {createJournal.isPending ? "Menyimpan..." : "Simpan Draft"}
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
                  <TableHead>No. Jurnal</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals?.map((journal) => (
                  <TableRow key={journal.id}>
                    <TableCell className="font-mono">{journal.journal_number}</TableCell>
                    <TableCell>
                      {format(new Date(journal.entry_date), "dd MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{journal.description}</TableCell>
                    <TableCell>
                      {journal.reference_type && (
                        <Badge variant="outline">
                          {journal.reference_type}: {journal.reference_number || "-"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(journal.total_debit)}
                    </TableCell>
                    <TableCell>{getStatusBadge(journal.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setSelectedJournal(journal);
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {journal.status === "DRAFT" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-green-600"
                            onClick={() => handlePost(journal)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {journal.status === "POSTED" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              setSelectedJournal(journal);
                              setIsVoidOpen(true);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {journals?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Tidak ada jurnal untuk periode ini
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Journal Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Jurnal - {selectedJournal?.journal_number}</DialogTitle>
          </DialogHeader>
          {journalDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tanggal:</span>{" "}
                  {format(new Date(journalDetail.entry_date), "dd MMMM yyyy", { locale: id })}
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  {getStatusBadge(journalDetail.status)}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Keterangan:</span> {journalDetail.description}
              </div>

              <Separator />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Akun</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Kredit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalDetail.lines?.map((line: any) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono">
                        {line.chart_of_accounts?.account_code}
                      </TableCell>
                      <TableCell>{line.chart_of_accounts?.account_name}</TableCell>
                      <TableCell className="text-right">
                        {line.debit_amount > 0 ? formatCurrency(line.debit_amount) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.credit_amount > 0 ? formatCurrency(line.credit_amount) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell colSpan={2} className="text-right">
                      Total
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(journalDetail.total_debit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(journalDetail.total_credit)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Void Journal Dialog */}
      <Dialog open={isVoidOpen} onOpenChange={setIsVoidOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Jurnal</DialogTitle>
            <DialogDescription>
              Jurnal yang dibatalkan tidak dapat dikembalikan. Masukkan alasan pembatalan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alasan Pembatalan *</Label>
              <Textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Masukkan alasan pembatalan..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVoidOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={!voidReason || voidJournal.isPending}
            >
              {voidJournal.isPending ? "Memproses..." : "Batalkan Jurnal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
