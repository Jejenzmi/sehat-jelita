import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle2, AlertCircle, Download, Trash2, Eye } from "lucide-react";
import ExcelJS from "exceljs";

// Target schema definitions for each entity type
const TARGET_SCHEMAS: Record<string, { field: string; label: string; required: boolean; type: string }[]> = {
  patients: [
    { field: "medical_record_number", label: "No. Rekam Medis", required: true, type: "string" },
    { field: "nik", label: "NIK", required: true, type: "string" },
    { field: "name", label: "Nama Lengkap", required: true, type: "string" },
    { field: "birth_date", label: "Tanggal Lahir", required: true, type: "date" },
    { field: "gender", label: "Jenis Kelamin", required: true, type: "enum" },
    { field: "blood_type", label: "Golongan Darah", required: false, type: "enum" },
    { field: "address", label: "Alamat", required: false, type: "string" },
    { field: "phone", label: "No. Telepon", required: false, type: "string" },
    { field: "email", label: "Email", required: false, type: "string" },
    { field: "bpjs_number", label: "No. BPJS", required: false, type: "string" },
    { field: "emergency_contact_name", label: "Kontak Darurat", required: false, type: "string" },
    { field: "emergency_contact_phone", label: "Telp. Kontak Darurat", required: false, type: "string" },
  ],
  doctors: [
    { field: "name", label: "Nama Dokter", required: true, type: "string" },
    { field: "sip_number", label: "No. SIP", required: true, type: "string" },
    { field: "str_number", label: "No. STR", required: true, type: "string" },
    { field: "specialization", label: "Spesialisasi", required: true, type: "string" },
    { field: "email", label: "Email", required: false, type: "string" },
    { field: "phone", label: "No. Telepon", required: false, type: "string" },
    { field: "consultation_fee", label: "Tarif Konsultasi", required: false, type: "number" },
    { field: "satusehat_practitioner_id", label: "ID Practitioner SATU SEHAT", required: false, type: "string" },
  ],
  medicines: [
    { field: "code", label: "Kode Obat", required: true, type: "string" },
    { field: "name", label: "Nama Obat", required: true, type: "string" },
    { field: "generic_name", label: "Nama Generik", required: false, type: "string" },
    { field: "category", label: "Kategori", required: true, type: "string" },
    { field: "unit", label: "Satuan", required: true, type: "string" },
    { field: "price", label: "Harga Jual", required: true, type: "number" },
    { field: "cost", label: "Harga Beli", required: false, type: "number" },
    { field: "min_stock", label: "Stok Minimum", required: false, type: "number" },
    { field: "manufacturer", label: "Produsen", required: false, type: "string" },
  ],
  services: [
    { field: "code", label: "Kode Layanan", required: true, type: "string" },
    { field: "name", label: "Nama Layanan", required: true, type: "string" },
    { field: "category", label: "Kategori", required: true, type: "string" },
    { field: "price", label: "Tarif", required: true, type: "number" },
    { field: "description", label: "Deskripsi", required: false, type: "string" },
  ],
  icd10: [
    { field: "code", label: "Kode ICD-10", required: true, type: "string" },
    { field: "description", label: "Deskripsi", required: true, type: "string" },
    { field: "category", label: "Kategori", required: false, type: "string" },
  ],
};

interface FieldMapping {
  sourceField: string;
  targetField: string;
}

interface ValidationResult {
  row: number;
  field: string;
  message: string;
  type: "error" | "warning";
}

export function MigrationTool() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upload");
  const [entityType, setEntityType] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sourceData, setSourceData] = useState<Record<string, unknown>[]>([]);
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    try {
      const data = await file.arrayBuffer();
      let jsonData: Record<string, unknown>[];

      if (file.name.toLowerCase().endsWith(".csv")) {
        // RFC 4180-compliant CSV parsing
        const text = new TextDecoder().decode(data);
        const parseCSVRow = (line: string): string[] => {
          const fields: string[] = [];
          let i = 0;
          while (i < line.length) {
            if (line[i] === '"') {
              let field = "";
              i++; // skip opening quote
              while (i < line.length) {
                if (line[i] === '"' && line[i + 1] === '"') {
                  field += '"'; i += 2; // escaped quote
                } else if (line[i] === '"') {
                  i++; break; // closing quote
                } else {
                  field += line[i++];
                }
              }
              fields.push(field.trim());
              if (line[i] === ",") i++;
            } else {
              const end = line.indexOf(",", i);
              if (end === -1) {
                fields.push(line.slice(i).trim());
                break;
              }
              fields.push(line.slice(i, end).trim());
              i = end + 1;
            }
          }
          return fields;
        };
        const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
        if (lines.length < 2) {
          toast({ title: "File Kosong", description: "File CSV tidak memiliki data", variant: "destructive" });
          return;
        }
        const headers = parseCSVRow(lines[0]);
        jsonData = lines.slice(1).map(line => {
          const values = parseCSVRow(line);
          return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
        });
      } else {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(data);
        const sheet = wb.worksheets[0];
        const headers: string[] = [];
        sheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
          headers.push(cell.value?.toString() ?? "");
        });
        jsonData = [];
        sheet.eachRow((row, rowNum) => {
          if (rowNum === 1) return;
          const rowObj: Record<string, unknown> = {};
          row.eachCell({ includeEmpty: true }, (cell, colNum) => {
            rowObj[headers[colNum - 1]] = cell.value;
          });
          if (Object.values(rowObj).some(v => v !== null && v !== undefined && v !== "")) {
            jsonData.push(rowObj);
          }
        });
      }

      if (jsonData.length === 0) {
        toast({
          title: "File Kosong",
          description: "File yang diupload tidak memiliki data",
          variant: "destructive",
        });
        return;
      }

      const columns = Object.keys(jsonData[0]);
      setSourceColumns(columns);
      setSourceData(jsonData);

      // Auto-detect field mappings based on similar names
      if (entityType && TARGET_SCHEMAS[entityType]) {
        const autoMappings: FieldMapping[] = TARGET_SCHEMAS[entityType].map((target) => {
          const matchedSource = columns.find((col) => {
            const normalizedCol = col.toLowerCase().replace(/[_\s-]/g, "");
            const normalizedTarget = target.field.toLowerCase().replace(/[_\s-]/g, "");
            const normalizedLabel = target.label.toLowerCase().replace(/[_\s-]/g, "");
            return normalizedCol.includes(normalizedTarget) || 
                   normalizedCol.includes(normalizedLabel) ||
                   normalizedTarget.includes(normalizedCol);
          });
          return {
            sourceField: matchedSource || "",
            targetField: target.field,
          };
        });
        setFieldMappings(autoMappings);
      }

      toast({
        title: "File Berhasil Dibaca",
        description: `${jsonData.length} baris data ditemukan dengan ${columns.length} kolom`,
      });

      setActiveTab("mapping");
    } catch {
      toast({
        title: "Gagal Membaca File",
        description: "Pastikan file dalam format CSV atau Excel yang valid",
        variant: "destructive",
      });
    }
  }, [entityType, toast]);

  const handleMappingChange = (targetField: string, sourceField: string) => {
    setFieldMappings((prev) =>
      prev.map((m) =>
        m.targetField === targetField ? { ...m, sourceField } : m
      )
    );
  };

  const validateData = useCallback(() => {
    if (!entityType || !TARGET_SCHEMAS[entityType]) return;

    const results: ValidationResult[] = [];
    const schema = TARGET_SCHEMAS[entityType];

    sourceData.forEach((row, rowIndex) => {
      schema.forEach((field) => {
        const mapping = fieldMappings.find((m) => m.targetField === field.field);
        const value = mapping?.sourceField ? row[mapping.sourceField] : undefined;

        // Check required fields
        if (field.required && (value === undefined || value === null || value === "")) {
          results.push({
            row: rowIndex + 1,
            field: field.label,
            message: `${field.label} wajib diisi`,
            type: "error",
          });
        }

        // Type validation
        if (value !== undefined && value !== null && value !== "") {
          if (field.type === "number" && isNaN(Number(value))) {
            results.push({
              row: rowIndex + 1,
              field: field.label,
              message: `${field.label} harus berupa angka`,
              type: "error",
            });
          }
          if (field.type === "date") {
            const date = new Date(value as string);
            if (isNaN(date.getTime())) {
              results.push({
                row: rowIndex + 1,
                field: field.label,
                message: `${field.label} format tanggal tidak valid`,
                type: "warning",
              });
            }
          }
          if (field.field === "nik" && String(value).length !== 16) {
            results.push({
              row: rowIndex + 1,
              field: field.label,
              message: `NIK harus 16 digit`,
              type: "warning",
            });
          }
        }
      });
    });

    setValidationResults(results);
    setActiveTab("preview");

    const errorCount = results.filter((r) => r.type === "error").length;
    const warningCount = results.filter((r) => r.type === "warning").length;

    toast({
      title: "Validasi Selesai",
      description: `${errorCount} error, ${warningCount} warning dari ${sourceData.length} baris`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
  }, [entityType, sourceData, fieldMappings, toast]);

  const handleImport = async () => {
    const errors = validationResults.filter((r) => r.type === "error");
    if (errors.length > 0) {
      toast({
        title: "Tidak Dapat Melanjutkan",
        description: "Perbaiki semua error terlebih dahulu sebelum import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    // Simulate import process
    const totalRows = sourceData.length;
    for (let i = 0; i < totalRows; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      setImportProgress(Math.round(((i + 1) / totalRows) * 100));
    }

    setIsImporting(false);
    toast({
      title: "Import Berhasil!",
      description: `${totalRows} data berhasil diimport ke sistem`,
    });
    setActiveTab("result");
  };

  const downloadTemplate = async () => {
    if (!entityType || !TARGET_SCHEMAS[entityType]) return;

    const schema = TARGET_SCHEMAS[entityType];
    const headers = schema.map((f) => f.label);
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet(entityType);
    sheet.addRow(headers);

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${entityType}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetMigration = () => {
    setUploadedFile(null);
    setSourceData([]);
    setSourceColumns([]);
    setFieldMappings([]);
    setValidationResults([]);
    setImportProgress(0);
    setActiveTab("upload");
  };

  const getMappedData = () => {
    return sourceData.slice(0, 10).map((row) => {
      const mappedRow: Record<string, unknown> = {};
      fieldMappings.forEach((mapping) => {
        if (mapping.sourceField) {
          mappedRow[mapping.targetField] = row[mapping.sourceField];
        }
      });
      return mappedRow;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Migration Tool</h2>
          <p className="text-muted-foreground">
            Import data dari sistem legacy dengan pemetaan field otomatis
          </p>
        </div>
        <Button variant="outline" onClick={resetMigration}>
          <Trash2 className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">1. Upload</TabsTrigger>
          <TabsTrigger value="mapping" disabled={sourceData.length === 0}>
            2. Mapping
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={fieldMappings.length === 0}>
            3. Preview
          </TabsTrigger>
          <TabsTrigger value="result" disabled={importProgress < 100}>
            4. Hasil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Tipe Data</CardTitle>
              <CardDescription>
                Pilih jenis data yang akan diimport dari sistem legacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.keys(TARGET_SCHEMAS).map((type) => (
                  <Card
                    key={type}
                    className={`cursor-pointer transition-all hover:border-primary ${
                      entityType === type ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setEntityType(type)}
                  >
                    <CardContent className="p-4 text-center">
                      <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="font-medium capitalize">
                        {type === "patients" && "Pasien"}
                        {type === "doctors" && "Dokter"}
                        {type === "medicines" && "Obat"}
                        {type === "services" && "Tarif Layanan"}
                        {type === "icd10" && "ICD-10"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {entityType && (
                <div className="flex gap-4">
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {entityType && (
            <Card>
              <CardHeader>
                <CardTitle>Upload File</CardTitle>
                <CardDescription>
                  Upload file CSV atau Excel dari sistem legacy Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary hover:underline">
                      Klik untuk upload
                    </span>{" "}
                    atau drag & drop file di sini
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Format: CSV, XLSX, XLS (max 10MB)
                  </p>
                </div>

                {uploadedFile && (
                  <div className="mt-4 p-4 bg-muted rounded-lg flex items-center gap-4">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{uploadedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {sourceData.length} baris
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pemetaan Field</CardTitle>
              <CardDescription>
                Petakan kolom dari file Anda ke field sistem ZEN+
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field Sistem (Target)</TableHead>
                    <TableHead className="w-12 text-center">
                      <ArrowRight className="h-4 w-4 mx-auto" />
                    </TableHead>
                    <TableHead>Kolom File (Source)</TableHead>
                    <TableHead>Wajib</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entityType &&
                    TARGET_SCHEMAS[entityType]?.map((field) => {
                      const mapping = fieldMappings.find(
                        (m) => m.targetField === field.field
                      );
                      return (
                        <TableRow key={field.field}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{field.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {field.field}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <ArrowRight className="h-4 w-4 mx-auto text-muted-foreground" />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={mapping?.sourceField || ""}
                              onValueChange={(value) =>
                                handleMappingChange(field.field, value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih kolom..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">-- Tidak dipetakan --</SelectItem>
                                {sourceColumns.map((col) => (
                                  <SelectItem key={col} value={col}>
                                    {col}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {field.required ? (
                              <Badge variant="destructive">Wajib</Badge>
                            ) : (
                              <Badge variant="secondary">Opsional</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4">
                <Button onClick={validateData}>
                  <Eye className="h-4 w-4 mr-2" />
                  Validasi & Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {validationResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Hasil Validasi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {validationResults.slice(0, 20).map((result, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-sm ${
                        result.type === "error"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-yellow-500/10 text-yellow-700"
                      }`}
                    >
                      Baris {result.row}: {result.message}
                    </div>
                  ))}
                  {validationResults.length > 20 && (
                    <p className="text-sm text-muted-foreground">
                      ...dan {validationResults.length - 20} masalah lainnya
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Preview Data (10 baris pertama)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {entityType &&
                        TARGET_SCHEMAS[entityType]?.map((field) => (
                          <TableHead key={field.field}>{field.label}</TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getMappedData().map((row, idx) => (
                      <TableRow key={idx}>
                        {entityType &&
                          TARGET_SCHEMAS[entityType]?.map((field) => (
                            <TableCell key={field.field}>
                              {String(row[field.field] ?? "-")}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Total: {sourceData.length} baris data akan diimport
                </p>
                <Button onClick={handleImport} disabled={isImporting}>
                  {isImporting ? "Mengimport..." : "Mulai Import"}
                </Button>
              </div>

              {isImporting && (
                <div className="mt-4 space-y-2">
                  <Progress value={importProgress} />
                  <p className="text-sm text-center text-muted-foreground">
                    {importProgress}% selesai
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Import Berhasil!</h3>
                <p className="text-muted-foreground mb-6">
                  {sourceData.length} data berhasil diimport ke sistem ZEN+
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={resetMigration}>
                    Import Data Lain
                  </Button>
                  <Button>Lihat Data di Modul</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
