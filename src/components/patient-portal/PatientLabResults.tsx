import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TestTube, Calendar, Download, Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface LabResult {
  id: string;
  lab_number: string;
  request_date: string;
  result_date: string | null;
  status: string;
  results: any;
  notes: string | null;
  template: {
    name: string;
    category: string | null;
    parameters: any;
    normal_values: any;
  } | null;
}

export default function PatientLabResults() {
  const { user } = useAuth();
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<LabResult | null>(null);

  useEffect(() => {
    if (user) {
      fetchLabResults();
    }
  }, [user]);

  const fetchLabResults = async () => {
    try {
      // First get patient ID
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!patient) return;

      const { data, error } = await supabase
        .from("lab_results")
        .select(`
          id,
          lab_number,
          request_date,
          result_date,
          status,
          results,
          notes,
          template:template_id (
            name,
            category,
            parameters,
            normal_values
          )
        `)
        .eq("patient_id", patient.id)
        .order("request_date", { ascending: false });

      if (error) throw error;
      setLabResults(data || []);
    } catch (error) {
      console.error("Error fetching lab results:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu</Badge>;
      case "processing":
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"><Clock className="h-3 w-3 mr-1" />Diproses</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (labResults.length === 0) {
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
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Hasil Laboratorium
            </CardTitle>
            <CardDescription>
              Riwayat pemeriksaan laboratorium Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {labResults.map((result) => (
                  <Card key={result.id} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">{result.template?.name || "Pemeriksaan Lab"}</p>
                          <p className="text-sm text-muted-foreground">
                            No: {result.lab_number}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(result.request_date), "d MMM yyyy", { locale: id })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(result.status)}
                          {result.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedResult(result)}
                            >
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
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Result Detail Dialog */}
      <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Hasil Laboratorium</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">No. Lab</p>
                  <p className="font-medium">{selectedResult.lab_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jenis Pemeriksaan</p>
                  <p className="font-medium">{selectedResult.template?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal Permintaan</p>
                  <p className="font-medium">
                    {format(new Date(selectedResult.request_date), "d MMMM yyyy", { locale: id })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal Hasil</p>
                  <p className="font-medium">
                    {selectedResult.result_date 
                      ? format(new Date(selectedResult.result_date), "d MMMM yyyy", { locale: id })
                      : "-"}
                  </p>
                </div>
              </div>

              {selectedResult.results && Object.keys(selectedResult.results).length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium">Parameter</th>
                        <th className="text-left p-3 text-sm font-medium">Hasil</th>
                        <th className="text-left p-3 text-sm font-medium">Nilai Normal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(selectedResult.results).map(([key, value]) => (
                        <tr key={key} className="border-t">
                          <td className="p-3 text-sm">{key}</td>
                          <td className="p-3 text-sm font-medium">{String(value)}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {selectedResult.template?.normal_values?.[key] || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedResult.notes && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Catatan</p>
                  <p className="text-sm text-muted-foreground">{selectedResult.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
