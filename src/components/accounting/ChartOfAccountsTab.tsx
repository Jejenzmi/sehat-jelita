import { useState } from "react";
import {
  useChartOfAccounts,
  useAddAccount,
  useUpdateAccount,
  ChartOfAccount,
} from "@/hooks/useAccountingData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  Pencil,
  ChevronRight,
  ChevronDown,
  FolderTree,
} from "lucide-react";

const accountTypes = [
  { value: "asset", label: "Aset", color: "bg-blue-500" },
  { value: "liability", label: "Liabilitas", color: "bg-red-500" },
  { value: "equity", label: "Ekuitas", color: "bg-purple-500" },
  { value: "revenue", label: "Pendapatan", color: "bg-green-500" },
  { value: "expense", label: "Beban", color: "bg-orange-500" },
];

export function ChartOfAccountsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const { data: accounts, isLoading } = useChartOfAccounts();
  const addAccount = useAddAccount();
  const updateAccount = useUpdateAccount();

  const toggleExpand = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const filteredAccounts = accounts?.filter((acc) => {
    const matchesSearch =
      acc.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.account_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || acc.account_type === filterType;
    return matchesSearch && matchesType;
  });

  // Build tree structure
  const buildTree = (accounts: ChartOfAccount[]) => {
    const rootAccounts = accounts.filter((a) => !a.parent_account_id);
    const getChildren = (parentId: string): ChartOfAccount[] => {
      return accounts.filter((a) => a.parent_account_id === parentId);
    };

    const renderAccount = (account: ChartOfAccount, depth: number = 0): JSX.Element => {
      const children = getChildren(account.id);
      const hasChildren = children.length > 0;
      const isExpanded = expandedAccounts.has(account.id);

      return (
        <div key={account.id}>
          <TableRow className={account.is_header ? "bg-muted/50 font-semibold" : ""}>
            <TableCell>
              <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 mr-1"
                    onClick={() => toggleExpand(account.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <span className="w-7" />
                )}
                <span className="font-mono">{account.account_code}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {account.is_header && <FolderTree className="h-4 w-4 text-muted-foreground" />}
                {account.account_name}
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={`${
                  accountTypes.find((t) => t.value === account.account_type)?.color
                } text-white border-0`}
              >
                {accountTypes.find((t) => t.value === account.account_type)?.label}
              </Badge>
            </TableCell>
            <TableCell className="capitalize">{account.normal_balance}</TableCell>
            <TableCell className="text-right font-mono">
              {!account.is_header &&
                new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(account.current_balance)}
            </TableCell>
            <TableCell>
              <Badge variant={account.is_active ? "default" : "secondary"}>
                {account.is_active ? "Aktif" : "Nonaktif"}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setSelectedAccount(account);
                  setIsEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
          {hasChildren && isExpanded && children.map((child) => renderAccount(child, depth + 1))}
        </div>
      );
    };

    return rootAccounts.map((account) => renderAccount(account));
  };

  const handleAddAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    addAccount.mutate(
      {
        account_code: formData.get("account_code") as string,
        account_name: formData.get("account_name") as string,
        account_type: formData.get("account_type") as ChartOfAccount["account_type"],
        account_category: formData.get("account_category") as string,
        parent_account_id: (formData.get("parent_account_id") as string) || undefined,
        level: parseInt(formData.get("level") as string) || 3,
        is_header: formData.get("is_header") === "on",
        normal_balance: formData.get("normal_balance") as "debit" | "credit",
        description: (formData.get("description") as string) || undefined,
        opening_balance: parseFloat(formData.get("opening_balance") as string) || 0,
        is_active: true,
      },
      {
        onSuccess: () => setIsAddOpen(false),
      }
    );
  };

  const handleUpdateAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccount) return;

    const formData = new FormData(e.currentTarget);

    updateAccount.mutate(
      {
        id: selectedAccount.id,
        account_name: formData.get("account_name") as string,
        account_category: formData.get("account_category") as string,
        description: (formData.get("description") as string) || undefined,
        is_active: formData.get("is_active") === "on",
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setSelectedAccount(null);
        },
      }
    );
  };

  const headerAccounts = accounts?.filter((a) => a.is_header) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Chart of Accounts (Daftar Akun)
          </CardTitle>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Akun
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tambah Akun Baru</DialogTitle>
                <DialogDescription>Masukkan detail akun baru</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAccount} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_code">Kode Akun *</Label>
                    <Input id="account_code" name="account_code" required placeholder="1104" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_type">Tipe Akun *</Label>
                    <Select name="account_type" defaultValue="asset">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_name">Nama Akun *</Label>
                  <Input id="account_name" name="account_name" required placeholder="Piutang Lain-lain" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_category">Kategori</Label>
                    <Input id="account_category" name="account_category" placeholder="Aset Lancar" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parent_account_id">Akun Induk</Label>
                    <Select name="parent_account_id">
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih akun induk" />
                      </SelectTrigger>
                      <SelectContent>
                        {headerAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.account_code} - {acc.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="normal_balance">Saldo Normal *</Label>
                    <Select name="normal_balance" defaultValue="debit">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debit">Debit</SelectItem>
                        <SelectItem value="credit">Kredit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opening_balance">Saldo Awal</Label>
                    <Input
                      id="opening_balance"
                      name="opening_balance"
                      type="number"
                      defaultValue="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input id="level" name="level" type="number" defaultValue="3" min="1" max="5" />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch id="is_header" name="is_header" />
                    <Label htmlFor="is_header">Akun Header</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea id="description" name="description" rows={2} />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={addAccount.isPending}>
                    {addAccount.isPending ? "Menyimpan..." : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari akun..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {accountTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Kode</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead className="w-[120px]">Tipe</TableHead>
                  <TableHead className="w-[100px]">Saldo Normal</TableHead>
                  <TableHead className="w-[150px] text-right">Saldo</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts && buildTree(filteredAccounts)}
                {filteredAccounts?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Tidak ada akun ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Akun</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div className="space-y-2">
                <Label>Kode Akun</Label>
                <Input value={selectedAccount.account_code} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_account_name">Nama Akun *</Label>
                <Input
                  id="edit_account_name"
                  name="account_name"
                  defaultValue={selectedAccount.account_name}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_account_category">Kategori</Label>
                <Input
                  id="edit_account_category"
                  name="account_category"
                  defaultValue={selectedAccount.account_category || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">Deskripsi</Label>
                <Textarea
                  id="edit_description"
                  name="description"
                  defaultValue={selectedAccount.description || ""}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit_is_active"
                  name="is_active"
                  defaultChecked={selectedAccount.is_active}
                />
                <Label htmlFor="edit_is_active">Akun Aktif</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={updateAccount.isPending}>
                  {updateAccount.isPending ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
