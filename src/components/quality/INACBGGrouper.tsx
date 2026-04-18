import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Search, Plus, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };
async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
import { format } from "date-fns";

interface ICD10Code {
  id: string;
  code: string;
  description_id: string;
}

interface DRGCode {
  id: string;
  drg_code: string;
  drg_name: string;
  severity_level: number;
  national_tariff: number;
}

interface CalculationResult {
  drg_code: string;
  drg_description: string;
  severity_level: number;
  base_tariff: number;
  adjustment_factor: number;
  final_tariff: number;
  los_grouper: number;
}

interface CalculationHistory {
  id: string;
  drg_code: string;
  drg_description: string;
  primary_diagnosis: string;
  final_tariff: number;
  hospital_cost: number;
  variance: number;
  calculated_at: string;
}

export default function INACBGGrouper() {
  const { toast } = useToast();
  const [icd10Codes, setIcd10Codes] = useState<ICD10Code[]>([]);
  const [drgCodes, setDrgCodes] = useState<DRGCode[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Form state
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState("");
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState<string[]>([]);
  const [procedures, setProcedures] = useState<string[]>([]);
  const [hospitalClass, setHospitalClass] = useState("A");
  const [regionalCode, setRegionalCode] = useState("1");
  const [los, setLos] = useState("");
  const [hospitalCost, setHospitalCost] = useState("");
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ICD10Code[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchType, setSearchType] = useState<"primary" | "secondary" | "procedure">("primary");
  
  // Result state
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [icdCodes, drgCodes, history] = await Promise.all([
        apiFetch<ICD10Code[]>('/icd11/codes?limit=100').catch(() => [] as ICD10Code[]),
        apiFetch<DRGCode[]>('/eklaim/drg-codes?limit=100').catch(() => [] as DRGCode[]),
        apiFetch<CalculationHistory[]>('/eklaim/inacbg-calculations?limit=20').catch(() => [] as CalculationHistory[]),
      ]);
      setIcd10Codes(icdCodes);
      setDrgCodes(drgCodes);
      setCalculationHistory(history);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const results = await apiFetch<ICD10Code[]>(`/icd11/codes?search=${encodeURIComponent(query)}&limit=10`).catch(() => []);
    setSearchResults(results);
  };

  const selectDiagnosis = (code: ICD10Code) => {
    if (searchType === "primary") {
      setPrimaryDiagnosis(code.code);
    } else if (searchType === "secondary") {
      if (!secondaryDiagnoses.includes(code.code)) {
        setSecondaryDiagnoses([...secondaryDiagnoses, code.code]);
      }
    } else {
      if (!procedures.includes(code.code)) {
        setProcedures([...procedures, code.code]);
      }
    }
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeDiagnosis = (code: string, type: "secondary" | "procedure") => {
    if (type === "secondary") {
      setSecondaryDiagnoses(secondaryDiagnoses.filter(d => d !== code));
    } else {
      setProcedures(procedures.filter(p => p !== code));
    }
  };

  const calculateGrouper = async () => {
    if (!primaryDiagnosis) {
      toast({ title: "Error", description: "Diagnosis utama wajib diisi", variant: "destructive" });
      return;
    }

    setIsCalculating(true);
    try {
      // Find matching DRG based on primary diagnosis via eklaim grouper
      const groupResult = await apiFetch<{ drg: DRGCode | null; tariff: number }>(
        `/eklaim/group?icd=${encodeURIComponent(primaryDiagnosis)}&hospital_class=${hospitalClass}&regional=${regionalCode}`
      ).catch(() => ({ drg: null, tariff: 5000000 }));

      let drg: DRGCode = groupResult.drg || {
        id: "", drg_code: "UNKNOWN", drg_name: "Tidak ditemukan", severity_level: 1, national_tariff: 5000000
      };
      if (!groupResult.drg) {
        toast({ title: "Info", description: "Menggunakan tarif default", variant: "default" });
      }

      let baseTariff = groupResult.tariff || drg.national_tariff || 5000000;
      
      // Calculate severity adjustment
      let adjustmentFactor = 1.0;
      if (secondaryDiagnoses.length > 2) adjustmentFactor = 1.15;
      else if (secondaryDiagnoses.length > 0) adjustmentFactor = 1.08;
      if (procedures.length > 0) adjustmentFactor *= 1.1;

      const finalTariff = baseTariff * adjustmentFactor;
      const costNum = parseFloat(hospitalCost) || 0;
      const variance = finalTariff - costNum;

      const result: CalculationResult = {
        drg_code: drg.drg_code,
        drg_description: drg.drg_name,
        severity_level: drg.severity_level || 1,
        base_tariff: baseTariff,
        adjustment_factor: adjustmentFactor,
        final_tariff: finalTariff,
        los_grouper: parseInt(los) || 3
      };

      setCalculationResult(result);
      setShowResultDialog(true);

      // Save calculation to history
      await apiPost('/eklaim/inacbg-calculations', {
        drg_code: drg.drg_code,
        drg_description: drg.drg_name,
        severity_level: drg.severity_level || 1,
        los_actual: parseInt(los) || null,
        los_grouper: 3,
        primary_diagnosis: primaryDiagnosis,
        secondary_diagnoses: secondaryDiagnoses,
        procedures,
        base_tariff: baseTariff,
        adjustment_factor: adjustmentFactor,
        final_tariff: finalTariff,
        hospital_cost: costNum || null,
        variance,
      }).catch(() => null);

      fetchData();
      toast({ title: "Berhasil", description: "Kalkulasi INA-CBG selesai" });

    } catch (error) {
      console.error("Error calculating:", error);
      toast({ title: "Error", description: "Gagal melakukan kalkulasi", variant: "destructive" });
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calculator className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{calculationHistory.length}</p>
                <p className="text-sm text-muted-foreground">Kalkulasi Hari Ini</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">
                  {calculationHistory.filter(c => (c.variance || 0) > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Surplus Tarif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">
                  {calculationHistory.filter(c => (c.variance || 0) < 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Defisit Tarif</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="h-8 w-8 flex items-center justify-center text-lg">A</Badge>
              <div>
                <p className="text-2xl font-bold">INA-CBG 6.0</p>
                <p className="text-sm text-muted-foreground">Versi Grouper</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grouper Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              INA-CBG Grouper
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hospital Class & Regional */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kelas Rumah Sakit</Label>
                <Select value={hospitalClass} onValueChange={setHospitalClass}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Kelas A</SelectItem>
                    <SelectItem value="B">Kelas B</SelectItem>
                    <SelectItem value="C">Kelas C</SelectItem>
                    <SelectItem value="D">Kelas D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Regional</Label>
                <Select value={regionalCode} onValueChange={setRegionalCode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Regional 1 (Jakarta)</SelectItem>
                    <SelectItem value="2">Regional 2 (Jawa Barat)</SelectItem>
                    <SelectItem value="3">Regional 3 (Jawa Tengah)</SelectItem>
                    <SelectItem value="4">Regional 4 (Jawa Timur)</SelectItem>
                    <SelectItem value="5">Regional 5 (Luar Jawa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Primary Diagnosis */}
            <div className="space-y-2">
              <Label>Diagnosis Utama (ICD-10) *</Label>
              <div className="flex gap-2">
                <Input 
                  value={primaryDiagnosis} 
                  onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                  placeholder="Masukkan kode ICD-10"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => { setSearchType("primary"); setShowSearch(true); }}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Secondary Diagnoses */}
            <div className="space-y-2">
              <Label>Diagnosis Sekunder</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setSearchType("secondary"); setShowSearch(true); }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Tambah
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {secondaryDiagnoses.map(code => (
                  <Badge key={code} variant="secondary" className="flex items-center gap-1">
                    {code}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeDiagnosis(code, "secondary")} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Procedures */}
            <div className="space-y-2">
              <Label>Prosedur (ICD-9-CM)</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setSearchType("procedure"); setShowSearch(true); }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Tambah
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {procedures.map(code => (
                  <Badge key={code} variant="outline" className="flex items-center gap-1">
                    {code}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeDiagnosis(code, "procedure")} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* LOS & Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Length of Stay (hari)</Label>
                <Input 
                  type="number" 
                  value={los} 
                  onChange={(e) => setLos(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Biaya RS Aktual (Rp)</Label>
                <Input 
                  type="number" 
                  value={hospitalCost} 
                  onChange={(e) => setHospitalCost(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={calculateGrouper}
              disabled={isCalculating || !primaryDiagnosis}
            >
              {isCalculating ? "Menghitung..." : "Hitung Tarif INA-CBG"}
            </Button>
          </CardContent>
        </Card>

        {/* Calculation History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Kalkulasi</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DRG</TableHead>
                    <TableHead>Tarif</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculationHistory.map((calc) => (
                    <TableRow key={calc.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{calc.drg_code}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {calc.drg_description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(calc.final_tariff || 0)}
                      </TableCell>
                      <TableCell>
                        {calc.variance !== null && calc.variance !== undefined ? (
                          <div className="flex items-center gap-1">
                            {calc.variance > 0 ? (
                              <TrendingUp className="h-4 w-4 text-success" />
                            ) : calc.variance < 0 ? (
                              <TrendingDown className="h-4 w-4 text-destructive" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={calc.variance > 0 ? "text-success" : calc.variance < 0 ? "text-destructive" : ""}>
                              {formatCurrency(Math.abs(calc.variance))}
                            </span>
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(calc.calculated_at), "dd/MM HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Search Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cari {searchType === "primary" ? "Diagnosis Utama" : searchType === "secondary" ? "Diagnosis Sekunder" : "Prosedur"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Ketik kode atau deskripsi..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <ScrollArea className="h-[300px]">
              {searchResults.map(code => (
                <div 
                  key={code.id}
                  className="p-3 hover:bg-muted cursor-pointer rounded-lg"
                  onClick={() => selectDiagnosis({ ...code, description: code.description_id } as any)}
                >
                  <p className="font-medium">{code.code}</p>
                  <p className="text-sm text-muted-foreground">{code.description_id}</p>
                </div>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Tidak ditemukan</p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hasil Kalkulasi INA-CBG</DialogTitle>
          </DialogHeader>
          {calculationResult && (
            <div className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Kode DRG</p>
                <p className="text-3xl font-bold text-primary">{calculationResult.drg_code}</p>
                <p className="text-sm">{calculationResult.drg_description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Severity Level</p>
                  <p className="text-lg font-bold">{calculationResult.severity_level}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">LOS Grouper</p>
                  <p className="text-lg font-bold">{calculationResult.los_grouper} hari</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarif Dasar</span>
                  <span>{formatCurrency(calculationResult.base_tariff)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Faktor Penyesuaian</span>
                  <span>×{calculationResult.adjustment_factor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Tarif Final</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(calculationResult.final_tariff)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
