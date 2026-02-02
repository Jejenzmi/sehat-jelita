import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Building2, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Hospital,
  Settings,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Globe
} from "lucide-react";
import { useCompleteSetup, HospitalProfileData, HospitalType, useAvailableModulesForType } from "@/hooks/useSetupWizard";
import zenLogo from "@/assets/zen-logo.webp";

interface SetupWizardProps {
  onComplete: () => void;
}

const HOSPITAL_TYPES: { value: HospitalType; label: string; description: string }[] = [
  { value: "A", label: "Tipe A", description: "RS Pendidikan Utama (26+ subspesialisasi, program PPDS)" },
  { value: "B", label: "Tipe B", description: "RS Pendidikan (11-12 spesialisasi, ICU lengkap)" },
  { value: "C", label: "Tipe C", description: "RS Umum (4 spesialisasi dasar, ICU dasar)" },
  { value: "D", label: "Tipe D", description: "RS Pratama (2 spesialisasi, layanan dasar)" },
  { value: "FKTP", label: "Klinik/FKTP", description: "Fasilitas Kesehatan Tingkat Pertama" },
];

const ACCREDITATION_OPTIONS = [
  { value: "paripurna", label: "Paripurna (Bintang 5)" },
  { value: "utama", label: "Utama (Bintang 4)" },
  { value: "madya", label: "Madya (Bintang 3)" },
  { value: "dasar", label: "Dasar (Bintang 1-2)" },
  { value: "belum", label: "Belum Terakreditasi" },
];

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<HospitalProfileData>>({
    hospital_name: "",
    hospital_code: "",
    hospital_type: "",
    facility_level: "B",
    address: "",
    city: "",
    province: "",
    phone: "",
    email: "",
    is_teaching_hospital: false,
    accreditation_status: "belum",
  });

  const completeSetup = useCompleteSetup();
  const { data: availableModules } = useAvailableModulesForType(formData.facility_level as HospitalType);

  const updateFormData = (field: keyof HospitalProfileData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleComplete = async () => {
    await completeSetup.mutateAsync(formData as HospitalProfileData);
    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return true; // Welcome step
      case 2:
        return formData.hospital_name && formData.hospital_code;
      case 3:
        return formData.facility_level;
      case 4:
        return true; // Module preview
      default:
        return false;
    }
  };

  const groupModulesByCategory = (modules: typeof availableModules) => {
    if (!modules) return {};
    return modules.reduce((acc, mod) => {
      const cat = mod.module_category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(mod);
      return acc;
    }, {} as Record<string, typeof modules>);
  };

  const categoryLabels: Record<string, string> = {
    core: "Modul Inti",
    clinical: "Pelayanan Klinis",
    support: "Penunjang Medis",
    admin: "Administrasi",
    integration: "Integrasi",
    reporting: "Pelaporan",
    education: "Pendidikan",
    quality: "Mutu & Akreditasi",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img src={zenLogo} alt="SIMRS ZEN+" className="h-16" />
          </div>
          <CardTitle className="text-2xl">Setup Awal SIMRS ZEN⁺</CardTitle>
          <CardDescription>
            Langkah {step} dari 4 - Konfigurasi sistem pertama kali
          </CardDescription>
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Selamat Datang!</h3>
                <p className="text-muted-foreground">
                  Terima kasih telah memilih SIMRS ZEN⁺. Wizard ini akan membantu Anda
                  mengkonfigurasi sistem sesuai dengan tipe dan kebutuhan fasilitas kesehatan Anda.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">Identitas RS</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Hospital className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">Tipe Fasilitas</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium">Modul Aktif</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Hospital Identity */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Identitas Rumah Sakit</h3>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hospital_name">Nama RS *</Label>
                    <Input
                      id="hospital_name"
                      placeholder="RSUD Contoh"
                      value={formData.hospital_name || ""}
                      onChange={(e) => updateFormData("hospital_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hospital_code">Kode RS *</Label>
                    <Input
                      id="hospital_code"
                      placeholder="3201234"
                      value={formData.hospital_code || ""}
                      onChange={(e) => updateFormData("hospital_code", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      className="pl-10"
                      placeholder="Jl. Contoh No. 123"
                      value={formData.address || ""}
                      onChange={(e) => updateFormData("address", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Kota/Kabupaten</Label>
                    <Input
                      id="city"
                      placeholder="Jakarta"
                      value={formData.city || ""}
                      onChange={(e) => updateFormData("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Provinsi</Label>
                    <Input
                      id="province"
                      placeholder="DKI Jakarta"
                      value={formData.province || ""}
                      onChange={(e) => updateFormData("province", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telepon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        className="pl-10"
                        placeholder="021-1234567"
                        value={formData.phone || ""}
                        onChange={(e) => updateFormData("phone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10"
                        placeholder="info@rscontoh.co.id"
                        value={formData.email || ""}
                        onChange={(e) => updateFormData("email", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="director_name">Nama Direktur</Label>
                  <Input
                    id="director_name"
                    placeholder="dr. Nama Direktur, Sp.XX"
                    value={formData.director_name || ""}
                    onChange={(e) => updateFormData("director_name", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Hospital Type */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Hospital className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Tipe Fasilitas Kesehatan</h3>
              </div>

              <div className="space-y-3">
                {HOSPITAL_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.facility_level === type.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => updateFormData("facility_level", type.value)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{type.label}</span>
                          {formData.facility_level === type.value && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {type.description}
                        </p>
                      </div>
                      <Checkbox
                        checked={formData.facility_level === type.value}
                        className="h-5 w-5"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accreditation">Status Akreditasi</Label>
                  <Select
                    value={formData.accreditation_status || "belum"}
                    onValueChange={(v) => updateFormData("accreditation_status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status akreditasi" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCREDITATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>RS Pendidikan</Label>
                    <p className="text-sm text-muted-foreground">
                      Aktifkan jika memiliki program pendidikan PPDS/Koas
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_teaching_hospital || false}
                    onCheckedChange={(v) => updateFormData("is_teaching_hospital", v)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bed_count">Jumlah Tempat Tidur</Label>
                  <Input
                    id="bed_count"
                    type="number"
                    placeholder="100"
                    value={formData.bed_count_total || ""}
                    onChange={(e) => updateFormData("bed_count_total", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Module Preview */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Modul yang Akan Aktif</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Berdasarkan tipe <strong>{HOSPITAL_TYPES.find(t => t.value === formData.facility_level)?.label}</strong>, 
                modul-modul berikut akan tersedia:
              </p>

              <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                {Object.entries(groupModulesByCategory(availableModules)).map(([category, modules]) => (
                  <div key={category}>
                    <h4 className="font-medium text-sm mb-2 text-muted-foreground">
                      {categoryLabels[category] || category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {modules.map((mod) => (
                        <Badge
                          key={mod.module_code}
                          variant={mod.is_core_module ? "default" : "secondary"}
                          className="py-1"
                        >
                          {mod.module_name}
                          {mod.is_core_module && (
                            <span className="ml-1 text-xs opacity-70">•</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/50 p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  💡 Anda dapat mengaktifkan atau menonaktifkan modul tambahan setelah setup 
                  melalui menu <strong>Pengaturan → Konfigurasi Modul</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Kembali
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Lanjut
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                disabled={completeSetup.isPending}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {completeSetup.isPending ? (
                  "Menyimpan..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Selesai & Mulai
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
