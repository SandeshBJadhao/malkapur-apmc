/**
 * Centralized navigation configuration for Malkapur APMC portal.
 * All navbar items come from this single source of truth.
 * To add/remove/reorder a nav item, only edit this file.
 */

export interface NavLink {
  href: string;
  label_mr: string;
  label_en: string;
  /** Optional: marks the link as admin-only (hidden in public navbar) */
  adminOnly?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { href: '/',                 label_mr: 'मुख्यपृष्ठ',   label_en: 'Home' },
  { href: '/about',            label_mr: 'आमच्याबद्दल',   label_en: 'About' },
  { href: '/sanchalak-mandal', label_mr: 'संचालक मंडळ',   label_en: 'Board' },
  { href: '/market-rates',     label_mr: 'बाजार भाव',     label_en: 'Market Rates' },
  { href: '/services',         label_mr: 'सेवा',          label_en: 'Services' },
  { href: '/initiatives',      label_mr: 'उपक्रम',        label_en: 'Initiatives' },
  { href: '/notices',          label_mr: 'सूचना',          label_en: 'Notices' },
  { href: '/news',             label_mr: 'बातम्या',        label_en: 'News' },
  { href: '/gallery',          label_mr: 'गॅलरी',          label_en: 'Gallery' },
  { href: '/contact',          label_mr: 'संपर्क',          label_en: 'Contact' },
];

/** Breadcrumb helper — returns the Marathi/English label for a given href. */
export function getNavLabel(href: string, language: 'mr' | 'en'): string {
  const link = NAV_LINKS.find((l) => l.href === href);
  if (!link) return href;
  return language === 'mr' ? link.label_mr : link.label_en;
}
