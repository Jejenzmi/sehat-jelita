import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useICUBeds, useUpdateICUBed } from "@/hooks/useICUData";
import { BedDouble, Wind, Monitor, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

export function ICUBedManagement() {
  const { data: beds, isLoading } = useICUBeds();
  const updateBed = useUpdateICUBed();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    bedId: string;
    bedNumber: string;
    currentStatus: boolean | null;
  }>({ open: false, bedId: "", bedNumber: "", currentStatus: null });

  const icuTypeLabels: Record<string, string> = {
    icu: "ICU",
    iccu: "ICCU",
    nicu: "NICU",
    picu: "PICU",
    hcu: "HCU",
  };

  const openConfirmDialog = (id: string, bedNumber: string, currentStatus: boolean | null) => {
    setConfirmDialog({ open: true, bedId: id, bedNumber, currentStatus });
  };

  const handleConfirmToggle = () => {
    updateBed.mutate({ id: confirmDialog.bedId, is_available: !confirmDialog.currentStatus });
    setConfirmDialog({ open: false, bedId: "", bedNumber: "", currentStatus: null });
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
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
                      : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
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
                    onClick={() => openConfirmDialog(bed.id, bed.bed_number, bed.is_available)}
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

      {/* Confirmation Dialog for Status Change */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="Konfirmasi Ubah Status Bed"
        description={`Apakah Anda yakin ingin mengubah status bed ${confirmDialog.bedNumber} menjadi ${confirmDialog.currentStatus ? "Terisi" : "Tersedia"}?`}
        confirmLabel="Ya, Ubah"
        cancelLabel="Batal"
        type="confirm"
        isLoading={updateBed.isPending}
        onConfirm={handleConfirmToggle}
      />
    </div>
  );
}
