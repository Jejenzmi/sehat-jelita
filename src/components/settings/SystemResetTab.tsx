import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };
async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, RotateCcw, Loader2, ShieldAlert } from "lucide-react";

export default function SystemResetTab() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const resetSystem = useMutation({
    mutationFn: () => apiPost('/admin/system-reset', {}),
    onSuccess: () => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["setup-completed"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-profile"] });
      queryClient.invalidateQueries({ queryKey: ["module-configurations"] });
      queryClient.invalidateQueries({ queryKey: ["available-modules-for-sidebar"] });
      queryClient.invalidateQueries({ queryKey: ["hospital-profile-for-modules"] });
      
      toast({
        title: "Sistem Berhasil Direset",
        description: "Sistem akan kembali ke mode instalasi awal.",
      });
      
      // Redirect to setup wizard
      setTimeout(() => {
        navigate("/setup");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Reset Sistem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleReset = () => {
    if (confirmText === "RESET SISTEM") {
      resetSystem.mutate();
      setIsDialogOpen(false);
      setConfirmText("");
    }
  };

  const isConfirmValid = confirmText === "RESET SISTEM";

  return (
    <div className="space-y-6">
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Reset Sistem
          </CardTitle>
          <CardDescription>
            Mengembalikan sistem ke mode instalasi awal (Setup Wizard)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Peringatan!</AlertTitle>
            <AlertDescription>
              Fitur ini akan mereset konfigurasi sistem ke kondisi awal instalasi:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profil rumah sakit akan direset</li>
                <li>Konfigurasi modul akan dikembalikan ke default</li>
                <li>Sistem akan kembali ke Setup Wizard</li>
                <li><strong>Data master (pasien, kunjungan, dll) TIDAK akan dihapus</strong></li>
              </ul>
            </AlertDescription>
          </Alert>

          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset ke Mode Instalasi
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Konfirmasi Reset Sistem
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>
                    Anda akan mereset sistem ke mode instalasi awal. 
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-reset">
                      Ketik <strong className="text-destructive">RESET SISTEM</strong> untuk mengkonfirmasi:
                    </Label>
                    <Input
                      id="confirm-reset"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="RESET SISTEM"
                      className="font-mono"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  disabled={!isConfirmValid || resetSystem.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {resetSystem.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Mereset...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Sistem
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
