'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CommitteeMember } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Calendar, MapPin, User, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  member: CommitteeMember;
  /**
   * 'leadership' — large card with contact details (सभापती, उपसभापती, सचिव)
   * 'board'      — compact card with village info only
   */
  variant?: 'leadership' | 'board';
  className?: string;
}

/**
 * Reusable profile card for committee members.
 * Handles both the large leadership variant and the compact board member variant.
 */
export default function ProfileCard({ member, variant = 'leadership', className }: ProfileCardProps) {
  const { t, language } = useLanguage();

  const name        = language === 'mr' ? member.name_mr        : member.name_en;
  const designation = language === 'mr' ? member.designation_mr : member.designation_en;
  const village     = language === 'mr' ? (member.village_mr ?? '') : (member.village_en ?? '');

  /* ── BOARD VARIANT (compact) ─────────────────────────────── */
  if (variant === 'board') {
    return (
      <div
        className={cn(
          'bg-white border border-gray-100 rounded-xl p-5 shadow-sm',
          'hover:shadow-md hover:border-green-200 hover:-translate-y-1 transition-all duration-300 group',
          'flex flex-col items-center text-center space-y-4',
          className
        )}
      >
        <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center border border-green-100 group-hover:bg-green-100/50 transition-colors shadow-inner overflow-hidden relative shrink-0">
          {member.image_url ? (
            <img src={member.image_url} alt={name} className="object-cover w-full h-full" />
          ) : (
            <User className="h-8 w-8 text-green-700/80" aria-hidden />
          )}
        </div>

        <div className="space-y-1.5 flex-grow">
          <Badge className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-100 text-[10px] px-2 py-0 font-bold rounded-md uppercase tracking-wider">
            {designation}
          </Badge>
          <h3 className="font-bold text-gray-900 group-hover:text-green-800 transition-colors text-base leading-tight">
            {name}
          </h3>
        </div>

        {village && (
          <div className="w-full pt-3 border-t border-gray-50 flex items-start justify-center gap-1.5 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" aria-hidden />
            <span className="font-medium">{village}</span>
          </div>
        )}
      </div>
    );
  }

  /* ── LEADERSHIP VARIANT (full card) ──────────────────────── */
  return (
    <div
      className={cn(
        'bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm',
        'hover:shadow-md hover:border-green-200 transition-all duration-300 group flex flex-col',
        className
      )}
    >
      {/* Accent strip */}
      <div className="h-2 bg-gradient-to-r from-green-700 to-emerald-600 w-full shrink-0" aria-hidden />

      {/* Avatar + name block */}
      <div className="flex flex-col items-center pt-8 pb-4 px-6">
        <div className="relative mb-4 group-hover:scale-105 transition-transform duration-300">
          <div className="h-28 w-28 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center border-4 border-white shadow-inner group-hover:border-green-50 overflow-hidden relative">
            {member.image_url ? (
              <img src={member.image_url} alt={name} className="object-cover w-full h-full" />
            ) : (
              <User className="h-14 w-14 text-green-700/80" aria-hidden />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-green-600 text-white p-2 rounded-full shadow-md z-10">
            <UserCheck className="h-4 w-4" aria-hidden />
          </div>
        </div>

        <div className="text-center space-y-1">
          <Badge className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-bold px-3 py-0.5 text-xs rounded-full">
            {designation}
          </Badge>
          <h3 className="text-lg md:text-xl font-bold text-gray-950 group-hover:text-green-800 transition-colors pt-2 leading-snug">
            {name}
          </h3>
        </div>
      </div>

      {/* Detail rows */}
      <div className="px-6 pb-8 pt-2 flex-grow space-y-4 text-sm text-gray-600 border-t border-gray-50 bg-gray-50/20">
        {(member.term_start || member.term_end) && (
          <div className="flex items-center gap-3 py-1">
            <div className="p-2 bg-green-100/60 rounded-lg text-green-700 shrink-0">
              <Calendar className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">
                {t('कालावधी', 'Tenure')}
              </span>
              <span className="font-semibold text-gray-800">
                {member.term_start}
                {member.term_end
                  ? ` – ${member.term_end === 'Present' ? t('वर्तमान', 'Present') : member.term_end}`
                  : ''}
              </span>
            </div>
          </div>
        )}

        {member.phone && (
          <div className="flex items-center gap-3 py-1">
            <div className="p-2 bg-green-100/60 rounded-lg text-green-700 shrink-0">
              <Phone className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">
                {t('संपर्क', 'Contact')}
              </span>
              <a href={`tel:${member.phone}`} className="font-semibold text-gray-800 hover:text-green-600 transition-colors">
                {member.phone}
              </a>
            </div>
          </div>
        )}

        {member.email && (
          <div className="flex items-center gap-3 py-1">
            <div className="p-2 bg-green-100/60 rounded-lg text-green-700 shrink-0">
              <Mail className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium uppercase tracking-wider">
                {t('ईमेल', 'Email')}
              </span>
              <a href={`mailto:${member.email}`} className="font-semibold text-gray-800 hover:text-green-600 transition-colors break-all">
                {member.email}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
