import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderTree, BookOpen, BookText, FileBarChart } from "lucide-react";
import { ChartOfAccountsTab } from "@/components/accounting/ChartOfAccountsTab";
import { JournalEntriesTab } from "@/components/accounting/JournalEntriesTab";
import { GeneralLedgerTab } from "@/components/accounting/GeneralLedgerTab";
import { FinancialReportsTab } from "@/components/accounting/FinancialReportsTab";

export default function Akuntansi() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Akuntansi / Keuangan</h1>
          <p className="text-muted-foreground">
            Manajemen Chart of Accounts, Jurnal, Buku Besar & Laporan Keuangan
          </p>
        </div>
      </div>

      <Tabs defaultValue="coa" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="coa" className="gap-2">
            <FolderTree className="h-4 w-4" />
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="journal" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Jurnal Umum
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-2">
            <BookText className="h-4 w-4" />
            Buku Besar
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileBarChart className="h-4 w-4" />
            Laporan Keuangan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coa">
          <ChartOfAccountsTab />
        </TabsContent>

        <TabsContent value="journal">
          <JournalEntriesTab />
        </TabsContent>

        <TabsContent value="ledger">
          <GeneralLedgerTab />
        </TabsContent>

        <TabsContent value="reports">
          <FinancialReportsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
