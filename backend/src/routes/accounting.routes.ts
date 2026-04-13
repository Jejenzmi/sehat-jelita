/**
 * SIMRS ZEN - Accounting Routes
 * Manages chart of accounts, journal entries, and financial reports
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { requireRole, ROLES } from '../middleware/role.middleware.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// Helper: normalize account record (add frontend-expected field aliases)
function normalizeAccount(acc: Record<string, unknown>) {
  return {
    ...acc,
    parent_account_id: acc.parent_id,
    opening_balance: Number(acc.opening_balance || 0),
    current_balance: Number(acc.current_balance || 0),
    total_debit: Number(acc.total_debit || 0),
    total_credit: Number(acc.total_credit || 0),
  };
}

// Helper: normalize journal entry record
function normalizeJournal(j: Record<string, unknown>) {
  return {
    ...j,
    journal_number: j.entry_number,
    total_debit: Number(j.total_debit || 0),
    total_credit: Number(j.total_credit || 0),
    lines: (j.journal_entry_lines as unknown[] | undefined)?.map(l => {
      const line = l as Record<string, unknown>;
      return {
        ...line,
        journal_entry_id: line.entry_id,
        debit_amount: Number(line.debit || 0),
        credit_amount: Number(line.credit || 0),
        account: line.chart_of_accounts ? normalizeAccount(line.chart_of_accounts as Record<string, unknown>) : undefined,
      };
    }),
  };
}

// Helper: generate journal number
async function generateJournalNumber(): Promise<string> {
  const today = new Date();
  const prefix = `JV${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  const last = await prisma.journal_entries.findFirst({
    where: { entry_number: { startsWith: prefix } },
    orderBy: { entry_number: 'desc' },
  });
  const seq = last ? parseInt(last.entry_number.slice(-4), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// ============================================
// CHART OF ACCOUNTS
// ============================================

interface AccountsQuery {
  type?: string;
  category?: string;
  active?: string;
  is_header?: string;
}

/**
 * GET /api/accounting/accounts
 */
router.get('/accounts',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request<{}, {}, {}, AccountsQuery>, res: Response) => {
    const { type, category, active, is_header } = req.query;

    const where: Record<string, unknown> = { is_active: active === 'false' ? false : true };
    if (type) where.account_type = type;
    if (category) where.account_category = category;
    if (is_header !== undefined) where.is_header = is_header === 'true';

    const accounts = await prisma.chart_of_accounts.findMany({
      where,
      orderBy: [{ display_order: 'asc' }, { account_code: 'asc' }],
    });

    res.json({ success: true, data: accounts.map(normalizeAccount) });
  })
);

/**
 * POST /api/accounting/accounts
 */
router.post('/accounts',
  requireRole([ROLES.KEUANGAN]),
  asyncHandler(async (req: Request, res: Response) => {
    const { parent_account_id, opening_balance, ...rest } = req.body;
    const account = await prisma.chart_of_accounts.create({
      data: {
        ...rest,
        parent_id: parent_account_id || rest.parent_id || null,
        opening_balance: opening_balance || 0,
        current_balance: opening_balance || 0,
      },
    });
    res.status(201).json({ success: true, data: normalizeAccount(account as unknown as Record<string, unknown>) });
  })
);

/**
 * PUT /api/accounting/accounts/:id
 */
router.put('/accounts/:id',
  requireRole([ROLES.KEUANGAN]),
  asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const { parent_account_id, opening_balance, ...rest } = req.body;
    const account = await prisma.chart_of_accounts.update({
      where: { id },
      data: {
        ...rest,
        parent_id: parent_account_id !== undefined ? parent_account_id || null : undefined,
        opening_balance: opening_balance !== undefined ? Number(opening_balance) : undefined,
      },
    });
    res.json({ success: true, data: normalizeAccount(account as unknown as Record<string, unknown>) });
  })
);

// ============================================
// JOURNAL ENTRIES
// ============================================

interface JournalsQuery {
  startDate?: string;
  endDate?: string;
  status?: string;
  entry_date_gte?: string;
  entry_date_lte?: string;
  cursor?: string;
  page?: string;
  limit?: string;
}

/**
 * GET /api/accounting/journals
 */
router.get('/journals',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request<{}, {}, {}, JournalsQuery>, res: Response) => {
    const { startDate, endDate, status, entry_date_gte, entry_date_lte, cursor, page = '1', limit = '50' } = req.query;
    const take = Math.min(parseInt(limit), 200);

    const where: Record<string, unknown> = {};
    const dateFrom = startDate || entry_date_gte;
    const dateTo = endDate || entry_date_lte;
    if (dateFrom && dateTo) {
      where.entry_date = { gte: new Date(dateFrom), lte: new Date(dateTo) };
    } else if (dateFrom) {
      where.entry_date = { gte: new Date(dateFrom) };
    } else if (dateTo) {
      where.entry_date = { lte: new Date(dateTo) };
    }
    if (status) where.status = status.toUpperCase();

    const include = {
      journal_entry_lines: {
        include: { chart_of_accounts: true },
        orderBy: { line_number: 'asc' as const },
      },
    };

    // Cursor-based pagination
    if (cursor) {
      const entries = await prisma.journal_entries.findMany({
        where: { ...where, id: { lt: cursor } },
        take: take + 1,
        orderBy: [{ entry_date: 'desc' }, { id: 'desc' }],
        include,
      });
      const hasMore = entries.length > take;
      if (hasMore) entries.pop();
      return res.json({
        success: true,
        data: entries.map(normalizeJournal),
        meta: { next_cursor: hasMore ? entries[entries.length - 1]?.id : null, has_more: hasMore, limit: take },
      });
    }

    // Offset pagination (backward compatible)
    const [entries, total] = await Promise.all([
      prisma.journal_entries.findMany({
        where,
        include,
        orderBy: [{ entry_date: 'desc' }, { entry_number: 'desc' }],
        skip: (parseInt(page) - 1) * take,
        take,
      }),
      prisma.journal_entries.count({ where }),
    ]);

    res.json({
      success: true,
      data: entries.map(normalizeJournal),
      pagination: { page: parseInt(page), limit: take, total },
    });
  })
);

/**
 * GET /api/accounting/journals/:id
 */
router.get('/journals/:id',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const journal = await prisma.journal_entries.findUnique({
      where: { id },
      include: {
        journal_entry_lines: {
          include: { chart_of_accounts: true },
          orderBy: { line_number: 'asc' as const },
        },
      },
    });
    if (!journal) throw new ApiError(404, 'Jurnal tidak ditemukan');
    res.json({ success: true, data: normalizeJournal(journal as unknown as Record<string, unknown>) });
  })
);

interface JournalLine {
  line_number?: number;
  account_id: string;
  description?: string;
  debit_amount?: number;
  debit?: number;
  credit_amount?: number;
  credit?: number;
}

interface JournalBody {
  entryDate?: string;
  entry_date?: string;
  description: string;
  referenceType?: string;
  reference_type?: string;
  referenceId?: string;
  reference_id?: string;
  reference_number?: string;
  lines: JournalLine[];
  notes?: string;
}

/**
 * POST /api/accounting/journals
 */
router.post('/journals',
  requireRole([ROLES.KEUANGAN]),
  asyncHandler(async (req: Request<{}, {}, JournalBody>, res: Response) => {
    const { entryDate, entry_date, description, referenceType, reference_type, referenceId, reference_id, reference_number, lines, notes } = req.body;

    if (!lines || lines.length < 2) {
      throw new ApiError(400, 'Jurnal harus memiliki minimal 2 baris');
    }

    const totalDebit = lines.reduce((s, l) => s + Number(l.debit_amount || l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + Number(l.credit_amount || l.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new ApiError(400, 'Total debit harus sama dengan total kredit');
    }

    const entryNumber = await generateJournalNumber();

    const entry = await prisma.journal_entries.create({
      data: {
        entry_number: entryNumber,
        entry_date: new Date(entryDate || entry_date!),
        description,
        reference_type: referenceType || reference_type || null,
        reference_id: referenceId || reference_id || null,
        reference_number: reference_number || null,
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'DRAFT',
        notes: notes || null,
        created_by: req.user?.id || null,
        journal_entry_lines: {
          create: lines.map((line, idx) => ({
            line_number: line.line_number || idx + 1,
            account_id: line.account_id,
            description: line.description || null,
            debit: Number(line.debit_amount || line.debit || 0),
            credit: Number(line.credit_amount || line.credit || 0),
          })),
        },
      },
      include: {
        journal_entry_lines: { include: { chart_of_accounts: true }, orderBy: { line_number: 'asc' } },
      },
    });

    res.status(201).json({ success: true, data: normalizeJournal(entry as unknown as Record<string, unknown>) });
  })
);

/**
 * PUT /api/accounting/journals/:id/post
 */
router.put('/journals/:id/post',
  requireRole([ROLES.KEUANGAN]),
  asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    const entry = await prisma.$transaction(async (tx) => {
      const journal = await tx.journal_entries.findUnique({
        where: { id },
        include: { journal_entry_lines: true },
      });

      if (!journal) throw new ApiError(404, 'Jurnal tidak ditemukan');
      if (journal.status === 'POSTED') throw new ApiError(400, 'Jurnal sudah di-posting');
      if (journal.status === 'VOIDED') throw new ApiError(400, 'Jurnal sudah dibatalkan');

      // Update account balances
      for (const line of journal.journal_entry_lines) {
        const account = await tx.chart_of_accounts.findUnique({ where: { id: line.account_id } });
        if (!account) continue;

        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);
        let balanceChange = debit - credit;
        if ((account as Record<string, unknown>).normal_balance === 'CREDIT') balanceChange = -balanceChange;

        await tx.chart_of_accounts.update({
          where: { id: line.account_id },
          data: { current_balance: { increment: balanceChange } },
        });
      }

      return tx.journal_entries.update({
        where: { id },
        data: { status: 'POSTED', posted_at: new Date(), posted_by: req.user?.id || null },
      });
    });

    res.json({ success: true, data: normalizeJournal(entry as unknown as Record<string, unknown>) });
  })
);

interface VoidBody {
  reason?: string;
}

/**
 * PUT /api/accounting/journals/:id/void
 */
router.put('/journals/:id/void',
  requireRole([ROLES.KEUANGAN]),
  asyncHandler(async (req: Request<{ id: string }, {}, VoidBody>, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const journal = await prisma.journal_entries.findUnique({ where: { id } });
    if (!journal) throw new ApiError(404, 'Jurnal tidak ditemukan');
    if (journal.status === 'VOIDED') throw new ApiError(400, 'Jurnal sudah dibatalkan');

    // Reverse balance changes if it was posted
    if (journal.status === 'POSTED') {
      const lines = await prisma.journal_entry_lines.findMany({ where: { entry_id: id } });
      for (const line of lines) {
        const account = await prisma.chart_of_accounts.findUnique({ where: { id: line.account_id } });
        if (!account) continue;
        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);
        let balanceChange = debit - credit;
        if ((account as Record<string, unknown>).normal_balance === 'CREDIT') balanceChange = -balanceChange;
        await prisma.chart_of_accounts.update({
          where: { id: line.account_id },
          data: { current_balance: { decrement: balanceChange } },
        });
      }
    }

    const entry = await prisma.journal_entries.update({
      where: { id },
      data: { status: 'VOIDED', notes: reason ? `[DIBATALKAN] ${reason}` : '[DIBATALKAN]' },
    });

    res.json({ success: true, data: normalizeJournal(entry as unknown as Record<string, unknown>) });
  })
);

// ============================================
// FISCAL PERIODS (computed from existing data)
// ============================================

interface FiscalPeriodsQuery {
  year?: string;
}

/**
 * GET /api/accounting/fiscal-periods
 * Returns computed list of months that have journal entries + current month
 */
router.get('/fiscal-periods',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request<{}, {}, {}, FiscalPeriodsQuery>, res: Response) => {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    // Get distinct months from journal_entries for the year
    const today = new Date();
    const months = [];
    for (let m = 1; m <= 12; m++) {
      const start = new Date(targetYear, m - 1, 1);
      const end = new Date(targetYear, m, 0, 23, 59, 59);
      const count = await prisma.journal_entries.count({
        where: { entry_date: { gte: start, lte: end } },
      });
      months.push({
        id: `${targetYear}-${String(m).padStart(2, '0')}`,
        period_name: start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        fiscal_year: targetYear,
        period_number: m,
        is_closed: today > end,
        entry_count: count,
      });
    }

    res.json({ success: true, data: months });
  })
);

// ============================================
// GENERAL LEDGER
// ============================================

interface GeneralLedgerQuery {
  year?: string;
  month?: string;
}

/**
 * GET /api/accounting/reports/general-ledger?year=&month=
 */
router.get('/reports/general-ledger',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request<{}, {}, {}, GeneralLedgerQuery>, res: Response) => {
    const { year, month } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    let startDate = new Date(targetYear, 0, 1);
    let endDate = new Date(targetYear, 11, 31, 23, 59, 59);
    if (month) {
      const m = parseInt(month);
      startDate = new Date(targetYear, m - 1, 1);
      endDate = new Date(targetYear, m, 0, 23, 59, 59);
    }

    const accounts = await prisma.chart_of_accounts.findMany({
      where: { is_active: true, is_header: false },
      orderBy: [{ account_code: 'asc' }],
    });

    const lines = await prisma.journal_entry_lines.findMany({
      where: {
        journal_entries: { entry_date: { gte: startDate, lte: endDate }, status: 'POSTED' },
      },
      include: {
        journal_entries: { select: { entry_date: true, entry_number: true, description: true, status: true } },
      },
    });

    // Aggregate per account
    const ledger = accounts.map(acc => {
      const accLines = lines.filter(l => l.account_id === acc.id);
      const totalDebit = accLines.reduce((s, l) => s + Number((l as Record<string, unknown>).debit || 0), 0);
      const totalCredit = accLines.reduce((s, l) => s + Number((l as Record<string, unknown>).credit || 0), 0);
      const openingBalance = Number((acc as Record<string, unknown>).opening_balance || 0);
      let closingBalance = openingBalance;
      if ((acc as Record<string, unknown>).normal_balance === 'DEBIT') closingBalance = openingBalance + totalDebit - totalCredit;
      else closingBalance = openingBalance + totalCredit - totalDebit;

      return {
        id: acc.id,
        account_id: acc.id,
        account_code: (acc as Record<string, unknown>).account_code,
        account_name: (acc as Record<string, unknown>).account_name,
        account_type: (acc as Record<string, unknown>).account_type,
        normal_balance: (acc as Record<string, unknown>).normal_balance,
        opening_balance: openingBalance,
        total_debit: totalDebit,
        total_credit: totalCredit,
        closing_balance: closingBalance,
        transaction_count: accLines.length,
        account: normalizeAccount(acc as unknown as Record<string, unknown>),
      };
    }).filter(e => Number((e as Record<string, unknown>).transaction_count) > 0 || Number((e as Record<string, unknown>).opening_balance) !== 0);

    res.json({ success: true, data: ledger });
  })
);

// ============================================
// FINANCIAL REPORTS
// ============================================

interface IncomeStatementQuery {
  year?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * GET /api/accounting/reports/trial-balance
 */
router.get('/reports/trial-balance',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request, res: Response) => {
    const accounts = await prisma.chart_of_accounts.findMany({
      where: { is_active: true, is_header: false },
      orderBy: { account_code: 'asc' },
    });

    const trialBalance = accounts.map(acc => ({
      accountCode: (acc as Record<string, unknown>).account_code,
      accountName: (acc as Record<string, unknown>).account_name,
      accountType: (acc as Record<string, unknown>).account_type,
      debit: (acc as Record<string, unknown>).normal_balance === 'DEBIT' ? Number((acc as Record<string, unknown>).current_balance || 0) : 0,
      credit: (acc as Record<string, unknown>).normal_balance === 'CREDIT' ? Number((acc as Record<string, unknown>).current_balance || 0) : 0,
    }));

    const totals = trialBalance.reduce(
      (sum, acc) => ({ debit: sum.debit + acc.debit, credit: sum.credit + acc.credit }),
      { debit: 0, credit: 0 }
    );

    res.json({ success: true, data: { accounts: trialBalance, totals } });
  })
);

/**
 * GET /api/accounting/reports/income-statement?year=&month=
 */
router.get('/reports/income-statement',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request<{}, {}, {}, IncomeStatementQuery>, res: Response) => {
    const { year, month, startDate, endDate } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    let start = startDate ? new Date(startDate) : new Date(targetYear, 0, 1);
    let end = endDate ? new Date(endDate) : new Date(targetYear, 11, 31, 23, 59, 59);
    if (month) {
      const m = parseInt(month);
      start = new Date(targetYear, m - 1, 1);
      end = new Date(targetYear, m, 0, 23, 59, 59);
    }

    const [revenueAccounts, expenseAccounts] = await Promise.all([
      prisma.chart_of_accounts.findMany({ where: { account_type: 'REVENUE', is_header: false, is_active: true } }),
      prisma.chart_of_accounts.findMany({ where: { account_type: 'EXPENSE', is_header: false, is_active: true } }),
    ]);

    const journalLines = await prisma.journal_entry_lines.findMany({
      where: {
        journal_entries: { entry_date: { gte: start, lte: end }, status: 'POSTED' },
      },
    });

    const calcAmount = (acc: Record<string, unknown>, isRevenue: boolean) => {
      const lines = journalLines.filter(l => l.account_id === acc.id);
      if (isRevenue) return lines.reduce((s, l) => s + Number((l as Record<string, unknown>).credit || 0) - Number((l as Record<string, unknown>).debit || 0), 0);
      return lines.reduce((s, l) => s + Number((l as Record<string, unknown>).debit || 0) - Number((l as Record<string, unknown>).credit || 0), 0);
    };

    const revenueItems = revenueAccounts
      .map(acc => ({ ...normalizeAccount(acc as unknown as Record<string, unknown>), amount: calcAmount(acc as unknown as Record<string, unknown>, true) }))
      .filter(i => i.amount !== 0);

    const expenseItems = expenseAccounts
      .map(acc => ({ ...normalizeAccount(acc as unknown as Record<string, unknown>), amount: calcAmount(acc as unknown as Record<string, unknown>, false) }))
      .filter(i => i.amount !== 0);

    const totalRevenue = revenueItems.reduce((s, i) => s + i.amount, 0);
    const totalExpense = expenseItems.reduce((s, i) => s + i.amount, 0);

    res.json({
      success: true,
      data: {
        revenue: revenueItems,
        expenses: expenseItems,
        totalRevenue,
        totalExpense,
        netIncome: totalRevenue - totalExpense,
      },
    });
  })
);

interface BalanceSheetQuery {
  asOfDate?: string;
}

/**
 * GET /api/accounting/reports/balance-sheet?asOfDate=
 */
router.get('/reports/balance-sheet',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request<{}, {}, {}, BalanceSheetQuery>, res: Response) => {
    const { asOfDate } = req.query;
    const cutoff = asOfDate ? new Date(asOfDate) : new Date();

    const accounts = await prisma.chart_of_accounts.findMany({
      where: { is_active: true, is_header: false },
      orderBy: { account_code: 'asc' },
    });

    const journalLines = await prisma.journal_entry_lines.findMany({
      where: { journal_entries: { entry_date: { lte: cutoff }, status: 'POSTED' } },
    });

    const calcBalance = (acc: Record<string, unknown>) => {
      const lines = journalLines.filter(l => l.account_id === acc.id);
      const totalDebit = lines.reduce((s, l) => s + Number((l as Record<string, unknown>).debit || 0), 0);
      const totalCredit = lines.reduce((s, l) => s + Number((l as Record<string, unknown>).credit || 0), 0);
      const opening = Number(acc.opening_balance || 0);
      return acc.normal_balance === 'DEBIT'
        ? opening + totalDebit - totalCredit
        : opening + totalCredit - totalDebit;
    };

    const assets = accounts.filter(a => (a as Record<string, unknown>).account_type === 'ASSET').map(a => ({ ...normalizeAccount(a as unknown as Record<string, unknown>), balance: calcBalance(a as unknown as Record<string, unknown>) })).filter(a => a.balance !== 0);
    const liabilities = accounts.filter(a => (a as Record<string, unknown>).account_type === 'LIABILITY').map(a => ({ ...normalizeAccount(a as unknown as Record<string, unknown>), balance: calcBalance(a as unknown as Record<string, unknown>) })).filter(a => a.balance !== 0);
    const equity = accounts.filter(a => (a as Record<string, unknown>).account_type === 'EQUITY').map(a => ({ ...normalizeAccount(a as unknown as Record<string, unknown>), balance: calcBalance(a as unknown as Record<string, unknown>) })).filter(a => a.balance !== 0);

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.balance, 0);

    res.json({
      success: true,
      data: {
        assets, liabilities, equity,
        totalAssets, totalLiabilities, totalEquity,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      },
    });
  })
);

interface CashFlowQuery {
  year?: string;
  month?: string;
}

/**
 * GET /api/accounting/reports/cash-flow?year=&month=
 */
router.get('/reports/cash-flow',
  requireRole([ROLES.KEUANGAN, ROLES.MANAJEMEN]),
  asyncHandler(async (req: Request<{}, {}, {}, CashFlowQuery>, res: Response) => {
    const { year, month } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    let startDate = new Date(targetYear, 0, 1);
    let endDate = new Date(targetYear, 11, 31, 23, 59, 59);
    if (month) {
      const m = parseInt(month);
      startDate = new Date(targetYear, m - 1, 1);
      endDate = new Date(targetYear, m, 0, 23, 59, 59);
    }

    // Cash accounts: account_type ASSET, account_code starting with 11
    const cashAccounts = await prisma.chart_of_accounts.findMany({
      where: { account_type: 'ASSET', account_code: { startsWith: '11' }, is_header: false },
    });
    const cashAccountIds = cashAccounts.map(a => a.id);

    const cashLines = await prisma.journal_entry_lines.findMany({
      where: {
        account_id: { in: cashAccountIds },
        journal_entries: { entry_date: { gte: startDate, lte: endDate }, status: 'POSTED' },
      },
      include: {
        journal_entries: { select: { description: true, reference_type: true, entry_date: true } },
      },
    });

    interface CashFlowItem {
      description: string;
      amount: number;
      date?: Date | string;
    }

    const operating: CashFlowItem[] = [];
    const investing: CashFlowItem[] = [];
    const financing: CashFlowItem[] = [];

    for (const line of cashLines) {
      const amount = Number((line as Record<string, unknown>).debit || 0) - Number((line as Record<string, unknown>).credit || 0);
      const journalEntries = (line as unknown as { journal_entries?: { description?: string; reference_type?: string; entry_date?: Date } }).journal_entries;
      const desc = journalEntries?.description || String((line as Record<string, unknown>).description || '') || 'Transaksi';
      const refType = journalEntries?.reference_type || '';
      const entryDate = journalEntries?.entry_date;
      const item: CashFlowItem = { description: desc, amount, date: entryDate };

      if (refType === 'billing' || refType === 'payroll' || refType === 'pharmacy') {
        operating.push(item);
      } else if (/aset|peralatan|investasi|gedung/i.test(desc)) {
        investing.push(item);
      } else if (/modal|pinjaman|hutang|kredit/i.test(desc)) {
        financing.push(item);
      } else {
        operating.push(item);
      }
    }

    const totalOperating = operating.reduce((s, i) => s + i.amount, 0);
    const totalInvesting = investing.reduce((s, i) => s + i.amount, 0);
    const totalFinancing = financing.reduce((s, i) => s + i.amount, 0);

    res.json({
      success: true,
      data: {
        operating, investing, financing,
        totalOperating, totalInvesting, totalFinancing,
        netCashFlow: totalOperating + totalInvesting + totalFinancing,
      },
    });
  })
);

// ============================================
// HELPERS
// ============================================

// GET /api/accounting/next-journal-number
router.get('/next-journal-number', asyncHandler(async (req: Request, res: Response) => {
  const number = await generateJournalNumber();
  res.json({ success: true, data: number });
}));

export default router;
