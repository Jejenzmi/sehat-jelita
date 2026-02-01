import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useRehabilitationData } from "@/hooks/useRehabilitationData";

export function RehabPatientList() {
  const { assessments, loadingAssessments } = useRehabilitationData();

  if (loadingAssessments) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pasien Rehabilitasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pasien Rehabilitasi</CardTitle>
      </CardHeader>
      <CardContent>
        {assessments && assessments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. RM</TableHead>
                <TableHead>Nama Pasien</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Terapis</TableHead>
                <TableHead>Pain Scale</TableHead>
                <TableHead>Est. Sesi</TableHead>
                <TableHead>Tanggal Assessment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment: any) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-mono text-sm">
                    {assessment.patients?.medical_record_number || "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {assessment.patients?.full_name || "-"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {assessment.diagnosis || "-"}
                  </TableCell>
                  <TableCell>
                    {assessment.doctors?.full_name || assessment.therapist_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={assessment.pain_scale > 5 ? "destructive" : "outline"}>
                      {assessment.pain_scale || 0}/10
                    </Badge>
                  </TableCell>
                  <TableCell>{assessment.estimated_sessions || "-"} sesi</TableCell>
                  <TableCell>
                    {new Date(assessment.assessment_date).toLocaleDateString("id-ID")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada data assessment rehabilitasi
          </div>
        )}
      </CardContent>
    </Card>
  );
}
