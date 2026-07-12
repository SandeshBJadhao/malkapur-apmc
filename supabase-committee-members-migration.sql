-- =============================================================================
-- APMC Malkapur – Committee Members Table + Storage Buckets Migration
-- Run this ONCE in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 0. CLEANUP (for clean re-runs)
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.committee_members CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. COMMITTEE MEMBERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.committee_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_mr         text NOT NULL,
  name_en         text NOT NULL,
  role_type       text NOT NULL CHECK (role_type IN ('leadership', 'board', 'employee', 'officer')),
  designation_mr  text NOT NULL,
  designation_en  text NOT NULL,
  department_mr   text,
  department_en   text,
  phone           text,
  email           text,
  image_url       text,
  term_start      text,
  term_end        text,
  village_mr      text,
  village_en      text,
  sort_order      integer NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_committee_members_updated_at ON public.committee_members;
CREATE TRIGGER trg_committee_members_updated_at
  BEFORE UPDATE ON public.committee_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.committee_members ENABLE ROW LEVEL SECURITY;

-- Public can read active members
CREATE POLICY "public_read_active_members"
  ON public.committee_members FOR SELECT
  USING (is_active = true);

-- Authenticated admin can do everything
CREATE POLICY "admin_all_members"
  ON public.committee_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. GALLERY ITEMS TABLE (update existing or create)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_mr        text,
  title_en        text,
  image_url       text NOT NULL,
  thumbnail_url   text,
  category        text NOT NULL DEFAULT 'other',
  is_published    boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_gallery_items_updated_at ON public.gallery_items;
CREATE TRIGGER trg_gallery_items_updated_at
  BEFORE UPDATE ON public.gallery_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_gallery"
  ON public.gallery_items FOR SELECT
  USING (is_published = true);

CREATE POLICY "admin_all_gallery"
  ON public.gallery_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SEED INITIAL COMMITTEE MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.committee_members (name_mr, name_en, role_type, designation_mr, designation_en, phone, email, term_start, term_end, village_mr, village_en, sort_order) VALUES
  ('मा. श्री. बाळासाहेब गणपतराव पाटील', 'Hon. Shri. Balasaheb Ganpatrao Patil', 'leadership', 'सभापती', 'Chairman', '+91 98220 12345', 'chairman@apmcmalkapur.org', '2023', 'Present', 'मलकापूर', 'Malkapur', 1),
  ('मा. श्री. रामदास विठ्ठलराव तायडे', 'Hon. Shri. Ramdas Vitthalrao Tayade', 'leadership', 'उपसभापती', 'Vice Chairman', '+91 98500 54321', 'vicechairman@apmcmalkapur.org', '2023', 'Present', 'नरवेल', 'Narwel', 2),
  ('श्री. सदाशिव नामदेवराव वानखडे', 'Shri. Sadashiv Namdevrao Wankhade', 'leadership', 'सचिव', 'Secretary', '+91 94221 67890', 'secretary@apmcmalkapur.org', '2020', 'Present', 'उमळी', 'Umali', 3),
  ('श्री. गजानन देवराव पाटील', 'Shri. Gajanan Devrao Patil', 'board', 'संचालक', 'Director', NULL, NULL, NULL, NULL, 'वडजी (सहकारी संस्था गट)', 'Wadji (Cooperative Societies Group)', 10),
  ('श्री. निवृत्ती नामदेव चोपडे', 'Shri. Nivruti Namdeo Chopade', 'board', 'संचालक', 'Director', NULL, NULL, NULL, NULL, 'माळखेड (सहकारी संस्था गट)', 'Malkhed (Cooperative Societies Group)', 11),
  ('सौ. शालिनीबाई गोपाळराव देशमुख', 'Sau. Shalinibai Gopalrao Deshmukh', 'board', 'संचालक', 'Director', NULL, NULL, NULL, NULL, 'मलकापूर (महिला राखीव गट)', 'Malkapur (Women''s Reserved Group)', 12),
  ('श्री. समाधान बाळकृष्ण तायडे', 'Shri. Samadhan Balkrishna Tayade', 'board', 'संचालक', 'Director', NULL, NULL, NULL, NULL, 'नरवेल (इतर मागासवर्गीय गट)', 'Narwel (OBC Group)', 13),
  ('श्री. ज्ञानेश्वर तुकाराम महाले', 'Shri. Dnyaneshwar Tukaram Mahale', 'board', 'संचालक', 'Director', NULL, NULL, NULL, NULL, 'धसाडी (ग्रामपंचायत गट)', 'Dhasadi (Gram Panchayat Group)', 14),
  ('श्री. भगवान विष्णू कोलते', 'Shri. Bhagwan Vishnu Kolte', 'board', 'संचालक', 'Director', NULL, NULL, NULL, NULL, 'भडगणी (कृषी पतसंस्था गट)', 'Bhadgani (Cooperative Credit Group)', 15),
  ('श्री. वासुदेव शंकर सोनोने', 'Shri. Vasudev Shankar Sonone', 'board', 'संचालक', 'Director', NULL, NULL, NULL, NULL, 'उमळी (विमुक्त जाती / भटक्या जमाती गट)', 'Umali (VJ/NT Group)', 16),
  ('श्री. शेख हुसेन शेख कादर', 'Shri. Sheikh Husain Sheikh Kadar', 'board', 'संचालक', 'Director', NULL, NULL, NULL, NULL, 'मलकापूर (व्यापारी / अडते गट)', 'Malkapur (Traders & Commission Agents Group)', 17),
  ('श्री. प्रकाश अर्जुन जुमळे', 'Shri. Prakash Arjun Jumale', 'board', 'संचालक', 'Director', NULL, NULL, NULL, NULL, 'मलकापूर (हमाल व तोलणार गट)', 'Malkapur (Labourers & Weighmen Group)', 18),
  ('श्री. विकास सखाराम सोनोने', 'Shri. Vikas Sakharam Sonone', 'officer', 'सहाय्यक सचिव', 'Assistant Secretary', '+91 94228 11111', NULL, NULL, NULL, NULL, NULL, 30),
  ('श्री. अर्जुन विठ्ठलराव तायडे', 'Shri. Arjun Vitthalrao Tayade', 'officer', 'मुख्य लेखापाल', 'Chief Accountant', '+91 98605 22222', NULL, NULL, NULL, NULL, NULL, 31),
  ('श्री. संजय गजानन चोपडे', 'Shri. Sanjay Gajanan Chopade', 'employee', 'बाजार निरीक्षक', 'Market Inspector', '+91 94234 33333', NULL, NULL, NULL, NULL, NULL, 32),
  ('सौ. ज्योती दिनकर पाटील', 'Sau. Jyoti Dinkar Patil', 'employee', 'वरिष्ठ लिपिक', 'Senior Clerk', '+91 98812 44444', NULL, NULL, NULL, NULL, NULL, 33),
  ('श्री. किरण वासुदेव सुरळकर', 'Shri. Kiran Vasudev Suralkar', 'employee', 'कनिष्ठ लिपिक', 'Junior Clerk', '+91 99223 55555', NULL, NULL, NULL, NULL, NULL, 34),
  ('श्री. राजू दगडू सोळंकी', 'Shri. Raju Dagdu Solanki', 'employee', 'तोलणार', 'Weighman', '+91 95456 66666', NULL, NULL, NULL, NULL, NULL, 35),
  ('श्री. गजानन भिकाजी तायडे', 'Shri. Gajanan Bhikaji Tayade', 'employee', 'शिपाई', 'Peon', '+91 91588 77777', NULL, NULL, NULL, NULL, NULL, 36);

-- Update dept fields for officers/employees
UPDATE public.committee_members SET department_mr = 'प्रशासन विभाग', department_en = 'Administration Dept' WHERE name_en IN ('Shri. Vikas Sakharam Sonone', 'Sau. Jyoti Dinkar Patil');
UPDATE public.committee_members SET department_mr = 'वित्त व लेखा विभाग', department_en = 'Finance & Accounts Dept' WHERE name_en = 'Shri. Arjun Vitthalrao Tayade';
UPDATE public.committee_members SET department_mr = 'बाजार व व्यापार विभाग', department_en = 'Market & Trading Dept' WHERE name_en IN ('Shri. Sanjay Gajanan Chopade', 'Shri. Kiran Vasudev Suralkar', 'Shri. Raju Dagdu Solanki');
UPDATE public.committee_members SET department_mr = 'सामान्य प्रशासन विभाग', department_en = 'General Administration Dept' WHERE name_en = 'Shri. Gajanan Bhikaji Tayade';
