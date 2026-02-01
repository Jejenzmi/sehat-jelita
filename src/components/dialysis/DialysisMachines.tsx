import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDialysisMachines } from "@/hooks/useDialysisData";
import { Cpu, CheckCircle, XCircle, Wrench } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export function DialysisMachines() {
  const { data: machines, isLoading } = useDialysisMachines();

  if (isLoading) {
    return <div className="text-center py-8">Memuat data mesin...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Daftar Mesin Hemodialisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {machines?.map((machine) => (
              <div
                key={machine.id}
                className={`p-4 rounded-lg border-2 ${
                  machine.is_available
                    ? "border-green-200 bg-green-50"
                    : "border-orange-200 bg-orange-50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{machine.machine_number}</span>
                  {machine.is_available ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="text-muted-foreground">
                    {machine.brand} {machine.model}
                  </div>
                  <Badge variant={machine.is_available ? "default" : "secondary"}>
                    {machine.is_available ? "Tersedia" : "Digunakan"}
                  </Badge>
                </div>

                {machine.next_maintenance_date && (
                  <div className="mt-3 pt-3 border-t text-xs flex items-center gap-1 text-muted-foreground">
                    <Wrench className="h-3 w-3" />
                    Maintenance: {format(new Date(machine.next_maintenance_date), "dd MMM yyyy", { locale: id })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
