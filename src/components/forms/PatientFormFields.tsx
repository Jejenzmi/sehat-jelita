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

// Standard options based on Indonesian regulations (Kemenkes, Dukcapil, BPJS)
export const RELIGION_OPTIONS = [
  { value: "islam", label: "Islam" },
  { value: "kristen", label: "Kristen Protestan" },
  { value: "katolik", label: "Katolik" },
  { value: "hindu", label: "Hindu" },
  { value: "buddha", label: "Buddha" },
  { value: "konghucu", label: "Konghucu" },
  { value: "lainnya", label: "Kepercayaan Lain" },
];

export const EDUCATION_OPTIONS = [
  { value: "tidak_sekolah", label: "Tidak Sekolah" },
  { value: "sd", label: "SD/Sederajat" },
  { value: "smp", label: "SMP/Sederajat" },
  { value: "sma", label: "SMA/Sederajat" },
  { value: "d1", label: "D1" },
  { value: "d2", label: "D2" },
  { value: "d3", label: "D3" },
  { value: "d4", label: "D4/S1" },
  { value: "s1", label: "S1" },
  { value: "s2", label: "S2" },
  { value: "s3", label: "S3" },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: "belum_kawin", label: "Belum Kawin" },
  { value: "kawin", label: "Kawin" },
  { value: "cerai_hidup", label: "Cerai Hidup" },
  { value: "cerai_mati", label: "Cerai Mati" },
];

export const BLOOD_TYPE_OPTIONS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "AB", label: "AB" },
  { value: "O", label: "O" },
];

export const OCCUPATION_OPTIONS = [
  { value: "pns", label: "PNS" },
  { value: "tni", label: "TNI" },
  { value: "polri", label: "POLRI" },
  { value: "swasta", label: "Karyawan Swasta" },
  { value: "wiraswasta", label: "Wiraswasta" },
  { value: "petani", label: "Petani" },
  { value: "nelayan", label: "Nelayan" },
  { value: "buruh", label: "Buruh" },
  { value: "ibu_rumah_tangga", label: "Ibu Rumah Tangga" },
  { value: "pelajar", label: "Pelajar/Mahasiswa" },
  { value: "pensiunan", label: "Pensiunan" },
  { value: "tidak_bekerja", label: "Tidak Bekerja" },
  { value: "lainnya", label: "Lainnya" },
];

export interface PatientFormData {
  nik: string;
  full_name: string;
  birth_date: string;
  birth_place: string;
  gender: "L" | "P" | "";
  blood_type: string;
  religion: string;
  marital_status: string;
  education_level: string;
  occupation: string;
  nationality: string;
  mother_name: string;
  phone: string;
  email: string;
  address: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  city: string;
  province: string;
  postal_code: string;
  bpjs_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  allergy_notes: string;
}

export const initialPatientFormData: PatientFormData = {
  nik: "",
  full_name: "",
  birth_date: "",
  birth_place: "",
  gender: "",
  blood_type: "",
  religion: "",
  marital_status: "",
  education_level: "",
  occupation: "",
  nationality: "Indonesia",
  mother_name: "",
  phone: "",
  email: "",
  address: "",
  rt: "",
  rw: "",
  kelurahan: "",
  kecamatan: "",
  kabupaten: "",
  city: "",
  province: "",
  postal_code: "",
  bpjs_number: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_contact_relation: "",
  allergy_notes: "",
};

interface PatientFormFieldsProps {
  data: PatientFormData;
  onChange: (data: PatientFormData) => void;
  compact?: boolean;
}

export function PatientFormFields({ data, onChange, compact = false }: PatientFormFieldsProps) {
  const updateField = <K extends keyof PatientFormData>(field: K, value: PatientFormData[K]) => {
    onChange({ ...data, [field]: value });
  };

  if (compact) {
    return (
      <ScrollArea className="max-h-[60vh] pr-4">
      <div className="space-y-4">
        {/* Identitas Dasar */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>NIK <span className="text-destructive">*</span></Label>
            <Input
              placeholder="16 digit NIK"
              value={data.nik}
              onChange={(e) => updateField("nik", e.target.value)}
              maxLength={16}
            />
          </div>
          <div className="space-y-2">
            <Label>No. BPJS</Label>
            <Input
              placeholder="Nomor BPJS (opsional)"
              value={data.bpjs_number}
              onChange={(e) => updateField("bpjs_number", e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Sesuai KTP"
              value={data.full_name}
              onChange={(e) => updateField("full_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Tanggal Lahir <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={data.birth_date}
              onChange={(e) => updateField("birth_date", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tempat Lahir</Label>
            <Input
              placeholder="Kota/Kabupaten"
              value={data.birth_place}
              onChange={(e) => updateField("birth_place", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Jenis Kelamin <span className="text-destructive">*</span></Label>
            <Select value={data.gender} onValueChange={(v: "L" | "P") => updateField("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
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
            <Label>Nama Ibu Kandung</Label>
            <Input
              placeholder="Nama ibu kandung"
              value={data.mother_name}
              onChange={(e) => updateField("mother_name", e.target.value)}
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

        <div className="grid grid-cols-4 gap-2">
          <div className="space-y-2">
            <Label>RT</Label>
            <Input placeholder="001" value={data.rt} onChange={(e) => updateField("rt", e.target.value)} maxLength={3} />
          </div>
          <div className="space-y-2">
            <Label>RW</Label>
            <Input placeholder="001" value={data.rw} onChange={(e) => updateField("rw", e.target.value)} maxLength={3} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Kelurahan/Desa</Label>
            <Input placeholder="Kelurahan" value={data.kelurahan} onChange={(e) => updateField("kelurahan", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <Label>Kecamatan</Label>
            <Input placeholder="Kecamatan" value={data.kecamatan} onChange={(e) => updateField("kecamatan", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Kab/Kota</Label>
            <Input placeholder="Kabupaten/Kota" value={data.city} onChange={(e) => updateField("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Provinsi</Label>
            <Input placeholder="Provinsi" value={data.province} onChange={(e) => updateField("province", e.target.value)} />
          </div>
        </div>
      </div>
      </ScrollArea>
    );
  }

  // Full form with tabs
  return (
    <Tabs defaultValue="identitas" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="identitas">Identitas</TabsTrigger>
        <TabsTrigger value="alamat">Alamat</TabsTrigger>
        <TabsTrigger value="kontak">Kontak</TabsTrigger>
        <TabsTrigger value="medis">Data Medis</TabsTrigger>
      </TabsList>

      <ScrollArea className="max-h-[60vh] mt-4">
      <TabsContent value="identitas" className="space-y-4 pr-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>NIK <span className="text-destructive">*</span></Label>
            <Input
              placeholder="16 digit NIK"
              value={data.nik}
              onChange={(e) => updateField("nik", e.target.value)}
              maxLength={16}
            />
          </div>
          <div className="space-y-2">
            <Label>No. BPJS</Label>
            <Input
              placeholder="Nomor BPJS (opsional)"
              value={data.bpjs_number}
              onChange={(e) => updateField("bpjs_number", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
          <Input
            placeholder="Nama sesuai KTP"
            value={data.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
          />
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
            <Label>Tanggal Lahir <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={data.birth_date}
              onChange={(e) => updateField("birth_date", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Jenis Kelamin <span className="text-destructive">*</span></Label>
            <Select value={data.gender} onValueChange={(v: "L" | "P") => updateField("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Laki-laki</SelectItem>
                <SelectItem value="P">Perempuan</SelectItem>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pekerjaan</Label>
            <Select value={data.occupation} onValueChange={(v) => updateField("occupation", v)}>
              <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
              <SelectContent>
                {OCCUPATION_OPTIONS.map((opt) => (
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
          <Label>Nama Ibu Kandung</Label>
          <Input
            placeholder="Nama ibu kandung (untuk verifikasi)"
            value={data.mother_name}
            onChange={(e) => updateField("mother_name", e.target.value)}
          />
        </div>
      </TabsContent>

      <TabsContent value="alamat" className="space-y-4 pr-4">
        <div className="space-y-2">
          <Label>Alamat Lengkap</Label>
          <Textarea
            placeholder="Jalan, nomor rumah, gang, dll"
            value={data.address}
            onChange={(e) => updateField("address", e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>RT</Label>
            <Input placeholder="001" value={data.rt} onChange={(e) => updateField("rt", e.target.value)} maxLength={3} />
          </div>
          <div className="space-y-2">
            <Label>RW</Label>
            <Input placeholder="001" value={data.rw} onChange={(e) => updateField("rw", e.target.value)} maxLength={3} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Kelurahan/Desa</Label>
            <Input placeholder="Nama kelurahan/desa" value={data.kelurahan} onChange={(e) => updateField("kelurahan", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kecamatan</Label>
            <Input placeholder="Nama kecamatan" value={data.kecamatan} onChange={(e) => updateField("kecamatan", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Kabupaten/Kota</Label>
            <Input placeholder="Nama kabupaten/kota" value={data.kabupaten} onChange={(e) => updateField("kabupaten", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Kota</Label>
            <Input placeholder="Nama kota" value={data.city} onChange={(e) => updateField("city", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Provinsi</Label>
            <Input placeholder="Nama provinsi" value={data.province} onChange={(e) => updateField("province", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2 max-w-xs">
          <Label>Kode Pos</Label>
          <Input placeholder="00000" value={data.postal_code} onChange={(e) => updateField("postal_code", e.target.value)} maxLength={5} />
        </div>
      </TabsContent>

      <TabsContent value="kontak" className="space-y-4 pr-4">
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

        <hr className="my-4" />
        <h4 className="font-medium text-sm text-muted-foreground">Kontak Darurat</h4>

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

        <div className="space-y-2 max-w-xs">
          <Label>Hubungan dengan Pasien</Label>
          <Select value={data.emergency_contact_relation} onValueChange={(v) => updateField("emergency_contact_relation", v)}>
            <SelectTrigger><SelectValue placeholder="Pilih hubungan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="orang_tua">Orang Tua</SelectItem>
              <SelectItem value="suami">Suami</SelectItem>
              <SelectItem value="istri">Istri</SelectItem>
              <SelectItem value="anak">Anak</SelectItem>
              <SelectItem value="saudara">Saudara Kandung</SelectItem>
              <SelectItem value="kerabat">Kerabat Lain</SelectItem>
              <SelectItem value="teman">Teman</SelectItem>
              <SelectItem value="lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="medis" className="space-y-4 pr-4">
        <div className="space-y-2">
          <Label>Riwayat Alergi</Label>
          <Textarea
            placeholder="Tuliskan riwayat alergi pasien (obat, makanan, dll) jika ada"
            value={data.allergy_notes}
            onChange={(e) => updateField("allergy_notes", e.target.value)}
            rows={4}
          />
        </div>
      </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
