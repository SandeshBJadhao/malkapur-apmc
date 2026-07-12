'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccentColor = 'green' | 'blue' | 'amber' | 'rose' | 'purple';

interface MarketCardProps {
  titleMr: string;
  titleEn: string;
  descMr: string;
  descEn: string;
  statMr: string;   // e.g. "५२ वस्तू"
  statEn: string;   // e.g. "52 Commodities"
  icon: LucideIcon;
  accentColor?: AccentColor;
  href?: string;
  className?: string;
}

const colorMap: Record<AccentColor, {
  gradient: string;
  iconBg: string;
  iconText: string;
  statText: string;
  badge: string;
}> = {
  green: {
    gradient: 'from-green-600 to-emerald-700',
    iconBg:   'bg-white/20',
    iconText: 'text-white',
    statText: 'text-green-100',
    badge:    'bg-green-900/30 text-green-100 border-green-700/30',
  },
  blue: {
    gradient: 'from-blue-600 to-blue-700',
    iconBg:   'bg-white/20',
    iconText: 'text-white',
    statText: 'text-blue-100',
    badge:    'bg-blue-900/30 text-blue-100 border-blue-700/30',
  },
  amber: {
    gradient: 'from-amber-500 to-amber-600',
    iconBg:   'bg-white/20',
    iconText: 'text-white',
    statText: 'text-amber-100',
    badge:    'bg-amber-900/20 text-amber-100 border-amber-700/30',
  },
  rose: {
    gradient: 'from-rose-600 to-rose-700',
    iconBg:   'bg-white/20',
    iconText: 'text-white',
    statText: 'text-rose-100',
    badge:    'bg-rose-900/30 text-rose-100 border-rose-700/30',
  },
  purple: {
    gradient: 'from-purple-600 to-purple-700',
    iconBg:   'bg-white/20',
    iconText: 'text-white',
    statText: 'text-purple-100',
    badge:    'bg-purple-900/30 text-purple-100 border-purple-700/30',
  },
};

/**
 * Featured market section card.
 * Used on the homepage to showcase the different market yards.
 */
export default function MarketCard({
  titleMr,
  titleEn,
  descMr,
  descEn,
  statMr,
  statEn,
  icon: Icon,
  accentColor = 'green',
  href,
  className,
}: MarketCardProps) {
  const { t } = useLanguage();
  const colors = colorMap[accentColor];

  const content = (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden group cursor-pointer',
        'transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl shadow-md',
        className
      )}
    >
      {/* Gradient background */}
      <div className={cn('absolute inset-0 bg-gradient-to-br', colors.gradient)} aria-hidden />

      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden
      />

      {/* Decorative blob */}
      <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" aria-hidden />

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Icon */}
        <div className={cn('inline-flex p-3.5 rounded-xl mb-4', colors.iconBg)}>
          <Icon className={cn('h-6 w-6', colors.iconText)} aria-hidden />
        </div>

        {/* Title */}
        <h3 className="text-xl font-extrabold text-white leading-snug mb-1">
          {t(titleMr, titleEn)}
        </h3>

        {/* Desc */}
        <p className={cn('text-sm leading-relaxed mb-4 opacity-90', colors.statText)}>
          {t(descMr, descEn)}
        </p>

        {/* Stat badge */}
        <div className="flex items-center justify-between">
          <span className={cn(
            'text-xs font-bold px-3 py-1 rounded-full border',
            colors.badge
          )}>
            {t(statMr, statEn)}
          </span>
          <div className="text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-200">
            <ArrowRight className="h-5 w-5" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
