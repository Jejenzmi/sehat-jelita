/**
 * SIMRS ZEN - Accounting Routes
 * Manages chart of accounts, journal entries, and financial reports
 */

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

router.use(authenticateToken);

// ============================================
// CHART OF ACCOUNTS
// ============================================

/**
 * GET /api/accounting/accounts
 */
router.get('/accounts',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { type, category, active = true } = req.query;

    const where = { is_active: active === 'true' };
    if (type) where.account_type = type;
    if (category) where.account_category = category;

    const accounts = await prisma.chart_of_accounts.findMany({
      where,
      orderBy: { account_code: 'asc' }
    });

    res.json({ success: true, data: accounts });
  })
);

/**
 * POST /api/accounting/accounts
 */
router.post('/accounts',
  requireRole([ROLES.KEUANGAN]),
  asyncHandler(async (req, res) => {
    const account = await prisma.chart_of_accounts.create({
      data: req.body
    });

    res.status(201).json({ success: true, data: account });
  })
);

// ============================================
// JOURNAL ENTRIES
// ============================================

/**
 * GET /api/accounting/journals
 */
router.get('/journals',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { startDate, endDate, status, page = 1, limit = 50 } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.entry_date = { gte: new Date(startDate), lte: new Date(endDate) };
    }
    if (status) where.status = status;

    const [entries, total] = await Promise.all([
      prisma.journal_entries.findMany({
        where,
        include: { journal_entry_lines: { include: { chart_of_accounts: true } } },
        orderBy: { entry_date: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      }),
      prisma.journal_entries.count({ where })
    ]);

    res.json({ success: true, data: entries, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  })
);

/**
 * POST /api/accounting/journals
 */
router.post('/journals',
  requireRole([ROLES.KEUANGAN]),
  asyncHandler(async (req, res) => {
    const { entryDate, description, referenceType, referenceId, lines } = req.body;

    // Validate debit = credit
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

    if (totalDebit !== totalCredit) {
      throw new ApiError(400, 'Total debit harus sama dengan total credit');
    }

    const entryNumber = await generateJournalNumber();

    const entry = await prisma.journal_entries.create({
      data: {
        entry_number: entryNumber,
        entry_date: new Date(entryDate),
        description,
        reference_type: referenceType,
        reference_id: referenceId,
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'DRAFT',
        created_by: req.user.id,
        journal_entry_lines: {
          create: lines.map((line, idx) => ({
            line_number: idx + 1,
            account_id: line.accountId,
            description: line.description,
            debit: line.debit || 0,
            credit: line.credit || 0
          }))
        }
      },
      include: { journal_entry_lines: true }
    });

    res.status(201).json({ success: true, data: entry });
  })
);

/**
 * PUT /api/accounting/journals/:id/post
 */
router.put('/journals/:id/post',
  requireRole([ROLES.KEUANGAN]),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const entry = await prisma.$transaction(async (tx) => {
      const journal = await tx.journal_entries.findUnique({
        where: { id },
        include: { journal_entry_lines: true }
      });

      if (journal.status !== 'DRAFT') {
        throw new ApiError(400, 'Jurnal sudah di-posting');
      }

      // Update account balances
      for (const line of journal.journal_entry_lines) {
        const account = await tx.chart_of_accounts.findUnique({
          where: { id: line.account_id }
        });

        let balanceChange = line.debit - line.credit;
        if (account.normal_balance === 'CREDIT') {
          balanceChange = -balanceChange;
        }

        await tx.chart_of_accounts.update({
          where: { id: line.account_id },
          data: { current_balance: { increment: balanceChange } }
        });
      }

      return tx.journal_entries.update({
        where: { id },
        data: { status: 'POSTED', posted_at: new Date(), posted_by: req.user.id }
      });
    });

    res.json({ success: true, data: entry });
  })
);

// ============================================
// GENERAL LEDGER
// ============================================

/**
 * GET /api/accounting/ledger/:accountId
 */
router.get('/ledger/:accountId',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { accountId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { account_id: accountId };
    if (startDate && endDate) {
      where.journal_entries = { entry_date: { gte: new Date(startDate), lte: new Date(endDate) } };
    }

    const [account, entries] = await Promise.all([
      prisma.chart_of_accounts.findUnique({ where: { id: accountId } }),
      prisma.journal_entry_lines.findMany({
        where,
        include: { journal_entries: { select: { entry_number: true, entry_date: true, description: true } } },
        orderBy: { journal_entries: { entry_date: 'asc' } }
      })
    ]);

    // Calculate running balance
    let runningBalance = account.opening_balance || 0;
    const ledger = entries.map(entry => {
      const change = account.normal_balance === 'DEBIT' 
        ? entry.debit - entry.credit 
        : entry.credit - entry.debit;
      runningBalance += change;
      return { ...entry, running_balance: runningBalance };
    });

    res.json({ success: true, data: { account, entries: ledger } });
  })
);

// ============================================
// FINANCIAL REPORTS
// ============================================

/**
 * GET /api/accounting/reports/trial-balance
 */
router.get('/reports/trial-balance',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { asOfDate } = req.query;

    const accounts = await prisma.chart_of_accounts.findMany({
      where: { is_active: true, is_header: false },
      orderBy: { account_code: 'asc' }
    });

    const trialBalance = accounts.map(acc => ({
      accountCode: acc.account_code,
      accountName: acc.account_name,
      accountType: acc.account_type,
      debit: acc.normal_balance === 'DEBIT' ? acc.current_balance : 0,
      credit: acc.normal_balance === 'CREDIT' ? acc.current_balance : 0
    }));

    const totals = trialBalance.reduce((sum, acc) => ({
      debit: sum.debit + acc.debit,
      credit: sum.credit + acc.credit
    }), { debit: 0, credit: 0 });

    res.json({ success: true, data: { accounts: trialBalance, totals } });
  })
);

/**
 * GET /api/accounting/reports/income-statement
 */
router.get('/reports/income-statement',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    // Get revenue accounts (4xxxx)
    const revenue = await prisma.chart_of_accounts.findMany({
      where: { account_type: 'REVENUE', is_header: false }
    });

    // Get expense accounts (5xxxx, 6xxxx)
    const expenses = await prisma.chart_of_accounts.findMany({
      where: { account_type: 'EXPENSE', is_header: false }
    });

    const totalRevenue = revenue.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    res.json({
      success: true,
      data: {
        revenue: { accounts: revenue, total: totalRevenue },
        expenses: { accounts: expenses, total: totalExpenses },
        netIncome
      }
    });
  })
);

/**
 * GET /api/accounting/reports/balance-sheet
 */
router.get('/reports/balance-sheet',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req, res) => {
    const { asOfDate } = req.query;

    const [assets, liabilities, equity] = await Promise.all([
      prisma.chart_of_accounts.findMany({
        where: { account_type: 'ASSET', is_header: false }
      }),
      prisma.chart_of_accounts.findMany({
        where: { account_type: 'LIABILITY', is_header: false }
      }),
      prisma.chart_of_accounts.findMany({
        where: { account_type: 'EQUITY', is_header: false }
      })
    ]);

    const totalAssets = assets.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const totalEquity = equity.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

    res.json({
      success: true,
      data: {
        assets: { accounts: assets, total: totalAssets },
        liabilities: { accounts: liabilities, total: totalLiabilities },
        equity: { accounts: equity, total: totalEquity },
        balanced: totalAssets === (totalLiabilities + totalEquity)
      }
    });
  })
);

// Helper
async function generateJournalNumber() {
  const today = new Date();
  const prefix = `JV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const last = await prisma.journal_entries.findFirst({
    where: { entry_number: { startsWith: prefix } },
    orderBy: { entry_number: 'desc' }
  });

  const seq = last ? parseInt(last.entry_number.slice(-4)) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export default router;
