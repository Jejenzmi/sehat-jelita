-- Migration: Add bpjs_number_hash for searchable encrypted BPJS lookup
-- bpjs_number will now be stored encrypted; bpjs_number_hash (SHA-256) allows
-- O(1) lookup without decrypting all rows.

ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "bpjs_number_hash" TEXT;

-- Create index for fast hash-based BPJS number lookups
CREATE INDEX IF NOT EXISTS "patients_bpjs_number_hash_idx" ON "patients"("bpjs_number_hash");
