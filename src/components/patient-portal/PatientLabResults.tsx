import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TestTube, Calendar, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { getLabResults, type LabOrder } from "@/lib/patient-portal-api";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

export default function PatientLabResults() {
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { fetchLabResults(); }, []);

  const fetchLabResults = async (cursor?: string) => {
    try {
      const json = await getLabResults(cursor);
      if (json.success) {
        if (cursor) {
          setLabOrders(prev => [...prev, ...json.data]);
        } else {
          setLabOrders(json.data);
        }
        setNextCursor(json.next_cursor || null);
      }
    } catch (err) {
      toast.error("Gagal memuat hasil laboratorium");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    fetchLabResults(nextCursor);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-600"><Clock className="h-3 w-3 mr-1" />Diproses</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFlagStyle = (flag: string | null) => {
    if (flag === "critical") return "font-bold text-red-600";
    if (flag === "high" || flag === "low") return "font-semibold text-orange-600";
    return "";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  if (labOrders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Belum ada hasil laboratorium</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Hasil Laboratorium
          </CardTitle>
          <CardDescription>Riwayat pemeriksaan laboratorium Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {labOrders.map(order => (
                <Card key={order.id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {order.lab_results.length > 0
                            ? order.lab_results.map(r => r.test_name).slice(0, 2).join(", ") +
                              (order.lab_results.length > 2 ? ` +${order.lab_results.length - 2} lagi` : "")
                            : "Pemeriksaan Lab"}
                        </p>
                        <p className="text-sm text-muted-foreground">No: {order.order_number}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.order_date), "d MMM yyyy", { locale: id })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(order.status)}
                        {order.status === "completed" && order.lab_results.length > 0 && (
                          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                            <Eye className="h-4 w-4 mr-1" />
                            Lihat
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {nextCursor && (
              <div className="pt-4 text-center">
                <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Memuat..." : "Muat lebih banyak"}
                </Button>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Hasil Laboratorium</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">No. Order</p>
                  <p className="font-medium">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.order_date), "d MMMM yyyy", { locale: id })}
                  </p>
                </div>
              </div>

              {selectedOrder.lab_results.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">Parameter</th>
                        <th className="text-left p-3 font-medium">Hasil</th>
                        <th className="text-left p-3 font-medium">Satuan</th>
                        <th className="text-left p-3 font-medium">Nilai Normal</th>
                        <th className="text-left p-3 font-medium">Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.lab_results.map(r => (
                        <tr key={r.id} className="border-t">
                          <td className="p-3">{r.test_name}</td>
                          <td className={`p-3 font-medium ${getFlagStyle(r.flag)}`}>{r.result_value || "-"}</td>
                          <td className="p-3 text-muted-foreground">{r.unit || "-"}</td>
                          <td className="p-3 text-muted-foreground">{r.reference_range || "-"}</td>
                          <td className="p-3">
                            {r.flag && r.flag !== "normal" ? (
                              <Badge variant="outline" className={getFlagStyle(r.flag)}>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {r.flag.toUpperCase()}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600">Normal</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Catatan</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
