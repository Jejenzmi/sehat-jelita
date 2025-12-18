import { Search, User, Calendar, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { StaffChat } from "@/components/chat/StaffChat";
import { useMedicineStockAlerts, useQueueUpdates } from "@/hooks/useNotifications";

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  // Enable real-time alerts
  useMedicineStockAlerts();
  useQueueUpdates();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedTime = currentTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    dokter: "Dokter",
    perawat: "Perawat",
    kasir: "Kasir",
    farmasi: "Farmasi",
    laboratorium: "Laboratorium",
    radiologi: "Radiologi",
    pendaftaran: "Pendaftaran",
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 lg:px-6">
      {/* Left Section - Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
          <span className="mx-2 text-border">|</span>
          <Clock className="h-4 w-4" />
          <span className="font-medium text-foreground">{formattedTime}</span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari pasien, dokter, atau layanan..."
            className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Staff Chat */}
        <StaffChat />
        
        {/* Notifications - Real-time */}
        <NotificationBell />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium">{user?.email?.split("@")[0] || "User"}</p>
                <div className="flex gap-1">
                  {roles.length > 0 ? (
                    roles.slice(0, 2).map((role) => (
                      <Badge key={role} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {roleLabels[role] || role}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Staff</p>
                  )}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Pengaturan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
