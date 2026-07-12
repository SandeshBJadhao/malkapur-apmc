-- =============================================================================
-- APMC Malkapur – Notices and News Items Tables + Storage Buckets Migration
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP (for clean re-runs)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TABLE IF EXISTS public.news_items CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. NOTICES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.notices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_mr        text NOT NULL,
  title_en        text,
  content_mr      text NOT NULL,
  content_en      text,
  category        text NOT NULL DEFAULT 'general', -- general, important, tender, meeting, holiday
  is_important    boolean NOT NULL DEFAULT false,
  is_published    boolean NOT NULL DEFAULT true,
  published_at    timestamptz DEFAULT now(),
  expires_at      timestamptz,
  attachment_url  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notices_updated_at ON public.notices;
CREATE TRIGGER trg_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. NEWS ITEMS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.news_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_mr        text NOT NULL,
  title_en        text,
  content_mr      text NOT NULL,
  content_en      text,
  excerpt_mr      text,
  excerpt_en      text,
  cover_image_url text,
  category        text NOT NULL DEFAULT 'other', -- market_update, agri_training, govt_scheme, arrivals_report, other
  is_published    boolean NOT NULL DEFAULT true,
  published_at    timestamptz DEFAULT now(),
  author          text NOT NULL DEFAULT 'APMC Admin',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_news_items_updated_at ON public.news_items;
CREATE TRIGGER trg_news_items_updated_at
  BEFORE UPDATE ON public.news_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

-- Notices Policy
CREATE POLICY public_read_published_notices ON public.notices FOR SELECT USING (is_published = true);
CREATE POLICY admin_all_notices ON public.notices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- News Policy
CREATE POLICY public_read_published_news ON public.news_items FOR SELECT USING (is_published = true);
CREATE POLICY admin_all_news ON public.news_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SEED DATA
-- ─────────────────────────────────────────────────────────────────────────────

-- Seed Notices
INSERT INTO public.notices (title_mr, title_en, content_mr, content_en, category, is_important, is_published) VALUES
('नवीन व्यापारी परवाना नोंदणी प्रक्रिया सुरू', 'New Trader License Registration Open', 'बाजार आवारात व्यापार सुरू करू इच्छिणाऱ्या नवीन व्यापाऱ्यांनी १५ जुलै २०२६ पर्यंत आपले अर्ज आवश्यक कागदपत्रांसह बाजार समिती कार्यालयात सादर करावेत.', 'New traders wishing to start business in the market yard must submit their applications along with required documents to the APMC office by July 15, 2026.', 'general', false, true),
('दिनांक ३० मे रोजी वार्षिक सर्वसाधारण सभा', 'Annual General Meeting on May 30', 'बाजार समितीची वार्षिक सर्वसाधारण सभा मुख्य सभागृहात दुपारी १२:०० वाजता आयोजित केली आहे. सर्व सदस्य, प्रतिनिधी आणि शेतकऱ्यांनी उपस्थित रहावे.', 'The annual general meeting of the APMC will be held in the main conference hall at 12:00 PM. All members, delegates, and farmers are requested to attend.', 'meeting', true, true),
('मुख्य बाजार आवार सीसीटीव्ही पाळत देखरेखीखाली', 'Main Market Yard Under CCTV Surveillance', 'सुरक्षा व्यवस्था अधिक बळकट करण्यासाठी संपूर्ण बाजार आवारात सीसीटीव्ही कॅमेरे बसवण्यात आले आहेत. नियमांचे उल्लंघन करणाऱ्यांवर कडक कारवाई केली जाईल.', 'For enhanced security, CCTV cameras have been installed across the market yard. Strict action will be taken against anyone violating mandi rules.', 'general', false, true);

-- Seed News
INSERT INTO public.news_items (title_mr, title_en, content_mr, content_en, excerpt_mr, excerpt_en, cover_image_url, category, is_published) VALUES
('मलकापूर बाजार समितीत कापूस व सोयाबीन खरेदी केंद्रांचे उद्घाटन', 'Inauguration of Cotton and Soyabean Procurement Centers at Malkapur APMC', 'मलकापूर कृषी उत्पन्न बाजार समितीच्या पुढाकाराने, शेतकऱ्यांना शासकीय हमीभावाचा थेट लाभ मिळावा यासाठी कापूस व सोयाबीन खरेदी केंद्रांचे अधिकृत उद्घाटन करण्यात आले. या उद्घाटन सोहळ्यास जिल्हाधिकारी, कृषी विभागाचे अधिकारी आणि स्थानिक लोकप्रतिनिधी उपस्थित होते. शेतकऱ्यांनी आपला शेतमाल थेट या केंद्रांवर आणून विक्री करावी आणि हमीभावाचा पूर्ण लाभ घ्यावा, असे आवाहन बाजार समितीच्या अध्यक्षांनी केले.', 'On behalf of the Malkapur APMC, official cotton and soyabean procurement centers were inaugurated to ensure farmers directly benefit from the government-declared Minimum Support Price (MSP). The inauguration ceremony was attended by the district collector, agricultural officials, and local representatives. The APMC chairperson urged farmers to bring their produce directly to these centers and avail the full benefit of the MSP without any intermediaries.', 'शेतकऱ्यांना हक्काची बाजारपेठ मिळवून देण्यासाठी शासकीय हमीभावाने कापूस आणि सोयाबीन खरेदी केंद्रांचे रीतसर उद्घाटन करण्यात आले. शेतकऱ्यांनी लाभ घेण्याचे आवाहन.', 'Government procurement centers for cotton and soyabean at minimum support price (MSP) were officially inaugurated to support local farmers.', 'https://images.unsplash.com/photo-1598986646512-93d5be8c0ed4?q=80&w=1200&auto=format&fit=crop', 'market_update', true),
('आधुनिक सेंद्रिय शेती तंत्रज्ञानावर एकदिवसीय शेतकरी मार्गदर्शन शिबिर संपन्न', 'One-Day Workshop Conducted on Advanced Organic Farming Techniques', 'मलकापूर बाजार समितीने कृषी विद्यापीठाच्या सहकार्याने एकदिवसीय शेतकरी प्रशिक्षण शिबिराचे आयोजन केले. सेंद्रिय शेती, सूक्ष्म खत व्यवस्थापन, जैविक कीड नियंत्रण आणि माती परीक्षणाबाबत तज्ज्ञांनी मार्गदर्शन केले. शिबिरात १२० हून अधिक शेतकऱ्यांनी भाग घेतला. शेतकऱ्यांना मोफत माती परीक्षण किटचे वाटप करण्यात आले.', 'In collaboration with the agricultural university, Malkapur APMC organized a full-day training workshop for local farmers. Experts guided participants on organic farming techniques, micro-nutrient management, biological pest control, and soil testing. Over 120 farmers participated. Free soil testing kits were distributed to all attendees.', 'बाजार समितीच्या वतीने तज्ज्ञ मार्गदर्शकांच्या उपस्थितीत सेंद्रिय शेती, खत व्यवस्थापन आणि कीड नियंत्रणाबाबत १०० हून अधिक शेतकऱ्यांना प्रशिक्षण देण्यात आले.', 'Malkapur APMC organized a training session for over 100 local farmers on organic fertilizers, biological pest controls, and sustainable practices.', 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1200&auto=format&fit=crop', 'agri_training', true),
('ठिबक व तुषार सिंचन योजनेसाठी शासकीय अनुदानाचे अर्ज भरणे सुरू', 'Applications Open for Government Subsidies on Drip & Sprinkler Irrigation', 'राज्य कृषी विभागाने ठिबक सिंचन (Drip Irrigation) आणि तुषार सिंचन (Sprinkler Irrigation) यंत्रणांसाठी ८०% पर्यंत सरकारी अनुदान जाहीर केले आहे. इच्छुक शेतकऱ्यांनी बाजार समिती कार्यालयात येथे येऊन अर्ज भरावेत. अर्जासोबत आधार कार्ड, ७/१२ उतारा आणि बँक पासबुकची प्रत जोडणे आवश्यक आहे. अंतिम मुदत: ३१ मे २०२६.', 'The State Agriculture Department has announced up to 80% government subsidy for drip and sprinkler irrigation systems. Interested farmers should visit the APMC office to fill out the application. Required documents include Aadhaar card, 7/12 land record extract, and a copy of bank passbook. Application deadline: May 31, 2026.', 'कृषी विभागाकडून सूक्ष्म सिंचनाला प्रोत्साहन देण्यासाठी ८०% पर्यंत सवलत जाहीर झाली आहे. अर्ज करण्याची अंतिम मुदत या महिन्याच्या अखेरपर्यंत आहे.', 'The Department of Agriculture has announced up to 80% subsidy for micro-irrigation installations. Last date for registration is end of this month.', 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?q=80&w=1200&auto=format&fit=crop', 'govt_scheme', true);
