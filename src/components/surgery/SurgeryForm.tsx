import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSurgeryData } from "@/hooks/useSurgeryData";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

const surgerySchema = z.object({
  patient_id: z.string().min(1, "Pasien harus dipilih"),
  operating_room_id: z.string().optional(),
  scheduled_date: z.string().min(1, "Tanggal harus diisi"),
  scheduled_start_time: z.string().min(1, "Waktu mulai harus diisi"),
  scheduled_end_time: z.string().optional(),
  preoperative_diagnosis: z.string().min(1, "Diagnosis pre-operasi harus diisi"),
  procedure_name: z.string().min(1, "Nama prosedur harus diisi"),
  procedure_code: z.string().optional(),
  procedure_type: z.enum(["elective", "emergency", "urgent"]),
  wound_class: z.enum(["clean", "clean_contaminated", "contaminated", "dirty"]),
  anesthesia_type: z.enum(["general", "regional", "local", "sedation", "combined"]).optional(),
  asa_classification: z.enum(["ASA_I", "ASA_II", "ASA_III", "ASA_IV", "ASA_V", "ASA_VI"]).optional(),
  preoperative_notes: z.string().optional(),
});

type SurgeryFormValues = z.infer<typeof surgerySchema>;

interface SurgeryFormProps {
  onSuccess: () => void;
  initialData?: Partial<SurgeryFormValues>;
}

export function SurgeryForm({ onSuccess, initialData }: SurgeryFormProps) {
  const { operatingRooms, createSurgery } = useSurgeryData();
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<Array<{ id: string; full_name: string; medical_record_number: string }>>([]);
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; full_name: string } | null>(null);

  const form = useForm<SurgeryFormValues>({
    resolver: zodResolver(surgerySchema),
    defaultValues: {
      patient_id: "",
      operating_room_id: "",
      scheduled_date: new Date().toISOString().split("T")[0],
      scheduled_start_time: "",
      scheduled_end_time: "",
      preoperative_diagnosis: "",
      procedure_name: "",
      procedure_code: "",
      procedure_type: "elective",
      wound_class: "clean",
      preoperative_notes: "",
      ...initialData,
    },
  });

  // Search patients
  useEffect(() => {
    const searchPatients = async () => {
      if (patientSearch.length < 2) {
        setPatients([]);
        return;
      }

      setSearchingPatient(true);
      const { data, error } = await supabase
        .from("patients")
        .select("id, full_name, medical_record_number")
        .or(`full_name.ilike.%${patientSearch}%,medical_record_number.ilike.%${patientSearch}%`)
        .limit(10);

      if (!error && data) {
        setPatients(data);
      }
      setSearchingPatient(false);
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [patientSearch]);

  const onSubmit = async (data: SurgeryFormValues) => {
    try {
      await createSurgery.mutateAsync({
        ...data,
        operating_room_id: data.operating_room_id || null,
      });
      onSuccess();
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="max-h-[60vh] pr-4">
        <div className="space-y-6">
        {/* Patient Selection */}
        <div className="space-y-2">
          <FormLabel>Pasien</FormLabel>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pasien (nama/RM)..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchingPatient && <p className="text-sm text-muted-foreground">Mencari...</p>}
          {patients.length > 0 && (
            <div className="border rounded-md max-h-40 overflow-y-auto">
              {patients.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                  onClick={() => {
                    form.setValue("patient_id", patient.id);
                    setSelectedPatient({ id: patient.id, full_name: patient.full_name });
                    setPatients([]);
                    setPatientSearch("");
                  }}
                >
                  <p className="font-medium">{patient.full_name}</p>
                  <p className="text-sm text-muted-foreground">{patient.medical_record_number}</p>
                </button>
              ))}
            </div>
          )}
          {selectedPatient && (
            <div className="p-2 bg-muted rounded-md">
              <p className="text-sm">Pasien terpilih: <strong>{selectedPatient.full_name}</strong></p>
            </div>
          )}
          {form.formState.errors.patient_id && (
            <p className="text-sm text-destructive">{form.formState.errors.patient_id.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Operating Room */}
          <FormField
            control={form.control}
            name="operating_room_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ruang Operasi</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ruang OK" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {operatingRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.room_number} - {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Procedure Type */}
          <FormField
            control={form.control}
            name="procedure_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Prosedur</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="elective">Elektif</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Cito / Emergency</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
          <FormField
            control={form.control}
            name="scheduled_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Operasi</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Start Time */}
          <FormField
            control={form.control}
            name="scheduled_start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waktu Mulai</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Time */}
          <FormField
            control={form.control}
            name="scheduled_end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Waktu Selesai (Est.)</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Wound Class */}
          <FormField
            control={form.control}
            name="wound_class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Klasifikasi Luka</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih klasifikasi" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="clean">Clean</SelectItem>
                    <SelectItem value="clean_contaminated">Clean-Contaminated</SelectItem>
                    <SelectItem value="contaminated">Contaminated</SelectItem>
                    <SelectItem value="dirty">Dirty/Infected</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Anesthesia Type */}
          <FormField
            control={form.control}
            name="anesthesia_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Anestesi</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe anestesi" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">General Anesthesia</SelectItem>
                    <SelectItem value="regional">Regional Anesthesia</SelectItem>
                    <SelectItem value="local">Local Anesthesia</SelectItem>
                    <SelectItem value="sedation">Sedation</SelectItem>
                    <SelectItem value="combined">Combined</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* ASA Classification */}
          <FormField
            control={form.control}
            name="asa_classification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Klasifikasi ASA</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih ASA" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ASA_I">ASA I - Sehat</SelectItem>
                    <SelectItem value="ASA_II">ASA II - Penyakit Sistemik Ringan</SelectItem>
                    <SelectItem value="ASA_III">ASA III - Penyakit Sistemik Berat</SelectItem>
                    <SelectItem value="ASA_IV">ASA IV - Penyakit Mengancam Jiwa</SelectItem>
                    <SelectItem value="ASA_V">ASA V - Moribund</SelectItem>
                    <SelectItem value="ASA_VI">ASA VI - Brain Dead (Donor Organ)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Procedure Name */}
        <FormField
          control={form.control}
          name="procedure_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Prosedur / Tindakan</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Appendectomy, Cholecystectomy, dll" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Procedure Code */}
        <FormField
          control={form.control}
          name="procedure_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kode Prosedur (ICD-9 CM)</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: 47.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pre-operative Diagnosis */}
        <FormField
          control={form.control}
          name="preoperative_diagnosis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Diagnosis Pre-Operasi</FormLabel>
              <FormControl>
                <Textarea placeholder="Masukkan diagnosis pre-operasi..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Pre-operative Notes */}
        <FormField
          control={form.control}
          name="preoperative_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan Pre-Operasi</FormLabel>
              <FormControl>
                <Textarea placeholder="Catatan tambahan (opsional)..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Batal
          </Button>
          <Button type="submit" disabled={createSurgery.isPending}>
            {createSurgery.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Simpan Jadwal
          </Button>
        </div>
      </form>
    </Form>
  );
}
