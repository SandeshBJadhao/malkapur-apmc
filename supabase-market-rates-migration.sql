-- =============================================================================
-- APMC Malkapur – Market Rates Migration
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP EXISTING TABLES (To fix column errors)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.market_rates CASCADE;
DROP TABLE IF EXISTS public.commodities CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. COMMODITIES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.commodities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_mr     text NOT NULL,
  name_en     text NOT NULL,
  category    text NOT NULL DEFAULT 'cereals'
                   CHECK (category IN ('cereals', 'oilseeds', 'pulses', 'fibers', 'vegetables', 'fruits', 'spices', 'other')),
  unit        text NOT NULL DEFAULT 'क्विंटल',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on commodities
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_commodities_updated_at ON public.commodities;
CREATE TRIGGER trg_commodities_updated_at
  BEFORE UPDATE ON public.commodities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.market_rates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id  uuid NOT NULL REFERENCES public.commodities(id) ON DELETE CASCADE,
  date          date NOT NULL,
  market_center text NOT NULL DEFAULT 'malkapur_main'
                     CHECK (market_center IN ('malkapur_main', 'nanda_sub')),
  min_price     numeric(10, 2) NOT NULL CHECK (min_price >= 0),
  max_price     numeric(10, 2) NOT NULL CHECK (max_price >= 0),
  modal_price   numeric(10, 2) NOT NULL CHECK (modal_price >= 0),
  arrivals_qty  numeric(10, 2) NOT NULL DEFAULT 0 CHECK (arrivals_qty >= 0),
  unit          text NOT NULL DEFAULT 'क्विंटल',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate entries for same commodity+date+market
  UNIQUE (commodity_id, date, market_center)
);

DROP TRIGGER IF EXISTS trg_market_rates_updated_at ON public.market_rates;
CREATE TRIGGER trg_market_rates_updated_at
  BEFORE UPDATE ON public.market_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_market_rates_date        ON public.market_rates (date DESC);
CREATE INDEX IF NOT EXISTS idx_market_rates_commodity   ON public.market_rates (commodity_id);
CREATE INDEX IF NOT EXISTS idx_market_rates_center_date ON public.market_rates (market_center, date DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.commodities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_rates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts on re-run
DROP POLICY IF EXISTS "Public read commodities"         ON public.commodities;
DROP POLICY IF EXISTS "Authenticated write commodities" ON public.commodities;
DROP POLICY IF EXISTS "Public read market_rates"        ON public.market_rates;
DROP POLICY IF EXISTS "Authenticated write market_rates" ON public.market_rates;

-- Anyone can read commodities (public website)
CREATE POLICY "Public read commodities"
  ON public.commodities FOR SELECT
  USING (true);

-- Only authenticated users (admins) can insert/update/delete commodities
CREATE POLICY "Authenticated write commodities"
  ON public.commodities FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Anyone can read market rates (public website)
CREATE POLICY "Public read market_rates"
  ON public.market_rates FOR SELECT
  USING (true);

-- Only authenticated users (admins) can insert/update/delete rates
CREATE POLICY "Authenticated write market_rates"
  ON public.market_rates FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SEED COMMODITIES (common Malkapur APMC crops)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.commodities (name_mr, name_en, category, unit, is_active)
VALUES
  ('सोयाबीन',          'Soyabean',            'oilseeds',  'क्विंटल', true),
  ('कापूस (कपाशी)',    'Cotton',               'fibers',    'क्विंटल', true),
  ('मका',              'Maize (Corn)',          'cereals',   'क्विंटल', true),
  ('गहू',              'Wheat',                'cereals',   'क्विंटल', true),
  ('तूर (अरहर)',       'Tur (Pigeon Pea)',     'pulses',    'क्विंटल', true),
  ('हरभरा (चना)',      'Gram (Chana)',          'pulses',    'क्विंटल', true),
  ('मूग',              'Green Gram (Moong)',    'pulses',    'क्विंटल', true),
  ('उडीद',             'Black Gram (Urad)',     'pulses',    'क्विंटल', true)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Done! Verify with:
--   SELECT * FROM public.commodities;
--   SELECT * FROM public.market_rates;
-- ─────────────────────────────────────────────────────────────────────────────
