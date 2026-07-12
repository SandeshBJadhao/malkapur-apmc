'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Megaphone } from 'lucide-react';

export interface TickerItem {
  id: string;
  textMr: string;
  textEn: string;
  type?: 'notice' | 'update' | 'alert';
}

interface AnnouncementTickerProps {
  items: TickerItem[];
}

const typeBadge: Record<NonNullable<TickerItem['type']>, { label: string; cls: string }> = {
  notice:  { label: 'सूचना',    cls: 'bg-amber-500/20 text-amber-200 border border-amber-500/30' },
  update:  { label: 'अपडेट',   cls: 'bg-green-500/20 text-green-200 border border-green-500/30' },
  alert:   { label: 'महत्वाचे', cls: 'bg-red-500/20 text-red-200 border border-red-500/30' },
};

/**
 * Full-width scrolling announcement ticker.
 * Placed immediately below the PageHero on the homepage.
 * Uses the apmc-ticker-track CSS class (defined in globals.css) for smooth infinite scroll.
 */
export default function AnnouncementTicker({ items }: AnnouncementTickerProps) {
  const { language } = useLanguage();

  if (!items || items.length === 0) return null;

  // Duplicate items to create a seamless loop
  const doubled = [...items, ...items];

  return (
    <div
      className="bg-green-950 border-b border-green-800/60 overflow-hidden relative"
      aria-label="Live announcements ticker"
    >
      {/* Left label badge */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center pr-6 pl-3 bg-gradient-to-r from-green-950 via-green-950 to-transparent pointer-events-none">
        <span className="flex items-center gap-2 bg-amber-500 text-green-950 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow whitespace-nowrap">
          <Megaphone className="h-3.5 w-3.5" aria-hidden />
          {language === 'mr' ? 'जाहीर सूचना' : 'Live Updates'}
        </span>
      </div>

      {/* Gradient fade on the right */}
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-green-950 to-transparent pointer-events-none"
        aria-hidden
      />

      {/* Ticker track — uses apmc-ticker-track from globals.css */}
      <div className="flex overflow-hidden py-2.5 pl-44">
        <div className="apmc-ticker-track whitespace-nowrap">
          {doubled.map((item, idx) => {
            const badge = typeBadge[item.type ?? 'update'];
            return (
              <span key={`${item.id}-${idx}`} className="inline-flex items-center gap-2.5 px-6">
                <span className="text-green-600 text-lg font-bold" aria-hidden>•</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.cls}`}>
                  {badge.label}
                </span>
                <span className="text-green-100 text-sm font-medium">
                  {language === 'mr' ? item.textMr : item.textEn}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
