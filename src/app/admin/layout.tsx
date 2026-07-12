'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  LogOut, 
  FileText, 
  Bell, 
  FileImage, 
  TrendingUp, 
  Briefcase, 
  Lightbulb, 
  Settings as SettingsIcon,
  Menu,
  X,
  Users,
  Info
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { t, toggleLanguage, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Auth Guard
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login');
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, [pathname, router, supabase.auth]);

  // Don't show sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Show a loading spinner during auth check
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
        <p className="mt-4 text-sm text-gray-500 font-medium">{t('प्रमाणीकरण तपासत आहे...', 'Verifying authentication...')}</p>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const menuItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: t('डॅशबोर्ड', 'Dashboard') },
    { href: '/admin/market-rates', icon: TrendingUp, label: t('बाजार भाव', 'Market Rates') },
    { href: '/admin/notices', icon: Bell, label: t('सूचना', 'Notices') },
    { href: '/admin/news', icon: FileText, label: t('बातम्या', 'News') },
    { href: '/admin/gallery', icon: GalleryIconHelper(FileImage), label: t('गॅलरी', 'Gallery') },
    { href: '/admin/sanchalak-mandal', icon: Users, label: t('संचालक मंडळ', 'Board') },
    { href: '/admin/services', icon: Briefcase, label: t('सेवा', 'Services') },
    { href: '/admin/initiatives', icon: Lightbulb, label: t('उपक्रम', 'Initiatives') },
    { href: '/admin/about', icon: Info, label: t('आमच्याबद्दल', 'About') },
    { href: '/admin/settings', icon: SettingsIcon, label: t('सेटिंग्ज', 'Settings') },
  ];

  // Helper to get matching type for icon component
  function GalleryIconHelper(icon: any) {
    return icon;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-green-900 text-white flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-green-800">
          <span className="text-xl font-bold">{t('APMC प्रशासन', 'APMC Admin')}</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-green-800 text-white font-medium' : 'text-green-100 hover:bg-green-800/50 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-green-800 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-green-100 hover:bg-green-800 hover:text-white cursor-pointer text-sm font-medium"
            onClick={toggleLanguage}
          >
            <span className="mr-3">🌐</span>
            {language === 'mr' ? 'English' : 'मराठी'}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-green-100 hover:bg-green-800 hover:text-white cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {t('बाहेर पडा', 'Logout')}
          </Button>
        </div>
      </aside>

      {/* Mobile Header Bar */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 md:hidden shadow-sm z-20">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            className="text-gray-600 hover:text-green-900 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          <span className="text-lg font-bold text-green-900">{t('APMC प्रशासन', 'APMC Admin')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLanguage}
            className="text-gray-600 hover:text-green-950 text-xs font-semibold cursor-pointer py-1 px-2 h-8"
          >
            🌐 {language === 'mr' ? 'EN' : 'मराठी'}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-600 hover:text-red-600 cursor-pointer">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Drawer (Overlay and Menu) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-10 md:hidden flex">
          {/* Overlay backdrop */}
          <div 
            className="fixed inset-0 bg-black/45" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Menu Drawer */}
          <aside className="relative w-64 bg-green-900 text-white flex flex-col z-20 animate-slideRight">
            <div className="h-16 flex items-center justify-between px-6 border-b border-green-800">
              <span className="text-lg font-bold">{t('APMC प्रशासन', 'APMC Admin')}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-green-100 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-green-800 text-white font-medium' : 'text-green-100 hover:bg-green-800/50 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-green-800 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-green-100 hover:bg-green-800 hover:text-white cursor-pointer text-sm font-medium"
                onClick={toggleLanguage}
              >
                <span className="mr-3">🌐</span>
                {language === 'mr' ? 'English' : 'मराठी'}
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-green-100 hover:bg-green-800 hover:text-white cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                {t('बाहेर पडा', 'Logout')}
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
