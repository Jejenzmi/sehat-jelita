import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import zenLogo from "@/assets/zen-logo.webp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session, signIn, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user && session) {
      navigate("/", { replace: true });
    }
  }, [user, session, authLoading, navigate]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  // If already authenticated, show loading while redirecting
  if (user && session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Mengalihkan...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      loginSchema.parse(loginData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0] as string] = err.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: error.message === "Invalid login credentials" 
          ? "Email atau password salah" 
          : error.message,
      });
    } else {
          toast({
            title: "Login Berhasil",
            description: "Selamat datang di SIMRS ZEN⁺",
          });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <div className="mb-8">
            <img src={zenLogo} alt="PT. Zen Multimedia Indonesia" className="h-16 mx-auto" />
          </div>
          <h1 className="text-4xl font-bold mb-4">SIMRS ZEN⁺</h1>
          <p className="text-xl mb-6 opacity-90">Sistem Informasi Manajemen Rumah Sakit</p>
          <p className="text-sm opacity-75">
            Platform terintegrasi untuk pengelolaan rumah sakit modern. 
            Mendukung BPJS Kesehatan, SATU SEHAT, dan standar Kemenkes RI.
          </p>
          
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur">
              <p className="text-2xl font-bold">100+</p>
              <p className="text-xs opacity-75">Modul</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs opacity-75">Dukungan</p>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur">
              <p className="text-2xl font-bold">99.9%</p>
              <p className="text-xs opacity-75">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img src={zenLogo} alt="PT. Zen Multimedia Indonesia" className="h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold">SIMRS ZEN⁺</h1>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Selamat Datang</h2>
              <p className="text-muted-foreground">Masuk ke akun SIMRS ZEN⁺ Anda</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@simrs.com"
                    className="pl-10"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full gradient-primary shadow-glow" disabled={isLoading}>
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
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Dengan masuk, Anda menyetujui Syarat & Ketentuan dan Kebijakan Privasi SIMRS ZEN⁺.
          </p>
        </div>
      </div>
    </div>
  );
}
