-- =============================================================================
-- APMC Malkapur – Initiatives Page Expansion Migration
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP (for clean re-runs)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.gov_schemes CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.initiative_timeline CASCADE;
DROP TABLE IF EXISTS public.initiative_settings CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. GOVERNMENT SCHEMES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.gov_schemes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_mr        text NOT NULL,
  title_en        text NOT NULL,
  desc_mr         text NOT NULL,
  desc_en         text NOT NULL,
  icon_name       text NOT NULL DEFAULT 'Network',
  sort_order      integer NOT NULL DEFAULT 0,
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

DROP TRIGGER IF EXISTS trg_gov_schemes_updated_at ON public.gov_schemes;
CREATE TRIGGER trg_gov_schemes_updated_at
  BEFORE UPDATE ON public.gov_schemes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ACHIEVEMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.achievements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label_mr        text NOT NULL,
  label_en        text NOT NULL,
  value           text NOT NULL,
  subtext_mr      text,
  subtext_en      text,
  icon_name       text NOT NULL DEFAULT 'Users',
  accent_color    text NOT NULL DEFAULT 'green', -- green, amber, blue, rose
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_achievements_updated_at ON public.achievements;
CREATE TRIGGER trg_achievements_updated_at
  BEFORE UPDATE ON public.achievements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. INITIATIVE TIMELINE TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.initiative_timeline (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year            text NOT NULL,
  title_mr        text NOT NULL,
  title_en        text NOT NULL,
  desc_mr         text NOT NULL,
  desc_en         text NOT NULL,
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_initiative_timeline_updated_at ON public.initiative_timeline;
CREATE TRIGGER trg_initiative_timeline_updated_at
  BEFORE UPDATE ON public.initiative_timeline
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INITIATIVE SETTINGS TABLE (Single row pattern)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.initiative_settings (
  id                uuid PRIMARY KEY DEFAULT '11111111-1111-1111-1111-111111111111'::uuid,
  future_vision_mr  text NOT NULL,
  future_vision_en  text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = '11111111-1111-1111-1111-111111111111'::uuid)
);

DROP TRIGGER IF EXISTS trg_initiative_settings_updated_at ON public.initiative_settings;
CREATE TRIGGER trg_initiative_settings_updated_at
  BEFORE UPDATE ON public.initiative_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.gov_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiative_settings ENABLE ROW LEVEL SECURITY;

-- Schemes policies
CREATE POLICY "Public read gov_schemes" ON public.gov_schemes FOR SELECT USING (true);
CREATE POLICY "Authenticated write gov_schemes" ON public.gov_schemes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Achievements policies
CREATE POLICY "Public read achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Authenticated write achievements" ON public.achievements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Timeline policies
CREATE POLICY "Public read initiative_timeline" ON public.initiative_timeline FOR SELECT USING (true);
CREATE POLICY "Authenticated write initiative_timeline" ON public.initiative_timeline FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Settings policies
CREATE POLICY "Public read initiative_settings" ON public.initiative_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated write initiative_settings" ON public.initiative_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. SEED INITIAL DATA
-- ─────────────────────────────────────────────────────────────────────────────

-- Seed Government Schemes
INSERT INTO public.gov_schemes (title_mr, title_en, desc_mr, desc_en, icon_name, sort_order, is_active)
VALUES
  ('e-NAM', 'e-NAM', 'राष्ट्रीय कृषी बाजाराशी जोडलेली डिजिटल बाजार माहिती आणि व्यवहार जागरूकता.', 'Digital market information and transaction awareness connected with the national agriculture market.', 'Network', 1, true),
  ('पीएम किसान', 'PM Kisan', 'शेतकरी लाभ योजनांबाबत माहिती व मार्गदर्शन.', 'Information and guidance for farmer benefit schemes.', 'BadgeIndianRupee', 2, true),
  ('पीक विमा जनजागृती', 'Crop Insurance Awareness', 'हंगामी जोखीम व्यवस्थापन आणि विमा नोंदणीबाबत जागरूकता.', 'Awareness on seasonal risk management and insurance registration.', 'Sprout', 3, true),
  ('शेतकरी प्रशिक्षण कार्यक्रम', 'Farmer Training Programs', 'बाजार प्रक्रिया, गुणवत्ता आणि नोंदणीबाबत प्रशिक्षण.', 'Training on market process, quality, and registration.', 'GraduationCap', 4, true);

-- Seed Achievements
INSERT INTO public.achievements (label_mr, label_en, value, subtext_mr, subtext_en, icon_name, accent_color, sort_order, is_active)
VALUES
  ('नोंदणीकृत शेतकरी', 'Registered Farmers', '8,500+', 'बाजार सेवांशी जोडलेले', 'Connected with market services', 'Users', 'green', 1, true),
  ('व्यापारी', 'Traders', '420+', 'परवानाधारक व्यापारी', 'Licensed traders', 'Store', 'amber', 2, true),
  ('दैनंदिन आवक', 'Daily Arrivals', '3,200+', 'क्विंटल सरासरी', 'Average quintals', 'TrendingUp', 'blue', 3, true),
  ('शेतमाल प्रकार', 'Commodities Traded', '85+', 'नोंदणीकृत शेतमाल', 'Registered commodity types', 'Sprout', 'rose', 4, true);

-- Seed Timeline
INSERT INTO public.initiative_timeline (year, title_mr, title_en, desc_mr, desc_en, sort_order, is_active)
VALUES
  ('2018', 'बाजार सेवा सुधारणा', 'Market Service Improvements', 'शेतकरी सुविधा आणि कार्यालयीन सेवा अधिक सुलभ करण्याची सुरुवात.', 'Started making farmer facilities and office services easier to access.', 1, true),
  ('2020', 'डिजिटल माहिती उपक्रम', 'Digital Information Initiative', 'दर आणि सूचना नागरिकांपर्यंत जलद पोहोचवण्यावर भर.', 'Focused on faster delivery of rates and notices to citizens.', 2, true),
  ('2023', 'पायाभूत सुविधा उन्नती', 'Infrastructure Upgrades', 'आवार व्यवस्थापन, स्वच्छता आणि सुविधा सुधारणा.', 'Campus management, cleanliness, and facility improvements.', 3, true),
  ('2026', 'एकात्मिक नागरिक पोर्टल', 'Integrated Citizen Portal', 'सेवा, उपक्रम आणि बाजार माहिती एकाच डिजिटल ठिकाणी.', 'Services, initiatives, and market information in one digital place.', 4, true);

-- Seed Future Vision Settings
INSERT INTO public.initiative_settings (id, future_vision_mr, future_vision_en)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'मलकापूर कृषी उत्पन्न बाजार समिती आगामी काळात संपूर्णपणे पेपरलेस आणि १००% डिजिटल करण्याचे आमचे उद्दिष्ट आहे. शेतकऱ्यांना घरबसल्या दराची खात्री मिळावी, वजन आणि देयक प्रक्रिया थेट मोबाईल ॲपद्वारे व्हावी, आणि साठवणुकीसाठी आधुनिक व अद्ययावत कोल्ड स्टोरेज साखळी उपलब्ध करून देणे ही आमची प्राथमिकता आहे. कृषी तंत्रज्ञानाचा वापर करून पारदर्शकता अधिक दृढ करणे व शेतकऱ्यांचे जीवन समृद्ध करणे या ध्येयासाठी आम्ही कटिबद्ध आहोत.',
  'APMC Malkapur envisions transition to a complete paperless, fully integrated smart marketplace. Our primary future goal is providing real-time bidding updates and digitized weighing directly to mobile devices. Expanding advanced cold storage infrastructure and integrating machine-learning-based grade testing remain our strategic directions for elevating local agricultural incomes.'
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKET & POLICIES FOR INITIATIVES
-- ─────────────────────────────────────────────────────────────────────────────

-- Create initiatives bucket in storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('initiatives', 'initiatives', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket Security Policies
DROP POLICY IF EXISTS "Public Access initiatives" ON storage.objects;
CREATE POLICY "Public Access initiatives" ON storage.objects
  FOR SELECT USING (bucket_id = 'initiatives');

DROP POLICY IF EXISTS "Authenticated Insert initiatives" ON storage.objects;
CREATE POLICY "Authenticated Insert initiatives" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'initiatives' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Update initiatives" ON storage.objects;
CREATE POLICY "Authenticated Update initiatives" ON storage.objects
  FOR UPDATE USING (bucket_id = 'initiatives' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated Delete initiatives" ON storage.objects;
CREATE POLICY "Authenticated Delete initiatives" ON storage.objects
  FOR DELETE USING (bucket_id = 'initiatives' AND auth.role() = 'authenticated');
