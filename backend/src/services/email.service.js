/**
 * SIMRS ZEN - Email Service
 * Handles email sending via SMTP (Nodemailer)
 */

import nodemailer from 'nodemailer';

// SMTP Transporter Configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
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
export const sendEmail = async ({ to, subject, html, text, attachments }) => {
  try {
    const info = await transporter.sendMail({
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

/**
 * Email Templates
 */
export const emailTemplates = {
  /**
   * Password Reset Email
   */
  passwordReset: (resetUrl, userName) => ({
    subject: 'Reset Password SIMRS ZEN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Reset Password</h2>
        <p>Halo ${userName},</p>
        <p>Kami menerima permintaan untuk reset password akun SIMRS ZEN Anda.</p>
        <p>Klik tombol di bawah untuk membuat password baru:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">Link ini akan kedaluwarsa dalam 1 jam.</p>
        <p style="color: #666; font-size: 14px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">© SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit</p>
      </div>
    `
  }),

  /**
   * Appointment Reminder
   */
  appointmentReminder: (patientName, doctorName, date, time, department) => ({
    subject: 'Pengingat Jadwal Kunjungan - SIMRS ZEN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Pengingat Jadwal Kunjungan</h2>
        <p>Halo ${patientName},</p>
        <p>Ini adalah pengingat untuk jadwal kunjungan Anda:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Tanggal:</strong> ${date}</p>
          <p><strong>Waktu:</strong> ${time}</p>
          <p><strong>Dokter:</strong> ${doctorName}</p>
          <p><strong>Poli:</strong> ${department}</p>
        </div>
        <p>Mohon datang 15 menit sebelum jadwal untuk proses pendaftaran.</p>
        <p>Jangan lupa membawa:</p>
        <ul>
          <li>Kartu identitas (KTP/SIM)</li>
          <li>Kartu BPJS (jika menggunakan)</li>
          <li>Hasil pemeriksaan sebelumnya (jika ada)</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">© SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit</p>
      </div>
    `
  }),

  /**
   * Lab Results Ready
   */
  labResultsReady: (patientName, testName, date) => ({
    subject: 'Hasil Laboratorium Tersedia - SIMRS ZEN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Hasil Laboratorium Tersedia</h2>
        <p>Halo ${patientName},</p>
        <p>Hasil pemeriksaan laboratorium Anda sudah tersedia:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Jenis Pemeriksaan:</strong> ${testName}</p>
          <p><strong>Tanggal Pemeriksaan:</strong> ${date}</p>
        </div>
        <p>Anda dapat mengakses hasil melalui Portal Pasien atau mengambilnya langsung di rumah sakit.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">© SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit</p>
      </div>
    `
  }),

  /**
   * Payment Receipt
   */
  paymentReceipt: (patientName, invoiceNumber, amount, paymentDate, items) => ({
    subject: `Bukti Pembayaran ${invoiceNumber} - SIMRS ZEN`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Bukti Pembayaran</h2>
        <p>Halo ${patientName},</p>
        <p>Terima kasih atas pembayaran Anda:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>No. Invoice:</strong> ${invoiceNumber}</p>
          <p><strong>Tanggal Bayar:</strong> ${paymentDate}</p>
          <p><strong>Total:</strong> Rp ${amount.toLocaleString('id-ID')}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Item</th>
              <th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 8px; text-align: right; border-bottom: 1px solid #eee;">Rp ${item.amount.toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">© SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit</p>
      </div>
    `
  }),

  /**
   * Welcome New User
   */
  welcomeUser: (userName, email, temporaryPassword) => ({
    subject: 'Selamat Datang di SIMRS ZEN',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Selamat Datang di SIMRS ZEN</h2>
        <p>Halo ${userName},</p>
        <p>Akun SIMRS ZEN Anda telah berhasil dibuat.</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password Sementara:</strong> ${temporaryPassword}</p>
        </div>
        <p style="color: #dc2626;"><strong>Penting:</strong> Segera ubah password Anda setelah login pertama.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">© SIMRS ZEN - Sistem Informasi Manajemen Rumah Sakit</p>
      </div>
    `
  })
};

/**
 * Send templated email
 */
export const sendTemplatedEmail = async (templateName, to, data) => {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error(`Email template '${templateName}' not found`);
  }

  const { subject, html } = template(...Object.values(data));
  return sendEmail({ to, subject, html });
};

export default {
  sendEmail,
  sendTemplatedEmail,
  emailTemplates
};
