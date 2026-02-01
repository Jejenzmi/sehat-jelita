import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActiveICUPatients } from "@/hooks/useICUData";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function ICUPatientList() {
  const { data: patients, isLoading } = useActiveICUPatients();

  const icuTypeLabels: Record<string, string> = {
    icu: "ICU",
    iccu: "ICCU",
    nicu: "NICU",
    picu: "PICU",
    hcu: "HCU",
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat data pasien...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pasien Aktif</CardTitle>
      </CardHeader>
      <CardContent>
        {patients?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada pasien aktif saat ini
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Admisi</TableHead>
                <TableHead>Nama Pasien</TableHead>
                <TableHead>No. RM</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Bed</TableHead>
                <TableHead>Tanggal Masuk</TableHead>
                <TableHead>DPJP</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients?.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    {patient.admission_number}
                  </TableCell>
                  <TableCell>{patient.patients?.full_name}</TableCell>
                  <TableCell>{patient.patients?.medical_record_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {icuTypeLabels[patient.icu_type] || patient.icu_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{patient.icu_beds?.bed_number || "-"}</TableCell>
                  <TableCell>
                    {format(new Date(patient.admission_date), "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell>{patient.doctors?.full_name || "-"}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {patient.apache_ii_score && (
                        <Badge variant="secondary" className="text-xs">
                          APACHE II: {patient.apache_ii_score}
                        </Badge>
                      )}
                      {patient.sofa_score && (
                        <Badge variant="secondary" className="text-xs ml-1">
                          SOFA: {patient.sofa_score}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
