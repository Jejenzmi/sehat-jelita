
-- Fix the prescription QR token trigger to use pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate the function with proper extension
CREATE OR REPLACE FUNCTION generate_prescription_qr_token()
RETURNS TRIGGER AS $$
BEGIN
  NEW.qr_token := encode(gen_random_bytes(16), 'hex');
  NEW.qr_generated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
