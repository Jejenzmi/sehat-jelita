/**
 * SIMRS ZEN - Export Routes
 */

import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { exportBilling, exportLabResult, exportAccountingJournal, exportKemenkesRL } from '../services/export.service.js';

const router = Router();

interface ExportQuery {
  date_from?: string;
  date_to?: string;
}

interface KemenkesQuery {
  month?: string;
  year?: string;
}

// GET /api/v1/export/billing
router.get('/billing', requireRole(['admin', 'keuangan', 'direktur']), asyncHandler(async (req: Request<Record<string, string>, any, any, ExportQuery>, res: Response) => {
  const { date_from, date_to } = req.query;
  const buffer = await exportBilling({ date_from, date_to });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Laporan_Billing_${date_from || 'all'}.xlsx`);
  res.send(Buffer.from(buffer));
}));

// GET /api/v1/export/lab-results/:orderId
router.get('/lab-results/:orderId', asyncHandler(async (req: Request<{ orderId: string }>, res: Response) => {
  const buffer = await exportLabResult(req.params.orderId);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Hasil_Lab_${req.params.orderId}.xlsx`);
  res.send(Buffer.from(buffer));
}));

// GET /api/v1/export/accounting/journal
router.get('/accounting/journal', requireRole(['admin', 'keuangan']), asyncHandler(async (req: Request<Record<string, string>, any, any, ExportQuery>, res: Response) => {
  const { date_from, date_to } = req.query;
  const buffer = await exportAccountingJournal({ date_from, date_to });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Jurnal_Akuntansi_${date_from || 'all'}.xlsx`);
  res.send(Buffer.from(buffer));
}));

// GET /api/v1/export/kemenkes/:reportType
router.get('/kemenkes/:reportType', requireRole(['admin', 'direktur']), asyncHandler(async (req: Request<{ reportType: string }, any, any, KemenkesQuery>, res: Response) => {
  const { reportType } = req.params;
  const { month = String(new Date().getMonth() + 1), year = String(new Date().getFullYear()) } = req.query;

  const buffer = await exportKemenkesRL({ report_type: reportType, month: parseInt(month), year: parseInt(year) });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=RL${reportType}_${month}_${year}.xlsx`);
  res.send(Buffer.from(buffer));
}));

export default router;
