'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoadingSpinnerProps {
  labelMr?: string;
  labelEn?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable centered loading spinner with optional Marathi/English label.
 */
export default function LoadingSpinner({
  labelMr = 'माहिती लोड होत आहे...',
  labelEn = 'Loading...',
  size = 'md',
}: LoadingSpinnerProps) {
  const { t } = useLanguage();

  const sizeMap = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-4',
    lg: 'h-14 w-14 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div
        className={`${sizeMap[size]} border-green-600 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label={t(labelMr, labelEn)}
      />
      <p className="text-gray-500 font-medium text-sm">{t(labelMr, labelEn)}</p>
    </div>
  );
}
