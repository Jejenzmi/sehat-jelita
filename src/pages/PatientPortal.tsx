import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, FileText, TestTube, Pill, Calendar, 
  Download, Eye, QrCode, Clock, CheckCircle,
  AlertCircle, Phone, Mail, MapPin, LogOut, Shield
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/db";
import { toast } from "sonner";
import PatientLabResults from "@/components/patient-portal/PatientLabResults";
import PatientMedicalRecords from "@/components/patient-portal/PatientMedicalRecords";
import PatientPrescriptions from "@/components/patient-portal/PatientPrescriptions";
import PatientAppointments from "@/components/patient-portal/PatientAppointments";
import PatientProfile from "@/components/patient-portal/PatientProfile";
import PatientInsurances from "@/components/patient-portal/PatientInsurances";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

export default function PatientPortal() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/patient-auth");
    toast.success("Berhasil keluar dari portal pasien");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Portal Pasien</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setLogoutConfirmOpen(true)}>
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        title="Konfirmasi Keluar"
        description="Apakah Anda yakin ingin keluar dari Portal Pasien?"
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        type="warning"
        onConfirm={handleSignOut}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl mx-auto">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </TabsTrigger>
            <TabsTrigger value="insurance" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Asuransi</span>
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Rekam Medis</span>
            </TabsTrigger>
            <TabsTrigger value="lab" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Lab</span>
            </TabsTrigger>
            <TabsTrigger value="prescriptions" className="flex items-center gap-2">
              <Pill className="h-4 w-4" />
              <span className="hidden sm:inline">Resep</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Jadwal</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <PatientProfile />
          </TabsContent>

          <TabsContent value="insurance">
            <PatientInsurances />
          </TabsContent>

          <TabsContent value="records">
            <PatientMedicalRecords />
          </TabsContent>

          <TabsContent value="lab">
            <PatientLabResults />
          </TabsContent>

          <TabsContent value="prescriptions">
            <PatientPrescriptions />
          </TabsContent>

          <TabsContent value="appointments">
            <PatientAppointments />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
