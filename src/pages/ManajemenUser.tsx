import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { 
  Users, Search, Shield, UserPlus, 
  KeyRound, Check, X, Loader2, Eye, EyeOff
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  UserFormFields, 
  initialUserFormData, 
  ALL_ROLES, 
  ROLE_COLORS,
  type UserFormData 
} from "@/components/forms/UserFormFields";

type AppRole = "admin" | "dokter" | "perawat" | "kasir" | "farmasi" | "laboratorium" | "radiologi" | "pendaftaran";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  nip: string | null;
  specialization: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

// Hook for fetching all user profiles
function useUserProfiles() {
  return useQuery({
    queryKey: ["admin-user-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data as UserProfile[];
    },
  });
}

// Hook for fetching all user roles
function useAllUserRoles() {
  return useQuery({
    queryKey: ["admin-all-user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*");
      if (error) throw error;
      return data as UserRole[];
    },
  });
}

export default function ManajemenUser() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRoles, setNewUserRoles] = useState<AppRole[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const { data: profiles, isLoading: loadingProfiles } = useUserProfiles();
  const { data: allRoles, isLoading: loadingRoles } = useAllUserRoles();

  // Get roles for a specific user
  const getUserRoles = (userId: string): AppRole[] => {
    if (!allRoles) return [];
    return allRoles.filter(r => r.user_id === userId).map(r => r.role);
  };

  // Update user roles mutation
  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: string; roles: AppRole[] }) => {
      // First, delete all existing roles for this user
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) throw deleteError;

      // Then insert new roles
      if (roles.length > 0) {
        const rolesToInsert = roles.map(role => ({
          user_id: userId,
          role,
        }));

        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(rolesToInsert);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-user-roles"] });
      toast({
        title: "Role Diperbarui",
        description: `Hak akses untuk ${selectedUser?.full_name} berhasil diperbarui.`,
      });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Gagal Memperbarui Role",
        description: error.message,
      });
    },
  });

  // Check if user has any role (active = has role)
  const isUserActive = (userId: string): boolean => {
    return getUserRoles(userId).length > 0;
  };

  // Open role dialog with current user's roles
  const openRoleDialog = (profile: UserProfile) => {
    setSelectedUser(profile);
    setSelectedRoles(getUserRoles(profile.user_id));
    setIsRoleDialogOpen(true);
  };

  // Handle role checkbox change
  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  // Handle new user role toggle
  const handleNewUserRoleToggle = (role: AppRole) => {
    setNewUserRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  // Create new user
  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserFullName) {
      toast({
        variant: "destructive",
        title: "Data Tidak Lengkap",
        description: "Email, password, dan nama lengkap wajib diisi.",
      });
      return;
    }

    if (newUserPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password Terlalu Pendek",
        description: "Password minimal 6 karakter.",
      });
      return;
    }

    if (newUserRoles.length === 0) {
      toast({
        variant: "destructive",
        title: "Role Belum Dipilih",
        description: "Pilih minimal satu role untuk user baru.",
      });
      return;
    }

    setIsCreatingUser(true);

    try {
      // Create user via Supabase Auth Admin API (requires service role key)
      // For now, we'll use signUp which will create the user and they can login
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserFullName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Assign roles to the new user
        const rolesToInsert = newUserRoles.map(role => ({
          user_id: authData.user!.id,
          role,
        }));

        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(rolesToInsert);

        if (rolesError) {
          console.error("Failed to assign roles:", rolesError);
        }
      }

      toast({
        title: "User Berhasil Dibuat",
        description: `Akun untuk ${newUserFullName} berhasil dibuat dengan ${newUserRoles.length} role.`,
      });

      // Reset form
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserFullName("");
      setNewUserRoles([]);
      setIsAddUserDialogOpen(false);

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["admin-user-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-user-roles"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Membuat User",
        description: error.message || "Terjadi kesalahan saat membuat user.",
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Filter profiles based on search
  const filteredProfiles = profiles?.filter(profile =>
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const isLoading = loadingProfiles || loadingRoles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen User</h1>
          <p className="text-muted-foreground">
            Kelola akun pengguna dan hak akses sistem
          </p>
        </div>
        <Button onClick={() => setIsAddUserDialogOpen(true)} className="gradient-primary">
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah User Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profiles?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">User Dengan Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {profiles?.filter(p => isUserActive(p.user_id)).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {allRoles?.filter(r => r.role === "admin").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Role Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{allRoles?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Tidak ada user ditemukan</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProfiles.map((profile) => {
                      const roles = getUserRoles(profile.user_id);
                      const isCurrentUser = profile.user_id === currentUser?.id;
                      
                      return (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {profile.full_name?.charAt(0).toUpperCase() || "U"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">
                                  {profile.full_name || "Unnamed User"}
                                  {isCurrentUser && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      Anda
                                    </Badge>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">{profile.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {roles.length === 0 ? (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Belum ada role
                                </Badge>
                              ) : (
                                roles.map((role) => (
                                  <Badge key={role} className={ROLE_COLORS[role]}>
                                    {role}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {roles.length > 0 ? (
                              <Badge className="bg-primary/10 text-primary">
                                <Check className="h-3 w-3 mr-1" />
                                Aktif
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground">
                                <X className="h-3 w-3 mr-1" />
                                Belum Aktif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(profile.created_at), "dd MMM yyyy", { locale: localeId })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleDialog(profile)}
                            >
                              <KeyRound className="h-4 w-4 mr-1" />
                              Kelola Role
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Kelola Hak Akses
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedUser.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div className="space-y-3">
                <Label>Pilih Role / Hak Akses:</Label>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {ALL_ROLES.map((role) => (
                      <div
                        key={role.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedRoles.includes(role.value) 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:bg-muted"
                        }`}
                        onClick={() => handleRoleToggle(role.value)}
                      >
                        <Checkbox
                          checked={selectedRoles.includes(role.value)}
                          onCheckedChange={() => handleRoleToggle(role.value)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={ROLE_COLORS[role.value]}>
                              {role.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                  Batal
                </Button>
                <Button
                  onClick={() => updateRolesMutation.mutate({
                    userId: selectedUser.user_id,
                    roles: selectedRoles,
                  })}
                  disabled={updateRolesMutation.isPending}
                  className="gradient-primary"
                >
                  {updateRolesMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add New User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Tambah User Baru
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nama Lengkap *</Label>
              <Input
                id="new-name"
                placeholder="Dr. John Doe"
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">Email *</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="john@rumahsakit.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Password *</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Pilih Role / Hak Akses *</Label>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {ALL_ROLES.map((role) => (
                    <div
                      key={role.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        newUserRoles.includes(role.value) 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:bg-muted"
                      }`}
                      onClick={() => handleNewUserRoleToggle(role.value)}
                    >
                      <Checkbox
                        checked={newUserRoles.includes(role.value)}
                        onCheckedChange={() => handleNewUserRoleToggle(role.value)}
                      />
                      <div className="flex-1">
                        <Badge className={ROLE_COLORS[role.value]}>
                          {role.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {newUserRoles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {newUserRoles.length} role dipilih
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={isCreatingUser}
              className="gradient-primary"
            >
              {isCreatingUser ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Membuat...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Buat User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
