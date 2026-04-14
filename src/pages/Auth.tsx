import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, loading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isAuthenticated = !!user;

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ height: "32px", width: "32px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "4px solid #3b82f6", borderTopColor: "transparent", margin: "0 auto 16px" }} />
          <p style={{ color: "#6b7280" }}>Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" }}>
        <p style={{ color: "#6b7280" }}>Mengalihkan ke dashboard...</p>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: error.message || "Email atau password salah",
        });
      } else {
        toast({
          title: "Login Berhasil",
          description: "Selamat datang di SIMRS ZEN",
        });
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Terjadi kesalahan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#ffffff" }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-[#1B4332]">
        <div style={{ maxWidth: "28rem", textAlign: "center", color: "white" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>SIMRS ZEN</h1>
          <p style={{ fontSize: "1.125rem", marginBottom: "1.5rem", opacity: 0.9 }}>Sistem Informasi Manajemen Rumah Sakit</p>
          <p style={{ fontSize: "0.875rem", opacity: 0.75 }}>Platform terintegrasi untuk pengelolaan rumah sakit modern.</p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", backgroundColor: "#ffffff" }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#111827", marginBottom: "0.5rem" }}>Selamat Datang</h2>
            <p style={{ color: "#6b7280" }}>Masuk ke akun SIMRS ZEN Anda</p>
          </div>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <Label htmlFor="email">Email</Label>
              <div style={{ position: "relative", marginTop: "0.5rem" }}>
                <Mail style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", height: "16px", width: "16px", color: "#9ca3af" }} />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@simrszen.local"
                  style={{ paddingLeft: "2.5rem" }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div style={{ position: "relative", marginTop: "0.5rem" }}>
                <Lock style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", height: "16px", width: "16px", color: "#9ca3af" }} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}
                >
                  {showPassword ? <EyeOff style={{ height: "16px", width: "16px" }} /> : <Eye style={{ height: "16px", width: "16px" }} />}
                </button>
              </div>
            </div>

            <Button type="submit" style={{ width: "100%", backgroundColor: "#1B4332", color: "white" }} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 style={{ marginRight: "8px", height: "16px", width: "16px" }} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          {import.meta.env.DEV && (
            <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb" }}>
              <p style={{ textAlign: "center", fontSize: "0.875rem", color: "#6b7280" }}>
                <strong>Default Login (Development Only):</strong>
              </p>
              <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>
                Email: admin@simrszen.local | Password: Admin@123!
              </p>
            </div>
          )}

          <p style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.75rem", color: "#9ca3af" }}>
            © {new Date().getFullYear()} PT Zen Multimedia Indonesia
          </p>
        </div>
      </div>
    </div>
  );
}
