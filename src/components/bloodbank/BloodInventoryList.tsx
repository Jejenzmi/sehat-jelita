import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBloodInventory } from "@/hooks/useBloodBankData";
import { format, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";

export function BloodInventoryList() {
  const { data: inventory, isLoading } = useBloodInventory();

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500">Tersedia</Badge>;
      case "reserved":
        return <Badge className="bg-yellow-500">Reserved</Badge>;
      case "crossmatched":
        return <Badge className="bg-blue-500">Crossmatched</Badge>;
      case "issued":
        return <Badge className="bg-purple-500">Issued</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getExpiryBadge = (expiryDate: string) => {
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days <= 0) {
      return <Badge variant="destructive">Expired</Badge>;
    } else if (days <= 3) {
      return <Badge className="bg-orange-500">{days} hari</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-yellow-500">{days} hari</Badge>;
    }
    return <span className="text-sm">{days} hari</span>;
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
    return <div className="text-center py-8">Memuat data inventori...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventori Darah</CardTitle>
      </CardHeader>
      <CardContent>
        {inventory?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Tidak ada stok darah
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Kantong</TableHead>
                <TableHead>Gol. Darah</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>Tgl. Pengambilan</TableHead>
                <TableHead>Sisa Waktu</TableHead>
                <TableHead>Screening</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.bag_number}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold">
                      {item.blood_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{productTypeLabels[item.product_type] || item.product_type}</TableCell>
                  <TableCell>{item.volume} ml</TableCell>
                  <TableCell>
                    {format(new Date(item.collection_date), "dd MMM yyyy", { locale: id })}
                  </TableCell>
                  <TableCell>{getExpiryBadge(item.expiry_date)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {item.hiv_status === 'negative' && item.hbsag_status === 'negative' && 
                       item.hcv_status === 'negative' ? (
                        <Badge className="bg-green-500 text-xs">Clear</Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">Check</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
