import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpCircle, ArrowDownCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Transaction {
  id: string;
  transaction_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_type: string | null;
  notes: string | null;
  created_at: string;
  medicine: {
    name: string;
    code: string;
    unit: string;
  } | null;
}

export default function InventoryTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select(`
          id,
          transaction_type,
          quantity,
          previous_stock,
          new_stock,
          reference_type,
          notes,
          created_at,
          medicine:medicine_id (
            name,
            code,
            unit
          )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "in":
        return <ArrowUpCircle className="h-5 w-5 text-green-500" />;
      case "out":
        return <ArrowDownCircle className="h-5 w-5 text-red-500" />;
      default:
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "in": return "Masuk";
      case "out": return "Keluar";
      case "adjustment": return "Penyesuaian";
      case "expired": return "Kadaluarsa";
      case "return": return "Retur";
      default: return type;
    }
  };

  const getReferenceLabel = (type: string | null) => {
    if (!type) return null;
    switch (type) {
      case "prescription": return "Resep";
      case "purchase_order": return "PO";
      case "adjustment": return "Adj";
      case "expired": return "Exp";
      case "batch_receipt": return "Batch";
      default: return type;
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.medicine?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || tx.transaction_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Riwayat Transaksi</CardTitle>
            <CardDescription>Log pergerakan stok obat</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari obat..."
                className="pl-10 w-48"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="in">Masuk</SelectItem>
                <SelectItem value="out">Keluar</SelectItem>
                <SelectItem value="adjustment">Penyesuaian</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {getTransactionIcon(tx.transaction_type)}
                  </div>
                  <div>
                    <p className="font-medium">{tx.medicine?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tx.created_at), "d MMM yyyy, HH:mm", { locale: id })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Perubahan</p>
                    <p className={`font-bold ${tx.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Stok</p>
                    <p className="font-medium">
                      {tx.previous_stock} → {tx.new_stock}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={tx.transaction_type === "in" ? "default" : tx.transaction_type === "out" ? "destructive" : "secondary"}>
                      {getTransactionLabel(tx.transaction_type)}
                    </Badge>
                    {tx.reference_type && (
                      <Badge variant="outline" className="text-xs">
                        {getReferenceLabel(tx.reference_type)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
