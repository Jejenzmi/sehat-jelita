import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Download, 
  RefreshCw, 
  Building2, 
  Users, 
  Activity, 
  HeartPulse, 
  MapPin, 
  BarChart3,
  Calculator,
  Send
} from "lucide-react";
import { useHospitalProfile, useRL6Indicators, useRLReportSubmissions, useCalculateRL6 } from "@/hooks/useRLReports";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
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

export default function RLReportsDashboard() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState("overview");

  const { data: hospitalProfile } = useHospitalProfile();
  const { data: rl6Indicators, isLoading: loadingRL6 } = useRL6Indicators(selectedYear);
  const { data: submissions } = useRLReportSubmissions(selectedYear);
  const calculateRL6 = useCalculateRL6();

  const handleCalculateRL6 = () => {
    calculateRL6.mutate({ month: selectedMonth, year: selectedYear });
  };

  const getSubmissionStatus = (reportType: string) => {
    const submission = submissions?.find(
      s => s.report_type === reportType && 
      s.report_period_month === selectedMonth && 
      s.report_period_year === selectedYear
    );
    return submission?.status || "belum";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Terkirim</Badge>;
      case "verified":
        return <Badge className="bg-green-100 text-green-800">Terverifikasi</Badge>;
      case "rejected":
        return <Badge variant="destructive">Ditolak</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">Belum Dibuat</Badge>;
    }
  };

  const reportTypes = [
    { code: "RL1", name: "Data Dasar RS", icon: Building2, description: "Profil dan data dasar rumah sakit" },
    { code: "RL2", name: "Data Ketenagaan", icon: Users, description: "Data SDM dan ketenagaan" },
    { code: "RL3", name: "Data Pelayanan", icon: Activity, description: "Statistik rawat jalan & rawat inap" },
    { code: "RL4", name: "Morbiditas & Mortalitas", icon: HeartPulse, description: "10 besar penyakit dan penyebab kematian" },
    { code: "RL5", name: "Data Pengunjung", icon: MapPin, description: "Asal daerah pengunjung" },
    { code: "RL6", name: "Indikator RS", icon: BarChart3, description: "BOR, LOS, TOI, BTO, NDR, GDR" },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Period Selection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Pelaporan Kemenkes RI</h2>
          <p className="text-sm text-muted-foreground">
            Laporan Rumah Sakit (RL 1-6) sesuai Permenkes
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Bulan" />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="rl6">RL6 Indikator</TabsTrigger>
          <TabsTrigger value="history">Riwayat Pengiriman</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Hospital Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Profil Rumah Sakit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hospitalProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nama RS</p>
                    <p className="font-medium">{hospitalProfile.hospital_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kode RS</p>
                    <p className="font-medium">{hospitalProfile.hospital_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipe</p>
                    <p className="font-medium">Tipe {hospitalProfile.hospital_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Akreditasi</p>
                    <p className="font-medium">{hospitalProfile.accreditation_status || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Jumlah TT</p>
                    <p className="font-medium">{hospitalProfile.bed_count_total} Tempat Tidur</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RS Pendidikan</p>
                    <p className="font-medium">{hospitalProfile.is_teaching_hospital ? "Ya" : "Tidak"}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Profil rumah sakit belum dikonfigurasi. Silakan lengkapi data di menu Pengaturan.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Report Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <Card key={report.code} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <report.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{report.code}</CardTitle>
                    </div>
                    {getStatusBadge(getSubmissionStatus(report.code))}
                  </div>
                  <CardDescription>{report.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="h-4 w-4 mr-1" />
                      Generate
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* RL6 Indicators Tab */}
        <TabsContent value="rl6" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Indikator Kinerja Rumah Sakit</h3>
              <p className="text-sm text-muted-foreground">
                Periode: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
              </p>
            </div>
            <Button onClick={handleCalculateRL6} disabled={calculateRL6.isPending}>
              <Calculator className="h-4 w-4 mr-2" />
              {calculateRL6.isPending ? "Menghitung..." : "Hitung Ulang"}
            </Button>
          </div>

          {/* Indicator Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "BOR", value: rl6Indicators?.[0]?.bor, unit: "%", target: "60-85%", desc: "Bed Occupancy Rate" },
              { label: "ALOS", value: rl6Indicators?.[0]?.alos, unit: " hari", target: "3-6 hari", desc: "Average Length of Stay" },
              { label: "TOI", value: rl6Indicators?.[0]?.toi, unit: " hari", target: "1-3 hari", desc: "Turn Over Interval" },
              { label: "BTO", value: rl6Indicators?.[0]?.bto, unit: "x", target: ">50x/thn", desc: "Bed Turn Over" },
              { label: "NDR", value: rl6Indicators?.[0]?.ndr, unit: "%", target: "<2.5%", desc: "Net Death Rate" },
              { label: "GDR", value: rl6Indicators?.[0]?.gdr, unit: "%", target: "<4.5%", desc: "Gross Death Rate" },
            ].map((indicator) => (
              <Card key={indicator.label}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {indicator.value !== undefined && indicator.value !== null 
                        ? `${Number(indicator.value).toFixed(1)}${indicator.unit}` 
                        : "-"}
                    </p>
                    <p className="font-medium">{indicator.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{indicator.desc}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      Target: {indicator.target}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Monthly Trend Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tren Indikator Bulanan {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRL6 ? (
                <p className="text-center py-8 text-muted-foreground">Memuat data...</p>
              ) : rl6Indicators && rl6Indicators.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bulan</TableHead>
                      <TableHead className="text-right">TT</TableHead>
                      <TableHead className="text-right">BOR (%)</TableHead>
                      <TableHead className="text-right">ALOS (hari)</TableHead>
                      <TableHead className="text-right">TOI (hari)</TableHead>
                      <TableHead className="text-right">BTO (x)</TableHead>
                      <TableHead className="text-right">NDR (%)</TableHead>
                      <TableHead className="text-right">GDR (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rl6Indicators.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{months.find(m => m.value === row.period_month)?.label}</TableCell>
                        <TableCell className="text-right">{row.total_beds}</TableCell>
                        <TableCell className="text-right">{Number(row.bor).toFixed(1)}</TableCell>
                        <TableCell className="text-right">{Number(row.alos).toFixed(1)}</TableCell>
                        <TableCell className="text-right">{Number(row.toi).toFixed(1)}</TableCell>
                        <TableCell className="text-right">{Number(row.bto).toFixed(1)}</TableCell>
                        <TableCell className="text-right">{Number(row.ndr).toFixed(2)}</TableCell>
                        <TableCell className="text-right">{Number(row.gdr).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Belum ada data indikator untuk tahun {selectedYear}. Klik "Hitung Ulang" untuk generate.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submission History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Riwayat Pengiriman Laporan</CardTitle>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {submissions && submissions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipe Laporan</TableHead>
                      <TableHead>Periode</TableHead>
                      <TableHead>Tanggal Kirim</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Diverifikasi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">{sub.report_type}</TableCell>
                        <TableCell>
                          {sub.report_period_month 
                            ? `${months.find(m => m.value === sub.report_period_month)?.label} ${sub.report_period_year}`
                            : sub.report_period_year
                          }
                        </TableCell>
                        <TableCell>
                          {sub.submission_date 
                            ? new Date(sub.submission_date).toLocaleDateString("id-ID")
                            : "-"
                          }
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status || "draft")}</TableCell>
                        <TableCell>
                          {sub.verification_date 
                            ? new Date(sub.verification_date).toLocaleDateString("id-ID")
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-muted-foreground">
                  Belum ada riwayat pengiriman laporan.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
