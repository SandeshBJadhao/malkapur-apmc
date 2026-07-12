'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, Calendar, Bell, ArrowRight,
  Package, Truck, Users,
  Wheat, Apple, Carrot, Store,
  Image as ImageIcon, FileText, Phone,
  ChevronRight, Quote, Star,
  BarChart3,
} from 'lucide-react';
import { Notice, MarketRate, NewsItem, GalleryItem } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  PageHero,
  InfoCard,
  SectionHeading,
  NoticeCard,
  StatsCard,
  ServiceCard,
  MarketCard,
  AnnouncementTicker,
  TickerItem,
  LoadingSpinner,
} from '@/components/shared';

/* ─────────────────────────────────────────────────────────────────────────────
   Static data — replace with DB queries as needed
───────────────────────────────────────────────────────────────────────────── */

const TICKER_ITEMS: TickerItem[] = [
  {
    id: '1',
    textMr: 'शेतकरी सेवा केंद्र आज सकाळी १०:०० वाजेपासून खुले — मुख्य कार्यालयात संपर्क साधा',
    textEn: 'Farmer service desk open from 10:00 AM today — Contact the main office',
    type: 'update',
  },
  {
    id: '2',
    textMr: 'नवीन व्यापारी नोंदणी प्रक्रिया सुरू — कार्यालयात संपर्क साधा',
    textEn: 'New trader registration process open — Contact the office',
    type: 'notice',
  },
  {
    id: '3',
    textMr: 'कापूस आवक वाढली — किमान आधारभूत किंमत ₹७,०२१ प्रति क्विंटल',
    textEn: 'Cotton arrivals increased — Minimum support price ₹7,021 per quintal',
    type: 'update',
  },
  {
    id: '4',
    textMr: 'दि. ३० मे रोजी बाजार समिती सभा — सर्व सदस्यांनी उपस्थित राहणे अनिवार्य',
    textEn: 'APMC committee meeting on May 30 — All members must attend',
    type: 'alert',
  },
  {
    id: '5',
    textMr: 'हरभरा (चना) आजचा कमाल दर: ₹५,४५० — आवक: १,२०० क्विंटल',
    textEn: 'Chickpea (Chana) max rate today: ₹5,450 — Arrivals: 1,200 quintals',
    type: 'update',
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */

export default function Home() {
  const { t, language } = useLanguage();
  const [latestRates,   setLatestRates]   = useState<MarketRate[]>([]);
  const [latestNotices, setLatestNotices] = useState<Notice[]>([]);
  const [latestNews,    setLatestNews]    = useState<NewsItem[]>([]);
  const [gallery,       setGallery]       = useState<GalleryItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const supabase = createClient();

  const [dbTickerItems, setDbTickerItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [ratesRes, noticesRes, newsRes, galleryRes] = await Promise.all([
          supabase
            .from('market_rates')
            .select(`*, commodities (name_mr, name_en, unit)`)
            .order('date', { ascending: false })
            .limit(6),
          supabase
            .from('notices')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false }),
          supabase
            .from('news_items')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
            .limit(3),
          supabase
            .from('gallery_items')
            .select('*')
            .eq('is_published', true)
            .order('sort_order', { ascending: true })
            .limit(6),
        ]);

        if (ratesRes.data)   setLatestRates(ratesRes.data);
        
        if (noticesRes.data) {
          // Filter out expired notices
          const activeNotices = noticesRes.data.filter((notice) => {
            if (!notice.expires_at) return true;
            return new Date(notice.expires_at) >= new Date();
          });
          
          setLatestNotices(activeNotices.slice(0, 4));

          // Generate dynamic ticker items from important or latest notices
          const tickerItems: TickerItem[] = activeNotices.map((n) => ({
            id: n.id,
            textMr: n.title_mr,
            textEn: n.title_en || n.title_mr,
            type: n.is_important ? 'alert' : 'notice',
          }));
          
          if (tickerItems.length > 0) {
            setDbTickerItems(tickerItems);
          }
        }
        
        if (newsRes.data)    setLatestNews(newsRes.data);
        if (galleryRes.data) setGallery(galleryRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      <PageHero
        titleMr="कृषी उत्पन्न बाजार समिती, मलकापूर"
        titleEn="Agricultural Produce Market Committee, Malkapur"
        subtitleMr="शेतकऱ्यांच्या प्रगतीचा आणि विश्वासाचा पाया. पारदर्शक व्यवहार आणि योग्य हमीभाव मिळवून देण्यासाठी आम्ही कटिबद्ध आहोत."
        subtitleEn="The foundation of farmers' progress and trust. We are committed to transparent transactions and ensuring fair prices."
        badgeMr="महाराष्ट्र शासन • बुलढाणा जिल्हा"
        badgeEn="Government of Maharashtra • Buldhana District"
        showDotGrid={false}
        contentClassName="pb-36 sm:pb-44 lg:pb-48"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-green-950 font-bold border-0 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0"
            asChild
          >
            <Link href="/market-rates">
              {t('आजचे बाजार भाव पहा', "View Today's Market Rates")}
              <TrendingUp className="ml-2 h-5 w-5" aria-hidden />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-sm font-semibold hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shrink-0"
            asChild
          >
            <Link href="/about">
              {t('आमच्याबद्दल अधिक जाणून घ्या', 'Learn More About Us')}
            </Link>
          </Button>
        </div>
      </PageHero>


      {/* ══════════════════════════════════════════════════════════════════════
          2. FLOATING QUICK INFO CARDS
          — Transparent background so the green hero gradient shows through.
            Negative margin pulls cards up to overlap the hero cleanly.
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 -mt-20 sm:-mt-24 lg:-mt-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            <InfoCard
              titleMr="बाजार भाव"
              titleEn="Market Rates"
              descMr="दैनंदिन शेतमाल आवक आणि दरांची अद्ययावत माहिती मिळवा."
              descEn="Get updated information on daily agricultural arrivals and rates."
              linkHref="/market-rates"
              linkLabelMr="सविस्तर पहा"
              linkLabelEn="View Details"
              icon={TrendingUp}
              accentColor="green"
            />
            <InfoCard
              titleMr="सेवा"
              titleEn="Services"
              descMr="शेतकरी, व्यापारी आणि नागरिकांसाठी उपलब्ध सुविधा व सहाय्य."
              descEn="Facilities and support available for farmers, traders, and citizens."
              linkHref="/services"
              linkLabelMr="सेवा पहा"
              linkLabelEn="View Services"
              icon={Calendar}
              accentColor="blue"
            />
            <InfoCard
              titleMr="उपक्रम"
              titleEn="Initiatives"
              descMr="बाजार विकास, शेतकरी जनजागृती आणि कल्याणकारी उपक्रम."
              descEn="Market development, farmer awareness, and welfare initiatives."
              linkHref="/initiatives"
              linkLabelMr="उपक्रम पहा"
              linkLabelEn="View Initiatives"
              icon={Users}
              accentColor="green"
            />
            <InfoCard
              titleMr="परिपत्रके व सूचना"
              titleEn="Notices & Circulars"
              descMr="बाजार समितीचे महत्वाचे निर्णय आणि सूचना."
              descEn="Important decisions and notices from the Market Committee."
              linkHref="/notices"
              linkLabelMr="सर्व सूचना वाचा"
              linkLabelEn="Read All Notices"
              icon={Bell}
              accentColor="amber"
            />
          </div>
        </div>
      </div>

      {/* Spacer that bridges the hero overlap region into the white page body */}
      <div className="bg-white pt-14 sm:pt-16" />

      {/* ══════════════════════════════════════════════════════════════════════
          3. ANNOUNCEMENT TICKER
          — Positioned below the floating cards as a live news strip.
      ══════════════════════════════════════════════════════════════════════ */}
      <AnnouncementTicker items={dbTickerItems.length > 0 ? dbTickerItems : TICKER_ITEMS} />

      {/* ══════════════════════════════════════════════════════════════════════
          4. MARKET STATISTICS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 sm:py-20 border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3">
              {t('बाजार आकडेवारी', 'Market Statistics')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              {t('एका नजरेत संपूर्ण बाजार', 'The Entire Market at a Glance')}
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto text-base">
              {t(
                'मलकापूर कृषी बाजार समितीचे आजचे प्रमुख आकडे.',
                'Key figures from APMC Malkapur for today.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            <StatsCard
              labelMr="एकूण शेतमाल"
              labelEn="Total Commodities"
              value="85+"
              subtextMr="नोंदणीकृत शेतमाल प्रकार"
              subtextEn="Registered commodity types"
              icon={Package}
              accentColor="green"
            />
            <StatsCard
              labelMr="दैनंदिन आवक"
              labelEn="Daily Arrivals"
              value="3,200+"
              subtextMr="क्विंटल / दिवस (सरासरी)"
              subtextEn="Quintals per day (avg.)"
              icon={Truck}
              accentColor="blue"
            />
            <StatsCard
              labelMr="नोंदणीकृत व्यापारी"
              labelEn="Active Traders"
              value="420+"
              subtextMr="परवानाधारक व्यापारी"
              subtextEn="Licensed traders"
              icon={Users}
              accentColor="amber"
            />
            <StatsCard
              labelMr="वार्षिक सेवा"
              labelEn="Annual Services"
              value="2,100+"
              subtextMr="शेतकरी व नागरिकांना दिलेले सहाय्य"
              subtextEn="Farmer and citizen support cases"
              icon={Calendar}
              accentColor="rose"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. LIVE MARKET RATES PREVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-16 sm:py-20 border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <SectionHeading
              titleMr="आजचे प्रमुख बाजार भाव"
              titleEn="Today's Major Market Rates"
              subtitleMr="सर्व प्रमुख शेतमालाचे किमान, कमाल व सर्वसाधारण दर."
              subtitleEn="Minimum, maximum, and modal prices for key commodities."
              accentColor="green"
              icon={BarChart3}
            />
            <Button
              variant="outline"
              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 rounded-full font-semibold text-sm shrink-0 self-start sm:self-auto"
              asChild
            >
              <Link href="/market-rates">
                {t('संपूर्ण बाजार भाव पहा', 'View Full Bazaar Bhav')}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <LoadingSpinner labelMr="बाजार भाव लोड होत आहेत..." labelEn="Loading market rates..." />
            ) : latestRates.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-[12px] text-emerald-950 font-bold uppercase tracking-wide bg-emerald-50 border-b border-emerald-100">
                      <tr>
                        <th className="px-6 py-4 text-left">{t('शेतमाल', 'Commodity')}</th>
                        <th className="px-6 py-4 text-right">{t('किमान (₹)', 'Min (₹)')}</th>
                        <th className="px-6 py-4 text-right">{t('कमाल (₹)', 'Max (₹)')}</th>
                        <th className="px-6 py-4 text-right">{t('सर्वसाधारण (₹)', 'Modal (₹)')}</th>
                        <th className="hidden sm:table-cell px-6 py-4 text-right">{t('एकक', 'Unit')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {latestRates.map((rate) => (
                        <tr
                          key={rate.id}
                          className="hover:bg-emerald-50/30 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {language === 'mr' ? rate.commodities?.name_mr : rate.commodities?.name_en}
                          </td>
                          <td className="px-6 py-4 text-right text-rose-600 font-semibold">{formatCurrency(rate.min_price)}</td>
                          <td className="px-6 py-4 text-right text-emerald-700 font-semibold">{formatCurrency(rate.max_price)}</td>
                          <td className="px-6 py-4 text-right font-extrabold text-gray-900">{formatCurrency(rate.modal_price)}</td>
                          <td className="hidden sm:table-cell px-6 py-4 text-right text-gray-400 text-xs font-medium">
                            {language === 'mr' ? rate.commodities?.unit : rate.commodities?.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-medium">
                    {t('* भाव प्रतिक्विंटल रुपयांमध्ये आहेत', '* Prices are per quintal in INR')}
                  </p>
                  <Link
                    href="/market-rates"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
                  >
                    {t('सर्व पहा', 'View All')}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-16 text-center text-gray-400 font-medium">
                {t('आजचे भाव अद्याप उपलब्ध नाहीत.', "Today's rates are not yet available.")}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. CHAIRMAN / SABHAPATI MESSAGE
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 sm:py-24 border-t border-gray-100 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Left — Avatar + decorative elements */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Decorative ring */}
                <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-50 opacity-70" aria-hidden />
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-green-200 to-transparent opacity-40" aria-hidden />

                {/* Avatar */}
                <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-green-700 to-emerald-800 flex items-center justify-center shadow-2xl border-4 border-white">
                  <div className="text-center text-white">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2 border-2 border-white/20">
                      <Users className="h-12 w-12 text-white/80" aria-hidden />
                    </div>
                    <p className="text-xs font-bold text-green-200 uppercase tracking-wider">
                      {t('सभापती', 'Chairman')}
                    </p>
                  </div>
                </div>

                {/* Badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-green-950 text-[10px] font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap">
                  {t('कृषी उत्पन्न बाजार समिती', 'APMC Malkapur')}
                </div>

                {/* Leaf decorations */}
                <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-green-100 border border-green-200 flex items-center justify-center" aria-hidden>
                  <Star className="h-5 w-5 text-green-600" aria-hidden />
                </div>
              </div>
            </div>

            {/* Right — Message */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-3">
                {t('सभापतींचा संदेश', "Chairman's Message")}
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                {t('शेतकरी बांधवांनो, आपले स्वागत आहे!', 'Welcome, Fellow Farmers!')}
              </h2>

              {/* Quote icon */}
              <Quote className="h-8 w-8 text-green-200 mb-4" aria-hidden />

              <p className="text-gray-600 text-base leading-loose mb-6">
                {t(
                  'मलकापूर कृषी उत्पन्न बाजार समितीच्या या अधिकृत संकेतस्थळावर आपले मनःपूर्वक स्वागत आहे. आमचे ध्येय शेतकऱ्यांना त्यांच्या शेतमालाला योग्य हमीभाव मिळवून देणे आणि पारदर्शक व्यापार व्यवस्था सुनिश्चित करणे हे आहे.',
                  'A very warm welcome to the official website of APMC Malkapur. Our mission is to ensure fair prices for farmers and to provide a transparent and honest trading system for all stakeholders.'
                )}
              </p>
              <p className="text-gray-600 text-base leading-loose mb-8">
                {t(
                  'आम्ही सदैव शेतकऱ्यांच्या हिताकरिता झटत राहू. आधुनिक तंत्रज्ञानाचा वापर करून बाजार व्यवस्था अधिक सुलभ आणि विश्वासार्ह बनविणे हा आमचा संकल्प आहे.',
                  'We remain steadfast in our commitment to farmers. Our resolve is to leverage modern technology to make the market system more accessible and trustworthy for everyone.'
                )}
              </p>

              {/* Signature block */}
              <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-green-700" aria-hidden />
                </div>
                <div>
                  <p className="font-extrabold text-gray-900 text-base">
                    {t('मा. सभापती', 'Hon. Chairman')}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    {t('कृषी उत्पन्न बाजार समिती, मलकापूर', 'APMC Malkapur')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. QUICK SERVICES
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-16 sm:py-20 border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3">
              {t('आमच्या सेवा', 'Our Services')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              {t('जलद सेवा केंद्र', 'Quick Service Centre')}
            </h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto text-base">
              {t(
                'सर्व सेवा एकाच ठिकाणी — सहज, जलद आणि पारदर्शक.',
                'All services in one place — simple, fast, and transparent.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <ServiceCard
              labelMr="बाजार भाव"
              labelEn="Bazaar Bhav"
              descMr="दैनंदिन दर"
              descEn="Daily rates"
              icon={TrendingUp}
              href="/market-rates"
              accentColor="green"
            />
            <ServiceCard
              labelMr="सेवा"
              labelEn="Services"
              descMr="सुविधा"
              descEn="Facilities"
              icon={Calendar}
              href="/services"
              accentColor="blue"
            />
            <ServiceCard
              labelMr="उपक्रम"
              labelEn="Initiatives"
              descMr="विकास कार्य"
              descEn="Development"
              icon={Users}
              href="/initiatives"
              accentColor="green"
            />
            <ServiceCard
              labelMr="सूचना"
              labelEn="Notices"
              descMr="परिपत्रके"
              descEn="Circulars"
              icon={Bell}
              href="/notices"
              accentColor="amber"
            />
            <ServiceCard
              labelMr="दालन"
              labelEn="Gallery"
              descMr="छायाचित्रे"
              descEn="Photos"
              icon={ImageIcon}
              href="/gallery"
              accentColor="purple"
            />
            <ServiceCard
              labelMr="अहवाल"
              labelEn="Reports"
              descMr="वार्षिक अहवाल"
              descEn="Annual reports"
              icon={FileText}
              href="/notices"
              accentColor="teal"
            />
            <ServiceCard
              labelMr="संपर्क"
              labelEn="Contact"
              descMr="आम्हाला संपर्क करा"
              descEn="Get in touch"
              icon={Phone}
              href="/contact"
              accentColor="rose"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. FEATURED MARKET YARDS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 sm:py-20 border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-3">
              {t('बाजार आवार', 'Market Yards')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              {t('आमचे प्रमुख बाजार', 'Our Major Markets')}
            </h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto text-base">
              {t(
                'मलकापूर बाजार समितीचे चार प्रमुख आवार शेतकऱ्यांसाठी नेहमी तत्पर.',
                'Four major yards of APMC Malkapur always ready for farmers.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MarketCard
              titleMr="मुख्य धान्य बाजार"
              titleEn="Main Grain Market"
              descMr="सोयाबीन, कापूस, तूर, हरभरा, गहू यांचे प्रमुख आवार."
              descEn="Primary yard for soybean, cotton, tur, chana, wheat."
              statMr="५०+ वस्तू"
              statEn="50+ Commodities"
              icon={Wheat}
              accentColor="green"
              href="/market-rates"
            />
            <MarketCard
              titleMr="फळ बाजार"
              titleEn="Fruit Market"
              descMr="केळी, संत्री, मोसंबी, डाळिंब यांचे विशेष आवार."
              descEn="Dedicated yard for banana, orange, sweet lime, pomegranate."
              statMr="२०+ फळे"
              statEn="20+ Fruits"
              icon={Apple}
              accentColor="amber"
              href="/market-rates"
            />
            <MarketCard
              titleMr="भाजीपाला बाजार"
              titleEn="Vegetable Market"
              descMr="टोमॅटो, कांदा, बटाटा, मिरची यांचे ताजे आवार."
              descEn="Fresh yard for tomato, onion, potato, chilli."
              statMr="३०+ भाज्या"
              statEn="30+ Vegetables"
              icon={Carrot}
              accentColor="rose"
              href="/market-rates"
            />
            <MarketCard
              titleMr="उप बाजार आवार"
              titleEn="Sub Market Yard"
              descMr="विविध शेतमालासाठी उपलब्ध सुविधा, वजन काटे आणि व्यापारी सहाय्य."
              descEn="Facilities, weighing support, and trading assistance for multiple commodities."
              statMr="१५+ श्रेणी"
              statEn="15+ Categories"
              icon={Store}
              accentColor="purple"
              href="/services"
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          9. LATEST NOTICES & NEWS  — split layout
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-16 sm:py-20 border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

            {/* ── Notices ──────────────────────────────────── */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <SectionHeading
                  titleMr="नवीनतम सूचना"
                  titleEn="Latest Notices"
                  subtitleMr="बाजार समितीच्या अधिकृत सूचना"
                  subtitleEn="Official notices from the committee"
                  accentColor="amber"
                  icon={Bell}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-full font-semibold shrink-0"
                  asChild
                >
                  <Link href="/notices">
                    {t('सर्व पहा', 'View All')}
                    <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>

              <div className="space-y-4 flex-1">
                {loading ? (
                  <LoadingSpinner labelMr="सूचना लोड होत आहेत..." labelEn="Loading notices..." />
                ) : latestNotices.length > 0 ? (
                  latestNotices.map((notice) => (
                    <NoticeCard key={notice.id} notice={notice} compact />
                  ))
                ) : (
                  <div className="py-14 text-center text-gray-400 font-medium border border-dashed border-gray-200 rounded-2xl bg-white">
                    {t('सध्या कोणतीही नवीन सूचना नाही.', 'No new notices at the moment.')}
                  </div>
                )}
              </div>
            </div>

            {/* ── News / Updates ────────────────────────────── */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <SectionHeading
                  titleMr="ताज्या बातम्या"
                  titleEn="Latest News"
                  subtitleMr="बाजार आणि शेती क्षेत्रातील अपडेट"
                  subtitleEn="Updates from the market and agri sector"
                  accentColor="green"
                  icon={FileText}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-800 hover:bg-green-50 rounded-full font-semibold shrink-0"
                  asChild
                >
                  <Link href="/news">
                    {t('सर्व पहा', 'View All')}
                    <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>

              <div className="space-y-4 flex-1">
                {loading ? (
                  <LoadingSpinner labelMr="बातम्या लोड होत आहेत..." labelEn="Loading news..." />
                ) : latestNews.length > 0 ? (
                  latestNews.map((item) => {
                    const title   = language === 'mr' ? item.title_mr   : (item.title_en   || item.title_mr);
                    const excerpt = language === 'mr' ? item.excerpt_mr : (item.excerpt_en || item.excerpt_mr || item.content_mr);
                    return (
                      <Link key={item.id} href="/news">
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group border-l-4 border-l-emerald-600">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                              <FileText className="h-5 w-5 text-emerald-600" aria-hidden />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-green-800 transition-colors">
                                {title}
                              </h3>
                              {excerpt && (
                                <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                                  {excerpt}
                                </p>
                              )}
                              {item.published_at && (
                                <p className="text-xs text-gray-400 font-medium mt-2 flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                                  {formatDate(item.published_at, language)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  /* Placeholder news cards when DB is empty */
                  [
                    {
                      id: 'p1',
                      titleMr: 'खरीप हंगाम २०२५ — शेतकऱ्यांसाठी मार्गदर्शक माहिती जाहीर',
                      titleEn: 'Kharif Season 2025 — Guidance information released for farmers',
                      dateMr: 'मे २०, २०२५',
                      dateEn: 'May 20, 2025',
                    },
                    {
                      id: 'p2',
                      titleMr: 'डिजिटल बाजार माहिती — शेतकऱ्यांसाठी पारदर्शक दर माहिती',
                      titleEn: 'Digital Market Information — transparent rate updates for farmers',
                      dateMr: 'मे १५, २०२५',
                      dateEn: 'May 15, 2025',
                    },
                    {
                      id: 'p3',
                      titleMr: 'सोयाबीन उत्पादकांसाठी विशेष प्रशिक्षण शिबीर — नोंदणी सुरू',
                      titleEn: 'Special training camp for soybean growers — Registration open',
                      dateMr: 'मे १०, २०२५',
                      dateEn: 'May 10, 2025',
                    },
                  ].map((p) => (
                    <Link key={p.id} href="/news">
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group border-l-4 border-l-emerald-600">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                            <FileText className="h-5 w-5 text-emerald-600" aria-hidden />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-green-800 transition-colors">
                              {language === 'mr' ? p.titleMr : p.titleEn}
                            </h3>
                            <p className="text-xs text-gray-400 font-medium mt-2 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" aria-hidden />
                              {language === 'mr' ? p.dateMr : p.dateEn}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          10. GALLERY PREVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 sm:py-20 border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <SectionHeading
              titleMr="छायाचित्र दालन"
              titleEn="Photo Gallery"
              subtitleMr="मलकापूर बाजार समितीचे क्षण आणि उपक्रम."
              subtitleEn="Moments and initiatives of APMC Malkapur."
              accentColor="purple"
              icon={ImageIcon}
            />
            <Button
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 rounded-full font-semibold text-sm shrink-0 self-start sm:self-auto"
              asChild
            >
              <Link href="/gallery">
                {t('संपूर्ण दालन पहा', 'View Full Gallery')}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>

          {/* Gallery grid */}
          {loading ? (
            <LoadingSpinner labelMr="दालन लोड होत आहे..." labelEn="Loading gallery..." />
          ) : gallery.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {gallery.slice(0, 6).map((item, idx) => (
                <Link key={item.id} href="/gallery">
                  <div
                    className={`relative rounded-2xl overflow-hidden bg-gray-100 group cursor-pointer ${
                      idx === 0 ? 'row-span-2 col-span-1 sm:col-span-1' : ''
                    }`}
                    style={{ aspectRatio: idx === 0 ? '1 / 2' : '4 / 3' }}
                  >
                    <img
                      src={item.thumbnail_url || item.image_url}
                      alt={language === 'mr' ? (item.title_mr ?? '') : (item.title_en ?? item.title_mr ?? '')}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <p className="text-white text-sm font-semibold line-clamp-2">
                        {language === 'mr' ? (item.title_mr ?? '') : (item.title_en ?? item.title_mr ?? '')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Placeholder gallery grid when DB is empty */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: t('बाजार आवार', 'Market Yard'), color: 'from-green-700 to-emerald-800' },
                { label: t('बाजार सुविधा', 'Market Facilities'), color: 'from-blue-700 to-blue-800' },
                { label: t('शेतकरी उपक्रम', 'Farmer Initiative'), color: 'from-amber-600 to-amber-700' },
                { label: t('पारितोषिक वितरण', 'Award Ceremony'), color: 'from-purple-700 to-purple-800' },
                { label: t('प्रशिक्षण शिबीर', 'Training Camp'), color: 'from-teal-700 to-teal-800' },
                { label: t('कार्यालय दृश्य', 'Office View'), color: 'from-rose-700 to-rose-800' },
              ].map((tile, idx) => (
                <Link key={idx} href="/gallery">
                  <div
                    className={`relative rounded-2xl overflow-hidden group cursor-pointer bg-gradient-to-br ${tile.color} hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}
                    style={{ aspectRatio: '4 / 3' }}
                  >
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" aria-hidden />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                      <ImageIcon className="h-8 w-8 text-white/60" aria-hidden />
                      <p className="text-white text-sm font-bold text-center">{tile.label}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          11. CTA BAND — before footer
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-green-800 via-green-900 to-emerald-950 py-14 sm:py-16 border-t border-green-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]" aria-hidden />
        <div className="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            {t('शेतमाल विक्रीसाठी नोंदणी करा', 'Register to Sell Your Produce')}
          </h2>
          <p className="text-emerald-200 max-w-lg mx-auto text-base mb-8 leading-relaxed">
            {t(
              'मलकापूर बाजार समितीत नोंदणी करा आणि उपलब्ध सेवा व पारदर्शक बाजार व्यवस्थेचा लाभ घ्या.',
              'Register with APMC Malkapur and benefit from available services and transparent market support.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-600 text-green-950 font-bold border-0 shadow-md hover:-translate-y-0.5 transition-all"
              asChild
            >
              <Link href="/contact">
                {t('आत्ताच संपर्क करा', 'Contact Us Now')}
                <Phone className="ml-2 h-5 w-5" aria-hidden />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 text-white hover:bg-white/10 font-semibold hover:-translate-y-0.5 transition-all"
              asChild
            >
              <Link href="/market-rates">
                {t('आजचे भाव पहा', 'See Today\'s Rates')}
                <TrendingUp className="ml-2 h-5 w-5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
