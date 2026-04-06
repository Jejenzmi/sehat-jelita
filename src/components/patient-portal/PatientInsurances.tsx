import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Star, Calendar, CheckCircle, XCircle } from "lucide-react";
import { getInsurances, type Insurance } from "@/lib/patient-portal-api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

export default function PatientInsurances() {
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInsurances(); }, []);

  const fetchInsurances = async () => {
    try {
      const data = await getInsurances();
      setInsurances(data);
    } catch {
      toast.error("Gagal memuat data asuransi");
    } finally {
      setLoading(false);
    }
  };

  const isExpiringSoon = (validUntil: string | null) => {
    if (!validUntil) return false;
    const daysLeft = Math.floor((new Date(validUntil).getTime() - Date.now()) / 86_400_000);
    return daysLeft >= 0 && daysLeft <= 30;
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  if (insurances.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Belum ada data asuransi</p>
          <p className="text-xs text-muted-foreground mt-2">
            Hubungi petugas pendaftaran untuk menambahkan asuransi
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Asuransi Kesehatan</h3>
        <p className="text-sm text-muted-foreground">Data asuransi yang terdaftar</p>
      </div>

      <div className="grid gap-4">
        {insurances.map(insurance => (
          <Card key={insurance.id} className={!insurance.is_active || isExpired(insurance.valid_until) ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {insurance.insurance_name || insurance.insurance_type}
                      {insurance.is_active && !isExpired(insurance.valid_until) ? (
                        <Badge className="bg-green-500/10 text-green-600 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          <XCircle className="h-3 w-3 mr-1" />
                          {isExpired(insurance.valid_until) ? "Kadaluarsa" : "Tidak Aktif"}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="uppercase text-xs">{insurance.insurance_type}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">No. Kartu / Polis</p>
                  <p className="font-medium font-mono">{insurance.insurance_number}</p>
                </div>
                {insurance.valid_until && (
                  <div>
                    <p className="text-muted-foreground">Berlaku Sampai</p>
                    <p className={`font-medium flex items-center gap-1 ${isExpiringSoon(insurance.valid_until) ? "text-orange-600" : ""}`}>
                      <Calendar className="h-3 w-3" />
                      {format(new Date(insurance.valid_until), "d MMM yyyy", { locale: id })}
                      {isExpiringSoon(insurance.valid_until) && (
                        <Badge variant="outline" className="text-orange-600 text-xs ml-1">Segera Habis</Badge>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
