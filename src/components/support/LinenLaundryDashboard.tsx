import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shirt, Droplets, Package, AlertCircle } from "lucide-react";

export default function LinenLaundryDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shirt className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">1,250</p>
                <p className="text-sm text-muted-foreground">Total Linen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-info" />
              <div>
                <p className="text-2xl font-bold">85</p>
                <p className="text-sm text-muted-foreground">Dalam Pencucian</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-success" />
              <div>
                <p className="text-2xl font-bold">1,120</p>
                <p className="text-sm text-muted-foreground">Bersih & Siap</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Perlu Penggantian</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Batch Laundry Terkini</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Modul Linen/Laundry siap digunakan.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
