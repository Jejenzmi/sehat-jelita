import { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle, AlertCircle, Shield, ShieldAlert, ShieldCheck, Info,
  Pill, Heart, Beaker, X, ChevronDown, ChevronUp,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface CDSAlertItem {
  type: string;
  severity: "info" | "warning" | "danger" | "critical";
  title: string;
  description?: string;
  medicine?: string;
  medicine_a?: string;
  medicine_b?: string;
  clinical_effect?: string;
  management?: string;
  reaction?: string;
  matched_allergen?: string;
  prescribed_dose?: string;
  max_dose?: string;
  min_dose?: string;
  icd_code?: string;
  diagnosis?: string;
  recommendation?: string;
  existing_prescription?: string;
}

interface CDSResult {
  alerts: CDSAlertItem[];
  safe: boolean;
  has_critical: boolean;
  summary: {
    total: number;
    critical: number;
    danger: number;
    warning: number;
    info: number;
  };
}

interface CDSAlertProps {
  patientId: string;
  prescriptionItems: Array<{
    medicine_id?: string;
    medicine_name: string;
    dosage: string;
    frequency?: string;
    quantity?: number;
  }>;
  diagnosisCodes?: string[];
  onOverride?: (reason: string) => void;
  onCancel?: () => void;
  autoCheck?: boolean;
}

const severityConfig = {
  critical: {
    icon: ShieldAlert,
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-300 dark:border-red-800",
    badge: "bg-red-600 text-white",
    pulse: true,
  },
  danger: {
    icon: AlertTriangle,
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-300 dark:border-orange-800",
    badge: "bg-orange-600 text-white",
    pulse: false,
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-700 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-300 dark:border-yellow-800",
    badge: "bg-yellow-600 text-white",
    pulse: false,
  },
  info: {
    icon: Info,
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-300 dark:border-blue-800",
    badge: "bg-blue-600 text-white",
    pulse: false,
  },
};

const typeIcons: Record<string, typeof Pill> = {
  drug_interaction: Beaker,
  allergy: Heart,
  allergy_text: Heart,
  overdose: AlertTriangle,
  underdose: Info,
  contraindication: ShieldAlert,
  duplicate_therapy: Pill,
  pediatric_warning: AlertCircle,
  geriatric_warning: AlertCircle,
};

function CDSAlertCard({ alert }: { alert: CDSAlertItem }) {
  const [expanded, setExpanded] = useState(false);
  const config = severityConfig[alert.severity] || severityConfig.info;
  const Icon = typeIcons[alert.type] || config.icon;

  return (
    <div className={`rounded-lg border p-3 ${config.bg} ${config.border} ${config.pulse ? "animate-pulse" : ""}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold text-sm ${config.color}`}>{alert.title}</span>
            <Badge className={`text-xs ${config.badge}`}>{alert.severity.toUpperCase()}</Badge>
          </div>

          {alert.medicine && (
            <p className="text-sm text-muted-foreground">
              <Pill className="inline h-3 w-3 mr-1" />
              {alert.medicine}
            </p>
          )}
          {alert.medicine_a && alert.medicine_b && (
            <p className="text-sm text-muted-foreground">
              <Beaker className="inline h-3 w-3 mr-1" />
              {alert.medicine_a} ↔ {alert.medicine_b}
            </p>
          )}
          {alert.description && (
            <p className="text-sm mt-1 text-muted-foreground">{alert.description}</p>
          )}

          {(alert.clinical_effect || alert.management || alert.recommendation) && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
              >
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {expanded ? "Sembunyikan detail" : "Lihat detail"}
              </button>
              {expanded && (
                <div className="mt-2 space-y-1 text-xs">
                  {alert.clinical_effect && (
                    <p><strong>Efek Klinis:</strong> {alert.clinical_effect}</p>
                  )}
                  {alert.management && (
                    <p><strong>Tatalaksana:</strong> {alert.management}</p>
                  )}
                  {alert.recommendation && (
                    <p><strong>Rekomendasi:</strong> {alert.recommendation}</p>
                  )}
                  {alert.prescribed_dose && (
                    <p><strong>Dosis diresepkan:</strong> {alert.prescribed_dose} (Maks: {alert.max_dose})</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CDSAlert({
  patientId,
  prescriptionItems,
  diagnosisCodes = [],
  onOverride,
  onCancel,
  autoCheck = true,
}: CDSAlertProps) {
  const [result, setResult] = useState<CDSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const runCheck = useCallback(async () => {
    if (!patientId || !prescriptionItems?.length) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("zen_access_token");
      const res = await fetch(`${API_BASE}/cds/check-prescription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patient_id: patientId,
          items: prescriptionItems,
          diagnosis_codes: diagnosisCodes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      }
    } catch (err) {
      console.error("CDS check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId, prescriptionItems, diagnosisCodes]);

  useEffect(() => {
    if (autoCheck) {
      const timer = setTimeout(runCheck, 500); // debounce
      return () => clearTimeout(timer);
    }
  }, [autoCheck, runCheck]);

  if (!result || result.safe) return null;

  return (
    <>
      <div className="space-y-3 p-4 rounded-xl border-2 border-dashed border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="font-bold text-red-800 dark:text-red-300">
              Clinical Decision Support — {result.summary.total} Peringatan
            </h3>
          </div>
          <div className="flex gap-1">
            {result.summary.critical > 0 && (
              <Badge className="bg-red-600 text-white">{result.summary.critical} Kritis</Badge>
            )}
            {result.summary.danger > 0 && (
              <Badge className="bg-orange-600 text-white">{result.summary.danger} Bahaya</Badge>
            )}
            {result.summary.warning > 0 && (
              <Badge className="bg-yellow-600 text-white">{result.summary.warning} Peringatan</Badge>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {result.alerts.map((alert, idx) => (
              <CDSAlertCard key={idx} alert={alert} />
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Batal — Ubah Resep
            </Button>
          )}
          {onOverride && (
            <Button
              variant="destructive"
              onClick={() => setOverrideDialogOpen(true)}
            >
              <ShieldCheck className="h-4 w-4 mr-1" />
              Override — Lanjutkan dengan Risiko
            </Button>
          )}
        </div>
      </div>

      {/* Override Confirmation Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Override Peringatan CDS</DialogTitle>
            <DialogDescription>
              Anda memilih untuk mengabaikan {result.summary.total} peringatan keamanan obat.
              Tuliskan alasan klinis untuk melanjutkan.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Alasan klinis override... (wajib diisi)"
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={!overrideReason.trim()}
              onClick={() => {
                setOverrideDialogOpen(false);
                onOverride?.(overrideReason);
              }}
            >
              Konfirmasi Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
