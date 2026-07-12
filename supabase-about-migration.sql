-- =============================================================================
-- APMC Malkapur – About Page Tables Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP (for clean re-runs)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.about_intro CASCADE;
DROP TABLE IF EXISTS public.about_missions CASCADE;
DROP TABLE IF EXISTS public.about_key_facts CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ABOUT INTRO TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.about_intro (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_mr  text NOT NULL,
  content_en  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_about_intro_updated_at ON public.about_intro;
CREATE TRIGGER trg_about_intro_updated_at
  BEFORE UPDATE ON public.about_intro
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ABOUT MISSIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.about_missions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text_mr     text NOT NULL,
  text_en     text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_about_missions_updated_at ON public.about_missions;
CREATE TRIGGER trg_about_missions_updated_at
  BEFORE UPDATE ON public.about_missions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ABOUT KEY FACTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.about_key_facts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value_mr    text NOT NULL,
  value_en    text NOT NULL,
  label_mr    text NOT NULL,
  label_en    text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_about_key_facts_updated_at ON public.about_key_facts;
CREATE TRIGGER trg_about_key_facts_updated_at
  BEFORE UPDATE ON public.about_key_facts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.about_intro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about_key_facts ENABLE ROW LEVEL SECURITY;

-- Select Policies
CREATE POLICY public_read_about_intro ON public.about_intro FOR SELECT USING (true);
CREATE POLICY public_read_about_missions ON public.about_missions FOR SELECT USING (is_active = true);
CREATE POLICY public_read_about_key_facts ON public.about_key_facts FOR SELECT USING (is_active = true);

-- Auth write Policies (All privileges for authenticated users)
CREATE POLICY admin_all_about_intro ON public.about_intro FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_about_missions ON public.about_missions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_about_key_facts ON public.about_key_facts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SEED DATA
-- ─────────────────────────────────────────────────────────────────────────────

-- Seed About Intro
INSERT INTO public.about_intro (content_mr, content_en) VALUES (
  'कृषी उत्पन्न बाजार समिती, मलकापूरची स्थापना शेतकऱ्यांच्या कल्याणासाठी आणि त्यांना त्यांच्या मालाला योग्य भाव मिळवून देण्यासाठी करण्यात आली आहे. ही समिती महाराष्ट्र कृषी उत्पन्न बाजार अधिनियम, १९६३ अंतर्गत कार्यरत आहे. आमचे ध्येय पारदर्शक व्यवहार आणि आधुनिक सुविधा पुरवणे हे आहे. बाजार समिती शेतकरी, व्यापारी आणि आडत्यांमध्ये पारदर्शक संवाद साधण्यासाठी सदैव प्रयत्नशील आहे.',
  'Agricultural Produce Market Committee, Malkapur was established for the welfare of farmers and to ensure fair prices for their agricultural produce. The committee operates under the Maharashtra Agricultural Produce Marketing (Development and Regulation) Act, 1963. Our goal is to provide transparent transactions and modern facilities. The market committee is always striving to facilitate transparent communication between farmers, traders, and commission agents.'
);

-- Seed About Missions
INSERT INTO public.about_missions (text_mr, text_en, sort_order) VALUES
('शेतकऱ्यांना योग्य आणि न्याय्य भाव मिळवून देणे.', 'Ensuring fair and just prices for farmers.', 10),
('बाजारातील सर्व व्यवहार पारदर्शक ठेवणे.', 'Keeping all market transactions transparent.', 20),
('आधुनिक तंत्रज्ञानाचा उपयोग करून माहिती सुलभ करणे.', 'Simplifying information using modern technology.', 30),
('शेतमालाची गुणवत्ता तपासणी आणि प्रमाणीकरण.', 'Quality inspection and certification of agricultural produce.', 40);

-- Seed About Key Facts
INSERT INTO public.about_key_facts (value_mr, value_en, label_mr, label_en, sort_order) VALUES
('१९६३', '1963', 'स्थापना वर्ष', 'Est. Year', 10),
('२ बाजार', '2 Markets', 'बाजार केंद्रे', 'Market Centers', 20),
('८+', '8+', 'शेतमाल प्रकार', 'Commodity Types', 30),
('५०००+', '5000+', 'नोंदणीकृत शेतकरी', 'Registered Farmers', 40);
