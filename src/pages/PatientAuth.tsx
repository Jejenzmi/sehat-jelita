import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, Heart, Shield, Calendar } from "lucide-react";

export default function PatientAuth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerNIK, setRegisterNIK] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      // Check if user has linked patient record
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      if (!patient) {
        toast.error("Akun Anda belum terhubung dengan data pasien. Silakan hubungi admin rumah sakit.");
        await supabase.auth.signOut();
        return;
      }

      toast.success("Login berhasil!");
      navigate("/patient-portal");
    } catch (error: any) {
      toast.error(error.message || "Login gagal");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First check if patient with NIK exists
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("id, user_id")
        .eq("nik", registerNIK)
        .single();

      if (!existingPatient) {
        toast.error("NIK tidak ditemukan dalam sistem. Pastikan Anda sudah pernah berobat di rumah sakit ini.");
        setIsLoading(false);
        return;
      }

      if (existingPatient.user_id) {
        toast.error("NIK ini sudah terdaftar dengan akun lain.");
        setIsLoading(false);
        return;
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerEmail,
        password: registerPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/patient-portal`,
          data: {
            full_name: registerFullName,
            is_patient: true,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Link patient record to user
        const { error: updateError } = await supabase
          .from("patients")
          .update({ 
            user_id: authData.user.id,
            email: registerEmail,
            phone: registerPhone || undefined 
          })
          .eq("id", existingPatient.id);

        if (updateError) throw updateError;
      }

      toast.success("Registrasi berhasil! Silakan cek email Anda untuk verifikasi.");
    } catch (error: any) {
      toast.error(error.message || "Registrasi gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden md:block space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Portal Pasien</h1>
            <p className="text-xl text-muted-foreground">
              Akses informasi kesehatan Anda kapan saja, di mana saja
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Rekam Medis Digital</h3>
                <p className="text-sm text-muted-foreground">
                  Lihat riwayat kesehatan dan hasil pemeriksaan Anda secara lengkap
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold">E-Prescription dengan QR</h3>
                <p className="text-sm text-muted-foreground">
                  Ambil obat di farmasi dengan scan QR code - tanpa antri
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Booking Online</h3>
                <p className="text-sm text-muted-foreground">
                  Jadwalkan kunjungan dokter secara online dengan mudah
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Selamat Datang</CardTitle>
            <CardDescription>
              Masuk atau daftar untuk mengakses portal pasien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Masuk</TabsTrigger>
                <TabsTrigger value="register">Daftar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      "Masuk"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-nik">NIK (Nomor Induk Kependudukan)</Label>
                    <Input
                      id="register-nik"
                      type="text"
                      placeholder="16 digit NIK"
                      value={registerNIK}
                      onChange={(e) => setRegisterNIK(e.target.value)}
                      maxLength={16}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      NIK harus sesuai dengan data saat Anda berobat
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nama Lengkap</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Nama sesuai KTP"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-phone">No. Telepon (Opsional)</Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      "Daftar"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Staff rumah sakit?{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/auth")}>
                  Login di sini
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
