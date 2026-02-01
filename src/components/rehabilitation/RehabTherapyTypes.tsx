import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRehabilitationData } from "@/hooks/useRehabilitationData";
import { Activity, Clock, Banknote } from "lucide-react";

export function RehabTherapyTypes() {
  const { therapyTypes, loadingTherapyTypes } = useRehabilitationData();

  if (loadingTherapyTypes) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "physiotherapy":
        return "bg-blue-100 text-blue-800";
      case "occupational_therapy":
        return "bg-green-100 text-green-800";
      case "speech_therapy":
        return "bg-purple-100 text-purple-800";
      case "hydrotherapy":
        return "bg-cyan-100 text-cyan-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "physiotherapy":
        return "Fisioterapi";
      case "occupational_therapy":
        return "Terapi Okupasi";
      case "speech_therapy":
        return "Terapi Wicara";
      case "hydrotherapy":
        return "Hidroterapi";
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {therapyTypes?.map((therapy) => (
        <Card key={therapy.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{therapy.name}</CardTitle>
            <Badge className={getTypeColor(therapy.type)}>
              {getTypeLabel(therapy.type)}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {therapy.description || "Tidak ada deskripsi"}
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{therapy.duration_minutes} menit</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Banknote className="h-4 w-4 text-muted-foreground" />
                <span>{therapy.unit_price ? formatCurrency(Number(therapy.unit_price)) : "-"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span>{therapy.is_active ? "Aktif" : "Tidak Aktif"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )) || (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          Tidak ada jenis terapi tersedia
        </div>
      )}
    </div>
  );
}
