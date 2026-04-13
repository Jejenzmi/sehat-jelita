/**
 * SIMRS ZEN - Email Service
 * Handles email sending via SMTP (Nodemailer)
 */

import nodemailer from 'nodemailer';
import type { SentMessageInfo, AttachmentLike } from 'nodemailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: AttachmentLike[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
}

// SMTP Transporter Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error('Email service connection failed:', error);
  } else {
    console.log('Email service ready');
  }
});

/**
 * Send email
 */
export const sendEmail = async ({ to, subject, html, text, attachments }: SendEmailOptions): Promise<EmailResult> => {
  try {
    const info: SentMessageInfo = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'SIMRS ZEN <noreply@example.com>',
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
      attachments
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Template data types
export interface PasswordResetData {
  resetUrl: string;
  userName: string;
}

export interface AppointmentReminderData {
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  department: string;
}

export interface LabResultsReadyData {
  patientName: string;
  testName: string;
  date: string;
}

export interface PaymentReceiptItem {
  name: string;
  amount: number;
}

export interface PaymentReceiptData {
  patientName: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  items: PaymentReceiptItem[];
}

export interface WelcomeUserData {
  userName: string;
  email: string;
  temporaryPassword: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
}

/**
 * Email Templates
 */
export const emailTemplates = {
  /**
   * Password Reset Email
   */
  passwordReset: (data: PasswordResetData): EmailTemplate => ({
    subject: 'Reset Password SIMRS ZEN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Reset Password</h2>
        <p>Halo ${data.userName},</p>
        <p>Kami menerima permintaan untuk reset password akun SIMRS ZEN Anda.</p>
        <p>Klik tombol di bawah untuk membuat password baru:</p>
        <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">Link ini akan kedaluwarsa dalam 1 jam.</p>
        <p style="color: #666; font-size: 14px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">&copy; SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit</p>
      </div>
    `
  }),

  /**
   * Appointment Reminder
   */
  appointmentReminder: (data: AppointmentReminderData): EmailTemplate => ({
    subject: 'Pengingat Jadwal Kunjungan - SIMRS ZEN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Pengingat Jadwal Kunjungan</h2>
        <p>Halo ${data.patientName},</p>
        <p>Ini adalah pengingat untuk jadwal kunjungan Anda:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Tanggal:</strong> ${data.date}</p>
          <p><strong>Waktu:</strong> ${data.time}</p>
          <p><strong>Dokter:</strong> ${data.doctorName}</p>
          <p><strong>Poli:</strong> ${data.department}</p>
        </div>
        <p>Mohon datang 15 menit sebelum jadwal untuk proses pendaftaran.</p>
        <p>Jangan lupa membawa:</p>
        <ul>
          <li>Kartu identitas (KTP/SIM)</li>
          <li>Kartu BPJS (jika menggunakan)</li>
          <li>Hasil pemeriksaan sebelumnya (jika ada)</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">&copy; SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit</p>
      </div>
    `
  }),

  /**
   * Lab Results Ready
   */
  labResultsReady: (data: LabResultsReadyData): EmailTemplate => ({
    subject: 'Hasil Laboratorium Tersedia - SIMRS ZEN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Hasil Laboratorium Tersedia</h2>
        <p>Halo ${data.patientName},</p>
        <p>Hasil pemeriksaan laboratorium Anda sudah tersedia:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Jenis Pemeriksaan:</strong> ${data.testName}</p>
          <p><strong>Tanggal Pemeriksaan:</strong> ${data.date}</p>
        </div>
        <p>Anda dapat mengakses hasil melalui Portal Pasien atau mengambilnya langsung di rumah sakit.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">&copy; SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit</p>
      </div>
    `
  }),

  /**
   * Payment Receipt
   */
  paymentReceipt: (data: PaymentReceiptData): EmailTemplate => ({
    subject: `Bukti Pembayaran ${data.invoiceNumber} - SIMRS ZEN`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Bukti Pembayaran</h2>
        <p>Halo ${data.patientName},</p>
        <p>Terima kasih atas pembayaran Anda:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>No. Invoice:</strong> ${data.invoiceNumber}</p>
          <p><strong>Tanggal Bayar:</strong> ${data.paymentDate}</p>
          <p><strong>Total:</strong> Rp ${data.amount.toLocaleString('id-ID')}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Item</th>
              <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${data.items.map(item => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">Rp ${item.amount.toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">&copy; SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit</p>
      </div>
    `
  }),

  /**
   * Welcome New User
   */
  welcomeUser: (data: WelcomeUserData): EmailTemplate => ({
    subject: 'Selamat Datang di SIMRS ZEN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Selamat Datang di SIMRS ZEN</h2>
        <p>Halo ${data.userName},</p>
        <p>Akun SIMRS ZEN Anda telah berhasil dibuat.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Password Sementara:</strong> ${data.temporaryPassword}</p>
        </div>
        <p style="color: #dc2626;"><strong>Penting:</strong> Segera ubah password Anda setelah login pertama.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">&copy; SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit</p>
      </div>
    `
  })
} as const;

export type TemplateName = keyof typeof emailTemplates;

/**
 * Send templated email
 */
export const sendTemplatedEmail = async (templateName: TemplateName, to: string | string[], data: Record<string, unknown>): Promise<EmailResult> => {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const { subject, html } = template(data as any);
  return sendEmail({ to, subject, html });
};

export default {
  sendEmail,
  sendTemplatedEmail,
  emailTemplates
};
