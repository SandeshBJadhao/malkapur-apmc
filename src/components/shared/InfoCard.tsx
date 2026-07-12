'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccentColor = 'green' | 'blue' | 'amber';

interface InfoCardProps {
  titleMr: string;
  titleEn: string;
  descMr: string;
  descEn: string;
  linkHref: string;
  linkLabelMr: string;
  linkLabelEn: string;
  icon: LucideIcon;
  accentColor?: AccentColor;
  /** Extra classes on the card wrapper */
  className?: string;
}

const colorMap: Record<AccentColor, {
  border: string;
  iconBg: string;
  iconText: string;
  iconHoverBg: string;
  titleText: string;
  linkText: string;
  linkHover: string;
}> = {
  green: {
    border:       'bg-emerald-600',
    iconBg:       'bg-emerald-50',
    iconText:     'text-emerald-600',
    iconHoverBg:  'group-hover:bg-emerald-100',
    titleText:    'text-emerald-950',
    linkText:     'text-emerald-700',
    linkHover:    'hover:text-emerald-800',
  },
  blue: {
    border:       'bg-blue-600',
    iconBg:       'bg-blue-50',
    iconText:     'text-blue-600',
    iconHoverBg:  'group-hover:bg-blue-100',
    titleText:    'text-blue-950',
    linkText:     'text-blue-700',
    linkHover:    'hover:text-blue-800',
  },
  amber: {
    border:       'bg-amber-500',
    iconBg:       'bg-amber-50',
    iconText:     'text-amber-600',
    iconHoverBg:  'group-hover:bg-amber-100',
    titleText:    'text-amber-950',
    linkText:     'text-amber-700',
    linkHover:    'hover:text-amber-800',
  },
};

/**
 * Quick-access info card used on the homepage and wherever
 * a "feature highlight + CTA link" pattern is needed.
 *
 * Includes: top accent border, circular icon badge, description, arrow link.
 */
export default function InfoCard({
  titleMr,
  titleEn,
  descMr,
  descEn,
  linkHref,
  linkLabelMr,
  linkLabelEn,
  icon: Icon,
  accentColor = 'green',
  className,
}: InfoCardProps) {
  const { t } = useLanguage();
  const colors = colorMap[accentColor];

  return (
    <div
      className={cn(
        'bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm',
        'hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 group flex flex-col',
        className
      )}
    >
      {/* Accent top bar */}
      <div className={cn('h-[5px] w-full shrink-0', colors.border)} aria-hidden />

      <div className="flex flex-row items-center justify-between px-6 pt-6 pb-2">
        <h3 className={cn('text-lg font-bold leading-snug', colors.titleText)}>
          {t(titleMr, titleEn)}
        </h3>
        <div className={cn('p-2.5 rounded-full transition-colors duration-300 shrink-0', colors.iconBg, colors.iconText, colors.iconHoverBg)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>

      <div className="px-6 pb-6 flex-1 flex flex-col justify-between gap-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          {t(descMr, descEn)}
        </p>
        <Link
          href={linkHref}
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-bold transition-colors duration-200 group/link',
            colors.linkText,
            colors.linkHover
          )}
        >
          {t(linkLabelMr, linkLabelEn)}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
