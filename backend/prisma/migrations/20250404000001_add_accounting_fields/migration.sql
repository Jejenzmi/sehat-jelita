-- Migration: add_accounting_fields
-- Adds missing fields to chart_of_accounts and journal_entries

-- chart_of_accounts: add is_header, level, display_order, opening_balance, current_balance
ALTER TABLE "chart_of_accounts"
  ADD COLUMN IF NOT EXISTS "is_header"       BOOLEAN        NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "level"           INTEGER        NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "display_order"   INTEGER        NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "opening_balance" DECIMAL(15,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "current_balance" DECIMAL(15,2)  NOT NULL DEFAULT 0;

-- journal_entries: add reference_number, posted_by
ALTER TABLE "journal_entries"
  ADD COLUMN IF NOT EXISTS "reference_number" TEXT,
  ADD COLUMN IF NOT EXISTS "posted_by"        TEXT;

-- Widen existing decimal columns to DECIMAL(15,2) for consistency
-- (safe no-op if already at that precision)
ALTER TABLE "journal_entries"
  ALTER COLUMN "total_debit"  TYPE DECIMAL(15,2),
  ALTER COLUMN "total_credit" TYPE DECIMAL(15,2);

ALTER TABLE "journal_entry_lines"
  ALTER COLUMN "debit"  TYPE DECIMAL(15,2),
  ALTER COLUMN "credit" TYPE DECIMAL(15,2);
