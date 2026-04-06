import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileText, Star, Users, Plus, Search, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, FETCH_OPTS);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...FETCH_OPTS, method: 'POST', body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return (json.data ?? json) as T;
}

interface VendorStats {
  total_vendors: number;
  active_vendors: number;
  active_contracts: number;
  average_rating: number;
}

interface Vendor {
  id: string;
  vendor_code?: string;
  vendor_name: string;
  category?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  rating?: number;
  is_active: boolean;
  vendor_contracts?: { id: string; contract_number: string; end_date: string }[];
}

const CATEGORIES = ['Farmasi', 'Alat Medis', 'Makanan & Minuman', 'Cleaning', 'IT & Teknologi', 'Lainnya'];

export default function VendorDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    vendor_name: "", vendor_code: "", category: "", contact_person: "",
    phone: "", email: "", address: "", notes: "",
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: () => apiFetch<VendorStats>('/vendors/stats'),
  });

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["vendors", search, filterCategory],
    queryFn: () => {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      if (filterCategory && filterCategory !== 'all') p.set('category', filterCategory);
      return apiFetch<Vendor[]>(`/vendors?${p}`);
    },
  });

  const createVendor = useMutation({
    mutationFn: (data: typeof form) => apiPost('/vendors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-stats"] });
      setDialogOpen(false);
      setForm({ vendor_name: "", vendor_code: "", category: "", contact_person: "", phone: "", email: "", address: "", notes: "" });
      toast({ title: "Vendor berhasil ditambahkan" });
    },
    onError: (e: Error) => toast({ title: "Gagal", description: e.message, variant: "destructive" }),
  });

  const statsCards = [
    { label: "Total Vendor", value: stats?.total_vendors ?? 0, icon: Building2, color: "text-primary" },
    { label: "Kontrak Aktif", value: stats?.active_contracts ?? 0, icon: FileText, color: "text-blue-600" },
    { label: "Rating Rata-rata", value: stats?.average_rating?.toFixed(1) ?? "0.0", icon: Star, color: "text-amber-500" },
    { label: "Vendor Aktif", value: stats?.active_vendors ?? 0, icon: Users, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Icon className={`h-8 w-8 ${color}`} />
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold">{value}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <CardTitle>Daftar Vendor</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari vendor..."
                  className="pl-8 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Tambah Vendor</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Tambah Vendor Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 mt-2">
                    <div>
                      <Label>Nama Vendor *</Label>
                      <Input value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))} placeholder="PT. Example" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Kode Vendor</Label>
                        <Input value={form.vendor_code} onChange={e => setForm(f => ({ ...f, vendor_code: e.target.value }))} placeholder="VND-001" />
                      </div>
                      <div>
                        <Label>Kategori</Label>
                        <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                          <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Kontak Person</Label>
                      <Input value={form.contact_person} onChange={e => setForm(f => ({ ...f, contact_person: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Telepon</Label>
                        <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
                      </div>
                    </div>
                    <div>
                      <Label>Alamat</Label>
                      <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                    <Button
                      onClick={() => createVendor.mutate(form)}
                      disabled={createVendor.isPending || !form.vendor_name}
                    >
                      {createVendor.isPending ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Kontrak Aktif</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorsLoading ? (
                [...Array(4)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : vendors && vendors.length > 0 ? (
                vendors.map(v => (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{v.vendor_name}</p>
                        {v.vendor_code && <p className="text-xs text-muted-foreground">{v.vendor_code}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.category ? (
                        <Badge variant="outline" className="text-xs">{v.category}</Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        {v.contact_person && <p>{v.contact_person}</p>}
                        {v.phone && <p className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{v.phone}</p>}
                        {v.email && <p className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{v.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {v.vendor_contracts?.length ? (
                        <p className="text-xs">{v.vendor_contracts[0].contract_number}</p>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {v.rating != null ? (
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          {Number(v.rating).toFixed(1)}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={v.is_active ? "default" : "secondary"} className="text-xs">
                        {v.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {search || filterCategory !== 'all' ? "Tidak ada vendor yang cocok dengan filter" : "Belum ada vendor terdaftar"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
