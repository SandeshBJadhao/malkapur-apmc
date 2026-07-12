-- =============================================================================
-- APMC Malkapur – Services, Initiatives, and Settings Migration
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP EXISTING TABLES (To support clean re-runs)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.initiatives CASCADE;
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SERVICES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_mr        text NOT NULL,
  title_en        text NOT NULL,
  description_mr  text,
  description_en  text,
  icon_name       text,
  display_order   integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. INITIATIVES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.initiatives (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_mr        text NOT NULL,
  title_en        text NOT NULL,
  description_mr  text,
  description_en  text,
  image_url       text,
  category        text,
  display_order   integer NOT NULL DEFAULT 0,
  is_published   boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_initiatives_updated_at ON public.initiatives;
CREATE TRIGGER trg_initiatives_updated_at
  BEFORE UPDATE ON public.initiatives
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SITE SETTINGS TABLE (Single row pattern)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.site_settings (
  id                uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  market_name       text NOT NULL DEFAULT 'कृषी उत्पन्न बाजार समिती, मलकापूर',
  address           text,
  phone             text,
  email             text,
  office_timings    text,
  social_facebook   text,
  social_twitter    text,
  social_instagram  text,
  social_youtube    text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts on re-runs
DROP POLICY IF EXISTS "Public read services" ON public.services;
DROP POLICY IF EXISTS "Authenticated write services" ON public.services;
DROP POLICY IF EXISTS "Public read initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Authenticated write initiatives" ON public.initiatives;
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated write site_settings" ON public.site_settings;

-- Services policies
CREATE POLICY "Public read services" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write services" ON public.services
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Initiatives policies
CREATE POLICY "Public read initiatives" ON public.initiatives
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write initiatives" ON public.initiatives
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Site settings policies
CREATE POLICY "Public read site_settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write site_settings" ON public.site_settings
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SEED INITIAL DATA
-- ─────────────────────────────────────────────────────────────────────────────

-- Seed Services
INSERT INTO public.services (title_mr, title_en, description_mr, description_en, icon_name, display_order, is_active)
VALUES
  ('बाजार भाव माहिती', 'Market Rates Information', 'दैनंदिन शेतमाल दर व आवक माहिती.', 'Daily commodity rates and arrivals.', 'TrendingUp', 1, true),
  ('वजन सुविधा', 'Weighing Facility', 'अधिकृत वजन काटे व पावती सहाय्य.', 'Official weighbridge and receipt support.', 'Scale', 2, true),
  ('व्यापार सभागृह माहिती', 'Trading Hall Information', 'विक्री क्षेत्र, बैठक व्यवस्था व प्रक्रिया माहिती.', 'Sale area, seating, and process information.', 'Building2', 3, true),
  ('परवाना सहाय्य', 'License Assistance', 'व्यापारी व सेवा परवान्यासाठी मार्गदर्शन.', 'Guidance for trader and service licenses.', 'BadgeCheck', 4, true),
  ('शेतकरी मार्गदर्शन केंद्र', 'Farmer Guidance Center', 'नोंदणी, कागदपत्रे आणि बाजार सहाय्य.', 'Registration, documents, and market support.', 'UserRoundCheck', 5, true),
  ('तक्रार नोंदणी', 'Complaint Registration', 'सेवा, वजन किंवा व्यवहाराबाबत तक्रार.', 'Complaint support for services and transactions.', 'MessageSquareWarning', 6, true);

-- Seed Initiatives
INSERT INTO public.initiatives (title_mr, title_en, description_mr, description_en, image_url, category, display_order, is_published)
VALUES
  ('ई-नाम (e-NAM) राष्ट्रीय बाजार जोडणी', 'e-NAM National Market Integration', 'शेतकऱ्यांना देशभरातील खरेदीदारांशी जोडणारी आणि बोली लावण्यासाठी मदत करणारी पारदर्शक डिजिटल प्रणाली.', 'A transparent digital bidding platform connecting farmers directly to buyers nationwide.', 'https://images.unsplash.com/photo-1464234470489-08588e748536?q=80&w=1200&auto=format&fit=crop', 'Digital Mandi', 1, true),
  ('शेतकरी प्रशिक्षण व डिजिटल वर्ग', 'Farmer Training & Digital Classrooms', 'नवीन सेंद्रिय पद्धती, खत व्यवस्थापन व सरकारी अनुदानाबाबत मार्गदर्शन करण्यासाठी बाजार आवारात सुरू करण्यात आलेले प्रशिक्षण केंद्र.', 'Training centers established inside the yard to educate farmers on organic methods and government subsidies.', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1200&auto=format&fit=crop', 'Education', 2, true),
  ('शीतगृह आणि गोदामांची उभारणी', 'Cold Storage & Modern Warehouses', 'नाशवंत शेतमाल टिकवून ठेवण्यासाठी आणि तातडीने विक्री टाळण्यासाठी अद्ययावत शीतगृह व साठवणूक सुविधा.', 'State-of-the-art cold storage facility built within the market yard to prevent distressed selling of perishables.', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop', 'Infrastructure', 3, true);

-- Seed Site Settings (one row only)
INSERT INTO public.site_settings (id, market_name, address, phone, email, office_timings, social_facebook, social_twitter, social_instagram, social_youtube)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'कृषी उत्पन्न बाजार समिती, मलकापूर',
  'कृषी उत्पन्न बाजार समिती, मुख्य बाजार आवार, राष्ट्रीय महामार्ग ६, मलकापूर, जि. बुलढाणा - ४४३१०१, महाराष्ट्र',
  '०७२६७-२२२०५२',
  'apmc.malkapur@yahoo.in',
  'कार्यालय: १०:०० AM ते ०६:०० PM (रविवार सुट्टी)\nबाजार वेळ: १०:०० AM ते ०५:०० PM',
  'https://facebook.com',
  'https://twitter.com',
  'https://instagram.com',
  'https://youtube.com'
)
ON CONFLICT (id) DO UPDATE SET
  market_name = EXCLUDED.market_name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  office_timings = EXCLUDED.office_timings,
  social_facebook = EXCLUDED.social_facebook,
  social_twitter = EXCLUDED.social_twitter,
  social_instagram = EXCLUDED.social_instagram,
  social_youtube = EXCLUDED.social_youtube;
