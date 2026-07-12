'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BreadcrumbItem {
  labelMr: string;
  labelEn: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Reusable breadcrumb navigation component.
 * Always prepends the "Home" root item automatically.
 */
export default function Breadcrumb({ items }: BreadcrumbProps) {
  const { t } = useLanguage();

  const allItems: BreadcrumbItem[] = [
    { labelMr: 'मुख्यपृष्ठ', labelEn: 'Home', href: '/' },
    ...items,
  ];

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm text-green-100/85 font-medium flex-wrap"
    >
      {allItems.map((item, idx) => {
        const isLast = idx === allItems.length - 1;
        const label = t(item.labelMr, item.labelEn);

        return (
          <React.Fragment key={idx}>
            {idx === 0 ? (
              item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </span>
              )
            ) : (
              <>
                <ChevronRight className="h-3.5 w-3.5 text-green-300/50 shrink-0" />
                {!isLast && item.href ? (
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-white font-semibold' : ''}>{label}</span>
                )}
              </>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
