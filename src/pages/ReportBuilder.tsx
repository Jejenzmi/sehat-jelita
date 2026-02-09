import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Eye,
  Save,
  FileDown,
  FileSpreadsheet,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  Table as TableIcon,
  GripVertical,
  Settings2,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";

// Available data sources
const dataSources = [
  { value: "visits", label: "Kunjungan Pasien" },
  { value: "billing", label: "Billing / Tagihan" },
  { value: "pharmacy", label: "Farmasi" },
  { value: "lab", label: "Laboratorium" },
  { value: "radiology", label: "Radiologi" },
  { value: "inpatient", label: "Rawat Inap" },
  { value: "igd", label: "IGD" },
  { value: "employees", label: "SDM / Pegawai" },
  { value: "inventory", label: "Inventory" },
  { value: "bpjs", label: "BPJS Claims" },
];

// Available columns per data source
const sourceColumns: Record<string, { value: string; label: string; type: string }[]> = {
  visits: [
    { value: "visit_date", label: "Tanggal Kunjungan", type: "date" },
    { value: "patient_name", label: "Nama Pasien", type: "text" },
    { value: "doctor_name", label: "Nama Dokter", type: "text" },
    { value: "department", label: "Departemen", type: "text" },
    { value: "visit_type", label: "Jenis Kunjungan", type: "text" },
    { value: "status", label: "Status", type: "text" },
    { value: "payment_type", label: "Tipe Pembayaran", type: "text" },
    { value: "diagnosis", label: "Diagnosis", type: "text" },
  ],
  billing: [
    { value: "invoice_number", label: "No. Invoice", type: "text" },
    { value: "billing_date", label: "Tanggal Billing", type: "date" },
    { value: "patient_name", label: "Nama Pasien", type: "text" },
    { value: "total", label: "Total", type: "number" },
    { value: "paid_amount", label: "Dibayar", type: "number" },
    { value: "payment_type", label: "Tipe Pembayaran", type: "text" },
    { value: "status", label: "Status", type: "text" },
  ],
  pharmacy: [
    { value: "prescription_date", label: "Tanggal Resep", type: "date" },
    { value: "patient_name", label: "Nama Pasien", type: "text" },
    { value: "medicine_name", label: "Nama Obat", type: "text" },
    { value: "quantity", label: "Jumlah", type: "number" },
    { value: "status", label: "Status", type: "text" },
  ],
  lab: [
    { value: "order_date", label: "Tanggal Order", type: "date" },
    { value: "patient_name", label: "Nama Pasien", type: "text" },
    { value: "test_name", label: "Nama Tes", type: "text" },
    { value: "result", label: "Hasil", type: "text" },
    { value: "status", label: "Status", type: "text" },
  ],
  radiology: [
    { value: "order_date", label: "Tanggal Order", type: "date" },
    { value: "patient_name", label: "Nama Pasien", type: "text" },
    { value: "exam_type", label: "Jenis Pemeriksaan", type: "text" },
    { value: "status", label: "Status", type: "text" },
  ],
  inpatient: [
    { value: "admission_date", label: "Tanggal Masuk", type: "date" },
    { value: "discharge_date", label: "Tanggal Keluar", type: "date" },
    { value: "patient_name", label: "Nama Pasien", type: "text" },
    { value: "room", label: "Ruangan", type: "text" },
    { value: "doctor_name", label: "DPJP", type: "text" },
    { value: "los", label: "Lama Rawat (hari)", type: "number" },
    { value: "status", label: "Status", type: "text" },
  ],
  igd: [
    { value: "arrival_date", label: "Tanggal Datang", type: "date" },
    { value: "patient_name", label: "Nama Pasien", type: "text" },
    { value: "triage_level", label: "Level Triage", type: "text" },
    { value: "disposition", label: "Disposisi", type: "text" },
  ],
  employees: [
    { value: "employee_name", label: "Nama Pegawai", type: "text" },
    { value: "department", label: "Departemen", type: "text" },
    { value: "position", label: "Jabatan", type: "text" },
    { value: "status", label: "Status", type: "text" },
    { value: "join_date", label: "Tanggal Masuk", type: "date" },
  ],
  inventory: [
    { value: "item_name", label: "Nama Barang", type: "text" },
    { value: "category", label: "Kategori", type: "text" },
    { value: "stock", label: "Stok", type: "number" },
    { value: "unit", label: "Satuan", type: "text" },
    { value: "min_stock", label: "Stok Minimum", type: "number" },
    { value: "expiry_date", label: "Tanggal Kadaluarsa", type: "date" },
  ],
  bpjs: [
    { value: "claim_date", label: "Tanggal Klaim", type: "date" },
    { value: "sep_number", label: "No. SEP", type: "text" },
    { value: "patient_name", label: "Nama Pasien", type: "text" },
    { value: "claim_amount", label: "Nilai Klaim", type: "number" },
    { value: "approved_amount", label: "Disetujui", type: "number" },
    { value: "status", label: "Status", type: "text" },
  ],
};

interface ReportColumn {
  id: string;
  sourceColumn: string;
  label: string;
  visible: boolean;
  sortable: boolean;
  aggregation?: "sum" | "count" | "avg" | "min" | "max" | "none";
}

interface ReportFilter {
  id: string;
  column: string;
  operator: "equals" | "contains" | "gt" | "lt" | "between" | "in";
  value: string;
}

// Generate sample data
function generateSampleData(source: string, columns: ReportColumn[]): Record<string, string | number>[] {
  const visibleCols = columns.filter(c => c.visible);
  if (visibleCols.length === 0) return [];
  const rows: Record<string, string | number>[] = [];
  for (let i = 0; i < 8; i++) {
    const row: Record<string, string | number> = {};
    visibleCols.forEach(col => {
      const srcCol = sourceColumns[source]?.find(s => s.value === col.sourceColumn);
      if (srcCol?.type === "number") row[col.sourceColumn] = Math.floor(Math.random() * 1000000) + 10000;
      else if (srcCol?.type === "date") row[col.sourceColumn] = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toLocaleDateString("id-ID");
      else row[col.sourceColumn] = `Sample ${col.label} ${i + 1}`;
    });
    rows.push(row);
  }
  return rows;
}

export default function ReportBuilder() {
  const [reportName, setReportName] = useState("Laporan Baru");
  const [dataSource, setDataSource] = useState("visits");
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [activeTab, setActiveTab] = useState("config");
  const [chartType, setChartType] = useState<"table" | "bar" | "pie" | "line">("table");

  const availableColumns = sourceColumns[dataSource] || [];

  const addColumn = useCallback((sourceColumn: string) => {
    const src = availableColumns.find(c => c.value === sourceColumn);
    if (!src) return;
    if (columns.some(c => c.sourceColumn === sourceColumn)) { toast.error("Kolom sudah ditambahkan"); return; }
    setColumns(prev => [...prev, {
      id: `col_${Date.now()}`,
      sourceColumn,
      label: src.label,
      visible: true,
      sortable: true,
      aggregation: "none",
    }]);
  }, [availableColumns, columns]);

  const removeColumn = (id: string) => setColumns(prev => prev.filter(c => c.id !== id));
  const updateColumn = (id: string, updates: Partial<ReportColumn>) => setColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

  const addFilter = useCallback(() => {
    if (availableColumns.length === 0) return;
    setFilters(prev => [...prev, {
      id: `filter_${Date.now()}`,
      column: availableColumns[0].value,
      operator: "contains",
      value: "",
    }]);
  }, [availableColumns]);

  const removeFilter = (id: string) => setFilters(prev => prev.filter(f => f.id !== id));

  const sampleData = generateSampleData(dataSource, columns);
  const visibleColumns = columns.filter(c => c.visible);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Dynamic Report Builder
          </h1>
          <p className="text-muted-foreground text-sm">Buat laporan custom dengan filtering dinamis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Laporan diekspor ke Excel")}>
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Laporan diekspor ke PDF")}>
            <FileDown className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button size="sm" onClick={() => toast.success("Laporan disimpan!")}>
            <Save className="h-4 w-4 mr-1" /> Simpan
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config">⚙️ Konfigurasi</TabsTrigger>
          <TabsTrigger value="preview">📊 Preview Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Data Source & Available Columns */}
            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Sumber Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Pilih Tabel Data</Label>
                  <Select value={dataSource} onValueChange={v => { setDataSource(v); setColumns([]); setFilters([]); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {dataSources.map(ds => <SelectItem key={ds.value} value={ds.value}>{ds.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Kolom Tersedia</Label>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-1">
                      {availableColumns.map(col => {
                        const isAdded = columns.some(c => c.sourceColumn === col.value);
                        return (
                          <Button key={col.value} variant={isAdded ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-xs" onClick={() => addColumn(col.value)} disabled={isAdded}>
                            <Plus className="h-3 w-3 mr-2" />
                            {col.label}
                            <Badge variant="outline" className="ml-auto text-[9px]">{col.type}</Badge>
                          </Button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>

            {/* Middle: Selected Columns */}
            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TableIcon className="h-4 w-4" /> Kolom Terpilih ({columns.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {columns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                      <TableIcon className="h-8 w-8 mb-2 opacity-30" />
                      <p>Klik kolom di panel kiri</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {columns.map(col => (
                        <div key={col.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                          <div className="flex-1 min-w-0">
                            <Input value={col.label} onChange={e => updateColumn(col.id, { label: e.target.value })} className="h-7 text-xs" />
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch checked={col.visible} onCheckedChange={v => updateColumn(col.id, { visible: v })} />
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeColumn(col.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Right: Filters & Chart */}
            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="h-4 w-4" /> Filter & Visualisasi
                  </CardTitle>
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={addFilter}>
                    <Plus className="h-3 w-3 mr-1" /> Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="space-y-2">
                  {filters.map(filter => (
                    <div key={filter.id} className="flex items-center gap-1">
                      <Select value={filter.column} onValueChange={v => setFilters(prev => prev.map(f => f.id === filter.id ? { ...f, column: v } : f))}>
                        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{availableColumns.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input placeholder="Nilai..." className="h-7 text-xs flex-1" value={filter.value} onChange={e => setFilters(prev => prev.map(f => f.id === filter.id ? { ...f, value: e.target.value } : f))} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFilter(filter.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Nama Laporan</Label>
                  <Input value={reportName} onChange={e => setReportName(e.target.value)} className="text-sm" />
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Tipe Visualisasi</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {([["table", TableIcon, "Tabel"], ["bar", BarChart3, "Bar"], ["pie", PieChart, "Pie"], ["line", TrendingUp, "Line"]] as const).map(([type, Icon, label]) => (
                      <Button key={type} variant={chartType === type ? "default" : "outline"} size="sm" className="flex flex-col items-center gap-1 h-auto py-2" onClick={() => setChartType(type)}>
                        <Icon className="h-4 w-4" />
                        <span className="text-[10px]">{label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button className="w-full" size="sm" onClick={() => { setActiveTab("preview"); toast.success("Laporan di-generate!"); }}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Generate Laporan
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{reportName}</CardTitle>
                  <p className="text-sm text-muted-foreground">Sumber: {dataSources.find(d => d.value === dataSource)?.label} • {sampleData.length} data</p>
                </div>
                <div className="flex items-center gap-2">
                  {([["table", TableIcon], ["bar", BarChart3], ["pie", PieChart], ["line", TrendingUp]] as const).map(([type, Icon]) => (
                    <Button key={type} variant={chartType === type ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setChartType(type)}>
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {visibleColumns.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <TableIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Pilih kolom terlebih dahulu di tab Konfigurasi</p>
                </div>
              ) : chartType === "table" ? (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        {visibleColumns.map(col => (
                          <TableHead key={col.id} className="cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-1">
                              {col.label}
                              <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sampleData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          {visibleColumns.map(col => (
                            <TableCell key={col.id}>
                              {typeof row[col.sourceColumn] === "number"
                                ? (row[col.sourceColumn] as number).toLocaleString("id-ID")
                                : row[col.sourceColumn]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] bg-muted/20 rounded-lg border-2 border-dashed">
                  {chartType === "bar" && <BarChart3 className="h-16 w-16 text-primary/40 mb-4" />}
                  {chartType === "pie" && <PieChart className="h-16 w-16 text-primary/40 mb-4" />}
                  {chartType === "line" && <TrendingUp className="h-16 w-16 text-primary/40 mb-4" />}
                  <p className="text-muted-foreground font-medium">Visualisasi {chartType.toUpperCase()} Chart</p>
                  <p className="text-sm text-muted-foreground mt-1">{visibleColumns.length} kolom • {sampleData.length} baris data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
