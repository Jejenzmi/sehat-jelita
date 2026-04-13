/**
 * SIMRS ZEN - Scheduled Task Engine
 *
 * Uses a pure Node.js interval-based scheduler (no external dependencies).
 * For production cron precision, swap with node-cron or node-schedule.
 *
 * Schedule:
 *   - Every day  00:05 -> daily revenue report (yesterday)
 *   - Every day  01:00 -> bed occupancy snapshot
 *   - 1st of month 02:00 -> monthly KPI report (previous month)
 */

import { enqueue } from '../utils/queue.js';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
let schedulerTimer: NodeJS.Timeout | null = null;

// Track last run to avoid duplicate triggers
const lastRun: Record<string, string | null> = {
  dailyRevenue: null,
  bedOccupancy: null,
  monthlyKpi: null,
  certExpiry: null,
  maintenance: null,
  dbBackup: null,
  archival: null,
};

function todayKey(): string { return new Date().toISOString().split('T')[0]; }
function thisMonth(): string {
  const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

async function runScheduledTasks(): Promise<void> {
  const now = new Date();

  try {
    // -- Database backup daily at 03:00 --
    if (now.getHours() === 3 && now.getMinutes() < 5) {
      const key = todayKey();
      if (lastRun.dbBackup !== key) {
        lastRun.dbBackup = key;
        await enqueue('reports', 'db-backup', {}, { priority: 5 });
        console.log('[scheduler] Enqueued db-backup');
      }
    }

    // -- Daily revenue report at 00:05 --
    if (now.getHours() === 0 && now.getMinutes() >= 5) {
      const key = todayKey();
      if (lastRun.dailyRevenue !== key) {
        lastRun.dailyRevenue = key;
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        await enqueue('reports', 'daily-revenue', {
          date: yesterday.toISOString().split('T')[0]
        }, { priority: 8 });
        console.log('[scheduler] Enqueued daily-revenue report for', yesterday.toISOString().split('T')[0]);
      }
    }

    // -- Bed occupancy snapshot every hour --
    if (now.getMinutes() < 5) {
      const key = `${todayKey()}-${now.getHours()}`;
      if (lastRun.bedOccupancy !== key) {
        lastRun.bedOccupancy = key;
        await enqueue('reports', 'bed-occupancy-snapshot', {}, { priority: 9 });
      }
    }

    // -- STR/SIP cert expiry check daily at 07:00 --
    if (now.getHours() === 7 && now.getMinutes() < 5) {
      const key = todayKey();
      if (lastRun.certExpiry !== key) {
        lastRun.certExpiry = key;
        await enqueue('reports', 'check-cert-expiry', {}, { priority: 8 });
        console.log('[scheduler] Enqueued check-cert-expiry');
      }
    }

    // -- ASPAK maintenance due check daily at 08:00 --
    if (now.getHours() === 8 && now.getMinutes() < 5) {
      const key = todayKey();
      if (lastRun.maintenance !== key) {
        lastRun.maintenance = key;
        await enqueue('reports', 'check-maintenance-due', {}, { priority: 8 });
        console.log('[scheduler] Enqueued check-maintenance-due');
      }
    }

    // -- Monthly data archival on 2nd of month at 04:00 --
    if (now.getDate() === 2 && now.getHours() === 4 && now.getMinutes() < 5) {
      const key = thisMonth();
      if (lastRun.archival !== key) {
        lastRun.archival = key;
        await enqueue('reports', 'archive-old-data', {}, { priority: 3 });
        console.log('[scheduler] Enqueued archive-old-data');
      }
    }

    // -- Monthly KPI on the 1st at 02:00 --
    if (now.getDate() === 1 && now.getHours() === 2 && now.getMinutes() < 5) {
      const key = thisMonth();
      if (lastRun.monthlyKpi !== key) {
        lastRun.monthlyKpi = key;
        const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        await enqueue('reports', 'monthly-kpi', {
          year: prevYear, month: prevMonth
        }, { priority: 7 });
        console.log(`[scheduler] Enqueued monthly-kpi report for ${prevYear}-${prevMonth}`);
      }
    }
  } catch (err) {
    console.error('[scheduler] Task error:', (err as Error).message);
  }
}

export function startScheduler(): void {
  if (schedulerTimer) return; // already started

  // Check every 5 minutes
  schedulerTimer = setInterval(runScheduledTasks, 5 * MINUTE);

  // Also run immediately in case server started right at schedule time
  setTimeout(runScheduledTasks, 10 * 1000);

  console.log('[scheduler] Scheduler started (5-min tick)');
}

export function stopScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  console.log('[scheduler] Scheduler stopped');
}

export interface TriggerReportParams {
  [key: string]: unknown;
}

interface JobSpec {
  queue: string;
  name: string;
  priority: number;
}

/**
 * Manually trigger a scheduled task on demand.
 * Used by admin API endpoints.
 */
export async function triggerReport(reportType: string, params: TriggerReportParams = {}): Promise<any> {
  const jobMap: Record<string, JobSpec> = {
    'daily_revenue': { queue: 'reports', name: 'daily-revenue', priority: 3 },
    'monthly_kpi': { queue: 'reports', name: 'monthly-kpi', priority: 3 },
    'bed_occupancy': { queue: 'reports', name: 'bed-occupancy-snapshot', priority: 3 },
    'bulk_import_patients': { queue: 'reports', name: 'bulk-import-patients', priority: 2 },
    'check_cert_expiry': { queue: 'reports', name: 'check-cert-expiry', priority: 5 },
    'check_maintenance': { queue: 'reports', name: 'check-maintenance-due', priority: 5 },
    'db_backup': { queue: 'reports', name: 'db-backup', priority: 3 },
  };

  const spec = jobMap[reportType];
  if (!spec) throw new Error(`Unknown report type: ${reportType}`);

  return enqueue(spec.queue, spec.name, params, { priority: spec.priority });
}
