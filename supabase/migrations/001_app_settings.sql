-- Migration: 001_app_settings
-- Run this in your Supabase SQL editor before launching the app.
--
-- Creates the app_settings table for storing company branding and
-- application configuration. Admins can edit these values via /settings.

CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Enable RLS (only service_role can write; anon/authenticated can read)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to read settings (needed by app shell & PDFs)
CREATE POLICY "authenticated_can_read_settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role (server-side API) can insert/update
-- The /api/settings PATCH route checks admin role before calling supabase with service key
CREATE POLICY "service_role_can_write_settings"
  ON public.app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed default rows (empty values — admin fills in via /settings page)
INSERT INTO public.app_settings (key, value) VALUES
  ('company_name',          ''),
  ('company_short_name',    ''),
  ('company_address',       ''),
  ('company_phone',         ''),
  ('company_hotline',       ''),
  ('company_email',         ''),
  ('company_email_alt',     ''),
  ('company_website',       ''),
  ('company_tax_code',      ''),
  ('company_logo_url',      ''),
  ('company_signature_url', ''),
  ('app_name',              ''),
  ('app_description',       '')
ON CONFLICT (key) DO NOTHING;
