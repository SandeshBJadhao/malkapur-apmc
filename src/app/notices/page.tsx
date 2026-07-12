'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Notice } from '@/types';
import { PageHero, NoticeCard, LoadingSpinner } from '@/components/shared';
import { cn } from '@/lib/utils';
import { FileDown, Calendar, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { key: 'all',       labelMr: 'सर्व सूचना',    labelEn: 'All Notices' },
  { key: 'general',   labelMr: 'सर्वसाधारण',    labelEn: 'General' },
  { key: 'important', labelMr: 'महत्त्वपूर्ण',   labelEn: 'Important' },
  { key: 'tender',    labelMr: 'निविदा',        labelEn: 'Tenders' },
  { key: 'meeting',   labelMr: 'बैठक',          labelEn: 'Meetings' },
  { key: 'holiday',   labelMr: 'सुट्टी',         labelEn: 'Holidays' },
];

export default function NoticesPage() {
  const { t, language } = useLanguage();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const supabase = createClient();

  useEffect(() => {
    async function fetchNotices() {
      try {
        const { data, error } = await supabase
          .from('notices')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false });

        if (error) throw error;

        if (data) {
          // Filter out expired notices
          const activeNotices = data.filter((notice) => {
            if (!notice.expires_at) return true;
            return new Date(notice.expires_at) >= new Date();
          });
          setNotices(activeNotices);
        }
      } catch (error) {
        console.error('Error fetching notices:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotices();
  }, [supabase]);

  const filteredNotices = activeCategory === 'all'
    ? notices
    : notices.filter((n) => n.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PageHero
        titleMr="परिपत्रके व सूचना"
        titleEn="Notices & Circulars"
        subtitleMr="बाजार समितीचे महत्वाचे निर्णय आणि अधिकृत सूचना."
        subtitleEn="Important decisions and official notices from the Market Committee."
        breadcrumbs={[{ labelMr: 'परिपत्रके व सूचना', labelEn: 'Notices' }]}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl space-y-8">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-b pb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                'px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-all cursor-pointer',
                activeCategory === cat.key
                  ? 'bg-green-750 bg-green-700 text-white border-green-700 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              {t(cat.labelMr, cat.labelEn)}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner
            labelMr="सूचना लोड होत आहेत..."
            labelEn="Loading notices..."
          />
        ) : filteredNotices.length > 0 ? (
          <div className="space-y-6">
            {filteredNotices.map((notice) => {
              const title = language === 'mr' ? notice.title_mr : (notice.title_en || notice.title_mr);
              const content = language === 'mr' ? notice.content_mr : (notice.content_en || notice.content_mr);

              return (
                <div
                  key={notice.id}
                  className={cn(
                    'rounded-xl border overflow-hidden bg-white transition-all duration-300 shadow-sm hover:shadow-md',
                    notice.is_important
                      ? 'border-l-4 border-l-red-500 border-r border-t border-b border-red-100 bg-red-50/5'
                      : 'border-l-4 border-l-emerald-600 border-r border-t border-b border-gray-100'
                  )}
                >
                  <div className="px-5 sm:px-6 pt-5 pb-2">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug flex-1">
                        {title}
                      </h3>
                      {notice.is_important && (
                        <span className="bg-red-550 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm animate-pulse shrink-0 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {t('महत्वाचे', 'Important')}
                        </span>
                      )}
                    </div>

                    {notice.published_at && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mt-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span>
                          {new Date(notice.published_at).toLocaleDateString(language === 'mr' ? 'mr-IN' : 'en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="px-5 sm:px-6 pb-5 pt-2 space-y-4">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {content}
                    </p>

                    {notice.attachment_url && (
                      <div className="pt-3 border-t border-gray-50 flex">
                        <a
                          href={notice.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-all border border-green-200"
                        >
                          <FileDown className="h-4 w-4" />
                          {t('अधिकृत दस्तऐवज डाउनलोड करा', 'Download Official Document')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 font-medium border border-dashed border-gray-200 rounded-xl bg-white">
            {t('सध्या कोणतीही नवीन सूचना नाही.', 'No notices available in this category.')}
          </div>
        )}
      </div>
    </div>
  );
}
