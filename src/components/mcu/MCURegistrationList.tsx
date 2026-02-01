import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useMCUData } from "@/hooks/useMCUData";

export function MCURegistrationList() {
  const { registrations, loadingRegistrations, updateRegistrationStatus } = useMCUData();

  if (loadingRegistrations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pendaftaran MCU</CardTitle>
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600">Selesai</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-600">Berlangsung</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Batal</Badge>;
      default:
        return <Badge variant="outline">Terdaftar</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      basic: "bg-gray-100 text-gray-800",
      standard: "bg-blue-100 text-blue-800",
      executive: "bg-purple-100 text-purple-800",
      comprehensive: "bg-amber-100 text-amber-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Pendaftaran MCU</CardTitle>
      </CardHeader>
      <CardContent>
        {registrations && registrations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Registrasi</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Perusahaan</TableHead>
                <TableHead>Tgl. Pemeriksaan</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((reg: any) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-mono text-sm">
                    {reg.registration_number}
                  </TableCell>
                  <TableCell className="font-medium">
                    {reg.patients?.full_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryBadge(reg.mcu_packages?.category)}>
                      {reg.mcu_packages?.package_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {reg.corporate_clients?.company_name || "Personal"}
                  </TableCell>
                  <TableCell>
                    {reg.examination_date
                      ? new Date(reg.examination_date).toLocaleDateString("id-ID")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {reg.final_price ? formatCurrency(Number(reg.final_price)) : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(reg.status)}</TableCell>
                  <TableCell>
                    {reg.status === "registered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRegistrationStatus.mutate({ id: reg.id, status: "in_progress" })}
                      >
                        Mulai
                      </Button>
                    )}
                    {reg.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateRegistrationStatus.mutate({ id: reg.id, status: "completed" })}
                      >
                        Selesai
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada pendaftaran MCU
          </div>
        )}
      </CardContent>
    </Card>
  );
}
