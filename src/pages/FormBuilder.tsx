import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Save,
  FileDown,
  Type,
  AlignLeft,
  CheckSquare,
  ListOrdered,
  Calendar,
  Hash,
  ToggleLeft,
  Upload,
  Copy,
  Settings2,
  Paintbrush,
  FileText,
} from "lucide-react";

// Field types available in the builder
const fieldTypes = [
  { value: "text", label: "Teks Singkat", icon: Type },
  { value: "textarea", label: "Teks Panjang", icon: AlignLeft },
  { value: "number", label: "Angka", icon: Hash },
  { value: "select", label: "Pilihan (Dropdown)", icon: ListOrdered },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "radio", label: "Radio Button", icon: CheckSquare },
  { value: "date", label: "Tanggal", icon: Calendar },
  { value: "toggle", label: "Toggle (Ya/Tidak)", icon: ToggleLeft },
  { value: "file", label: "Upload File", icon: Upload },
  { value: "heading", label: "Heading/Section", icon: Type },
  { value: "separator", label: "Garis Pemisah", icon: AlignLeft },
];

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  description?: string;
  width: "full" | "half";
}

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
  createdAt: string;
}

// Preset templates
const presetTemplates: Omit<FormTemplate, "id" | "createdAt">[] = [
  {
    name: "Asesmen Awal Rawat Inap",
    description: "Formulir asesmen awal medis untuk rawat inap",
    category: "rawat_inap",
    fields: [
      { id: "f1", type: "select", label: "Jenis Anamnesis", required: true, options: ["Auto Anamnesis", "Allo Anamnesis"], width: "half" },
      { id: "f2", type: "textarea", label: "Keluhan Utama", required: true, width: "full" },
      { id: "f3", type: "textarea", label: "Riwayat Penyakit Sekarang", required: true, width: "full" },
      { id: "f4", type: "checkbox", label: "Riwayat Penyakit Keluarga", required: false, options: ["Jantung", "Diabetes", "Hipertensi", "Asthma", "Kanker"], width: "full" },
      { id: "f5", type: "checkbox", label: "Riwayat Alergi", required: false, options: ["Obat", "Makanan", "Udara Dingin", "Lain-lain"], width: "full" },
      { id: "f6", type: "heading", label: "Pemeriksaan Fisik", required: false, width: "full" },
      { id: "f7", type: "select", label: "Keadaan Umum", required: true, options: ["Tampak Tidak Sakit", "Tampak Sakit Ringan", "Tampak Sakit Sedang", "Tampak Sakit Berat"], width: "half" },
      { id: "f8", type: "textarea", label: "Pemeriksaan Fisik Bermakna", required: false, width: "full" },
    ],
  },
  {
    name: "SOAP Rawat Jalan",
    description: "Template SOAP standar untuk rawat jalan",
    category: "rawat_jalan",
    fields: [
      { id: "s1", type: "textarea", label: "Subjective (Keluhan)", required: true, width: "full" },
      { id: "s2", type: "textarea", label: "Objective (Pemeriksaan)", required: true, width: "full" },
      { id: "s3", type: "textarea", label: "Assessment (Diagnosis)", required: true, width: "full" },
      { id: "s4", type: "textarea", label: "Plan (Rencana Terapi)", required: true, width: "full" },
    ],
  },
];

export default function FormBuilder() {
  const [activeTab, setActiveTab] = useState("builder");
  const [formName, setFormName] = useState("Formulir Baru");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("rawat_jalan");
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<FormTemplate[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addField = useCallback((type: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: fieldTypes.find(f => f.value === type)?.label || "Field Baru",
      placeholder: "",
      required: false,
      options: type === "select" || type === "checkbox" || type === "radio" ? ["Opsi 1", "Opsi 2"] : undefined,
      width: "full",
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
    toast.success("Field ditambahkan");
  }, []);

  const removeField = useCallback((id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  }, [selectedFieldId]);

  const duplicateField = useCallback((id: string) => {
    const field = fields.find(f => f.id === id);
    if (!field) return;
    const newField = { ...field, id: `field_${Date.now()}`, label: `${field.label} (Copy)` };
    const idx = fields.findIndex(f => f.id === id);
    setFields(prev => [...prev.slice(0, idx + 1), newField, ...prev.slice(idx + 1)]);
  }, [fields]);

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const saveTemplate = useCallback(() => {
    if (!formName.trim()) { toast.error("Nama formulir wajib diisi"); return; }
    if (fields.length === 0) { toast.error("Formulir harus memiliki minimal 1 field"); return; }
    const template: FormTemplate = {
      id: `tmpl_${Date.now()}`,
      name: formName,
      description: formDescription,
      category: formCategory,
      fields: [...fields],
      createdAt: new Date().toISOString(),
    };
    setSavedTemplates(prev => [...prev, template]);
    toast.success("Template berhasil disimpan!");
  }, [formName, formDescription, formCategory, fields]);

  const loadTemplate = useCallback((template: Omit<FormTemplate, "id" | "createdAt">) => {
    setFormName(template.name);
    setFormDescription(template.description);
    setFormCategory(template.category);
    setFields(template.fields.map(f => ({ ...f, id: `field_${Date.now()}_${Math.random().toString(36).slice(2)}` })));
    setActiveTab("builder");
    toast.success("Template dimuat!");
  }, []);

  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newFields = [...fields];
    const [removed] = newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, removed);
    setFields(newFields);
    setDraggedIndex(index);
  };
  const handleDragEnd = () => setDraggedIndex(null);

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const renderPreviewField = (field: FormField) => {
    switch (field.type) {
      case "heading": return <h3 className="text-lg font-semibold text-slate-900 pt-2">{field.label}</h3>;
      case "separator": return <Separator />;
      case "text": return <div><Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label><Input placeholder={field.placeholder} disabled /></div>;
      case "textarea": return <div><Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label><Textarea placeholder={field.placeholder} disabled /></div>;
      case "number": return <div><Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label><Input type="number" disabled /></div>;
      case "date": return <div><Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label><Input type="date" disabled /></div>;
      case "toggle": return <div className="flex items-center gap-3"><Switch disabled /><Label>{field.label}</Label></div>;
      case "file": return <div><Label>{field.label}</Label><div className="border-2 border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">Klik atau drag file ke sini</div></div>;
      case "select": return <div><Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label><Select disabled><SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger></Select></div>;
      case "checkbox": return <div><Label className="mb-2 block">{field.label}</Label><div className="space-y-1">{field.options?.map((opt, i) => <label key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" disabled />{opt}</label>)}</div></div>;
      case "radio": return <div><Label className="mb-2 block">{field.label}</Label><div className="space-y-1">{field.options?.map((opt, i) => <label key={i} className="flex items-center gap-2 text-sm"><input type="radio" name={field.id} disabled />{opt}</label>)}</div></div>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Paintbrush className="h-6 w-6 text-primary" />
            Dynamic Form Builder
          </h1>
          <p className="text-muted-foreground text-sm">Buat formulir EMR custom tanpa coding</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab("preview")}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Formulir diekspor sebagai PDF")}>
            <FileDown className="h-4 w-4 mr-1" /> Export PDF
          </Button>
          <Button size="sm" onClick={saveTemplate}>
            <Save className="h-4 w-4 mr-1" /> Simpan Template
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="builder">🔧 Builder</TabsTrigger>
          <TabsTrigger value="preview">👁️ Preview</TabsTrigger>
          <TabsTrigger value="templates">📁 Template</TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Field Palette */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tambah Field</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {fieldTypes.map(ft => (
                  <Button key={ft.value} variant="ghost" size="sm" className="w-full justify-start text-xs" onClick={() => addField(ft.value)}>
                    <ft.icon className="h-3.5 w-3.5 mr-2 text-primary" />
                    {ft.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Canvas */}
            <Card className="lg:col-span-5">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <Input value={formName} onChange={e => setFormName(e.target.value)} className="text-lg font-bold border-none px-0 focus-visible:ring-0" />
                  <Input value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Deskripsi formulir..." className="text-sm text-muted-foreground border-none px-0 focus-visible:ring-0" />
                  <Select value={formCategory} onValueChange={setFormCategory}>
                    <SelectTrigger className="w-48 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rawat_jalan">Rawat Jalan</SelectItem>
                      <SelectItem value="rawat_inap">Rawat Inap</SelectItem>
                      <SelectItem value="igd">IGD</SelectItem>
                      <SelectItem value="ok">Kamar Operasi</SelectItem>
                      <SelectItem value="icu">ICU</SelectItem>
                      <SelectItem value="umum">Umum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {fields.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <Plus className="h-10 w-10 mb-3 opacity-30" />
                      <p className="text-sm">Klik field di panel kiri untuk menambahkan</p>
                      <p className="text-xs mt-1">Atau pilih template yang sudah tersedia</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {fields.map((field, idx) => (
                        <div
                          key={field.id}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedFieldId(field.id)}
                          className={`group flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedFieldId === field.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <GripVertical className="h-4 w-4 mt-1 text-muted-foreground/40 cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px]">{fieldTypes.find(ft => ft.value === field.type)?.label}</Badge>
                              {field.required && <Badge variant="destructive" className="text-[10px]">Wajib</Badge>}
                              <Badge variant="secondary" className="text-[10px]">{field.width === "full" ? "Full" : "Half"}</Badge>
                            </div>
                            <p className="text-sm font-medium truncate">{field.label}</p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); duplicateField(field.id); }}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); removeField(field.id); }}>
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

            {/* Properties Panel */}
            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings2 className="h-4 w-4" /> Properti Field
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedField ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input value={selectedField.label} onChange={e => updateField(selectedField.id, { label: e.target.value })} />
                      </div>
                      {selectedField.type !== "heading" && selectedField.type !== "separator" && (
                        <>
                          <div>
                            <Label className="text-xs">Placeholder</Label>
                            <Input value={selectedField.placeholder || ""} onChange={e => updateField(selectedField.id, { placeholder: e.target.value })} />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Wajib Diisi</Label>
                            <Switch checked={selectedField.required} onCheckedChange={v => updateField(selectedField.id, { required: v })} />
                          </div>
                          <div>
                            <Label className="text-xs">Lebar</Label>
                            <Select value={selectedField.width} onValueChange={(v: "full" | "half") => updateField(selectedField.id, { width: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">Full Width</SelectItem>
                                <SelectItem value="half">Half Width</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {selectedField.options && (
                        <div>
                          <Label className="text-xs">Opsi</Label>
                          {selectedField.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2 mt-1">
                              <Input value={opt} onChange={e => {
                                const newOpts = [...(selectedField.options || [])];
                                newOpts[i] = e.target.value;
                                updateField(selectedField.id, { options: newOpts });
                              }} className="text-sm h-8" />
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                                updateField(selectedField.id, { options: selectedField.options?.filter((_, j) => j !== i) });
                              }}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="mt-2 w-full text-xs" onClick={() => {
                            updateField(selectedField.id, { options: [...(selectedField.options || []), `Opsi ${(selectedField.options?.length || 0) + 1}`] });
                          }}>
                            <Plus className="h-3 w-3 mr-1" /> Tambah Opsi
                          </Button>
                        </div>
                      )}
                      <div>
                        <Label className="text-xs">Keterangan</Label>
                        <Textarea value={selectedField.description || ""} onChange={e => updateField(selectedField.id, { description: e.target.value })} rows={2} />
                      </div>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                    <Settings2 className="h-8 w-8 mb-2 opacity-30" />
                    <p>Pilih field untuk mengedit properti</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>{formName}</CardTitle>
              {formDescription && <p className="text-sm text-muted-foreground">{formDescription}</p>}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="max-w-2xl mx-auto space-y-4">
                  {fields.length === 0 ? (
                    <p className="text-center text-muted-foreground py-20">Belum ada field. Kembali ke Builder untuk menambahkan field.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {fields.map(field => (
                        <div key={field.id} className={field.width === "full" ? "col-span-2" : "col-span-1"}>
                          {renderPreviewField(field)}
                        </div>
                      ))}
                    </div>
                  )}
                  {fields.length > 0 && (
                    <div className="flex justify-end gap-2 pt-6 border-t">
                      <Button variant="outline">Batal</Button>
                      <Button>Simpan</Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Preset templates */}
            {presetTemplates.map((tmpl, i) => (
              <Card key={`preset_${i}`} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => loadTemplate(tmpl)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">{tmpl.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="w-fit text-[10px]">Preset</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">{tmpl.description}</p>
                  <p className="text-xs text-muted-foreground">{tmpl.fields.length} field</p>
                </CardContent>
              </Card>
            ))}
            {/* User saved templates */}
            {savedTemplates.map(tmpl => (
              <Card key={tmpl.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => loadTemplate(tmpl)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-500" />
                    <CardTitle className="text-sm">{tmpl.name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="w-fit text-[10px]">Custom</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-2">{tmpl.description}</p>
                  <p className="text-xs text-muted-foreground">{tmpl.fields.length} field • {new Date(tmpl.createdAt).toLocaleDateString("id-ID")}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
