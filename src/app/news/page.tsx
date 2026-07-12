'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHero, SectionHeading } from '@/components/shared';
import { Calendar, Tag, ArrowRight, Newspaper, X, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface NewsItem {
  id: string;
  titleMr: string;
  titleEn: string;
  date: string;
  categoryMr: string;
  categoryEn: string;
  summaryMr: string;
  summaryEn: string;
  bodyMr: string;
  bodyEn: string;
  imageUrl: string;
  author?: string;
}

const CATEGORIES = [
  { key: 'all',             labelMr: 'सर्व बातम्या',      labelEn: 'All News' },
  { key: 'market_update',   labelMr: 'बाजार अपडेट',      labelEn: 'Market Update' },
  { key: 'agri_training',   labelMr: 'कृषी शिक्षण',      labelEn: 'Agri Training' },
  { key: 'govt_scheme',     labelMr: 'शासकीय योजना',     labelEn: 'Govt Schemes' },
  { key: 'arrivals_report', labelMr: 'आवक वृत्त',        labelEn: 'Arrivals Report' },
  { key: 'other',           labelMr: 'इतर घडामोडी',       labelEn: 'Other Updates' },
];

const CAT_LABELS: Record<string, { mr: string; en: string }> = {
  market_update:   { mr: 'बाजार अपडेट',  en: 'Market Update' },
  agri_training:   { mr: 'कृषी शिक्षण',  en: 'Agri Training' },
  govt_scheme:     { mr: 'शासकीय योजना', en: 'Govt Schemes' },
  arrivals_report: { mr: 'आवक वृत्त',   en: 'Arrivals Report' },
  other:           { mr: 'इतर घडामोडी',  en: 'Other Updates' },
};

export default function NewsPage() {
  const { t, language } = useLanguage();
  const [activeNews, setActiveNews] = useState<NewsItem | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const supabase = createClient();

  useEffect(() => {
    async function fetchNews() {
      try {
        const { data, error } = await supabase
          .from('news_items')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setNewsItems(
            data.map((item) => {
              const catLabels = CAT_LABELS[item.category] || { mr: 'इतर', en: 'Other' };
              return {
                id: item.id,
                titleMr: item.title_mr,
                titleEn: item.title_en || item.title_mr,
                date: item.published_at ? new Date(item.published_at).toISOString().split('T')[0] : '',
                categoryMr: catLabels.mr,
                categoryEn: catLabels.en,
                summaryMr: item.excerpt_mr || item.content_mr.slice(0, 150),
                summaryEn: item.excerpt_en || (item.content_en || item.content_mr).slice(0, 150),
                bodyMr: item.content_mr,
                bodyEn: item.content_en || item.content_mr,
                imageUrl: item.cover_image_url || 'https://images.unsplash.com/photo-1598986646512-93d5be8c0ed4?q=80&w=1200&auto=format&fit=crop',
                author: item.author || 'APMC Admin',
              };
            })
          );
        }
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, [supabase]);

  // Filter based on activeCategory
  const filteredNews = activeCategory === 'all'
    ? newsItems
    : newsItems.filter((item) => {
        const catObj = CATEGORIES.find(c => c.key === activeCategory);
        return item.categoryEn === catObj?.labelEn;
      });

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = activeNews ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeNews]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveNews(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="bg-gray-50/50 min-h-screen pb-16">
      <PageHero
        titleMr="बातम्या व घडामोडी"
        titleEn="News & Updates"
        subtitleMr="बाजार समितीचे परिपत्रक, नवीन योजना, उपक्रम आणि शेती जगतातील महत्त्वपूर्ण बातम्या."
        subtitleEn="Mandi announcements, developmental initiatives, government schemes, and agricultural updates."
        breadcrumbs={[{ labelMr: 'बातम्या', labelEn: 'News' }]}
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200/60 pb-6">
          <SectionHeading
            titleMr="ताजी वृत्त व घडामोडी"
            titleEn="Latest Mandi News"
            subtitleMr="शेतकऱ्यांच्या माहितीसाठी महत्त्वपूर्ण अपडेट्स"
            subtitleEn="Stay informed with agricultural news and local market highlights"
            icon={Newspaper}
            className="pl-0 border-l-0"
          />

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  'px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-all duration-200 active:scale-95 cursor-pointer',
                  activeCategory === cat.key
                    ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                {t(cat.labelMr, cat.labelEn)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700" />
            <p className="text-gray-500 font-semibold">{t('बातम्या लोड होत आहेत...', 'Loading articles...')}</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="py-24 text-center text-gray-400 text-lg font-medium border border-dashed rounded-xl bg-white">
            {t('कोणतीही बातमी उपलब्ध नाही.', 'No news articles available in this category.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNews.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300 flex flex-col group rounded-xl"
              >
                {/* Image Column */}
                <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={language === 'mr' ? item.titleMr : item.titleEn}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Content Column */}
                <CardContent className="p-6 flex flex-col justify-between flex-grow space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {item.date}
                      </span>
                      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        <Tag className="h-3 w-3" />
                        {language === 'mr' ? item.categoryMr : item.categoryEn}
                      </span>
                      {item.author && (
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          {item.author}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-800 transition-colors leading-snug line-clamp-2">
                      {language === 'mr' ? item.titleMr : item.titleEn}
                    </h3>

                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                      {language === 'mr' ? item.summaryMr : item.summaryEn}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <button
                      id={`news-read-more-${item.id}`}
                      onClick={() => setActiveNews(item)}
                      className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer group/btn"
                      aria-label={`Read full article: ${language === 'mr' ? item.titleMr : item.titleEn}`}
                    >
                      {t('अधिक वाचा', 'Read Full Article')}
                      <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Article Modal ─────────────────────────────────────────────────────── */}
      {activeNews && (
        <div
          id="news-article-modal"
          role="dialog"
          aria-modal="true"
          aria-label={language === 'mr' ? activeNews.titleMr : activeNews.titleEn}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setActiveNews(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image */}
            <div className="relative w-full h-56 sm:h-72 bg-gray-100 overflow-hidden rounded-t-2xl">
              <Image
                src={activeNews.imageUrl}
                alt={language === 'mr' ? activeNews.titleMr : activeNews.titleEn}
                fill
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Category badge over image */}
              <span className="absolute bottom-4 left-5 inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-700/90 px-3 py-1 rounded-full backdrop-blur-sm">
                <Tag className="h-3 w-3" />
                {language === 'mr' ? activeNews.categoryMr : activeNews.categoryEn}
              </span>

              {/* Close button */}
              <button
                id="news-modal-close"
                onClick={() => setActiveNews(null)}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors cursor-pointer backdrop-blur-sm"
                aria-label="Close article"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 text-xs text-gray-400 font-semibold">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{activeNews.date}</span>
                {activeNews.author && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{activeNews.author}</span>}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
                {language === 'mr' ? activeNews.titleMr : activeNews.titleEn}
              </h2>

              <p className="text-sm text-blue-900 font-semibold bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 leading-relaxed">
                {language === 'mr' ? activeNews.summaryMr : activeNews.summaryEn}
              </p>

              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {language === 'mr' ? activeNews.bodyMr : activeNews.bodyEn}
              </p>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  id="news-modal-close-bottom"
                  onClick={() => setActiveNews(null)}
                  className="px-5 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  {t('बंद करा', 'Close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease; }
      `}</style>
    </div>
  );
}
