-- =============================================================================
-- APMC Malkapur – Services Extension Tables Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP (for clean re-runs)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.service_facilities CASCADE;
DROP TABLE IF EXISTS public.service_forms CASCADE;
DROP TABLE IF EXISTS public.service_faqs CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FACILITIES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.service_facilities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_mr    text NOT NULL,
  title_en    text NOT NULL,
  icon_name   text NOT NULL DEFAULT 'ClipboardCheck',
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at trigger helper (using public.set_updated_at if exists, otherwise define here)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_service_facilities_updated_at ON public.service_facilities;
CREATE TRIGGER trg_service_facilities_updated_at
  BEFORE UPDATE ON public.service_facilities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DOWNLOADABLE FORMS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.service_forms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_mr        text NOT NULL,
  title_en        text NOT NULL,
  description_mr  text,
  description_en  text,
  file_url        text,
  file_name       text,
  file_type       text NOT NULL DEFAULT 'PDF',
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_service_forms_updated_at ON public.service_forms;
CREATE TRIGGER trg_service_forms_updated_at
  BEFORE UPDATE ON public.service_forms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FAQS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.service_faqs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_mr text NOT NULL,
  question_en text NOT NULL,
  answer_mr   text NOT NULL,
  answer_en   text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_service_faqs_updated_at ON public.service_faqs;
CREATE TRIGGER trg_service_faqs_updated_at
  BEFORE UPDATE ON public.service_faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.service_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_faqs ENABLE ROW LEVEL SECURITY;

-- Select Policies
CREATE POLICY public_read_facilities ON public.service_facilities FOR SELECT USING (is_active = true);
CREATE POLICY public_read_forms ON public.service_forms FOR SELECT USING (is_active = true);
CREATE POLICY public_read_faqs ON public.service_faqs FOR SELECT USING (is_active = true);

-- Auth write Policies
CREATE POLICY admin_all_facilities ON public.service_facilities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_forms ON public.service_forms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_all_faqs ON public.service_faqs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SEED DATA
-- ─────────────────────────────────────────────────────────────────────────────

-- Seed Facilities
INSERT INTO public.service_facilities (title_mr, title_en, icon_name, sort_order) VALUES
('पार्किंग', 'Parking', 'ParkingCircle', 10),
('पिण्याचे पाणी', 'Drinking Water', 'Waves', 20),
('विश्रांती कक्ष', 'Rest Area', 'Sofa', 30),
('सुरक्षा', 'Security', 'ShieldCheck', 40),
('डिजिटल डिस्प्ले बोर्ड', 'Digital Display Boards', 'MonitorUp', 50),
('गोदाम माहिती', 'Warehouse Information', 'Warehouse', 60);

-- Seed Forms
INSERT INTO public.service_forms (title_mr, title_en, description_mr, description_en, file_type, sort_order) VALUES
('शेतकरी नोंदणी फॉर्म', 'Farmer Registration Form', 'शेतकरी सेवा आणि बाजार माहिती नोंदणीसाठी.', 'For farmer service and market information registration.', 'PDF', 10),
('व्यापारी नोंदणी फॉर्म', 'Trader Registration Form', 'व्यापारी नोंदणी व प्राथमिक तपशीलासाठी.', 'For trader registration and basic details.', 'PDF', 20),
('परवाना अर्ज फॉर्म', 'License Application Form', 'परवाना अर्ज प्रक्रियेसाठी आवश्यक नमुना.', 'Sample form required for license application.', 'PDF', 30);

-- Seed FAQs
INSERT INTO public.service_faqs (question_mr, question_en, answer_mr, answer_en, sort_order) VALUES
('बाजार भाव माहिती कुठे पाहता येईल?', 'Where can I view market rates?', 'दैनंदिन बाजार भाव वेबसाइटवरील बाजार भाव पृष्ठावर उपलब्ध आहेत.', 'Daily rates are available on the Market Rates page of this website.', 10),
('परवाना सहाय्यासाठी कोणाशी संपर्क करावा?', 'Who should I contact for license assistance?', 'मुख्य कार्यालयातील सेवा कक्ष किंवा संपर्क पृष्ठावरील अधिकृत क्रमांक वापरा.', 'Contact the service desk at the main office or use the official number on the Contact page.', 20),
('तक्रार ऑनलाइन नोंदवता येते का?', 'Can complaints be submitted online?', 'सध्या संपर्क पृष्ठावरील चौकशी व तक्रार फॉर्मद्वारे प्राथमिक नोंदणी करता येते.', 'Initial complaint registration can currently be made through the inquiry form on the Contact page.', 30),
('फॉर्म डाउनलोड कसे करावे?', 'How do I download forms?', 'या पृष्ठावरील फॉर्म कार्ड नमुना डाउनलोड विभाग म्हणून दिले आहेत. अधिकृत प्रत कार्यालयातून मिळेल.', 'The form cards on this page are mock download entries. Official copies are available from the office.', 40);
