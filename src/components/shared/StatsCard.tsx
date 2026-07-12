'use client';

import React, { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccentColor = 'green' | 'blue' | 'amber' | 'rose';

interface StatsCardProps {
  labelMr: string;
  labelEn: string;
  value: string | number;
  subtextMr?: string;
  subtextEn?: string;
  icon: LucideIcon;
  accentColor?: AccentColor;
  /** Optional trend badge rendered next to value */
  trendBadge?: ReactNode;
  className?: string;
}

const colorMap: Record<AccentColor, {
  iconBg: string;
  iconText: string;
  iconHoverBg: string;
  iconHoverText: string;
  valueText: string;
}> = {
  green: {
    iconBg:       'bg-green-50',
    iconText:     'text-green-700',
    iconHoverBg:  'group-hover:bg-green-600',
    iconHoverText:'group-hover:text-white',
    valueText:    'text-green-700',
  },
  blue: {
    iconBg:       'bg-blue-50',
    iconText:     'text-blue-700',
    iconHoverBg:  'group-hover:bg-blue-600',
    iconHoverText:'group-hover:text-white',
    valueText:    'text-blue-700',
  },
  amber: {
    iconBg:       'bg-amber-50',
    iconText:     'text-amber-700',
    iconHoverBg:  'group-hover:bg-amber-600',
    iconHoverText:'group-hover:text-white',
    valueText:    'text-gray-900',
  },
  rose: {
    iconBg:       'bg-rose-50',
    iconText:     'text-rose-700',
    iconHoverBg:  'group-hover:bg-rose-600',
    iconHoverText:'group-hover:text-white',
    valueText:    'text-rose-600',
  },
};

/**
 * Reusable KPI / statistics card.
 * Used in market-rates page, admin dashboard, and homepage.
 */
export default function StatsCard({
  labelMr,
  labelEn,
  value,
  subtextMr,
  subtextEn,
  icon: Icon,
  accentColor = 'green',
  trendBadge,
  className,
}: StatsCardProps) {
  const { t } = useLanguage();
  const colors = colorMap[accentColor];

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-xl shadow-sm p-5',
        'hover:shadow-md hover:border-current/30 transition-all duration-300 group',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs sm:text-sm font-semibold text-gray-500 leading-tight">
          {t(labelMr, labelEn)}
        </span>
        <div
          className={cn(
            'p-2 rounded-lg transition-colors duration-200',
            colors.iconBg,
            colors.iconText,
            colors.iconHoverBg,
            colors.iconHoverText
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <div className={cn('text-xl sm:text-2xl font-extrabold leading-none break-words', colors.valueText)}>
          {value}
        </div>
        {trendBadge}
      </div>

      {(subtextMr || subtextEn) && (
        <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 leading-snug">
          {t(subtextMr ?? '', subtextEn ?? '')}
        </p>
      )}
    </div>
  );
}
