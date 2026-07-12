'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/utils';
import { Notice } from '@/types';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoticeCardProps {
  notice: Notice;
  /** If true, truncates content to 2 lines (for dashboard previews) */
  compact?: boolean;
  className?: string;
}

/**
 * Reusable notice card used on the homepage dashboard and full notices page.
 * Important notices get a red left-border accent + animated pill badge.
 */
export default function NoticeCard({ notice, compact = false, className }: NoticeCardProps) {
  const { t, language } = useLanguage();

  const title   = language === 'mr' ? notice.title_mr   : (notice.title_en   || notice.title_mr);
  const content = language === 'mr' ? notice.content_mr : (notice.content_en || notice.content_mr);

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden bg-white transition-all duration-300',
        'hover:shadow-md hover:-translate-y-0.5',
        notice.is_important
          ? 'border-l-4 border-l-red-500 border-r border-t border-b border-gray-100 bg-red-50/10'
          : 'border-l-4 border-l-emerald-600 border-r border-t border-b border-gray-100',
        className
      )}
    >
      <div className="px-5 sm:px-6 pt-5 pb-2">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug flex-1">
            {title}
          </h3>
          {notice.is_important && (
            <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm animate-pulse shrink-0">
              {t('महत्वाचे', 'Important')}
            </span>
          )}
        </div>

        {notice.published_at && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mt-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" aria-hidden />
            <span>{formatDate(notice.published_at, language)}</span>
          </div>
        )}
      </div>

      <div className="px-5 sm:px-6 pb-5 pt-2">
        <p className={cn('text-sm text-gray-600 leading-relaxed', compact && 'line-clamp-2')}>
          {content}
        </p>
      </div>
    </div>
  );
}
