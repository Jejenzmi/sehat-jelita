import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMCUData } from "@/hooks/useMCUData";

export function MCUReports() {
  const { registrations, summaryReports } = useMCUData();

  const completedCount = registrations?.filter((r: any) => r.status === "completed").length || 0;
  const totalRevenue = registrations?.reduce((sum: number, r: any) => sum + (Number(r.final_price) || 0), 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Statistik MCU</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Pendaftaran</span>
              <span className="text-lg font-bold">{registrations?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">MCU Selesai</span>
              <span className="text-lg font-bold text-primary">{completedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Pendapatan</span>
              <span className="text-lg font-bold">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Laporan Diterbitkan</span>
              <span className="text-lg font-bold">{summaryReports?.length || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Kesehatan Peserta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Fit for Work</span>
              <span className="text-lg font-bold text-primary">78%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Fit with Conditions</span>
              <span className="text-lg font-bold">18%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Temporarily Unfit</span>
              <span className="text-lg font-bold text-amber-600">3%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Perlu Follow-up</span>
              <span className="text-lg font-bold text-destructive">1%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
