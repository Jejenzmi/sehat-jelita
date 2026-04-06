/**
 * ThermalReceipt — struk kasir untuk printer thermal 80mm / 58mm
 *
 * Cara pakai:
 *   <ThermalReceipt billingId={id} open={open} onClose={() => setOpen(false)} />
 *
 * Tombol "Cetak" memanggil window.print() dengan CSS @media print
 * yang sudah dikalibrasi untuk kertas thermal.
 */

import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

interface BillingPrintData {
  hospital: {
    hospital_name?: string;
    hospital_address?: string;
    hospital_phone?: string;
  };
  billing: {
    id: string;
    invoice_number: string;
    billing_date: string;
    payment_date?: string;
    payment_method?: string;
    payment_type: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paid_amount: number;
    status: string;
    notes?: string;
    patients?: { full_name: string; medical_record_number: string };
    visits?: { visit_number?: string; departments?: { department_name: string } };
    billing_items?: { id: string; item_name: string; item_type: string; quantity: number; unit_price: number; total_price: number }[];
  };
}

interface ThermalReceiptProps {
  billingId: string | null;
  open: boolean;
  onClose: () => void;
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: 'Tunai',
  debit: 'Kartu Debit',
  debit_card: 'Kartu Debit',
  credit: 'Kartu Kredit',
  credit_card: 'Kartu Kredit',
  transfer: 'Transfer Bank',
  qris: 'QRIS',
};

const PAYMENT_TYPE_LABEL: Record<string, string> = {
  umum: 'Umum',
  bpjs: 'BPJS Kesehatan',
  asuransi: 'Asuransi',
};

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ThermalReceipt({ billingId, open, onClose }: ThermalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["billing-print", billingId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/billing/print/${billingId}`, FETCH_OPTS);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Gagal memuat data struk');
      return json.data as BillingPrintData;
    },
    enabled: !!billingId && open,
  });

  const handlePrint = () => {
    const printContent = receiptRef.current?.innerHTML;
    if (!printContent) return;

    const w = window.open('', '_blank', 'width=400,height=700');
    if (!w) { window.print(); return; }

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Struk Pembayaran</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm 4mm;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            color: #000;
            width: 72mm;
          }
          .center   { text-align: center; }
          .right    { text-align: right; }
          .bold     { font-weight: bold; }
          .lg       { font-size: 13px; }
          .sm       { font-size: 10px; }
          .divider  { border-top: 1px dashed #000; margin: 3px 0; }
          .row      { display: flex; justify-content: space-between; margin: 1px 0; }
          .row .label { flex: 1; }
          .row .val   { text-align: right; white-space: nowrap; margin-left: 4px; }
          .item-name  { padding-right: 4px; }
          .total-row  { font-weight: bold; font-size: 12px; }
          .footer     { margin-top: 6px; text-align: center; font-size: 10px; }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  const hospital = data?.hospital;
  const billing  = data?.billing;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <span className="font-semibold text-sm">Preview Struk</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint} disabled={isLoading || !data}>
              <Printer className="h-4 w-4 mr-1" />
              Cetak
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Receipt preview */}
        <div className="overflow-y-auto max-h-[75vh] bg-white p-4">
          {isLoading && (
            <div className="text-center text-sm text-muted-foreground py-8">Memuat struk…</div>
          )}

          {!isLoading && !data && (
            <div className="text-center text-sm text-destructive py-8">Gagal memuat data struk</div>
          )}

          {data && billing && (
            /* This div content is extracted for the print window */
            <div ref={receiptRef} style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 12, color: '#000', width: '100%' }}>

              {/* Header RS */}
              <div className="center bold lg" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13 }}>
                {hospital?.hospital_name || 'RUMAH SAKIT'}
              </div>
              {hospital?.hospital_address && (
                <div className="center sm" style={{ textAlign: 'center', fontSize: 10 }}>{hospital.hospital_address}</div>
              )}
              {hospital?.hospital_phone && (
                <div className="center sm" style={{ textAlign: 'center', fontSize: 10 }}>Telp: {hospital.hospital_phone}</div>
              )}

              <div className="divider" style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

              {/* Invoice info */}
              <div style={{ fontSize: 11 }}>
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                  <span>No. Invoice</span>
                  <span style={{ fontWeight: 'bold' }}>{billing.invoice_number}</span>
                </div>
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                  <span>Tanggal</span>
                  <span>{formatDate(billing.payment_date || billing.billing_date)}</span>
                </div>
                {billing.visits?.visit_number && (
                  <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span>No. Kunjungan</span>
                    <span>{billing.visits.visit_number}</span>
                  </div>
                )}
              </div>

              <div className="divider" style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

              {/* Patient info */}
              <div style={{ fontSize: 11 }}>
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                  <span>Pasien</span>
                  <span style={{ fontWeight: 'bold' }}>{billing.patients?.full_name || '-'}</span>
                </div>
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                  <span>No. RM</span>
                  <span>{billing.patients?.medical_record_number || '-'}</span>
                </div>
                <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                  <span>Jenis Bayar</span>
                  <span>{PAYMENT_TYPE_LABEL[billing.payment_type] || billing.payment_type.toUpperCase()}</span>
                </div>
                {billing.visits?.departments?.department_name && (
                  <div className="row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span>Poli/Unit</span>
                    <span>{billing.visits.departments.department_name}</span>
                  </div>
                )}
              </div>

              <div className="divider" style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

              {/* Billing items */}
              {billing.billing_items && billing.billing_items.length > 0 && (
                <>
                  <div style={{ fontSize: 11 }}>
                    {billing.billing_items.map((item) => (
                      <div key={item.id} style={{ marginBottom: 3 }}>
                        <div style={{ fontWeight: 'bold' }}>{item.item_name}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>  {item.quantity} x {formatRp(item.unit_price)}</span>
                          <span>{formatRp(item.total_price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="divider" style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />
                </>
              )}

              {/* Totals */}
              <div style={{ fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                  <span>Subtotal</span>
                  <span>{formatRp(billing.subtotal)}</span>
                </div>
                {billing.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span>Diskon</span>
                    <span>- {formatRp(billing.discount)}</span>
                  </div>
                )}
                {billing.tax > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span>Pajak</span>
                    <span>{formatRp(billing.tax)}</span>
                  </div>
                )}
              </div>

              <div className="divider" style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

              {/* Grand total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>
                <span>TOTAL</span>
                <span>{formatRp(billing.total)}</span>
              </div>

              {billing.payment_type !== 'bpjs' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 1 }}>
                    <span>Dibayar</span>
                    <span>{formatRp(billing.paid_amount)}</span>
                  </div>
                  {billing.paid_amount > billing.total && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 1 }}>
                      <span>Kembali</span>
                      <span style={{ fontWeight: 'bold' }}>{formatRp(billing.paid_amount - billing.total)}</span>
                    </div>
                  )}
                </>
              )}

              {billing.payment_method && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 1 }}>
                  <span>Metode</span>
                  <span>{PAYMENT_METHOD_LABEL[billing.payment_method] || billing.payment_method}</span>
                </div>
              )}

              <div className="divider" style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

              {/* Status badge */}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 12 }}>
                {billing.status === 'paid' ? '*** LUNAS ***'
                  : billing.status === 'partial' ? '*** DIBAYAR SEBAGIAN ***'
                  : `STATUS: ${billing.status.toUpperCase()}`}
              </div>

              {/* Footer */}
              <div style={{ marginTop: 6, textAlign: 'center', fontSize: 10 }}>
                <div>Terima kasih atas kepercayaan Anda</div>
                <div>Struk ini adalah bukti pembayaran yang sah</div>
                <div style={{ marginTop: 4 }}>Dicetak: {formatDate(new Date().toISOString())}</div>
              </div>

              {/* Bottom spacing for tear */}
              <div style={{ marginTop: 16 }} />

            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
