-- =============================================================================
-- Migration: Variety & MSAMB Variety Support
-- Run this in your Supabase SQL Editor (Project → SQL Editor → New Query)
--
-- This adds:
--   1. `msamb_variety`  column to `commodities`  (default MSAMB variety for sync)
--   2. `variety`        column to `market_rates`  (per-entry variety for display & sync)
--   3. `commodity_varieties` table               (manage multiple varieties per commodity)
-- =============================================================================

-- ── 1. Add msamb_variety to commodities ──────────────────────────────────────
ALTER TABLE public.commodities
  ADD COLUMN IF NOT EXISTS msamb_variety TEXT DEFAULT '' NOT NULL;

COMMENT ON COLUMN public.commodities.msamb_variety IS
  'Default variety text used when syncing this commodity to the MSAMB portal (e.g. लोकल, पिवळा, काळा)';

-- ── 2. Add variety to market_rates ───────────────────────────────────────────
ALTER TABLE public.market_rates
  ADD COLUMN IF NOT EXISTS variety TEXT DEFAULT '' NOT NULL;

COMMENT ON COLUMN public.market_rates.variety IS
  'Variety / grade for this specific rate entry (e.g. लोकल, पिवळा). Used in MSAMB sync.';

-- ── 3. Create commodity_varieties table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.commodity_varieties (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id UUID NOT NULL REFERENCES public.commodities(id) ON DELETE CASCADE,
  name_mr      TEXT NOT NULL,
  name_en      TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.commodity_varieties IS
  'List of available varieties / grades for each commodity, used to populate dropdowns in admin forms.';

-- Index for fast lookup by commodity
CREATE INDEX IF NOT EXISTS idx_commodity_varieties_commodity_id
  ON public.commodity_varieties (commodity_id, sort_order);

-- ── 4. Enable Row Level Security ──────────────────────────────────────────────
ALTER TABLE public.commodity_varieties ENABLE ROW LEVEL SECURITY;

-- Public read (same pattern as other tables)
CREATE POLICY IF NOT EXISTS "commodity_varieties_public_read"
  ON public.commodity_varieties FOR SELECT
  USING (true);

-- Service role (admin) can do everything
CREATE POLICY IF NOT EXISTS "commodity_varieties_service_all"
  ON public.commodity_varieties FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── 5. Pre-populate varieties for existing commodities ────────────────────────
-- (Only inserts if that commodity already exists in your DB.
--  Safe to run multiple times — uses INSERT … ON CONFLICT DO NOTHING.)

-- Adjust the INSERT statements below if your commodity names differ slightly.

DO $$
DECLARE
  comm_id UUID;
BEGIN

  -- उडीद → काळा
  SELECT id INTO comm_id FROM public.commodities WHERE name_mr = 'उडीद' LIMIT 1;
  IF comm_id IS NOT NULL THEN
    INSERT INTO public.commodity_varieties (commodity_id, name_mr, name_en, sort_order)
    VALUES (comm_id, 'काळा', 'Black', 0)
    ON CONFLICT DO NOTHING;
    UPDATE public.commodities SET msamb_variety = 'काळा' WHERE id = comm_id AND msamb_variety = '';
  END IF;

  -- कांदा → लोकल
  SELECT id INTO comm_id FROM public.commodities WHERE name_mr = 'कांदा' LIMIT 1;
  IF comm_id IS NOT NULL THEN
    INSERT INTO public.commodity_varieties (commodity_id, name_mr, name_en, sort_order)
    VALUES (comm_id, 'लोकल', 'Local', 0)
    ON CONFLICT DO NOTHING;
    UPDATE public.commodities SET msamb_variety = 'लोकल' WHERE id = comm_id AND msamb_variety = '';
  END IF;

  -- कापूस (कपाशी) → लोकल
  SELECT id INTO comm_id FROM public.commodities WHERE name_mr ILIKE '%कापूस%' LIMIT 1;
  IF comm_id IS NOT NULL THEN
    INSERT INTO public.commodity_varieties (commodity_id, name_mr, name_en, sort_order)
    VALUES (comm_id, 'लोकल', 'Local', 0)
    ON CONFLICT DO NOTHING;
    UPDATE public.commodities SET msamb_variety = 'लोकल' WHERE id = comm_id AND msamb_variety = '';
  END IF;

  -- गहू → लोकल
  SELECT id INTO comm_id FROM public.commodities WHERE name_mr = 'गहू' LIMIT 1;
  IF comm_id IS NOT NULL THEN
    INSERT INTO public.commodity_varieties (commodity_id, name_mr, name_en, sort_order)
    VALUES (comm_id, 'लोकल', 'Local', 0)
    ON CONFLICT DO NOTHING;
    UPDATE public.commodities SET msamb_variety = 'लोकल' WHERE id = comm_id AND msamb_variety = '';
  END IF;

  -- ज्वारी → हायब्रीड
  SELECT id INTO comm_id FROM public.commodities WHERE name_mr = 'ज्वारी' LIMIT 1;
  IF comm_id IS NOT NULL THEN
    INSERT INTO public.commodity_varieties (commodity_id, name_mr, name_en, sort_order)
    VALUES (comm_id, 'हायब्रीड', 'Hybrid', 0), (comm_id, 'देशी', 'Deshi', 1)
    ON CONFLICT DO NOTHING;
    UPDATE public.commodities SET msamb_variety = 'हायब्रीड' WHERE id = comm_id AND msamb_variety = '';
  END IF;

  -- तूर (अरहर) → लाल
  SELECT id INTO comm_id FROM public.commodities WHERE name_mr ILIKE '%तूर%' LIMIT 1;
  IF comm_id IS NOT NULL THEN
    INSERT INTO public.commodity_varieties (commodity_id, name_mr, name_en, sort_order)
    VALUES (comm_id, 'लाल', 'Red', 0)
    ON CONFLICT DO NOTHING;
    UPDATE public.commodities SET msamb_variety = 'लाल' WHERE id = comm_id AND msamb_variety = '';
  END IF;

  -- मका → पिवळी
  SELECT id INTO comm_id FROM public.commodities WHERE name_mr = 'मका' LIMIT 1;
  IF comm_id IS NOT NULL THEN
    INSERT INTO public.commodity_varieties (commodity_id, name_mr, name_en, sort_order)
    VALUES (comm_id, 'पिवळी', 'Yellow', 0)
    ON CONFLICT DO NOTHING;
    UPDATE public.commodities SET msamb_variety = 'पिवळी' WHERE id = comm_id AND msamb_variety = '';
  END IF;

  -- मूग → चमकी
  SELECT id INTO comm_id FROM public.commodities WHERE name_mr = 'मूग' LIMIT 1;
  IF comm_id IS NOT NULL THEN
    INSERT INTO public.commodity_varieties (commodity_id, name_mr, name_en, sort_order)
    VALUES (comm_id, 'चमकी', 'Chamki', 0)
    ON CONFLICT DO NOTHING;
    UPDATE public.commodities SET msamb_variety = 'चमकी' WHERE id = comm_id AND msamb_variety = '';
  END IF;

  -- सोयाबीन → पिवळा
  SELECT id INTO comm_id FROM public.commodities WHERE name_mr ILIKE '%सोयाबीन%' LIMIT 1;
  IF comm_id IS NOT NULL THEN
    INSERT INTO public.commodity_varieties (commodity_id, name_mr, name_en, sort_order)
    VALUES (comm_id, 'पिवळा', 'Yellow', 0)
    ON CONFLICT DO NOTHING;
    UPDATE public.commodities SET msamb_variety = 'पिवळा' WHERE id = comm_id AND msamb_variety = '';
  END IF;

  -- हरभरा (चना) → चाफा
  SELECT id INTO comm_id FROM public.commodities WHERE name_mr ILIKE '%हरभरा%' LIMIT 1;
  IF comm_id IS NOT NULL THEN
    INSERT INTO public.commodity_varieties (commodity_id, name_mr, name_en, sort_order)
    VALUES (comm_id, 'चाफा', 'Chafa', 0)
    ON CONFLICT DO NOTHING;
    UPDATE public.commodities SET msamb_variety = 'चाफा' WHERE id = comm_id AND msamb_variety = '';
  END IF;

END $$;

-- ── Done ──────────────────────────────────────────────────────────────────────
-- Verify with:
--   SELECT name_mr, msamb_variety FROM public.commodities ORDER BY name_en;
--   SELECT * FROM public.commodity_varieties ORDER BY commodity_id, sort_order;
--   SELECT id, variety FROM public.market_rates LIMIT 5;
