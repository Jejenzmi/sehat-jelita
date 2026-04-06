/**
 * SIMRS ZEN - Report Generation Worker
 * Computes and stores scheduled reports (daily revenue, monthly KPIs, RL reports).
 */

import { prisma } from '../config/database.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfDay(d) {
  const dt = new Date(d); dt.setHours(0, 0, 0, 0); return dt;
}
function endOfDay(d) {
  const dt = new Date(d); dt.setHours(23, 59, 59, 999); return dt;
}
function startOfMonth(year, month) { return new Date(year, month - 1, 1); }
function endOfMonth(year, month)   { return new Date(year, month, 0, 23, 59, 59, 999); }

// ── Job handler ───────────────────────────────────────────────────────────────

export async function processReportJob(job) {
  const { name, data } = job;

  switch (name) {

    case 'daily-revenue': {
      const date  = data.date ? new Date(data.date) : new Date();
      const start = startOfDay(date);
      const end   = endOfDay(date);

      const [revenue, byType, visitCount, newPatients] = await Promise.all([
        prisma.billings.aggregate({
          where: { payment_date: { gte: start, lte: end }, status: 'paid' },
          _sum: { paid_amount: true }, _count: true
        }),
        prisma.billings.groupBy({
          by: ['payment_type'],
          where: { payment_date: { gte: start, lte: end }, status: 'paid' },
          _sum: { paid_amount: true }, _count: true
        }),
        prisma.visits.count({ where: { visit_date: { gte: start, lte: end } } }),
        prisma.patients.count({ where: { created_at: { gte: start, lte: end }, is_active: true } }),
      ]);

      const reportData = {
        date:           start.toISOString().split('T')[0],
        total_revenue:  Number(revenue._sum.paid_amount || 0),
        transactions:   revenue._count,
        visit_count:    visitCount,
        new_patients:   newPatients,
        by_payment_type: byType.map(r => ({
          type:    r.payment_type,
          revenue: Number(r._sum.paid_amount || 0),
          count:   r._count,
        }))
      };

      // Upsert into scheduled_reports
      await prisma.scheduled_reports.upsert({
        where:  {
          // Use findFirst+update pattern since no unique constraint on type+period
          id: (await prisma.scheduled_reports.findFirst({
            where: { report_type: 'daily_revenue', report_period: reportData.date }
          }))?.id ?? '00000000-0000-0000-0000-000000000000'
        },
        update: { status: 'completed', data: reportData, generated_at: new Date() },
        create: {
          report_type: 'daily_revenue', report_period: reportData.date,
          status: 'completed', data: reportData, generated_at: new Date()
        }
      }).catch(async () => {
        // upsert fails on missing id → create
        await prisma.scheduled_reports.create({
          data: {
            report_type:   'daily_revenue',
            report_period: reportData.date,
            status:        'completed',
            data:          reportData,
            generated_at:  new Date()
          }
        });
      });

      return { success: true, report: 'daily_revenue', date: reportData.date, total_revenue: reportData.total_revenue };
    }

    case 'monthly-kpi': {
      const year  = data.year  || new Date().getFullYear();
      const month = data.month || new Date().getMonth() + 1;
      const start = startOfMonth(year, month);
      const end   = endOfMonth(year, month);
      const period = `${year}-${String(month).padStart(2, '0')}`;

      // Inpatient metrics
      const admissions = await prisma.inpatient_admissions.findMany({
        where: { admission_date: { gte: start, lte: end } },
        select: { admission_date: true, discharge_date: true, bed_id: true }
      });

      const totalBeds = await prisma.beds.count({ where: { status: { not: 'maintenance' } } });

      const daysInMonth  = new Date(year, month, 0).getDate();
      const totalPatientDays = admissions.reduce((sum, a) => {
        const discharge = a.discharge_date ? new Date(a.discharge_date) : end;
        const days = Math.max(1, Math.ceil((discharge - new Date(a.admission_date)) / 86400000));
        return sum + days;
      }, 0);

      const BOR  = totalBeds ? ((totalPatientDays / (totalBeds * daysInMonth)) * 100).toFixed(2) : 0;
      const ALOS = admissions.length ? (totalPatientDays / admissions.length).toFixed(2) : 0;

      const [deaths, revenue, visits, labs, prescriptions] = await Promise.all([
        prisma.inpatient_admissions.count({
          where: { discharge_date: { gte: start, lte: end }, discharge_status: 'meninggal' }
        }).catch(() => 0),
        prisma.billings.aggregate({
          where: { payment_date: { gte: start, lte: end }, status: 'paid' },
          _sum: { paid_amount: true }
        }),
        prisma.visits.count({ where: { visit_date: { gte: start, lte: end } } }),
        prisma.lab_orders.count({ where: { created_at: { gte: start, lte: end } } }),
        prisma.prescriptions.count({ where: { created_at: { gte: start, lte: end } } }),
      ]);

      const NDR = admissions.length >= 48
        ? ((deaths / admissions.length) * 1000).toFixed(2) : 0;

      const reportData = {
        period, year, month,
        inpatient: {
          admissions:        admissions.length,
          total_patient_days: totalPatientDays,
          BOR:               parseFloat(BOR),
          ALOS:              parseFloat(ALOS),
          NDR:               parseFloat(NDR),
        },
        total_revenue: Number(revenue._sum.paid_amount || 0),
        visits,
        lab_orders:    labs,
        prescriptions,
        computed_at:   new Date().toISOString()
      };

      await prisma.scheduled_reports.create({
        data: {
          report_type:   'monthly_kpi',
          report_period: period,
          status:        'completed',
          data:          reportData,
          generated_at:  new Date()
        }
      });

      // Also save as analytics snapshot
      await prisma.analytics_snapshots.upsert({
        where: {
          snapshot_type_snapshot_date_department_id: {
            snapshot_type: 'monthly_kpi',
            snapshot_date:  start,
            department_id:  null
          }
        },
        update: { data: reportData, computed_at: new Date() },
        create: {
          snapshot_type: 'monthly_kpi',
          snapshot_date:  start,
          data:           reportData
        }
      }).catch(() => {});

      return { success: true, report: 'monthly_kpi', period, BOR, ALOS };
    }

    case 'bed-occupancy-snapshot': {
      const now  = new Date();
      const date = startOfDay(now);

      const [occupied, total] = await Promise.all([
        prisma.beds.count({ where: { status: 'occupied' } }),
        prisma.beds.count({ where: { status: { not: 'maintenance' } } })
      ]);

      const BOR = total ? ((occupied / total) * 100).toFixed(1) : '0';

      await prisma.analytics_snapshots.upsert({
        where: {
          snapshot_type_snapshot_date_department_id: {
            snapshot_type: 'daily_bed_occupancy',
            snapshot_date:  date,
            department_id:  null
          }
        },
        update: { data: { occupied, total, BOR }, computed_at: new Date() },
        create: {
          snapshot_type: 'daily_bed_occupancy',
          snapshot_date:  date,
          data:           { occupied, total, BOR }
        }
      }).catch(() => {});

      return { success: true, occupied, total, BOR };
    }

    case 'bulk-import-patients': {
      const { rows } = data; // [{ full_name, nik, birth_date, gender, ... }]
      let imported = 0, failed = 0;
      const errors = [];

      for (const row of rows || []) {
        try {
          const existing = row.nik
            ? await prisma.patients.findFirst({ where: { nik: row.nik } })
            : null;
          if (existing) { failed++; errors.push(`NIK ${row.nik} sudah terdaftar`); continue; }

          // Generate MRN
          const year  = new Date().getFullYear().toString().slice(-2);
          const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
          const prefix = `RM${year}${month}`;
          const last = await prisma.patients.findFirst({
            where: { medical_record_number: { startsWith: prefix } },
            orderBy: { medical_record_number: 'desc' }
          });
          const seq = last ? parseInt(last.medical_record_number.slice(-5), 10) + 1 : 1;
          const medical_record_number = `${prefix}${seq.toString().padStart(5, '0')}`;

          await prisma.patients.create({
            data: { ...row, medical_record_number }
          });
          imported++;
        } catch (err) {
          failed++;
          errors.push(`Row ${imported + failed}: ${err.message}`);
        }
      }

      return { success: true, imported, failed, errors: errors.slice(0, 20) };
    }

    // ── PostgreSQL Database Backup ────────────────────────────────────────────
    case 'db-backup': {
      const backupDir  = process.env.BACKUP_PATH || './backups';
      const retainDays = Number(process.env.BACKUP_RETAIN_DAYS || 7);

      // Ensure backup directory exists
      mkdirSync(backupDir, { recursive: true });

      // Parse DATABASE_URL to extract connection details
      const dbUrl  = new URL(process.env.DATABASE_URL || process.env.DIRECT_URL || '');
      const dbName = dbUrl.pathname.replace(/^\//, '').split('?')[0];
      const dbHost = dbUrl.hostname;
      const dbPort = dbUrl.port || '5432';
      const dbUser = dbUrl.username;

      const timestamp  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupFile = join(backupDir, `backup_${dbName}_${timestamp}.sql.gz`);

      // Run pg_dump | gzip via shell (requires pg_dump in PATH)
      try {
        await execFileAsync('sh', [
          '-c',
          `PGPASSWORD="${dbUrl.password}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-password | gzip > "${backupFile}"`,
        ]);

        // Get file size
        const { size } = statSync(backupFile);
        const sizeMb = (size / 1e6).toFixed(2);

        // Log success to DB
        await prisma.notification_logs.create({
          data: {
            channel_type:  'system',
            recipient:     'dba',
            template_type: 'db_backup',
            payload: { file: backupFile, size_mb: sizeMb, timestamp },
            status: 'sent',
            sent_at: new Date(),
          },
        }).catch(() => {});

        // Clean up old backups (retain last N days)
        const cutoff = Date.now() - retainDays * 86400000;
        const files  = readdirSync(backupDir).filter(f => f.startsWith('backup_'));
        for (const file of files) {
          const filePath = join(backupDir, file);
          const { mtimeMs } = statSync(filePath);
          if (mtimeMs < cutoff) unlinkSync(filePath);
        }

        return { success: true, file: backupFile, size_mb: sizeMb };
      } catch (err) {
        console.error('[Backup] pg_dump failed:', err.message);
        // Log failure
        await prisma.notification_logs.create({
          data: {
            channel_type:  'system',
            recipient:     'dba',
            template_type: 'db_backup_failed',
            payload: { error: err.message, timestamp },
            status: 'failed',
            error_message: err.message,
          },
        }).catch(() => {});
        throw err;
      }
    }

    // ── STR/SIP Certification Expiry Alerts ──────────────────────────────────
    case 'check-cert-expiry': {
      const now       = new Date();
      const in30Days  = new Date(now.getTime() + 30 * 86400000);
      const in7Days   = new Date(now.getTime() +  7 * 86400000);

      // Find active certs expiring within 30 days that haven't been alerted
      const certsToAlert = await prisma.staff_certifications.findMany({
        where: {
          status: 'active',
          expiry_date: { lte: in30Days },
          OR: [
            { alert_sent_30d: false },
            { alert_sent_7d: false, expiry_date: { lte: in7Days } },
          ],
        },
        include: {
          employees: {
            select: { full_name: true, employee_code: true, departments: { select: { name: true } } },
          },
        },
      });

      let alerted30 = 0, alerted7 = 0;
      for (const cert of certsToAlert) {
        const daysLeft = Math.ceil((new Date(cert.expiry_date) - now) / 86400000);
        const employeeName = cert.employees?.full_name || cert.user_id || 'Unknown';
        const deptName     = cert.employees?.departments?.name || '';

        // Log notification for each alert
        const payload = {
          cert_id:       cert.id,
          cert_type:     cert.cert_type,
          cert_number:   cert.cert_number,
          employee_name: employeeName,
          department:    deptName,
          expiry_date:   cert.expiry_date,
          days_left:     daysLeft,
        };

        if (!cert.alert_sent_30d && daysLeft <= 30) {
          await prisma.notification_logs.create({
            data: {
              channel_type:  'system',
              recipient:     employeeName,
              template_type: 'cert_expiry',
              payload,
              status: 'sent',
              sent_at: now,
            },
          }).catch(() => {});

          await prisma.staff_certifications.update({
            where: { id: cert.id },
            data: { alert_sent_30d: true, updated_at: now },
          });
          alerted30++;
        }

        if (!cert.alert_sent_7d && daysLeft <= 7) {
          await prisma.notification_logs.create({
            data: {
              channel_type:  'system',
              recipient:     employeeName,
              template_type: 'cert_expiry_urgent',
              payload: { ...payload, urgent: true },
              status: 'sent',
              sent_at: now,
            },
          }).catch(() => {});

          await prisma.staff_certifications.update({
            where: { id: cert.id },
            data: { alert_sent_7d: true, updated_at: now },
          });
          alerted7++;
        }
      }

      // Mark actually-expired certs
      await prisma.staff_certifications.updateMany({
        where: { status: 'active', expiry_date: { lt: now } },
        data:  { status: 'expired', updated_at: now },
      });

      return { success: true, alerted30, alerted7, checked: certsToAlert.length };
    }

    // ── Maintenance Due Alerts for ASPAK Assets ──────────────────────────────
    case 'check-maintenance-due': {
      const now      = new Date();
      const in7Days  = new Date(now.getTime() + 7 * 86400000);

      const assetsDue = await prisma.aspak_assets.findMany({
        where: {
          is_active: true,
          next_maintenance_at: { lte: in7Days },
        },
        include: { departments: { select: { name: true } } },
      });

      if (assetsDue.length > 0) {
        await prisma.notification_logs.create({
          data: {
            channel_type:  'system',
            recipient:     'maintenance_team',
            template_type: 'maintenance_due',
            payload: {
              count: assetsDue.length,
              assets: assetsDue.map(a => ({
                code: a.asset_code,
                name: a.asset_name,
                dept: a.departments?.name,
                due:  a.next_maintenance_at,
              })),
            },
            status: 'sent',
            sent_at: now,
          },
        }).catch(() => {});
      }

      return { success: true, maintenance_due: assetsDue.length };
    }

    // ── Data Archival (records > 2 years old) ─────────────────────────────────
    case 'archive-old-data': {
      const cutoffDate = new Date(Date.now() - 2 * 365 * 86400000); // 2 years ago
      const batchSize = 1000;
      const results = {};

      // Archive audit_logs
      const auditLogs = await prisma.audit_logs.findMany({
        where: { created_at: { lt: cutoffDate } },
        take: batchSize,
      });
      if (auditLogs.length > 0) {
        await prisma.$executeRaw`
          INSERT INTO archive_audit_logs
            (id, table_name, action, record_id, user_id, old_data, new_data, ip_address, user_agent, created_at)
          SELECT id, table_name, action, record_id, user_id, old_data, new_data, ip_address, user_agent, created_at
          FROM audit_logs
          WHERE created_at < ${cutoffDate}
          LIMIT ${batchSize}
        `;
        await prisma.audit_logs.deleteMany({
          where: { id: { in: auditLogs.map(r => r.id) } },
        });
        results.audit_logs = auditLogs.length;
      }

      // Archive old notification_logs
      const notifLogs = await prisma.notification_logs.findMany({
        where: {
          created_at: { lt: cutoffDate },
          status: { in: ['sent', 'delivered', 'bounced'] },
        },
        take: batchSize,
      });
      if (notifLogs.length > 0) {
        await prisma.$executeRaw`
          INSERT INTO archive_notification_logs
            (id, channel_type, recipient, template_type, payload, status, provider, provider_msg_id, error_message, sent_at, created_at)
          SELECT id, channel_type, recipient, template_type, payload, status, provider, provider_msg_id, error_message, sent_at, created_at
          FROM notification_logs
          WHERE created_at < ${cutoffDate}
            AND status IN ('sent', 'delivered', 'bounced')
          LIMIT ${batchSize}
        `;
        await prisma.notification_logs.deleteMany({
          where: { id: { in: notifLogs.map(r => r.id) } },
        });
        results.notification_logs = notifLogs.length;
      }

      // Log archival action
      await prisma.notification_logs.create({
        data: {
          channel_type:  'system',
          recipient:     'dba',
          template_type: 'data_archival',
          payload: { cutoff: cutoffDate.toISOString(), ...results },
          status: 'sent',
          sent_at: new Date(),
        },
      }).catch(() => {});

      return { success: true, archived: results, cutoff: cutoffDate.toISOString() };
    }

    default:
      throw new Error(`Unknown report job: ${name}`);
  }
}
