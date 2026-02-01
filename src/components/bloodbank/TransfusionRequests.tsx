import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransfusionRequests } from "@/hooks/useBloodBankData";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function TransfusionRequests() {
  const { data: requests, isLoading } = useTransfusionRequests();

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-500">Processing</Badge>;
      case "ready":
        return <Badge className="bg-green-500">Ready</Badge>;
      case "issued":
        return <Badge className="bg-purple-500">Issued</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string | null) => {
    switch (urgency) {
      case "emergency":
        return <Badge variant="destructive">Emergency</Badge>;
      case "urgent":
        return <Badge className="bg-orange-500">Urgent</Badge>;
      default:
        return <Badge variant="outline">Routine</Badge>;
    }
  };

  const productTypeLabels: Record<string, string> = {
    'whole_blood': 'Whole Blood',
    'prc': 'PRC',
    'ffp': 'FFP',
    'tc': 'TC',
    'cryoprecipitate': 'Cryo',
    'platelets': 'Platelets',
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat data permintaan...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permintaan Transfusi</CardTitle>
      </CardHeader>
      <CardContent>
        {requests?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada permintaan transfusi
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Permintaan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pasien</TableHead>
                <TableHead>Gol. Darah</TableHead>
                <TableHead>Produk</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Indikasi</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.request_number}</TableCell>
                  <TableCell>
                    {format(new Date(request.request_date), "dd MMM yyyy HH:mm", { locale: id })}
                  </TableCell>
                  <TableCell>
                    <div>{request.patients?.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {request.patients?.medical_record_number}
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.patient_blood_type ? (
                      <Badge variant="outline" className="font-bold">
                        {request.patient_blood_type}
                      </Badge>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{productTypeLabels[request.product_type] || request.product_type}</TableCell>
                  <TableCell>{request.units_requested} unit</TableCell>
                  <TableCell className="max-w-[200px] truncate">{request.indication}</TableCell>
                  <TableCell>{getUrgencyBadge(request.urgency)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
