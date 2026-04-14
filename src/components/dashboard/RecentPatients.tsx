import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Loader2 } from "lucide-react";
import { useRecentPatients } from "@/hooks/useDashboardData";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

const statusStyles: Record<string, string> = {
  menunggu: "bg-warning/10 text-warning border-warning/20",
  dipanggil: "bg-info/10 text-info border-info/20",
  dilayani: "bg-success/10 text-success border-success/20",
  selesai: "bg-muted text-muted-foreground border-border",
  dibatalkan: "bg-destructive/10 text-destructive border-destructive/20",
};

const paymentStyles: Record<string, string> = {
  bpjs: "bg-primary/10 text-primary",
  umum: "bg-muted text-muted-foreground",
  asuransi: "bg-medical-purple/10 text-medical-purple",
};

export function RecentPatients() {
  const { data: patients, isLoading, error } = useRecentPatients();

  if (isLoading) {
    return (
      <div className="module-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Pasien Terbaru</h3>
            <p className="text-sm text-muted-foreground">Memuat data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="module-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Pasien Terbaru</h3>
            <p className="text-sm text-muted-foreground">Gagal memuat data</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Terjadi kesalahan saat memuat data pasien
        </div>
      </div>
    );
  }

  return (
    <div className="module-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Pasien Terbaru</h3>
          <p className="text-sm text-muted-foreground">Daftar pasien hari ini</p>
        </div>
        <Button variant="outline" size="sm">
          Lihat Semua
        </Button>
      </div>

      {patients && patients.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. RM</th>
                <th>Pasien</th>
                <th>Layanan</th>
                <th>Pembayaran</th>
                <th>Status</th>
                <th>Jam</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => {
                const visitDate = patient.visit_date ? new Date(patient.visit_date) : null;
                const timeStr = visitDate ? format(visitDate, "HH:mm", { locale: localeID }) : "-";
                const age = patient.birth_date ? calculateAge(new Date(patient.birth_date)) : null;
                const genderLabel = patient.gender === "male" ? "Laki-laki" : patient.gender === "female" ? "Perempuan" : "-";

                return (
                  <tr key={patient.id}>
                    <td className="font-mono text-xs">{patient.medical_record_number || "-"}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {patient.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{patient.full_name || "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {genderLabel}{age ? `, ${age} tahun` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">{patient.visit_type === "rawat_jalan" ? "Rawat Jalan" : patient.visit_type === "igd" ? "IGD" : patient.visit_type === "rawat_inap" ? "Rawat Inap" : patient.visit_type || "-"}</td>
                    <td>
                      <Badge variant="secondary" className={paymentStyles[patient.payment_type || "umum"]}>
                        {(patient.payment_type || "umum").charAt(0).toUpperCase() + (patient.payment_type || "umum").slice(1)}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant="outline" className={statusStyles[patient.status || "menunggu"]}>
                        {(patient.status || "menunggu").charAt(0).toUpperCase() + (patient.status || "menunggu").slice(1)}
                      </Badge>
                    </td>
                    <td className="text-sm text-muted-foreground">{timeStr}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Belum ada pasien hari ini
        </div>
      )}
    </div>
  );
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
