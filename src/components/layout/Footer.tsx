'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  MapPin, Phone, Mail, Clock,
  TrendingUp, Calendar, Bell, Image as ImageIcon,
  Newspaper, Users, Globe, Video,
  MessageCircle, ExternalLink,
} from 'lucide-react';

const quickLinks = [
  { href: '/market-rates',      labelMr: 'आजचे बाजार भाव',    labelEn: "Today's Market Rates",   icon: TrendingUp },
  { href: '/services',          labelMr: 'सेवा',              labelEn: 'Services',                icon: Calendar },
  { href: '/initiatives',       labelMr: 'उपक्रम',            labelEn: 'Initiatives',             icon: Globe },
  { href: '/notices',           labelMr: 'परिपत्रके व सूचना', labelEn: 'Circulars & Notices',     icon: Bell },
  { href: '/news',              labelMr: 'बातम्या',            labelEn: 'News & Updates',          icon: Newspaper },
  { href: '/gallery',           labelMr: 'दालन (Gallery)',     labelEn: 'Photo Gallery',           icon: ImageIcon },
  { href: '/sanchalak-mandal',  labelMr: 'संचालक मंडळ',       labelEn: 'Committee Members',       icon: Users },
  { href: '/about',             labelMr: 'बाजार समितीबद्दल',  labelEn: 'About APMC',              icon: ExternalLink },
  { href: '/contact',           labelMr: 'संपर्क साधा',        labelEn: 'Contact Us',              icon: Phone },
];

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-green-950 text-white">
      {/* Top gradient accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-green-600 via-amber-500 to-green-600" aria-hidden />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* ── Col 1: Branding + About ─────────────────────── */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-white p-1.5 rounded-full shrink-0 shadow-md">
                <Image
                  src="/logo.png"
                  alt="APMC Malkapur Logo"
                  width={52}
                  height={52}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white leading-tight">
                  {t('कृषी उत्पन्न बाजार समिती', 'APMC Malkapur')}
                </h3>
                <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                  {t('मलकापूर, जि. बुलढाणा', 'Malkapur, Dist. Buldhana')}
                </p>
              </div>
            </div>

            <p className="text-green-200/80 text-sm leading-relaxed mb-6">
              {t(
                'शेतकऱ्यांच्या आर्थिक प्रगतीसाठी आणि शेतमालाला योग्य भाव मिळवून देण्यासाठी आम्ही कटिबद्ध आहोत.',
                'We are committed to the economic progress of farmers and ensuring fair prices for their agricultural produce.'
              )}
            </p>

            {/* Government badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-900/50 border border-green-800 mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" aria-hidden />
              <span className="text-[10px] text-green-300 font-semibold uppercase tracking-wider">
                {t('महाराष्ट्र शासनाचा उपक्रम', 'Govt. of Maharashtra Initiative')}
              </span>
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-green-900 hover:bg-blue-600 border border-green-800 hover:border-blue-600 flex items-center justify-center transition-all duration-200 group"
              >
                <Globe className="h-4 w-4 text-green-300 group-hover:text-white" aria-hidden />
              </a>
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-green-900 hover:bg-red-600 border border-green-800 hover:border-red-600 flex items-center justify-center transition-all duration-200 group"
              >
                <Video className="h-4 w-4 text-green-300 group-hover:text-white" aria-hidden />
              </a>
              <a
                href="https://wa.me"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-green-900 hover:bg-green-500 border border-green-800 hover:border-green-500 flex items-center justify-center transition-all duration-200 group"
              >
                <MessageCircle className="h-4 w-4 text-green-300 group-hover:text-white" aria-hidden />
              </a>
            </div>
          </div>

          {/* ── Col 2: Quick Links ───────────────────────────── */}
          <div>
            <h4 className="text-sm font-extrabold text-white uppercase tracking-widest mb-5 border-b border-green-800 pb-2">
              {t('महत्वाच्या लिंक्स', 'Quick Links')}
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2.5 text-sm text-green-200/80 hover:text-amber-400 transition-colors duration-200 group"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-green-600 group-hover:text-amber-500 transition-colors" aria-hidden />
                      {t(link.labelMr, link.labelEn)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Col 3: Market Info ───────────────────────────── */}
          <div>
            <h4 className="text-sm font-extrabold text-white uppercase tracking-widest mb-5 border-b border-green-800 pb-2">
              {t('बाजार माहिती', 'Market Information')}
            </h4>
            <ul className="space-y-3 text-sm text-green-200/80">
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-green-500 mt-0.5" aria-hidden />
                <div>
                  <p className="text-white font-semibold text-[11px] uppercase tracking-wider mb-0.5">
                    {t('बाजार वेळ', 'Market Hours')}
                  </p>
                  <p>{t('सोमवार – शनिवार', 'Monday – Saturday')}</p>
                  <p className="font-semibold text-amber-400">
                    {t('सकाळी ७:०० – दुपारी ३:००', '7:00 AM – 3:00 PM')}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-green-500 mt-0.5" aria-hidden />
                <div>
                  <p className="text-white font-semibold text-[11px] uppercase tracking-wider mb-0.5">
                    {t('कार्यालय वेळ', 'Office Hours')}
                  </p>
                  <p>{t('सोमवार – शुक्रवार', 'Monday – Friday')}</p>
                  <p className="font-semibold text-amber-400">
                    {t('सकाळी १०:०० – सायंकाळी ५:३०', '10:00 AM – 5:30 PM')}
                  </p>
                </div>
              </li>
              <li className="pt-2 border-t border-green-900">
                <p className="text-white font-semibold text-[11px] uppercase tracking-wider mb-1.5">
                  {t('मुख्य बाजार आवार', 'Main Market Yards')}
                </p>
                <ul className="space-y-1 text-xs">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden />
                    {t('मुख्य धान्य बाजार', 'Main Grain Market')}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden />
                    {t('फळ बाजार', 'Fruit Market')}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden />
                    {t('भाजीपाला बाजार', 'Vegetable Market')}
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          {/* ── Col 4: Contact Info ──────────────────────────── */}
          <div>
            <h4 className="text-sm font-extrabold text-white uppercase tracking-widest mb-5 border-b border-green-800 pb-2">
              {t('संपर्क माहिती', 'Contact Information')}
            </h4>
            <ul className="space-y-4 text-sm text-green-200/80">
              <li className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-green-900 border border-green-800 shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-amber-400" aria-hidden />
                </div>
                <span className="leading-relaxed">
                  {t(
                    'कृषी उत्पन्न बाजार समिती, मुख्य आवार, मलकापूर, जि. बुलढाणा – ४४३१०१',
                    'APMC, Main Yard, Malkapur, Dist. Buldhana – 443101'
                  )}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-green-900 border border-green-800 shrink-0">
                  <Phone className="h-4 w-4 text-amber-400" aria-hidden />
                </div>
                <div>
                  <p className="text-white font-semibold text-[10px] uppercase tracking-wider mb-0.5">
                    {t('दूरध्वनी', 'Phone')}
                  </p>
                  <a href="tel:+917262220000" className="hover:text-amber-400 transition-colors font-semibold">
                    +91 72622 20000
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-green-900 border border-green-800 shrink-0">
                  <Mail className="h-4 w-4 text-amber-400" aria-hidden />
                </div>
                <div>
                  <p className="text-white font-semibold text-[10px] uppercase tracking-wider mb-0.5">
                    {t('ईमेल', 'Email')}
                  </p>
                  <a href="mailto:info@malkapurapmc.gov.in" className="hover:text-amber-400 transition-colors font-semibold break-all">
                    info@malkapurapmc.gov.in
                  </a>
                </div>
              </li>

              {/* Google Maps placeholder */}
              <li className="pt-2">
                <a
                  href="https://maps.google.com/?q=Malkapur+APMC"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" aria-hidden />
                  {t('Google Maps वर पहा', 'View on Google Maps')}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-green-900">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-green-400">
            <p>
              &copy; {new Date().getFullYear()}{' '}
              {t(
                'कृषी उत्पन्न बाजार समिती, मलकापूर. सर्व हक्क सुरक्षित.',
                'APMC Malkapur. All rights reserved.'
              )}
            </p>
            <p className="flex items-center gap-1.5">
              <span className="text-green-600">{t('महाराष्ट्र शासन | बुलढाणा जिल्हा', 'Govt. of Maharashtra | Buldhana District')}</span>
              <span className="w-1 h-1 rounded-full bg-green-700" aria-hidden />
              <Link href="/admin/login" className="hover:text-amber-400 transition-colors">
                {t('प्रशासक', 'Admin')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
