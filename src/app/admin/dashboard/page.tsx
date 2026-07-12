'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Bell, 
  Briefcase, 
  Lightbulb, 
  Settings, 
  Loader2, 
  FileText,
  Newspaper,
  FileImage,
  Users,
  Info,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminDashboard() {
  const supabase = createClient();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    commodities: 0,
    rates: 0,
    notices: 0,
    news: 0,
    gallery: 0,
  });
  const [summaryData, setSummaryData] = useState({
    lastRateDate: '',
    expiringNotices: 0,
  });

  const [checklist, setChecklist] = useState<{ id: number; labelMr: string; labelEn: string; checked: boolean }[]>([]);

  // Load checklist from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('apmc_admin_checklist');
      if (saved) {
        try {
          setChecklist(JSON.parse(saved));
          return;
        } catch (e) {
          console.error('Failed to parse checklist', e);
        }
      }
      setChecklist([
        { id: 1, labelMr: 'आजचे नवीन बाजार भाव अपडेट करा', labelEn: 'Update today\'s market rates', checked: false },
        { id: 2, labelMr: 'कालबाह्य झालेल्या सूचना तपासा', labelEn: 'Review expired notices', checked: false },
        { id: 3, labelMr: 'नवीन कृषी बातमी/उपक्रम पोस्ट करा', labelEn: 'Publish new agricultural news/update', checked: false },
      ]);
    }
  }, []);

  // Save checklist to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined' && checklist.length > 0) {
      localStorage.setItem('apmc_admin_checklist', JSON.stringify(checklist));
    }
  }, [checklist]);

  const toggleChecklistItem = (id: number) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get commodities count
      const { count: commoditiesCount, error: commErr } = await supabase
        .from('commodities')
        .select('*', { count: 'exact', head: true });
        
      // Get market rates count
      const { count: ratesCount, error: ratesErr } = await supabase
        .from('market_rates')
        .select('*', { count: 'exact', head: true });

      // Get notices count
      const { count: noticesCount, error: noticesErr } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true });

      // Get news count
      const { count: newsCount, error: newsErr } = await supabase
        .from('news_items')
        .select('*', { count: 'exact', head: true });

      // Get gallery count
      const { count: galleryCount, error: galleryErr } = await supabase
        .from('gallery_items')
        .select('*', { count: 'exact', head: true });

      if (commErr) console.error('Error fetching commodities count:', commErr);
      if (ratesErr) console.error('Error fetching rates count:', ratesErr);
      if (noticesErr) console.error('Error fetching notices count:', noticesErr);
      if (newsErr) console.error('Error fetching news count:', newsErr);
      if (galleryErr) console.error('Error fetching gallery count:', galleryErr);

      setCounts({
        commodities: commoditiesCount || 0,
        rates: ratesCount || 0,
        notices: noticesCount || 0,
        news: newsCount || 0,
        gallery: galleryCount || 0,
      });

      // Get last rate date
      const { data: lastRateData, error: lastRateErr } = await supabase
        .from('market_rates')
        .select('date')
        .order('date', { ascending: false })
        .limit(1);

      if (lastRateErr) console.error('Error fetching last rate date:', lastRateErr);

      // Get expiring notices count (next 7 days)
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const { count: expiringNoticesCount, error: expiringErr } = await supabase
        .from('notices')
        .select('*', { count: 'exact', head: true })
        .gte('expires_at', today.toISOString())
        .lte('expires_at', sevenDaysFromNow.toISOString());

      if (expiringErr) console.error('Error fetching expiring notices:', expiringErr);

      setSummaryData({
        lastRateDate: lastRateData?.[0]?.date || '',
        expiringNotices: expiringNoticesCount || 0,
      });

    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const stats = [
    { 
      title: t('एकूण शेतमाल', 'Total Commodities'), 
      value: counts.commodities, 
      icon: TrendingUp, 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      desc: t('व्यवस्थापित शेतमाल', 'Managed crop commodities'),
      href: '/admin/market-rates'
    },
    { 
      title: t('बाजार भाव नोंदी', 'Market Rate Records'), 
      value: counts.rates, 
      icon: TrendingUp, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      desc: t('एकूण ऐतिहासिक दर नोंदी', 'Total historical price logs'),
      href: '/admin/market-rates'
    },
    { 
      title: t('प्रसिद्ध केलेल्या सूचना', 'Notices Published'), 
      value: counts.notices, 
      icon: Bell, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      desc: t('सक्रिय सूचना व निविदा', 'Active notices & tenders'),
      href: '/admin/notices'
    },
    { 
      title: t('बातम्या आणि लेख', 'News Articles'), 
      value: counts.news, 
      icon: Newspaper, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      desc: t('अपडेट केलेल्या बातम्या', 'Updated news updates'),
      href: '/admin/news'
    },
    { 
      title: t('गॅलरी चित्रे', 'Gallery Photos'), 
      value: counts.gallery, 
      icon: FileImage, 
      color: 'text-rose-600', 
      bg: 'bg-rose-50', 
      desc: t('अपलोड केलेले फोटो', 'Uploaded site photos'),
      href: '/admin/gallery'
    },
  ];

  const quickActions = [
    { label: t('बाजार भाव अपडेट करा', 'Update Market Rates'), href: '/admin/market-rates', desc: t('दैनिक किमती आणि आवक जोडा', 'Add daily prices & arrivals'), icon: TrendingUp },
    { label: t('सूचना प्रसिद्ध करा', 'Post Notices'), href: '/admin/notices', desc: t('अधिकृत सूचना व निविदा अपलोड करा', 'Publish official notices & tenders'), icon: Bell },
    { label: t('बातम्या व्यवस्थापित करा', 'Manage News'), href: '/admin/news', desc: t('कृषी अपडेट आणि बातम्या जोडा', 'Add agriculture updates & news'), icon: Newspaper },
    { label: t('गॅलरी व्यवस्थापन', 'Gallery Manager'), href: '/admin/gallery', desc: t('फोटो आणि अल्बम अपलोड करा', 'Upload photos & albums'), icon: FileImage },
    { label: t('संचालक मंडळ', 'Board Members'), href: '/admin/sanchalak-mandal', desc: t('समिती सदस्यांची माहिती बदला', 'Edit committee board members'), icon: Users },
    { label: t('सेवा व्यवस्थापित करा', 'Manage Services'), href: '/admin/services', desc: t('मदत सेवा कार्ड कॉन्फिगर करा', 'Configure help service cards'), icon: Briefcase },
    { label: t('उपक्रम संपादित करा', 'Edit Initiatives'), href: '/admin/initiatives', desc: t('प्रकल्प व विकास अपडेट प्रकाशित करा', 'Publish project & development updates'), icon: Lightbulb },
    { label: t('आमच्याबद्दल माहिती', 'About Page'), href: '/admin/about', desc: t('बाजार समितीचा इतिहास व माहिती बदला', 'Edit APMC history & description'), icon: Info },
    { label: t('साइट सेटिंग्ज', 'Configure Site Settings'), href: '/admin/settings', desc: t('संपर्क, वेळा आणि पत्ते बदला', 'Update contacts, hours & details'), icon: Settings },
  ];

  const formatCurrentDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const locale = language === 'mr' ? 'mr-IN' : 'en-US';
    return new Date().toLocaleDateString(locale, options);
  };

  const formatDateValue = (dateStr: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const locale = language === 'mr' ? 'mr-IN' : 'en-US';
    return dateObj.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('डॅशबोर्ड आढावा', 'Dashboard Overview')}</h1>
          <p className="text-sm text-gray-500">
            {t('कृषी उत्पन्न बाजार समिती, मलकापूर च्या अधिकृत पोर्टलच्या व्यवस्थापनामध्ये आपले स्वागत आहे.', 'Welcome back! Manage the official portal for Agricultural Produce Market Committee, Malkapur.')}
          </p>
        </div>
        <div className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
          <button 
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-gray-700 font-semibold"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Loader2 className="h-3.5 w-3.5" />}
            {t('आकडेवारी रिफ्रेश करा', 'Refresh Stats')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <Link key={index} href={stat.href} className="block">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
              <CardContent className="p-4 flex items-center justify-between h-full">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stat.title}</p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-100 animate-pulse rounded mt-2" />
                  ) : (
                    <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{stat.value}</h3>
                  )}
                  <p className="text-[9px] text-gray-400 mt-1 leading-normal">{stat.desc}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg} shrink-0 ml-2`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Grid for Actions and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Actions Panel */}
        <Card className="lg:col-span-8 border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-gray-50/30">
            <CardTitle className="text-base font-bold">{t('जलद क्रिया आणि शॉर्टकट', 'Quick Actions & Shortcuts')}</CardTitle>
            <CardDescription>{t('पोर्टलच्या सर्व महत्त्वाच्या विभागांमध्ये प्रवेश करण्यासाठी थेट शॉर्टकट.', 'Direct shortcuts to access all important sections of the portal.')}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Link 
                    key={idx} 
                    href={action.href}
                    className="flex items-start gap-3.5 p-3.5 border border-gray-150 rounded-xl hover:border-green-600 hover:bg-green-50/20 transition-all group"
                  >
                    <div className="p-2.5 bg-green-50 text-green-700 rounded-xl group-hover:bg-green-700 group-hover:text-white transition-colors shrink-0">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 group-hover:text-green-800 transition-colors truncate">{action.label}</h4>
                      <p className="text-[10px] text-gray-500 leading-normal line-clamp-2">{action.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Today's Summary & Checklist Panel */}
        <Card className="lg:col-span-4 border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-gray-50/30">
            <CardTitle className="text-base font-bold">{t('आजचा आढावा', 'Today\'s Summary')}</CardTitle>
            <CardDescription>{t('दैनंदिन कामाची स्थिती आणि महत्त्वाचे अपडेट.', 'Daily status indicators and admin action items.')}</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {/* Live Stats */}
            <div className="space-y-3">
              <div className="flex flex-col p-3.5 border border-gray-150 rounded-xl bg-gray-50/30 gap-1">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t('आजची तारीख', 'Current Date')}</span>
                </div>
                <span className="text-sm font-extrabold text-gray-900 mt-1">{formatCurrentDate()}</span>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-150 rounded-xl bg-gray-50/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('शेवटचे बाजार भाव', 'Last Market Rates')}</span>
                    <span className="text-xs font-bold text-gray-700 truncate mt-0.5">
                      {summaryData.lastRateDate ? formatDateValue(summaryData.lastRateDate) : t('नोंद नाही', 'No records')}
                    </span>
                  </div>
                </div>
                <Badge className="bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[10px]">
                  {t('अद्ययावत', 'Updated')}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-150 rounded-xl bg-gray-50/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('लवकरच संपणाऱ्या सूचना', 'Expiring Notices')}</span>
                    <span className="text-xs font-bold text-gray-700 truncate mt-0.5">
                      {t('७ दिवसात संपत आहेत', 'Expiring in 7 days')}
                    </span>
                  </div>
                </div>
                <Badge className={`font-semibold text-[10px] ${summaryData.expiringNotices > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                  {summaryData.expiringNotices}
                </Badge>
              </div>
            </div>

            {/* Checklist */}
            <div className="border-t pt-4">
              <h4 className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {t('दैनंदिन कामे', 'Daily Checklist')}
              </h4>
              <div className="space-y-2.5">
                {checklist.map((item) => (
                  <label 
                    key={item.id}
                    className="flex items-start gap-3 p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50/50 cursor-pointer transition-colors"
                  >
                    <input 
                      type="checkbox" 
                      checked={item.checked} 
                      onChange={() => toggleChecklistItem(item.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-350 text-green-600 focus:ring-green-500 cursor-pointer"
                    />
                    <span className={`text-xs font-medium leading-normal select-none transition-all ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {language === 'mr' ? item.labelMr : item.labelEn}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

