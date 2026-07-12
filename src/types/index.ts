export type Language = 'mr' | 'en';

export interface CommodityVariety {
  id: string;
  commodity_id: string;
  name_mr: string;
  name_en: string;
  sort_order: number;
  created_at?: string;
}

export interface Commodity {
  id: string;
  name_mr: string;
  name_en: string;
  category: string;
  unit: string;
  is_active: boolean;
  msamb_variety?: string;
  created_at: string;
  updated_at: string;
  varieties?: CommodityVariety[];
}

export interface MarketRate {
  id: string;
  commodity_id: string;
  date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  min_arrivals: number;
  max_arrivals: number;
  modal_arrivals: number;
  unit: string;
  variety?: string;
  created_at: string;
  updated_at: string;
  commodities?: Commodity;
  market_center?: string | null;
}
export interface Service {
  id: string;
  title_mr: string;
  title_en: string;
  description_mr: string | null;
  description_en: string | null;
  icon_name: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Initiative {
  id: string;
  title_mr: string;
  title_en: string;
  description_mr: string | null;
  description_en: string | null;
  image_url: string | null;
  category: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  market_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  office_timings: string | null;
  social_facebook: string | null;
  social_twitter: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  created_at: string;
  updated_at: string;
}

export interface GovScheme {
  id: string;
  title_mr: string;
  title_en: string;
  desc_mr: string;
  desc_en: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  label_mr: string;
  label_en: string;
  value: string;
  subtext_mr: string | null;
  subtext_en: string | null;
  icon_name: string;
  accent_color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InitiativeTimeline {
  id: string;
  year: string;
  title_mr: string;
  title_en: string;
  desc_mr: string;
  desc_en: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InitiativeSettings {
  id: string;
  future_vision_mr: string;
  future_vision_en: string;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: string;
  title_mr: string;
  title_en: string | null;
  content_mr: string;
  content_en: string | null;
  category: string;
  is_important: boolean;
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsItem {
  id: string;
  title_mr: string;
  title_en: string | null;
  content_mr: string;
  content_en: string | null;
  excerpt_mr: string | null;
  excerpt_en: string | null;
  cover_image_url: string | null;
  category: string;
  is_published: boolean;
  published_at: string | null;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  title_mr: string | null;
  title_en: string | null;
  image_url: string;
  thumbnail_url: string | null;
  category: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ContentPage {
  id: string;
  slug: string;
  title_mr: string;
  title_en: string | null;
  content_mr: string;
  content_en: string | null;
  meta_description_mr: string | null;
  meta_description_en: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  full_name: string | null;
  role: 'admin' | 'super_admin' | 'editor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommitteeMember {
  id: string;
  name_mr: string;
  name_en: string;
  role_type: 'leadership' | 'board' | 'employee' | 'officer';
  designation_mr: string;
  designation_en: string;
  department_mr?: string | null;
  department_en?: string | null;
  phone?: string | null;
  email?: string | null;
  image_url?: string | null;
  term_start?: string | null;
  term_end?: string | null;
  village_mr?: string | null;
  village_en?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AboutIntro {
  id: string;
  content_mr: string;
  content_en: string;
  created_at: string;
  updated_at: string;
}

export interface AboutMission {
  id: string;
  text_mr: string;
  text_en: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AboutKeyFact {
  id: string;
  value_mr: string;
  value_en: string;
  label_mr: string;
  label_en: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFacility {
  id: string;
  title_mr: string;
  title_en: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceForm {
  id: string;
  title_mr: string;
  title_en: string;
  description_mr: string | null;
  description_en: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFAQ {
  id: string;
  question_mr: string;
  question_en: string;
  answer_mr: string;
  answer_en: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}



