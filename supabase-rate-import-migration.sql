-- =============================================================================
-- APMC Malkapur – Rate Import System Migration
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RATE IMPORT SESSIONS TABLE
--    Tracks each image upload batch (one session per image uploaded)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_import_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  image_url     text,
  status        text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'published', 'discarded')),
  date_for      date,
  market_center text NOT NULL DEFAULT 'malkapur_main'
                     CHECK (market_center IN ('malkapur_main', 'nanda_sub')),
  raw_ai_json   jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. RATE IMPORT ITEMS TABLE
--    Individual commodity rows extracted by AI (pending admin review)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_import_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES public.rate_import_sessions(id) ON DELETE CASCADE,
  commodity_id        uuid REFERENCES public.commodities(id),
  commodity_name_raw  text NOT NULL,
  min_price           numeric(10, 2),
  max_price           numeric(10, 2),
  modal_price         numeric(10, 2),
  arrivals_qty        numeric(10, 2) DEFAULT 0,
  unit                text NOT NULL DEFAULT 'क्विंटल',
  market_center       text NOT NULL DEFAULT 'malkapur_main',
  confidence          integer NOT NULL DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  is_flagged          boolean NOT NULL DEFAULT false,
  admin_action        text NOT NULL DEFAULT 'keep' CHECK (admin_action IN ('keep', 'skip')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_import_items_session ON public.rate_import_items (session_id);
CREATE INDEX IF NOT EXISTS idx_rate_import_sessions_status ON public.rate_import_sessions (status, uploaded_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.rate_import_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_import_items    ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts on re-run
DROP POLICY IF EXISTS "Admin full access sessions" ON public.rate_import_sessions;
DROP POLICY IF EXISTS "Admin full access items"    ON public.rate_import_items;

-- Only authenticated admins can access import tables (not public)
CREATE POLICY "Admin full access sessions"
  ON public.rate_import_sessions FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin full access items"
  ON public.rate_import_items FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SUPABASE REALTIME — Enable on market_rates table for live public updates
-- ─────────────────────────────────────────────────────────────────────────────
-- This enables the public /market-rates page to auto-refresh when admin publishes
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_rates;

-- ─────────────────────────────────────────────────────────────────────────────
-- Done! Verify with:
--   SELECT * FROM public.rate_import_sessions;
--   SELECT * FROM public.rate_import_items;
-- ─────────────────────────────────────────────────────────────────────────────
