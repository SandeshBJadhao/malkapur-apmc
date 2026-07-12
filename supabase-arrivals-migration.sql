-- =============================================================================
-- Migration: Add Separate Arrival Columns (min/max/modal)
-- Run this in your Supabase SQL Editor (Project -> SQL Editor -> New Query)
-- =============================================================================

-- 1. Add the three specific arrival columns if they don't exist
ALTER TABLE public.market_rates
  ADD COLUMN IF NOT EXISTS min_arrivals INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_arrivals INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS modal_arrivals INTEGER NOT NULL DEFAULT 0;

-- 2. Migrate existing data: copy arrivals_qty into modal_arrivals if it is not empty
UPDATE public.market_rates 
SET modal_arrivals = COALESCE(arrivals_qty, 0)
WHERE modal_arrivals = 0;

-- 3. Drop the old arrivals_qty column entirely to replace it
ALTER TABLE public.market_rates 
  DROP COLUMN IF EXISTS arrivals_qty;

COMMENT ON COLUMN public.market_rates.min_arrivals IS 'किमान दराला झालेली आवक (क्वि.)';
COMMENT ON COLUMN public.market_rates.max_arrivals IS 'कमाल दराला झालेली आवक (क्वि.)';
COMMENT ON COLUMN public.market_rates.modal_arrivals IS 'सर्वसाधारण दराला झालेली आवक (क्वि.)';
