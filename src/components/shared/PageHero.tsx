'use client';

import React, { ReactNode } from 'react';
import Breadcrumb, { BreadcrumbItem } from '@/components/shared/Breadcrumb';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PageHeroProps {
  titleMr: string;
  titleEn: string;
  subtitleMr?: string;
  subtitleEn?: string;
  /** Optional government badge text */
  badgeMr?: string;
  badgeEn?: string;
  /** Breadcrumb items after Home. Last item = current page (not linked). */
  breadcrumbs?: BreadcrumbItem[];
  /** Optional CTA buttons / extra content rendered below subtitle */
  children?: ReactNode;
  /** Extra classes on the outer <section> */
  className?: string;
  /** Extra classes on the inner content container (use to override padding) */
  contentClassName?: string;
  /** Whether to show the decorative dot-grid overlay */
  showDotGrid?: boolean;
}

/**
 * Reusable full-width page hero section used across all public pages.
 * Provides: gradient background, optional government badge, breadcrumb,
 * h1 title, subtitle, and an optional children slot for CTAs.
 */
export default function PageHero({
  titleMr,
  titleEn,
  subtitleMr,
  subtitleEn,
  badgeMr,
  badgeEn,
  breadcrumbs = [],
  children,
  className,
  contentClassName,
  showDotGrid = true,
}: PageHeroProps) {
  const { t } = useLanguage();

  return (
    <section
      className={cn(
        'relative bg-gradient-to-br from-green-950 via-green-900 to-emerald-950 text-white overflow-hidden',
        className
      )}
    >
      {/* Subtle agricultural texture overlay */}
      <div
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.07] mix-blend-overlay"
        aria-hidden
      />

      {/* Decorative dot-grid pattern */}
      {showDotGrid && (
        <div
          className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:18px_18px]"
          aria-hidden
        />
      )}

      {/* Decorative blobs */}
      <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" aria-hidden />
      <div className="absolute -left-24 -top-24 w-96 h-96 rounded-full bg-green-500/10 blur-3xl pointer-events-none" aria-hidden />

      {/* Content */}
      <div className={cn('container mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 sm:pt-12 sm:pb-18 lg:pt-14 lg:pb-20 relative z-10', contentClassName)}>

        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <div className="mb-5">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}

        {/* Government badge */}
        {(badgeMr || badgeEn) && (
          <div className="mb-5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/40 border border-emerald-500/20 text-xs font-semibold text-emerald-200 uppercase tracking-wider backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" aria-hidden />
              {t(badgeMr ?? '', badgeEn ?? '')}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl drop-shadow-sm">
          {t(titleMr, titleEn)}
        </h1>

        {/* Subtitle */}
        {(subtitleMr || subtitleEn) && (
          <p className="mt-4 text-sm sm:text-base md:text-lg text-emerald-100/90 max-w-2xl leading-relaxed">
            {t(subtitleMr ?? '', subtitleEn ?? '')}
          </p>
        )}

        {/* Optional CTA / extra content */}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
