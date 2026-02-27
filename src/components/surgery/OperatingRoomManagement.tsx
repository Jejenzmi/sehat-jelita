import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings, CheckCircle, XCircle, Wrench } from "lucide-react";
import { useSurgeryData } from "@/hooks/useSurgeryData";
import { db } from "@/lib/db";
import { toast } from "sonner";

export function OperatingRoomManagement() {
  const { operatingRooms, isLoading, refetchSurgeries } = useSurgeryData();

  const toggleAvailability = async (roomId: string, isAvailable: boolean) => {
    const { error } = await db
      .from("operating_rooms")
      .update({ is_available: !isAvailable })
      .eq("id", roomId);

    if (error) {
      toast.error("Gagal mengubah status ruangan");
    } else {
      toast.success(`Ruangan ${!isAvailable ? 'tersedia' : 'tidak tersedia'}`);
      refetchSurgeries();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Room Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {operatingRooms.map((room) => (
          <Card key={room.id} className={!room.is_available ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{room.room_number}</CardTitle>
                  <p className="text-sm text-muted-foreground">{room.name}</p>
                </div>
                <Badge variant={room.is_available ? "default" : "secondary"}>
                  {room.is_available ? "Tersedia" : "Tidak Tersedia"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipe Ruangan</p>
                  <Badge variant="outline" className="capitalize">{room.room_type}</Badge>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Peralatan</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(room.equipment) && room.equipment.slice(0, 3).map((eq: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {eq}
                      </Badge>
                    ))}
                    {Array.isArray(room.equipment) && room.equipment.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{room.equipment.length - 3} lainnya
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm">Ketersediaan</span>
                  <Switch
                    checked={room.is_available}
                    onCheckedChange={() => toggleAvailability(room.id, room.is_available)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Daftar Ruang Operasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Ruangan</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Peralatan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operatingRooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="font-medium">{room.room_number}</TableCell>
                  <TableCell>{room.name}</TableCell>
                  <TableCell className="capitalize">{room.room_type}</TableCell>
                  <TableCell>
                    {Array.isArray(room.equipment) ? room.equipment.length : 0} item
                  </TableCell>
                  <TableCell>
                    {room.is_available ? (
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span>Tersedia</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span>Tidak Tersedia</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Wrench className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
