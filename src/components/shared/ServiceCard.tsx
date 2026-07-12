'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccentColor = 'green' | 'blue' | 'amber' | 'rose' | 'purple' | 'teal';

interface ServiceCardProps {
  labelMr: string;
  labelEn: string;
  descMr?: string;
  descEn?: string;
  icon: LucideIcon;
  href: string;
  accentColor?: AccentColor;
  className?: string;
}

const colorMap: Record<AccentColor, {
  iconBg: string;
  iconText: string;
  hoverBorder: string;
  hoverShadow: string;
  dot: string;
}> = {
  green: {
    iconBg:       'bg-green-50',
    iconText:     'text-green-700',
    hoverBorder:  'hover:border-green-300',
    hoverShadow:  'hover:shadow-green-100',
    dot:          'bg-green-500',
  },
  blue: {
    iconBg:       'bg-blue-50',
    iconText:     'text-blue-700',
    hoverBorder:  'hover:border-blue-300',
    hoverShadow:  'hover:shadow-blue-100',
    dot:          'bg-blue-500',
  },
  amber: {
    iconBg:       'bg-amber-50',
    iconText:     'text-amber-700',
    hoverBorder:  'hover:border-amber-300',
    hoverShadow:  'hover:shadow-amber-100',
    dot:          'bg-amber-500',
  },
  rose: {
    iconBg:       'bg-rose-50',
    iconText:     'text-rose-700',
    hoverBorder:  'hover:border-rose-300',
    hoverShadow:  'hover:shadow-rose-100',
    dot:          'bg-rose-500',
  },
  purple: {
    iconBg:       'bg-purple-50',
    iconText:     'text-purple-700',
    hoverBorder:  'hover:border-purple-300',
    hoverShadow:  'hover:shadow-purple-100',
    dot:          'bg-purple-500',
  },
  teal: {
    iconBg:       'bg-teal-50',
    iconText:     'text-teal-700',
    hoverBorder:  'hover:border-teal-300',
    hoverShadow:  'hover:shadow-teal-100',
    dot:          'bg-teal-500',
  },
};

/**
 * Government-style quick service grid card.
 * Each card links to a major section of the portal.
 * Used in the Quick Services section on the homepage.
 */
export default function ServiceCard({
  labelMr,
  labelEn,
  descMr,
  descEn,
  icon: Icon,
  href,
  accentColor = 'green',
  className,
}: ServiceCardProps) {
  const { t } = useLanguage();
  const colors = colorMap[accentColor];

  return (
    <Link href={href} className={cn('block group', className)}>
      <div
        className={cn(
          'bg-white border border-gray-200 rounded-xl p-5 text-center',
          'transition-all duration-300',
          'hover:-translate-y-1.5 hover:shadow-lg',
          colors.hoverBorder,
          colors.hoverShadow,
          'flex flex-col items-center gap-3'
        )}
      >
        {/* Icon container */}
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center',
            'transition-all duration-300 group-hover:scale-110',
            colors.iconBg,
            colors.iconText
          )}
        >
          <Icon className="h-7 w-7" aria-hidden />
        </div>

        {/* Label */}
        <div>
          <p className="font-bold text-gray-900 text-sm leading-snug group-hover:text-gray-700 transition-colors">
            {t(labelMr, labelEn)}
          </p>
          {(descMr || descEn) && (
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              {t(descMr ?? '', descEn ?? '')}
            </p>
          )}
        </div>

        {/* Status dot */}
        <span className={cn('w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300', colors.dot)} aria-hidden />
      </div>
    </Link>
  );
}
