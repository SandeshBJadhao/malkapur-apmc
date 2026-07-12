'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type AccentColor = 'green' | 'blue' | 'amber' | 'rose' | 'purple';

interface SectionHeadingProps {
  titleMr: string;
  titleEn: string;
  subtitleMr?: string;
  subtitleEn?: string;
  /** Optional Lucide icon rendered before the title */
  icon?: LucideIcon;
  /** Accent color for the left border indicator */
  accentColor?: AccentColor;
  /** Extra classes for the wrapper div */
  className?: string;
}

const accentBorderMap: Record<AccentColor, string> = {
  green:  'border-l-4 border-green-600',
  blue:   'border-l-4 border-blue-600',
  amber:  'border-l-4 border-amber-500',
  rose:   'border-l-4 border-rose-500',
  purple: 'border-l-4 border-purple-600',
};

const accentIconMap: Record<AccentColor, string> = {
  green:  'text-green-700',
  blue:   'text-blue-700',
  amber:  'text-amber-600',
  rose:   'text-rose-600',
  purple: 'text-purple-700',
};

/**
 * Standardised section heading with left-border accent, optional icon and subtitle.
 * Replaces 17+ copy-pasted section header divs across the project.
 */
export default function SectionHeading({
  titleMr,
  titleEn,
  subtitleMr,
  subtitleEn,
  icon: Icon,
  accentColor = 'green',
  className,
}: SectionHeadingProps) {
  const { t } = useLanguage();

  return (
    <div className={cn('pl-4', accentBorderMap[accentColor], className)}>
      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5 leading-tight">
        {Icon && (
          <Icon className={cn('h-6 w-6 shrink-0', accentIconMap[accentColor])} aria-hidden />
        )}
        {t(titleMr, titleEn)}
      </h2>
      {(subtitleMr || subtitleEn) && (
        <p className="text-gray-500 mt-1.5 text-sm md:text-base leading-relaxed">
          {t(subtitleMr ?? '', subtitleEn ?? '')}
        </p>
      )}
    </div>
  );
}
