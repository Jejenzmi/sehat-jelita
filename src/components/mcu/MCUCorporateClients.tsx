import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useMCUData } from "@/hooks/useMCUData";

export function MCUCorporateClients() {
  const { corporateClients, loadingClients } = useMCUData();

  if (loadingClients) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Klien Korporat</CardTitle>
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
        <CardTitle>Klien Korporat</CardTitle>
      </CardHeader>
      <CardContent>
        {corporateClients && corporateClients.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Perusahaan</TableHead>
                <TableHead>PIC</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Kontrak</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {corporateClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-mono text-sm">
                    {client.company_code || "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {client.company_name}
                  </TableCell>
                  <TableCell>{client.pic_name || "-"}</TableCell>
                  <TableCell>{client.phone || "-"}</TableCell>
                  <TableCell>
                    {client.discount_percentage ? `${client.discount_percentage}%` : "-"}
                  </TableCell>
                  <TableCell>
                    {client.contract_start && client.contract_end ? (
                      <span className="text-xs">
                        {new Date(client.contract_start).toLocaleDateString("id-ID")} - {" "}
                        {new Date(client.contract_end).toLocaleDateString("id-ID")}
                      </span>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.is_active ? "default" : "secondary"}>
                      {client.is_active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada klien korporat terdaftar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
