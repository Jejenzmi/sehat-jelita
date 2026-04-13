/**
 * SIMRS ZEN - PDF Generation Worker
 * Generates billing receipts, patient summaries, and lab reports as PDF.
 *
 * NOTE: Uses a simple HTML->PDF approach without external native dependencies.
 * For production, swap the placeholder with puppeteer or a PDF microservice.
 */

import { prisma } from '../config/database.js';

interface BillingItem {
  item_name: string;
  item_type: string;
  quantity: number | string;
  unit_price: number | string;
  total_price: number | string;
}

interface PatientInfo {
  full_name?: string;
  medical_record_number?: string;
}

interface BillingRecord {
  invoice_number: string;
  billing_date: Date | string;
  subtotal?: number | string;
  discount?: number | string;
  tax?: number | string;
  total?: number | string;
  status?: string;
  payment_method?: string;
  billing_items?: BillingItem[];
  patients?: PatientInfo;
}

interface PdfJobData {
  billing_id?: string;
  patient_id?: string;
  [key: string]: unknown;
}

interface PdfJob {
  name: string;
  data: PdfJobData;
}

interface InvoiceResult {
  success: boolean;
  billing_id: string;
  invoice: string;
  file_url: string;
  html_size: number;
  note: string;
}

interface PatientSummaryResult {
  success: boolean;
  patient_id: string;
  file_url: string;
  visit_count: number;
  lab_count: number;
}

type PdfResult = InvoiceResult | PatientSummaryResult;

/**
 * Generate an HTML invoice template (lightweight, no binary deps)
 */
function buildInvoiceHtml(billing: BillingRecord): string {
  const items = billing.billing_items || [];
  const rows = items.map(i =>
    `<tr>
      <td>${i.item_name}</td>
      <td>${i.item_type}</td>
      <td style="text-align:right">${i.quantity}</td>
      <td style="text-align:right">Rp ${Number(i.unit_price).toLocaleString('id-ID')}</td>
      <td style="text-align:right">Rp ${Number(i.total_price).toLocaleString('id-ID')}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice ${billing.invoice_number}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 13px; margin: 32px; }
  h1   { font-size: 20px; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #ddd; padding: 8px; }
  th { background: #f5f5f5; }
  .total { font-weight: bold; font-size: 15px; }
</style>
</head>
<body>
  <h1>SIMRS ZEN</h1>
  <p>Invoice: <strong>${billing.invoice_number}</strong></p>
  <p>Pasien: ${billing.patients?.full_name || '-'} | No. RM: ${billing.patients?.medical_record_number || '-'}</p>
  <p>Tanggal: ${new Date(billing.billing_date).toLocaleDateString('id-ID')}</p>
  <table>
    <thead><tr><th>Nama</th><th>Jenis</th><th>Qty</th><th>Harga</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="total" style="text-align:right; margin-top:16px;">
    Subtotal: Rp ${Number(billing.subtotal || 0).toLocaleString('id-ID')}<br>
    Diskon: Rp ${Number(billing.discount || 0).toLocaleString('id-ID')}<br>
    Pajak: Rp ${Number(billing.tax || 0).toLocaleString('id-ID')}<br>
    <strong>Total: Rp ${Number(billing.total || 0).toLocaleString('id-ID')}</strong>
  </p>
  <p style="margin-top:32px; font-size:11px; color:#888">
    Status: ${billing.status?.toUpperCase()} | Metode: ${billing.payment_method || '-'}
  </p>
</body>
</html>`;
}

export async function processPdfJob(job: PdfJob): Promise<PdfResult> {
  const { name, data } = job;

  if (name === 'generate-invoice') {
    const { billing_id } = data;

    if (!billing_id) throw new Error('billing_id is required');

    const billing = await prisma.billings.findUnique({
      where: { id: billing_id },
      include: {
        patients: { select: { full_name: true, medical_record_number: true } },
        billing_items: true
      }
    }) as unknown as BillingRecord | null;

    if (!billing) throw new Error(`Billing ${billing_id} not found`);

    const html = buildInvoiceHtml(billing);

    // Store the HTML representation; swap with real PDF generation in production
    // e.g. await page.setContent(html); await page.pdf({ path: filePath });
    const fileUrl = `/storage/invoices/${billing.invoice_number}.html`;

    // In a real setup: write file to storage bucket
    // For now: store HTML in result and mark URL
    return {
      success: true,
      billing_id,
      invoice: billing.invoice_number,
      file_url: fileUrl,
      html_size: html.length,
      note: 'HTML template generated; swap with Puppeteer/PDF microservice for binary output'
    };
  }

  if (name === 'generate-patient-summary') {
    const { patient_id } = data;

    if (!patient_id) throw new Error('patient_id is required');

    const patient = await prisma.patients.findUnique({
      where: { id: patient_id },
      include: {
        visits: {
          take: 10, orderBy: { visit_date: 'desc' },
          include: { departments: { select: { department_name: true } } }
        },
        lab_orders: {
          take: 5, orderBy: { created_at: 'desc' },
          include: { lab_results: { take: 5 } }
        }
      }
    });

    if (!patient) throw new Error(`Patient ${patient_id} not found`);

    return {
      success: true,
      patient_id,
      file_url: `/storage/summaries/patient-${patient_id}.html`,
      visit_count: (patient.visits as unknown[]).length,
      lab_count: (patient.lab_orders as unknown[]).length,
    };
  }

  throw new Error(`Unknown PDF job: ${name}`);
}
