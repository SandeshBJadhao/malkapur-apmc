'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Menu, X, Globe, User } from 'lucide-react';
import { NAV_LINKS } from '@/config/navigation';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { t, language, toggleLanguage } = useLanguage();
  const pathname = usePathname();
  const [isOpen, setIsOpen]       = useState(false);
  const [scrolled, setScrolled]   = useState(false);

  /* ── Scroll shadow ───────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Close mobile menu on route change ───────────────────── */
  useEffect(() => { setIsOpen(false); }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 transition-all duration-300',
        scrolled ? 'shadow-md' : 'shadow-sm'
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between">

          {/* 1. Branding */}
          <div className="flex items-center shrink min-w-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
              <div className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="APMC Malkapur Logo"
                  width={52}
                  height={52}
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-base sm:text-lg xl:text-xl font-extrabold text-green-800 tracking-tight leading-tight group-hover:text-green-700 transition-colors truncate max-w-[48vw] sm:max-w-none">
                  {t('कृषी उत्पन्न बाजार समिती, मलकापूर', 'APMC Malkapur')}
                </span>
                <span className="hidden sm:block text-[10px] xl:text-xs font-semibold text-amber-600/90 tracking-wide mt-0.5 truncate">
                  {t('शेतकऱ्यांच्या सेवेत तत्पर', 'Dedicated to Farmers Service')}
                </span>
              </div>
            </Link>
          </div>

          {/* 2. Desktop Navigation — sourced from config */}
          <nav
            className="hidden lg:flex items-center gap-1.5 xl:gap-3 2xl:gap-5 ml-auto mr-4 xl:mr-6"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-[13px] xl:text-[14px] 2xl:text-[15px] font-semibold transition-colors duration-200',
                  'whitespace-nowrap relative',
                  'after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-full',
                  'after:origin-bottom-right after:scale-x-0 after:bg-green-600',
                  'after:transition-transform hover:after:origin-bottom-left hover:after:scale-x-100',
                  pathname === link.href
                    ? 'text-green-700 after:scale-x-100 after:origin-bottom-left'
                    : 'text-gray-600 hover:text-green-600'
                )}
              >
                {language === 'mr' ? link.label_mr : link.label_en}
              </Link>
            ))}
          </nav>

          {/* 3. Actions */}
          <div className="hidden lg:flex items-center gap-3 border-l border-gray-200 pl-4 xl:pl-6 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="gap-1.5 border-gray-200 text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-200 rounded-full px-3 transition-all text-xs font-semibold"
              aria-label="Toggle language"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden />
              <span>{language === 'mr' ? 'English' : 'मराठी'}</span>
            </Button>
            <Link href="/admin/login">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-full h-8 w-8"
                aria-label="Admin login"
              >
                <User className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </div>

          {/* 4. Mobile controls */}
          <div className="flex items-center lg:hidden gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="gap-1.5 px-2.5 border-gray-200 rounded-full text-xs font-semibold"
              aria-label="Toggle language"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden />
              <span>{language === 'mr' ? 'EN' : 'MR'}</span>
            </Button>
            <button
              onClick={() => setIsOpen((o) => !o)}
              className="inline-flex items-center justify-center rounded-full p-2 text-gray-600 hover:bg-green-50 hover:text-green-700 focus:outline-none transition-colors"
              aria-expanded={isOpen}
              aria-label="Open main menu"
            >
              {isOpen ? (
                <X className="h-5 w-5" aria-hidden />
              ) : (
                <Menu className="h-5 w-5" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white/95 backdrop-blur-md shadow-lg absolute w-full">
          <div className="space-y-1 px-4 pb-6 pt-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'block rounded-xl px-4 py-3 text-base font-semibold transition-colors',
                  pathname === link.href
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'
                )}
              >
                {language === 'mr' ? link.label_mr : link.label_en}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href="/admin/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
              >
                <User className="h-5 w-5" aria-hidden />
                {t('प्रशासक लॉगिन', 'Admin Login')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
