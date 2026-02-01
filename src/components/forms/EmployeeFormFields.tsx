import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RELIGION_OPTIONS, EDUCATION_OPTIONS, MARITAL_STATUS_OPTIONS, BLOOD_TYPE_OPTIONS } from "./PatientFormFields";

export const TAX_STATUS_OPTIONS = [
  { value: "TK/0", label: "TK/0 - Tidak Kawin, 0 Tanggungan" },
  { value: "TK/1", label: "TK/1 - Tidak Kawin, 1 Tanggungan" },
  { value: "TK/2", label: "TK/2 - Tidak Kawin, 2 Tanggungan" },
  { value: "TK/3", label: "TK/3 - Tidak Kawin, 3 Tanggungan" },
  { value: "K/0", label: "K/0 - Kawin, 0 Tanggungan" },
  { value: "K/1", label: "K/1 - Kawin, 1 Tanggungan" },
  { value: "K/2", label: "K/2 - Kawin, 2 Tanggungan" },
  { value: "K/3", label: "K/3 - Kawin, 3 Tanggungan" },
  { value: "K/I/0", label: "K/I/0 - Kawin, Istri Bekerja, 0 Tanggungan" },
  { value: "K/I/1", label: "K/I/1 - Kawin, Istri Bekerja, 1 Tanggungan" },
  { value: "K/I/2", label: "K/I/2 - Kawin, Istri Bekerja, 2 Tanggungan" },
  { value: "K/I/3", label: "K/I/3 - Kawin, Istri Bekerja, 3 Tanggungan" },
];

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "permanent", label: "Tetap" },
  { value: "contract", label: "Kontrak" },
  { value: "probation", label: "Percobaan" },
  { value: "internship", label: "Magang" },
  { value: "parttime", label: "Part-time" },
];

export const ACADEMIC_TITLE_OPTIONS = [
  { value: "", label: "Tidak Ada" },
  { value: "dr.", label: "dr. (Dokter)" },
  { value: "drg.", label: "drg. (Dokter Gigi)" },
  { value: "Sp.", label: "Sp. (Spesialis)" },
  { value: "S.Kep", label: "S.Kep (Sarjana Keperawatan)" },
  { value: "Ns.", label: "Ns. (Ners)" },
  { value: "S.Farm", label: "S.Farm (Sarjana Farmasi)" },
  { value: "Apt.", label: "Apt. (Apoteker)" },
  { value: "S.KM", label: "S.KM (Sarjana Kesehatan Masyarakat)" },
  { value: "SKG", label: "SKG (Sarjana Kedokteran Gigi)" },
  { value: "S.Si", label: "S.Si (Sarjana Sains)" },
  { value: "A.Md.Kep", label: "A.Md.Kep (Ahli Madya Keperawatan)" },
  { value: "A.Md.Farm", label: "A.Md.Farm (Ahli Madya Farmasi)" },
  { value: "A.Md.AK", label: "A.Md.AK (Ahli Madya Analis Kesehatan)" },
  { value: "A.Md.Rad", label: "A.Md.Rad (Ahli Madya Radiologi)" },
  { value: "A.Md.Gz", label: "A.Md.Gz (Ahli Madya Gizi)" },
];

export interface EmployeeFormData {
  // Personal Data
  full_name: string;
  nik: string;
  birth_place: string;
  birth_date: string;
  gender: string;
  religion: string;
  blood_type: string;
  marital_status: string;
  nationality: string;
  address: string;
  phone: string;
  email: string;
  // Employment
  position: string;
  department_id: string;
  employment_type: string;
  join_date: string;
  end_date: string;
  // Professional (for healthcare workers)
  academic_title: string;
  specialization: string;
  str_number: string;
  str_expiry_date: string;
  sip_number: string;
  sip_expiry_date: string;
  satusehat_practitioner_id: string;
  // Financial
  salary: string;
  bank_name: string;
  bank_account: string;
  npwp: string;
  tax_status: string;
  bpjs_kesehatan: string;
  bpjs_ketenagakerjaan: string;
  // Education
  education_level: string;
  last_education: string;
  // Emergency Contact
  emergency_contact_name: string;
  emergency_contact_phone: string;
  // Additional
  notes: string;
}

export const initialEmployeeFormData: EmployeeFormData = {
  full_name: "",
  nik: "",
  birth_place: "",
  birth_date: "",
  gender: "",
  religion: "",
  blood_type: "",
  marital_status: "",
  nationality: "Indonesia",
  address: "",
  phone: "",
  email: "",
  position: "",
  department_id: "",
  employment_type: "permanent",
  join_date: "",
  end_date: "",
  academic_title: "",
  specialization: "",
  str_number: "",
  str_expiry_date: "",
  sip_number: "",
  sip_expiry_date: "",
  satusehat_practitioner_id: "",
  salary: "",
  bank_name: "",
  bank_account: "",
  npwp: "",
  tax_status: "",
  bpjs_kesehatan: "",
  bpjs_ketenagakerjaan: "",
  education_level: "",
  last_education: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  notes: "",
};

interface Department {
  id: string;
  name: string;
}

interface EmployeeFormFieldsProps {
  data: EmployeeFormData;
  onChange: (data: EmployeeFormData) => void;
  departments?: Department[];
  showProfessionalTab?: boolean;
}

export function EmployeeFormFields({ 
  data, 
  onChange, 
  departments = [],
  showProfessionalTab = true,
}: EmployeeFormFieldsProps) {
  const updateField = <K extends keyof EmployeeFormData>(field: K, value: EmployeeFormData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <Tabs defaultValue="personal" className="w-full">
      <TabsList className={`grid w-full ${showProfessionalTab ? 'grid-cols-5' : 'grid-cols-4'}`}>
        <TabsTrigger value="personal">Data Pribadi</TabsTrigger>
        <TabsTrigger value="employment">Kepegawaian</TabsTrigger>
        {showProfessionalTab && <TabsTrigger value="professional">Kredensial</TabsTrigger>}
        <TabsTrigger value="financial">Finansial</TabsTrigger>
        <TabsTrigger value="emergency">Darurat</TabsTrigger>
      </TabsList>

      <ScrollArea className="max-h-[60vh] mt-4">
      <TabsContent value="personal" className="space-y-4 pr-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Nama sesuai KTP"
              value={data.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>NIK</Label>
            <Input
              placeholder="16 digit NIK"
              value={data.nik}
              onChange={(e) => updateField("nik", e.target.value)}
              maxLength={16}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tempat Lahir</Label>
            <Input
              placeholder="Kota/Kabupaten"
              value={data.birth_place}
              onChange={(e) => updateField("birth_place", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Lahir</Label>
            <Input
              type="date"
              value={data.birth_date}
              onChange={(e) => updateField("birth_date", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Jenis Kelamin</Label>
            <Select value={data.gender} onValueChange={(v) => updateField("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Laki-laki</SelectItem>
                <SelectItem value="female">Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Agama</Label>
            <Select value={data.religion} onValueChange={(v) => updateField("religion", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {RELIGION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Gol. Darah</Label>
            <Select value={data.blood_type} onValueChange={(v) => updateField("blood_type", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {BLOOD_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status Pernikahan</Label>
            <Select value={data.marital_status} onValueChange={(v) => updateField("marital_status", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {MARITAL_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kewarganegaraan</Label>
            <Input
              value={data.nationality}
              onChange={(e) => updateField("nationality", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Alamat</Label>
          <Textarea
            placeholder="Alamat lengkap"
            value={data.address}
            onChange={(e) => updateField("address", e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>No. Telepon</Label>
            <Input
              placeholder="08xxxxxxxxxx"
              value={data.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="email@contoh.com"
              value={data.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pendidikan Terakhir</Label>
            <Select value={data.education_level} onValueChange={(v) => updateField("education_level", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {EDUCATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Institusi Pendidikan</Label>
            <Input
              placeholder="Nama universitas/sekolah"
              value={data.last_education}
              onChange={(e) => updateField("last_education", e.target.value)}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="employment" className="space-y-4 pr-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Jabatan <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Nama jabatan"
              value={data.position}
              onChange={(e) => updateField("position", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Departemen</Label>
            <Select value={data.department_id} onValueChange={(v) => updateField("department_id", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih Departemen" /></SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Jenis Kepegawaian</Label>
            <Select value={data.employment_type} onValueChange={(v) => updateField("employment_type", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tanggal Mulai Kerja <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={data.join_date}
              onChange={(e) => updateField("join_date", e.target.value)}
            />
          </div>
        </div>

        {data.employment_type === "contract" && (
          <div className="space-y-2 max-w-xs">
            <Label>Tanggal Berakhir Kontrak</Label>
            <Input
              type="date"
              value={data.end_date}
              onChange={(e) => updateField("end_date", e.target.value)}
            />
          </div>
        )}
      </TabsContent>

      {showProfessionalTab && (
        <TabsContent value="professional" className="space-y-4 pr-4">
          <p className="text-sm text-muted-foreground mb-4">
            Kredensial profesional untuk tenaga kesehatan (dokter, perawat, farmasi, dll)
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gelar Akademik</Label>
              <Select value={data.academic_title} onValueChange={(v) => updateField("academic_title", v)}>
                <SelectTrigger><SelectValue placeholder="Pilih gelar" /></SelectTrigger>
                <SelectContent>
                  {ACADEMIC_TITLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Spesialisasi</Label>
              <Input
                placeholder="Contoh: Bedah Umum, Anak, dll"
                value={data.specialization}
                onChange={(e) => updateField("specialization", e.target.value)}
              />
            </div>
          </div>

          <hr className="my-4" />
          <h4 className="font-medium text-sm">STR (Surat Tanda Registrasi)</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor STR</Label>
              <Input
                placeholder="Nomor STR"
                value={data.str_number}
                onChange={(e) => updateField("str_number", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Masa Berlaku STR</Label>
              <Input
                type="date"
                value={data.str_expiry_date}
                onChange={(e) => updateField("str_expiry_date", e.target.value)}
              />
            </div>
          </div>

          <hr className="my-4" />
          <h4 className="font-medium text-sm">SIP (Surat Izin Praktik)</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor SIP</Label>
              <Input
                placeholder="Nomor SIP"
                value={data.sip_number}
                onChange={(e) => updateField("sip_number", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Masa Berlaku SIP</Label>
              <Input
                type="date"
                value={data.sip_expiry_date}
                onChange={(e) => updateField("sip_expiry_date", e.target.value)}
              />
            </div>
          </div>

          <hr className="my-4" />
          <div className="space-y-2 max-w-md">
            <Label>SATU SEHAT Practitioner ID</Label>
            <Input
              placeholder="ID Practitioner dari SATU SEHAT"
              value={data.satusehat_practitioner_id}
              onChange={(e) => updateField("satusehat_practitioner_id", e.target.value)}
            />
          </div>
        </TabsContent>
      )}

      <TabsContent value="financial" className="space-y-4 pr-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gaji Pokok</Label>
            <Input
              type="number"
              placeholder="0"
              value={data.salary}
              onChange={(e) => updateField("salary", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status Pajak (PTKP)</Label>
            <Select value={data.tax_status} onValueChange={(v) => updateField("tax_status", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
              <SelectContent>
                {TAX_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nama Bank</Label>
            <Input
              placeholder="Nama bank"
              value={data.bank_name}
              onChange={(e) => updateField("bank_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Nomor Rekening</Label>
            <Input
              placeholder="Nomor rekening"
              value={data.bank_account}
              onChange={(e) => updateField("bank_account", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2 max-w-md">
          <Label>NPWP</Label>
          <Input
            placeholder="00.000.000.0-000.000"
            value={data.npwp}
            onChange={(e) => updateField("npwp", e.target.value)}
          />
        </div>

        <hr className="my-4" />
        <h4 className="font-medium text-sm">BPJS</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>No. BPJS Kesehatan</Label>
            <Input
              placeholder="Nomor BPJS Kesehatan"
              value={data.bpjs_kesehatan}
              onChange={(e) => updateField("bpjs_kesehatan", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>No. BPJS Ketenagakerjaan</Label>
            <Input
              placeholder="Nomor BPJS Ketenagakerjaan"
              value={data.bpjs_ketenagakerjaan}
              onChange={(e) => updateField("bpjs_ketenagakerjaan", e.target.value)}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="emergency" className="space-y-4 pr-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nama Kontak Darurat</Label>
            <Input
              placeholder="Nama lengkap"
              value={data.emergency_contact_name}
              onChange={(e) => updateField("emergency_contact_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>No. Telepon Darurat</Label>
            <Input
              placeholder="08xxxxxxxxxx"
              value={data.emergency_contact_phone}
              onChange={(e) => updateField("emergency_contact_phone", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Catatan</Label>
          <Textarea
            placeholder="Catatan tambahan tentang karyawan"
            value={data.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
          />
        </div>
      </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
