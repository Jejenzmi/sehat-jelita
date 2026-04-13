/**
 * SIMRS ZEN - Notification Service
 * Actual WhatsApp/SMS/Email delivery via:
 *   - WhatsApp: Fonnte API (Indonesian provider)
 *   - SMS: Twilio SMS
 *   - Email: SMTP (existing email.service.js)
 *
 * Usage:
 *   import { notify } from '../services/notification.service.js';
 *   await notify.whatsapp('+628123456789', 'appointment_reminder', { name, datetime });
 */

import axios, { AxiosResponse } from 'axios';
import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { logger } from '../middleware/logger.js';
import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// -- Configuration --
const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const FONNTE_URL = 'https://api.fonnte.com/send';
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER;
const TWILIO_SMS_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;

// -- Message Templates --
export interface TemplateData {
  name?: string;
  hospital?: string;
  datetime?: string;
  doctor?: string;
  department?: string;
  test_names?: string;
  prescription_number?: string;
  billing_number?: string;
  amount?: string | number;
  cert_type?: string;
  employee_name?: string;
  cert_number?: string;
  expiry_date?: string;
  days_left?: string | number;
  incident_code?: string;
  incident_type?: string;
  severity_grade?: string;
  file?: string;
  size_mb?: string | number;
  timestamp?: string;
  error?: string;
  count?: number | string;
  message?: string;
  [key: string]: unknown;
}

type TemplateFn = (data: TemplateData) => string;

const TEMPLATES: Record<string, TemplateFn> = {
  appointment_reminder: (d: TemplateData) =>
    `Halo ${d.name}, mengingatkan janji temu Anda di *${d.hospital || 'SIMRS ZEN'}* pada *${d.datetime}* dengan *dr. ${d.doctor || '-'}* di poli *${d.department || '-'}*.\n\nMohon hadir 15 menit sebelumnya. Terima kasih 🏥`,

  lab_ready: (d: TemplateData) =>
    `Halo ${d.name}, hasil laboratorium Anda (${d.test_names || 'pemeriksaan lab'}) sudah tersedia. Silakan ambil di loket Lab atau lihat di aplikasi Portal Pasien. Terima kasih 🔬`,

  prescription_ready: (d: TemplateData) =>
    `Halo ${d.name}, obat Anda (No. Resep: ${d.prescription_number}) sudah siap diambil di Apotek. Terima kasih 💊`,

  billing_due: (d: TemplateData) =>
    `Halo ${d.name}, tagihan Anda dengan nomor *${d.billing_number}* sebesar *Rp ${d.amount}* sudah jatuh tempo. Silakan lakukan pembayaran di kasir atau via transfer. Terima kasih 💳`,

  cert_expiry: (d: TemplateData) =>
    `⚠️ Pemberitahuan: ${d.cert_type} a.n. *${d.employee_name}* (No. ${d.cert_number}) akan berakhir pada *${d.expiry_date}* (${d.days_left} hari lagi). Segera lakukan perpanjangan.`,

  cert_expiry_urgent: (d: TemplateData) =>
    `🚨 MENDESAK: ${d.cert_type} a.n. *${d.employee_name}* berakhir dalam *${d.days_left} hari* (${d.expiry_date}). Hubungi bagian SDM segera!`,

  incident_alert: (d: TemplateData) =>
    `🚨 INSIDEN KESELAMATAN PASIEN\nKode: ${d.incident_code}\nTipe: ${d.incident_type}\nGrade: ${d.severity_grade}\nLokasi: ${d.department}\nSegera lakukan tindakan!`,

  db_backup: (d: TemplateData) =>
    `✅ Backup database berhasil\nFile: ${d.file}\nUkuran: ${d.size_mb} MB\nWaktu: ${d.timestamp}`,

  db_backup_failed: (d: TemplateData) =>
    `❌ BACKUP DATABASE GAGAL\nError: ${d.error}\nWaktu: ${d.timestamp}\nSegera periksa server!`,

  maintenance_due: (d: TemplateData) =>
    `🔧 Reminder Maintenance Aset\nTerdapat ${d.count} aset yang jadwal maintenance-nya akan/sudah jatuh tempo dalam 7 hari ke depan. Segera hubungi tim teknis.`,

  custom: (d: TemplateData) => d.message || '',
};

// -- Core send functions --

interface SendResult {
  success: boolean;
  provider?: string;
  message_id?: string;
  reason?: string;
  error?: string;
}

async function sendWhatsApp(to: string, message: string): Promise<SendResult> {
  if (!FONNTE_TOKEN) {
    logger.warn('FONNTE_TOKEN not configured — WhatsApp not sent', { to });
    return { success: false, reason: 'not_configured' };
  }

  // Normalize phone: remove +, spaces, dashes; ensure starts with 62
  const phone = to.replace(/[\s\-+]/g, '').replace(/^0/, '62').replace(/^(\d)(?!62)/, '62$1');

  const response: AxiosResponse = await axios.post(
    FONNTE_URL,
    { target: phone, message, countryCode: '62' },
    { headers: { Authorization: FONNTE_TOKEN }, timeout: 10000 }
  );

  if (!response.data?.status) {
    throw new Error(response.data?.reason || 'Fonnte returned failure');
  }

  return { success: true, provider: 'fonnte', message_id: response.data?.id };
}

async function sendSMS(to: string, message: string): Promise<SendResult> {
  if (!TWILIO_SID || !TWILIO_TOKEN) {
    logger.warn('Twilio not configured — SMS not sent', { to });
    return { success: false, reason: 'not_configured' };
  }

  const params = new URLSearchParams({
    To: to,
    From: TWILIO_FROM || '',
    Body: message,
  });

  const response: AxiosResponse = await axios.post(TWILIO_SMS_URL, params.toString(), {
    auth: { username: TWILIO_SID, password: TWILIO_TOKEN || '' },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000,
  });

  return { success: true, provider: 'twilio', message_id: response.data?.sid };
}

// -- Log notification to DB --

async function logNotification(
  channel_type: string,
  recipient: string,
  template_type: string,
  payload: Record<string, unknown>,
  result: SendResult
): Promise<void> {
  await prisma.notification_logs.create({
    data: {
      channel_type,
      recipient,
      template_type,
      payload: payload as unknown as Prisma.InputJsonValue,
      status: result.success ? 'sent' : 'failed',
      provider: result.provider || null,
      provider_msg_id: result.message_id || null,
      error_message: result.error || null,
      sent_at: result.success ? new Date() : null,
    },
  }).catch((e) => logger.warn('Failed to log notification', { error: (e as Error).message }));
}

// -- Public API --

export const notify = {
  /**
   * Send WhatsApp message using a template.
   */
  async whatsapp(phone: string, template_type: string, data: Record<string, unknown> = {}): Promise<SendResult> {
    const templateFn = TEMPLATES[template_type];
    if (!templateFn) throw new Error(`Unknown template: ${template_type}`);
    const message = templateFn(data);

    let result: SendResult;
    try {
      result = await sendWhatsApp(phone, message);
    } catch (err) {
      logger.error('WhatsApp send failed', { phone, error: (err as Error).message });
      result = { success: false, error: (err as Error).message };
    }

    await logNotification('whatsapp', phone, template_type, data, result);
    return result;
  },

  /**
   * Send SMS message using a template.
   */
  async sms(phone: string, template_type: string, data: Record<string, unknown> = {}): Promise<SendResult> {
    const templateFn = TEMPLATES[template_type];
    if (!templateFn) throw new Error(`Unknown template: ${template_type}`);
    const message = templateFn(data);

    let result: SendResult;
    try {
      result = await sendSMS(phone, message);
    } catch (err) {
      logger.error('SMS send failed', { phone, error: (err as Error).message });
      result = { success: false, error: (err as Error).message };
    }

    await logNotification('sms', phone, template_type, data, result);
    return result;
  },

  /**
   * Send via the best available channel for a patient/employee.
   * Checks notification_channels table for their preferences.
   */
  async toPatient(patient_id: string, template_type: string, data: Record<string, unknown> = {}): Promise<SendResult | SendResult[]> {
    const channels = await prisma.notification_channels.findMany({
      where: { patient_id, is_active: true, is_verified: true },
      orderBy: { channel_type: 'asc' },
    });

    if (!channels.length) {
      // Fallback: try patient's mobile_phone from patients table
      const patient = await prisma.patients.findUnique({
        where: { id: patient_id },
        select: { mobile_phone: true, full_name: true },
      });
      if (patient?.mobile_phone) {
        return this.whatsapp(patient.mobile_phone, template_type, { ...data, name: patient.full_name });
      }
      return { success: false, reason: 'no_channel' };
    }

    const results: SendResult[] = [];
    for (const ch of channels) {
      if (ch.channel_type === 'whatsapp') {
        results.push(await this.whatsapp(ch.address, template_type, data));
      } else if (ch.channel_type === 'sms') {
        results.push(await this.sms(ch.address, template_type, data));
      }
    }
    return results;
  },

  /**
   * Send appointment reminder to patient.
   */
  async appointmentReminder(patient_id: string, appointment: Record<string, unknown>): Promise<SendResult | SendResult[]> {
    return this.toPatient(patient_id, 'appointment_reminder', {
      name: appointment.patient_name,
      datetime: new Date(appointment.appointment_date as string).toLocaleString('id-ID'),
      doctor: appointment.doctor_name,
      department: appointment.department_name,
    });
  },

  /**
   * Notify patient that lab results are ready.
   */
  async labReady(patient_id: string, lab_order: Record<string, unknown>): Promise<SendResult | SendResult[]> {
    return this.toPatient(patient_id, 'lab_ready', {
      name: lab_order.patient_name,
      test_names: (lab_order.tests as string[])?.join(', '),
    });
  },

  /**
   * Broadcast to all admins / department heads via system channel.
   */
  async broadcast(template_type: string, data: Record<string, unknown> = {}, phones: string[] = []): Promise<SendResult[]> {
    const results: SendResult[] = [];
    for (const phone of phones) {
      results.push(await this.whatsapp(phone, template_type, data));
    }
    return results;
  },
};

// -- Notification routes (exposed via /api/notifications) --

const adminOnly = [authenticateToken, requireRole(['admin', 'it'])];

export const notificationRouter = Router();
notificationRouter.use(authenticateToken);

// GET /api/notifications/config — current gateway status (which providers are configured)
notificationRouter.get('/config', ...adminOnly, asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      whatsapp: {
        provider: 'Fonnte',
        configured: !!FONNTE_TOKEN,
        docs_url: 'https://fonnte.com/docs',
        env_var: 'FONNTE_TOKEN',
      },
      sms: {
        provider: 'Twilio',
        configured: !!(TWILIO_SID && TWILIO_TOKEN),
        env_vars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'],
        docs_url: 'https://www.twilio.com/docs/sms',
      },
      templates: Object.keys(TEMPLATES),
    },
  });
}));

// GET /api/notifications/logs
notificationRouter.get('/logs', asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50', status, template_type, channel_type } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (template_type) where.template_type = template_type;
  if (channel_type) where.channel_type = channel_type;

  const [logs, total] = await Promise.all([
    prisma.notification_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.notification_logs.count({ where }),
  ]);

  res.json({ success: true, data: logs, meta: { total, page: Number(page), limit: Number(limit) } });
}));

// POST /api/notifications/send — manual send (admin only)
notificationRouter.post('/send', ...adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { phone, template_type, data, channel = 'whatsapp' } = req.body;
  if (!phone || !template_type) {
    return res.status(400).json({ success: false, error: 'phone dan template_type wajib diisi' });
  }

  const result = channel === 'sms'
    ? await notify.sms(phone, template_type, data || {})
    : await notify.whatsapp(phone, template_type, data || {});

  res.json({ success: true, data: result });
}));

// POST /api/notifications/test — test provider connectivity (admin only)
notificationRouter.post('/test', ...adminOnly, asyncHandler(async (req: Request, res: Response) => {
  const { phone, channel = 'whatsapp' } = req.body;
  if (!phone) return res.status(400).json({ success: false, error: 'phone wajib diisi' });

  const result = channel === 'sms'
    ? await notify.sms(phone, 'custom', {
      message: `✅ Test SMS dari SIMRS ZEN berhasil! Waktu: ${new Date().toLocaleString('id-ID')}`,
    })
    : await notify.whatsapp(phone, 'custom', {
      message: `✅ Test notifikasi dari SIMRS ZEN berhasil! Waktu: ${new Date().toLocaleString('id-ID')}`,
    });

  res.json({ success: true, data: result });
}));

// GET /api/notifications/stats — last 30 days breakdown
notificationRouter.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const stats = await prisma.notification_logs.groupBy({
    by: ['channel_type', 'status'],
    _count: { id: true },
    where: { created_at: { gte: new Date(Date.now() - 30 * 86400000) } },
  });
  res.json({ success: true, data: stats });
}));
