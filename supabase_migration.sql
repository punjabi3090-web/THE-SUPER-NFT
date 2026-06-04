-- ============================================================
-- Run this SQL in your Supabase SQL Editor (dashboard.supabase.com)
-- Project: THE SUPER NFT
-- ============================================================

-- 1. Create admin_settings table (key-value store)
CREATE TABLE IF NOT EXISTS admin_settings (
  key   TEXT PRIMARY KEY,
  value TEXT DEFAULT ''
);

-- 2. Insert default values (skip if already exist)
INSERT INTO admin_settings (key, value) VALUES
  ('telegram_link',          'https://t.me/+uE-PlUgGg-wzOWRk'),
  ('customer_service_link',  'https://t.me/TigerProtocolGlobal'),
  ('usdt_bep20_address',     ''),
  ('usdt_trc20_address',     ''),
  ('bep20_qr_url',           ''),
  ('trc20_qr_url',           ''),
  ('min_withdraw',           '10'),
  ('max_withdraw',           '10000')
ON CONFLICT (key) DO NOTHING;

-- 3. Enable RLS on admin_settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- 4. Allow all authenticated users to READ admin_settings
CREATE POLICY "admin_settings_read" ON admin_settings
  FOR SELECT USING (true);

-- 5. Allow only admins to WRITE admin_settings
CREATE POLICY "admin_settings_write" ON admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 6. Add screenshot_url column to deposits (if not exists)
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- ============================================================
-- Supabase Storage Setup (do this in Storage tab of dashboard)
-- ============================================================
-- Create bucket named "deposits" (Public bucket)
-- Create bucket named "qr-codes"  (Public bucket)
--
-- For "deposits" bucket, add this policy:
--   Name: "Allow authenticated uploads"
--   Policy: (auth.uid() = owner) OR (auth.uid() IS NOT NULL)
--   Operation: INSERT
--
-- ============================================================
