/**
 * SIMRS ZEN - Export Service
 * Excel/PDF generation using exceljs
 */

import ExcelJS from 'exceljs';
import { prisma } from '../config/database.js';

// ── Shared styling ────────────────────────────────────────────────────────────

const HEADER_STYLE = {
  font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  },
};

const CELL_STYLE = {
  border: {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  },
  alignment: { vertical: 'middle', wrapText: true },
};

const CURRENCY_FORMAT = '#,##0';

function applyHeaderStyle(row) {
  row.eachCell(cell => { Object.assign(cell, HEADER_STYLE); });
  row.height = 30;
}

function applyCellStyle(row) {
  row.eachCell(cell => { Object.assign(cell, CELL_STYLE); });
}

function addHospitalHeader(sheet, hospitalInfo) {
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = hospitalInfo.name || 'SIMRS ZEN';
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:H2');
  const addrCell = sheet.getCell('A2');
  addrCell.value = hospitalInfo.address || '';
  addrCell.alignment = { horizontal: 'center' };

  sheet.addRow([]);
}

async function getHospitalInfo() {
  const settings = await prisma.system_settings.findMany({
    where: { setting_key: { in: ['hospital_name', 'hospital_address', 'hospital_phone'] } }
  });
  const info = {};
  settings.forEach(s => { info[s.setting_key.replace('hospital_', '')] = s.setting_value; });
  return info;
}

// ── Billing Export ────────────────────────────────────────────────────────────

export async function exportBilling({ date_from, date_to, format = 'xlsx' }) {
  const where = { status: 'paid' };
  if (date_from || date_to) {
    where.payment_date = {};
    if (date_from) where.payment_date.gte = new Date(date_from);
    if (date_to) where.payment_date.lte = new Date(date_to);
  }

  const billings = await prisma.billings.findMany({
    where,
    orderBy: { payment_date: 'desc' },
    include: {
      patients: { select: { full_name: true, medical_record_number: true } },
    },
  });

  const hospitalInfo = await getHospitalInfo();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIMRS ZEN';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Laporan Billing');
  addHospitalHeader(sheet, hospitalInfo);

  sheet.mergeCells('A4:H4');
  const periodCell = sheet.getCell('A4');
  periodCell.value = `Laporan Billing${date_from ? ` (${date_from} s/d ${date_to || 'sekarang'})` : ''}`;
  periodCell.font = { bold: true, size: 13 };
  periodCell.alignment = { horizontal: 'center' };
  sheet.addRow([]);

  sheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'No Invoice', key: 'invoice_number', width: 18 },
    { header: 'Tanggal', key: 'payment_date', width: 15 },
    { header: 'No RM', key: 'mrn', width: 14 },
    { header: 'Nama Pasien', key: 'patient_name', width: 25 },
    { header: 'Tipe Bayar', key: 'payment_type', width: 14 },
    { header: 'Total (Rp)', key: 'total', width: 18 },
    { header: 'Dibayar (Rp)', key: 'paid', width: 18 },
  ];

  const headerRow = sheet.getRow(6);
  applyHeaderStyle(headerRow);

  let grandTotal = 0;
  let grandPaid = 0;

  billings.forEach((b, i) => {
    const row = sheet.addRow({
      no: i + 1,
      invoice_number: b.invoice_number,
      payment_date: b.payment_date ? new Date(b.payment_date).toLocaleDateString('id-ID') : '',
      mrn: b.patients?.medical_record_number || '',
      patient_name: b.patients?.full_name || '',
      payment_type: b.payment_type || '',
      total: b.total || 0,
      paid: b.paid_amount || 0,
    });
    applyCellStyle(row);
    row.getCell('total').numFmt = CURRENCY_FORMAT;
    row.getCell('paid').numFmt = CURRENCY_FORMAT;
    grandTotal += b.total || 0;
    grandPaid += b.paid_amount || 0;
  });

  // Summary row
  const sumRow = sheet.addRow(['', '', '', '', '', 'TOTAL', grandTotal, grandPaid]);
  sumRow.font = { bold: true };
  sumRow.getCell(7).numFmt = CURRENCY_FORMAT;
  sumRow.getCell(8).numFmt = CURRENCY_FORMAT;

  return workbook.xlsx.writeBuffer();
}

// ── Lab Results Export (PDF-style HTML) ──────────────────────────────────────

export async function exportLabResult(orderId) {
  const order = await prisma.lab_orders.findUnique({
    where: { id: orderId },
    include: {
      patients: true,
      doctors: { select: { id: true } },
      lab_results: true,
    },
  });

  if (!order) throw new Error('Lab order not found');

  const hospitalInfo = await getHospitalInfo();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Hasil Lab');

  addHospitalHeader(sheet, hospitalInfo);

  sheet.addRow(['HASIL PEMERIKSAAN LABORATORIUM']).font = { bold: true, size: 14 };
  sheet.addRow([]);
  sheet.addRow(['No. Order', order.order_number]);
  sheet.addRow(['Nama Pasien', order.patients?.full_name]);
  sheet.addRow(['No. Rekam Medis', order.patients?.medical_record_number]);
  sheet.addRow(['Tanggal', new Date(order.order_date).toLocaleDateString('id-ID')]);
  sheet.addRow([]);

  sheet.columns = [
    { width: 6 }, { width: 25 }, { width: 15 }, { width: 10 }, { width: 20 }, { width: 12 },
  ];

  const headerRow = sheet.addRow(['No', 'Pemeriksaan', 'Hasil', 'Satuan', 'Nilai Normal', 'Flag']);
  applyHeaderStyle(headerRow);

  order.lab_results.forEach((r, i) => {
    const row = sheet.addRow([
      i + 1,
      r.test_name,
      r.result_value || '-',
      r.unit || '',
      r.reference_range || '',
      r.flag || 'normal',
    ]);
    applyCellStyle(row);
    if (r.flag === 'critical') {
      row.getCell(6).font = { bold: true, color: { argb: 'FFFF0000' } };
    } else if (r.flag === 'high' || r.flag === 'low') {
      row.getCell(6).font = { bold: true, color: { argb: 'FFFF8800' } };
    }
  });

  return workbook.xlsx.writeBuffer();
}

// ── Generic Report Export ────────────────────────────────────────────────────

export async function exportAccountingJournal({ date_from, date_to }) {
  const where = {};
  if (date_from || date_to) {
    where.journal_date = {};
    if (date_from) where.journal_date.gte = new Date(date_from);
    if (date_to) where.journal_date.lte = new Date(date_to);
  }

  const journals = await prisma.journal_entries.findMany({
    where,
    orderBy: { journal_date: 'desc' },
    include: { journal_entry_items: true },
  });

  const hospitalInfo = await getHospitalInfo();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Jurnal Akuntansi');

  addHospitalHeader(sheet, hospitalInfo);
  sheet.addRow(['Laporan Jurnal Akuntansi']).font = { bold: true, size: 13 };
  sheet.addRow([]);

  const headerRow = sheet.addRow(['No', 'No. Jurnal', 'Tanggal', 'Keterangan', 'Debit (Rp)', 'Kredit (Rp)']);
  applyHeaderStyle(headerRow);

  sheet.columns = [
    { width: 6 }, { width: 18 }, { width: 14 }, { width: 35 }, { width: 18 }, { width: 18 },
  ];

  let totalDebit = 0, totalCredit = 0;

  journals.forEach((j, i) => {
    // Journal header row
    const row = sheet.addRow([
      i + 1,
      j.journal_number,
      new Date(j.journal_date).toLocaleDateString('id-ID'),
      j.description || '',
      '', '',
    ]);
    applyCellStyle(row);
    row.font = { bold: true };

    // Entry items
    for (const item of (j.journal_entry_items || [])) {
      const itemRow = sheet.addRow([
        '', '', '',
        `  ${item.account_code || ''} - ${item.account_name || ''}`,
        item.debit_amount || 0,
        item.credit_amount || 0,
      ]);
      applyCellStyle(itemRow);
      itemRow.getCell(5).numFmt = CURRENCY_FORMAT;
      itemRow.getCell(6).numFmt = CURRENCY_FORMAT;
      totalDebit += item.debit_amount || 0;
      totalCredit += item.credit_amount || 0;
    }
  });

  const sumRow = sheet.addRow(['', '', '', 'TOTAL', totalDebit, totalCredit]);
  sumRow.font = { bold: true };
  sumRow.getCell(5).numFmt = CURRENCY_FORMAT;
  sumRow.getCell(6).numFmt = CURRENCY_FORMAT;

  return workbook.xlsx.writeBuffer();
}

// ── Kemenkes Reports ─────────────────────────────────────────────────────────

export async function exportKemenkesRL({ report_type, month, year }) {
  const hospitalInfo = await getHospitalInfo();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`RL ${report_type}`);

  addHospitalHeader(sheet, hospitalInfo);
  sheet.addRow([`Laporan RL${report_type} - ${month}/${year}`]).font = { bold: true, size: 13 };
  sheet.addRow([]);

  if (report_type === '1') {
    // RL1: Data Dasar RS
    const headerRow = sheet.addRow(['No', 'Indikator', 'Nilai']);
    applyHeaderStyle(headerRow);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [totalBeds, occupiedBeds, totalAdmissions, totalDischarges, totalVisits] = await Promise.all([
      prisma.beds.count(),
      prisma.beds.count({ where: { status: 'occupied' } }),
      prisma.inpatient_admissions.count({ where: { admission_date: { gte: startDate, lte: endDate } } }),
      prisma.inpatient_admissions.count({ where: { discharge_date: { gte: startDate, lte: endDate } } }),
      prisma.visits.count({ where: { visit_date: { gte: startDate, lte: endDate } } }),
    ]);

    const bor = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(2) : 0;

    const data = [
      ['Jumlah Tempat Tidur', totalBeds],
      ['TT Terisi', occupiedBeds],
      ['BOR (%)', bor],
      ['Jumlah Pasien Masuk', totalAdmissions],
      ['Jumlah Pasien Keluar', totalDischarges],
      ['Jumlah Kunjungan Rawat Jalan', totalVisits],
    ];

    data.forEach((d, i) => {
      const row = sheet.addRow([i + 1, d[0], d[1]]);
      applyCellStyle(row);
    });
  }

  return workbook.xlsx.writeBuffer();
}
