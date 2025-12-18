import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, Mail, MapPin, Calendar, CreditCard, Heart, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PatientData {
  id: string;
  full_name: string;
  medical_record_number: string;
  nik: string;
  birth_date: string;
  birth_place: string | null;
  gender: string;
  blood_type: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  bpjs_number: string | null;
  allergy_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
}

export default function PatientProfile() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPatientData();
    }
  }, [user]);

  const fetchPatientData = async () => {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setPatient(data);
    } catch (error) {
      console.error("Error fetching patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Data pasien tidak ditemukan</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{patient.full_name}</CardTitle>
                <CardDescription className="text-base">
                  No. Rekam Medis: {patient.medical_record_number}
                </CardDescription>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">
                    {patient.gender === "L" ? "Laki-laki" : "Perempuan"}
                  </Badge>
                  {patient.blood_type && (
                    <Badge variant="outline">Gol. Darah: {patient.blood_type}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Informasi Pribadi
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">NIK</p>
                    <p className="font-medium">{patient.nik}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tanggal Lahir</p>
                    <p className="font-medium">
                      {patient.birth_place && `${patient.birth_place}, `}
                      {format(new Date(patient.birth_date), "d MMMM yyyy", { locale: id })}
                    </p>
                  </div>
                </div>
                {patient.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telepon</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{patient.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                Alamat
              </h4>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium">
                    {patient.address || "-"}
                    {patient.city && `, ${patient.city}`}
                    {patient.province && `, ${patient.province}`}
                  </p>
                </div>
              </div>

              {patient.bpjs_number && (
                <>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mt-6">
                    Asuransi
                  </h4>
                  <div className="flex items-center gap-3">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">No. BPJS</p>
                      <p className="font-medium">{patient.bpjs_number}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allergy Warning */}
      {patient.allergy_notes && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Riwayat Alergi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{patient.allergy_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contact */}
      {patient.emergency_contact_name && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kontak Darurat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{patient.emergency_contact_name}</p>
                <p className="text-sm text-muted-foreground">
                  {patient.emergency_contact_relation}
                </p>
              </div>
              {patient.emergency_contact_phone && (
                <Badge variant="outline" className="font-mono">
                  {patient.emergency_contact_phone}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
