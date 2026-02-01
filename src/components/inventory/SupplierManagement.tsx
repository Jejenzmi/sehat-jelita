import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, Search, Building2, Phone, Mail, MapPin, 
  Edit, Trash2, Star, Ban, CheckCircle, FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Vendor {
  id: string;
  vendor_code: string;
  vendor_name: string;
  vendor_type: string;
  category: string[] | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  npwp: string | null;
  bank_name: string | null;
  bank_account: string | null;
  payment_terms: number | null;
  credit_limit: number | null;
  rating: number | null;
  is_active: boolean | null;
  blacklisted: boolean | null;
  blacklist_reason: string | null;
  notes: string | null;
  created_at: string;
}

const vendorTypes = [
  { value: "pharmaceutical", label: "Farmasi" },
  { value: "medical_device", label: "Alat Kesehatan" },
  { value: "laboratory", label: "Laboratorium" },
  { value: "general", label: "Umum" },
  { value: "service", label: "Jasa" },
];

const categories = [
  "Obat Generik",
  "Obat Branded",
  "Alat Medis",
  "Reagent Lab",
  "BHP Medis",
  "Linen",
  "ATK",
  "Maintenance",
];

export default function SupplierManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    vendor_code: "",
    vendor_name: "",
    vendor_type: "",
    category: [] as string[],
    address: "",
    city: "",
    phone: "",
    email: "",
    website: "",
    contact_person: "",
    contact_phone: "",
    npwp: "",
    bank_name: "",
    bank_account: "",
    payment_terms: "",
    credit_limit: "",
    notes: "",
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    blacklisted: 0,
    avgRating: 0,
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("vendor_name");

      if (error) throw error;

      setVendors(data || []);
      
      // Calculate stats
      const activeCount = data?.filter(v => v.is_active && !v.blacklisted).length || 0;
      const blacklistedCount = data?.filter(v => v.blacklisted).length || 0;
      const ratings = data?.filter(v => v.rating).map(v => v.rating!) || [];
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      
      setStats({
        total: data?.length || 0,
        active: activeCount,
        blacklisted: blacklistedCount,
        avgRating: Math.round(avgRating * 10) / 10,
      });
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Gagal memuat data supplier");
    } finally {
      setLoading(false);
    }
  };

  const generateVendorCode = async () => {
    const { count } = await supabase
      .from("vendors")
      .select("*", { count: "exact", head: true });
    
    const nextNum = (count || 0) + 1;
    return `VND${nextNum.toString().padStart(4, "0")}`;
  };

  const handleOpenCreate = async () => {
    const code = await generateVendorCode();
    setFormData({
      vendor_code: code,
      vendor_name: "",
      vendor_type: "",
      category: [],
      address: "",
      city: "",
      phone: "",
      email: "",
      website: "",
      contact_person: "",
      contact_phone: "",
      npwp: "",
      bank_name: "",
      bank_account: "",
      payment_terms: "30",
      credit_limit: "",
      notes: "",
    });
    setSelectedVendor(null);
    setShowFormDialog(true);
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setFormData({
      vendor_code: vendor.vendor_code,
      vendor_name: vendor.vendor_name,
      vendor_type: vendor.vendor_type,
      category: vendor.category || [],
      address: vendor.address || "",
      city: vendor.city || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      website: vendor.website || "",
      contact_person: vendor.contact_person || "",
      contact_phone: vendor.contact_phone || "",
      npwp: vendor.npwp || "",
      bank_name: vendor.bank_name || "",
      bank_account: vendor.bank_account || "",
      payment_terms: vendor.payment_terms?.toString() || "",
      credit_limit: vendor.credit_limit?.toString() || "",
      notes: vendor.notes || "",
    });
    setSelectedVendor(vendor);
    setShowFormDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.vendor_name || !formData.vendor_type) {
      toast.error("Nama dan tipe supplier wajib diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        vendor_code: formData.vendor_code,
        vendor_name: formData.vendor_name,
        vendor_type: formData.vendor_type,
        category: formData.category.length > 0 ? formData.category : null,
        address: formData.address || null,
        city: formData.city || null,
        phone: formData.phone || null,
        email: formData.email || null,
        website: formData.website || null,
        contact_person: formData.contact_person || null,
        contact_phone: formData.contact_phone || null,
        npwp: formData.npwp || null,
        bank_name: formData.bank_name || null,
        bank_account: formData.bank_account || null,
        payment_terms: formData.payment_terms ? parseInt(formData.payment_terms) : null,
        credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
        notes: formData.notes || null,
      };

      if (selectedVendor) {
        // Update
        const { error } = await supabase
          .from("vendors")
          .update(payload)
          .eq("id", selectedVendor.id);

        if (error) throw error;
        toast.success("Supplier berhasil diperbarui");
      } else {
        // Create
        const { error } = await supabase
          .from("vendors")
          .insert(payload);

        if (error) throw error;
        toast.success("Supplier berhasil ditambahkan");
      }

      setShowFormDialog(false);
      fetchVendors();
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVendor) return;

    try {
      const { error } = await supabase
        .from("vendors")
        .delete()
        .eq("id", selectedVendor.id);

      if (error) throw error;

      toast.success("Supplier berhasil dihapus");
      setShowDeleteDialog(false);
      setSelectedVendor(null);
      fetchVendors();
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus supplier");
    }
  };

  const handleToggleStatus = async (vendor: Vendor) => {
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ is_active: !vendor.is_active })
        .eq("id", vendor.id);

      if (error) throw error;
      toast.success(`Supplier ${!vendor.is_active ? "diaktifkan" : "dinonaktifkan"}`);
      fetchVendors();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleBlacklist = async (vendor: Vendor) => {
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ 
          blacklisted: !vendor.blacklisted,
          blacklist_reason: !vendor.blacklisted ? "Masalah kinerja" : null
        })
        .eq("id", vendor.id);

      if (error) throw error;
      toast.success(`Supplier ${!vendor.blacklisted ? "di-blacklist" : "dihapus dari blacklist"}`);
      fetchVendors();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.includes(cat) 
        ? prev.category.filter(c => c !== cat)
        : [...prev.category, cat]
    }));
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vendor_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || v.vendor_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Supplier</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.avgRating || "-"}</p>
                  <p className="text-sm text-muted-foreground">Rating Rata-rata</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Ban className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{stats.blacklisted}</p>
                  <p className="text-sm text-muted-foreground">Blacklist</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Manajemen Supplier</CardTitle>
                <CardDescription>Kelola data supplier/vendor</CardDescription>
              </div>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Supplier
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  {vendorTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Supplier</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Memuat data...
                      </TableCell>
                    </TableRow>
                  ) : filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Tidak ada data supplier
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id} className={vendor.blacklisted ? "opacity-50" : ""}>
                        <TableCell className="font-mono text-sm">{vendor.vendor_code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{vendor.vendor_name}</p>
                            {vendor.city && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {vendor.city}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {vendorTypes.find(t => t.value === vendor.vendor_type)?.label || vendor.vendor_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {vendor.phone && (
                              <p className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {vendor.phone}
                              </p>
                            )}
                            {vendor.email && (
                              <p className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {vendor.email}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {vendor.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-primary text-primary" />
                              <span>{vendor.rating}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vendor.blacklisted ? (
                            <Badge variant="destructive">Blacklist</Badge>
                          ) : vendor.is_active ? (
                            <Badge variant="default">Aktif</Badge>
                          ) : (
                            <Badge variant="secondary">Nonaktif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(vendor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(vendor)}
                            >
                              {vendor.is_active ? (
                                <Ban className="h-4 w-4 text-destructive" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedVendor ? "Edit Supplier" : "Tambah Supplier Baru"}
            </DialogTitle>
            <DialogDescription>
              Lengkapi data supplier berikut
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kode Supplier</Label>
                <Input value={formData.vendor_code} disabled />
              </div>
              <div className="space-y-2">
                <Label>Tipe Supplier *</Label>
                <Select value={formData.vendor_type} onValueChange={(v) => setFormData({...formData, vendor_type: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorTypes.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nama Supplier *</Label>
              <Input 
                value={formData.vendor_name} 
                onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                placeholder="PT. Nama Supplier"
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Kategori Produk</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={formData.category.includes(cat) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Kota</Label>
                <Input 
                  value={formData.city} 
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input 
                  value={formData.phone} 
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="021-1234567"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="info@supplier.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input 
                  value={formData.contact_person} 
                  onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>No. HP Contact Person</Label>
                <Input 
                  value={formData.contact_phone} 
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  placeholder="08123456789"
                />
              </div>
            </div>

            {/* Financial Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NPWP</Label>
                <Input 
                  value={formData.npwp} 
                  onChange={(e) => setFormData({...formData, npwp: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input 
                  value={formData.website} 
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="www.supplier.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Bank</Label>
                <Input 
                  value={formData.bank_name} 
                  onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>No. Rekening</Label>
                <Input 
                  value={formData.bank_account} 
                  onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Term Pembayaran (Hari)</Label>
                <Input 
                  type="number"
                  value={formData.payment_terms} 
                  onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Credit Limit (Rp)</Label>
                <Input 
                  type="number"
                  value={formData.credit_limit} 
                  onChange={(e) => setFormData({...formData, credit_limit: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus supplier "{selectedVendor?.vendor_name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
