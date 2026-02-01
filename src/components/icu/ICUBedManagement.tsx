import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useICUBeds, useUpdateICUBed } from "@/hooks/useICUData";
import { BedDouble, Wind, Monitor, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ICUBedManagement() {
  const { data: beds, isLoading } = useICUBeds();
  const updateBed = useUpdateICUBed();

  const icuTypeLabels: Record<string, string> = {
    icu: "ICU",
    iccu: "ICCU",
    nicu: "NICU",
    picu: "PICU",
    hcu: "HCU",
  };

  const toggleAvailability = (id: string, currentStatus: boolean | null) => {
    updateBed.mutate({ id, is_available: !currentStatus });
  };

  if (isLoading) {
    return <div className="text-center py-8">Memuat data bed...</div>;
  }

  // Group beds by type
  const bedsByType = beds?.reduce((acc, bed) => {
    const type = bed.icu_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(bed);
    return acc;
  }, {} as Record<string, typeof beds>);

  return (
    <div className="space-y-6">
      {bedsByType && Object.entries(bedsByType).map(([type, typeBeds]) => (
        <Card key={type}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="h-5 w-5" />
              {icuTypeLabels[type] || type.toUpperCase()}
              <Badge variant="outline" className="ml-2">
                {typeBeds?.filter(b => b.is_available).length} / {typeBeds?.length} tersedia
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {typeBeds?.map((bed) => (
                <div
                  key={bed.id}
                  className={`p-4 rounded-lg border-2 ${
                    bed.is_available
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{bed.bed_number}</span>
                    {bed.is_available ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    {bed.has_ventilator && (
                      <Badge variant="secondary" className="text-xs">
                        <Wind className="h-3 w-3 mr-1" />
                        Ventilator
                      </Badge>
                    )}
                    {bed.has_monitor && (
                      <Badge variant="secondary" className="text-xs">
                        <Monitor className="h-3 w-3 mr-1" />
                        Monitor
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => toggleAvailability(bed.id, bed.is_available)}
                    disabled={updateBed.isPending}
                  >
                    {bed.is_available ? "Set Terisi" : "Set Tersedia"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
