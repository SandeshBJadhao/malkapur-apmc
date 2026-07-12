'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeIndianRupee,
  BarChart3,
  Building2,
  CalendarDays,
  GraduationCap,
  HandHeart,
  HelpCircle,
  Landmark,
  Leaf,
  Megaphone,
  MonitorUp,
  Network,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  TrendingUp,
  Users,
  Image as ImageIcon,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHero, SectionHeading, StatsCard } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const iconMap: Record<string, LucideIcon> = {
  Network,
  BadgeIndianRupee,
  Sprout,
  GraduationCap,
  Users,
  Store,
  TrendingUp,
  BarChart3,
  CalendarDays,
  Building2,
  HandHeart,
  Landmark,
  Leaf,
  Sparkles,
  HelpCircle
};

const staticInitiatives = [
  {
    title_mr: 'ई-नाम (e-NAM) राष्ट्रीय बाजार जोडणी',
    title_en: 'e-NAM National Market Integration',
    description_mr: 'शेतकऱ्यांना देशभरातील खरेदीदारांशी जोडणारी आणि बोली लावण्यासाठी मदत करणारी पारदर्शक डिजिटल प्रणाली.',
    description_en: 'A transparent digital bidding platform connecting farmers directly to buyers nationwide.',
    image_url: 'https://images.unsplash.com/photo-1464234470489-08588e748536?q=80&w=1200&auto=format&fit=crop',
    category: 'Digital Mandi',
  },
  {
    title_mr: 'शेतकरी प्रशिक्षण व डिजिटल वर्ग',
    title_en: 'Farmer Training & Digital Classrooms',
    description_mr: 'नवीन सेंद्रिय पद्धती, खत व्यवस्थापन व सरकारी अनुदानाबाबत मार्गदर्शन करण्यासाठी बाजार आवारात सुरू करण्यात आलेले प्रशिक्षण केंद्र.',
    description_en: 'Training centers established inside the yard to educate farmers on organic methods and government subsidies.',
    image_url: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1200&auto=format&fit=crop',
    category: 'Education',
  },
  {
    title_mr: 'शीतगृह आणि गोदामांची उभारणी',
    title_en: 'Cold Storage & Modern Warehouses',
    description_mr: 'नाशवंत शेतमाल टिकवून ठेवण्यासाठी आणि तातडीने विक्री टाळण्यासाठी अद्ययावत शीतगृह व साठवणूक सुविधा.',
    description_en: 'State-of-the-art cold storage facility built within the market yard to prevent distressed selling of perishables.',
    image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop',
    category: 'Infrastructure',
  },
];

const staticSchemes = [
  {
    title_mr: 'e-NAM',
    title_en: 'e-NAM',
    desc_mr: 'राष्ट्रीय कृषी बाजाराशी जोडलेली डिजिटल बाजार माहिती आणि व्यवहार जागरूकता.',
    desc_en: 'Digital market information and transaction awareness connected with the national agriculture market.',
    icon_name: 'Network',
  },
  {
    title_mr: 'पीएम किसान',
    title_en: 'PM Kisan',
    desc_mr: 'शेतकरी लाभ योजनांबाबत माहिती व मार्गदर्शन.',
    desc_en: 'Information and guidance for farmer benefit schemes.',
    icon_name: 'BadgeIndianRupee',
  },
  {
    title_mr: 'पीक विमा जनजागृती',
    title_en: 'Crop Insurance Awareness',
    desc_mr: 'हंगामी जोखीम व्यवस्थापन आणि विमा नोंदणीबाबत जागरूकता.',
    desc_en: 'Awareness on seasonal risk management and insurance registration.',
    icon_name: 'Sprout',
  },
  {
    title_mr: 'शेतकरी प्रशिक्षण कार्यक्रम',
    title_en: 'Farmer Training Programs',
    desc_mr: 'बाजार प्रक्रिया, गुणवत्ता आणि नोंदणीबाबत प्रशिक्षण.',
    desc_en: 'Training on market process, quality, and registration.',
    icon_name: 'GraduationCap',
  },
];

const staticTimeline = [
  {
    year: '2018',
    title_mr: 'बाजार सेवा सुधारणा',
    title_en: 'Market Service Improvements',
    desc_mr: 'शेतकरी सुविधा आणि कार्यालयीन सेवा अधिक सुलभ करण्याची सुरुवात.',
    desc_en: 'Started making farmer facilities and office services easier to access.',
  },
  {
    year: '2020',
    title_mr: 'डिजिटल माहिती उपक्रम',
    title_en: 'Digital Information Initiative',
    desc_mr: 'दर आणि सूचना नागरिकांपर्यंत जलद पोहोचवण्यावर भर.',
    desc_en: 'Focused on faster delivery of rates and notices to citizens.',
  },
  {
    year: '2023',
    title_mr: 'पायाभूत सुविधा उन्नती',
    title_en: 'Infrastructure Upgrades',
    desc_mr: 'आवार व्यवस्थापन, स्वच्छता आणि सुविधा सुधारणा.',
    desc_en: 'Campus management, cleanliness, and facility improvements.',
  },
  {
    year: '2026',
    title_mr: 'एकात्मिक नागरिक पोर्टल',
    title_en: 'Integrated Citizen Portal',
    desc_mr: 'सेवा, उपक्रम आणि बाजार माहिती एकाच डिजिटल ठिकाणी.',
    desc_en: 'Services, initiatives, and market information in one digital place.',
  },
];

const staticAchievements = [
  {
    label_mr: 'नोंदणीकृत शेतकरी',
    label_en: 'Registered Farmers',
    value: '8,500+',
    subtext_mr: 'बाजार सेवांशी जोडलेले',
    subtext_en: 'Connected with market services',
    icon_name: 'Users',
    accent_color: 'green',
  },
  {
    label_mr: 'व्यापारी',
    label_en: 'Traders',
    value: '420+',
    subtext_mr: 'परवानाधारक व्यापारी',
    subtext_en: 'Licensed traders',
    icon_name: 'Store',
    accent_color: 'amber',
  },
  {
    label_mr: 'दैनंदिन आवक',
    label_en: 'Daily Arrivals',
    value: '3,200+',
    subtext_mr: 'क्विंटल सरासरी',
    subtext_en: 'Average quintals',
    icon_name: 'TrendingUp',
    accent_color: 'blue',
  },
  {
    label_mr: 'शेतमाल प्रकार',
    label_en: 'Commodities Traded',
    value: '85+',
    subtext_mr: 'नोंदणीकृत शेतमाल',
    subtext_en: 'Registered commodity types',
    icon_name: 'Sprout',
    accent_color: 'rose',
  },
];

const staticFutureVision = {
  future_vision_mr: 'मलकापूर कृषी उत्पन्न बाजार समिती आगामी काळात संपूर्णपणे पेपरलेस आणि १००% डिजिटल करण्याचे आमचे उद्दिष्ट आहे. शेतकऱ्यांना घरबसल्या दराची खात्री मिळावी, वजन आणि देयक प्रक्रिया थेट मोबाईल ॲपद्वारे व्हावी, आणि साठवणुकीसाठी आधुनिक व अद्ययावत कोल्ड स्टोरेज साखळी उपलब्ध करून देणे ही आमची प्राथमिकता आहे. कृषी तंत्रज्ञानाचा वापर करून पारदर्शकता अधिक दृढ करणे व शेतकऱ्यांचे जीवन समृद्ध करणे या ध्येयासाठी आम्ही कटिबद्ध आहोत.',
  future_vision_en: 'APMC Malkapur envisions transition to a complete paperless, fully integrated smart marketplace. Our primary future goal is providing real-time bidding updates and digitized weighing directly to mobile devices. Expanding advanced cold storage infrastructure and integrating machine-learning-based grade testing remain our strategic directions for elevating local agricultural incomes.',
};

export default function InitiativesPage() {
  const { t, language } = useLanguage();
  const supabase = createClient();
  
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [futureVision, setFutureVision] = useState<any>(staticFutureVision);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch initiatives
        const { data: initData, error: initErr } = await supabase
          .from('initiatives')
          .select('*')
          .eq('is_published', true)
          .order('display_order', { ascending: true });

        if (!initErr && initData && initData.length > 0) {
          setInitiatives(initData);
        } else {
          setInitiatives(staticInitiatives);
        }

        // Fetch schemes
        const { data: schemeData, error: schemeErr } = await supabase
          .from('gov_schemes')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!schemeErr && schemeData && schemeData.length > 0) {
          setSchemes(schemeData);
        } else {
          setSchemes(staticSchemes);
        }

        // Fetch achievements
        const { data: achData, error: achErr } = await supabase
          .from('achievements')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!achErr && achData && achData.length > 0) {
          setAchievements(achData);
        } else {
          setAchievements(staticAchievements);
        }

        // Fetch timeline
        const { data: timeData, error: timeErr } = await supabase
          .from('initiative_timeline')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!timeErr && timeData && timeData.length > 0) {
          setTimeline(timeData);
        } else {
          setTimeline(staticTimeline);
        }

        // Fetch future vision settings
        const { data: settingsData, error: settingsErr } = await supabase
          .from('initiative_settings')
          .select('*')
          .limit(1);

        if (!settingsErr && settingsData && settingsData.length > 0) {
          setFutureVision(settingsData[0]);
        } else {
          setFutureVision(staticFutureVision);
        }

      } catch (err) {
        console.error('Error loading initiatives page data:', err);
        setInitiatives(staticInitiatives);
        setSchemes(staticSchemes);
        setAchievements(staticAchievements);
        setTimeline(staticTimeline);
        setFutureVision(staticFutureVision);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  return (
    <div className="bg-white">
      <PageHero
        titleMr="उपक्रम"
        titleEn="Initiatives"
        subtitleMr="मलकापूर कृषी उत्पन्न बाजार समितीचे बाजार विकास, शेतकरी कल्याण आणि सार्वजनिक सुविधा सुधारणा उपक्रम."
        subtitleEn="Market development, farmer welfare, and public facility improvement initiatives by APMC Malkapur."
        badgeMr="बाजार विकास | सार्वजनिक कल्याण"
        badgeEn="Market Development | Public Welfare"
        breadcrumbs={[{ labelMr: 'उपक्रम', labelEn: 'Initiatives' }]}
      />

      {/* Current Initiatives Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            titleMr="सध्याचे उपक्रम"
            titleEn="Current Initiatives"
            subtitleMr="शेतकरी आणि बाजार प्रणालीसाठी सुरू असलेले प्रमुख उपक्रम."
            subtitleEn="Current priorities for farmers and the market system."
            icon={Sparkles}
            accentColor="green"
          />

          {loading ? (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse bg-gray-50 border border-gray-100 overflow-hidden">
                  <div className="h-48 bg-gray-200" />
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {initiatives.map((init, idx) => (
                <Card 
                  key={`${init.id || idx}`} 
                  className="overflow-hidden border border-gray-150 bg-white hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 rounded-2xl flex flex-col group"
                >
                  {/* Image Container */}
                  <div className="relative h-48 sm:h-52 w-full bg-gray-100 overflow-hidden shrink-0">
                    {init.image_url ? (
                      <Image
                        src={init.image_url}
                        alt={language === 'mr' ? init.title_mr : init.title_en}
                        fill
                        sizes="(max-width: 768px) 100vw, 384px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-green-700/90 text-white border-0 backdrop-blur-sm text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {init.category || 'Initiative'}
                      </Badge>
                    </div>
                  </div>

                  {/* Body Content */}
                  <CardContent className="p-6 flex flex-col justify-between flex-grow">
                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-green-800 transition-colors leading-snug">
                        {language === 'mr' ? init.title_mr : init.title_en}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {language === 'mr' ? init.description_mr : init.description_en}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Govt Schemes Section */}
      <section className="bg-gray-50 py-16 sm:py-20 border-y border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            titleMr="शासकीय योजना माहिती"
            titleEn="Government Schemes"
            subtitleMr="शेतकऱ्यांसाठी उपयुक्त योजना आणि जनजागृती विषय."
            subtitleEn="Useful schemes and awareness topics for farmers."
            icon={Landmark}
            accentColor="amber"
          />
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {schemes.map((scheme, idx) => {
              const Icon = iconMap[scheme.icon_name] || Landmark;
              return (
                <Card key={`${scheme.title_en || idx}`} className="hover:shadow-lg hover:-translate-y-1 transition-all">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-green-50 text-green-700 flex items-center justify-center mb-2">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <CardTitle className="text-lg">{t(scheme.title_mr, scheme.title_en)}</CardTitle>
                    <CardDescription>{t(scheme.desc_mr, scheme.desc_en)}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Operational stats section (Achievements) */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            titleMr="उपलब्धी"
            titleEn="Achievements"
            subtitleMr="मलकापूर बाजार समितीच्या कामकाजाचा आढावा."
            subtitleEn="A snapshot of APMC Malkapur operations."
            icon={BarChart3}
            accentColor="blue"
          />
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {achievements.map((item, idx) => {
              const Icon = iconMap[item.icon_name] || BarChart3;
              return (
                <StatsCard
                  key={`${item.id || idx}`}
                  labelMr={item.label_mr}
                  labelEn={item.label_en}
                  value={item.value}
                  subtextMr={item.subtext_mr || ''}
                  subtextEn={item.subtext_en || ''}
                  icon={Icon}
                  accentColor={item.accent_color as any}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline/Milestones */}
      <section className="bg-gray-50 py-16 sm:py-20 border-y border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            titleMr="महत्त्वाचे टप्पे"
            titleEn="Timeline"
            subtitleMr="सेवा आणि बाजार विकासातील प्रमुख टप्पे."
            subtitleEn="Major milestones in service and market development."
            icon={CalendarDays}
            accentColor="green"
          />
          <div className="mt-10 relative max-w-4xl mx-auto">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-green-200 hidden sm:block" aria-hidden />
            <div className="space-y-5">
              {timeline.map((item, idx) => (
                <Card key={`${item.id || idx}`} className="sm:ml-12 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                        {item.year}
                      </span>
                      <div>
                        <h3 className="font-bold text-gray-900">{t(item.title_mr, item.title_en)}</h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{t(item.desc_mr, item.desc_en)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Future Vision */}
      <section className="bg-gradient-to-br from-green-900 via-green-950 to-emerald-950 py-16 sm:py-20 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <SectionHeading
              titleMr="भविष्यातील दिशा"
              titleEn="Future Vision"
              subtitleMr="मलकापूर बाजार समितीचे आगामी उद्दिष्ट"
              subtitleEn="Strategic expansion and future goals"
              icon={Sparkles}
              className="text-white border-l-green-500 mb-6 pl-4 border-l-4"
            />
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {t(
                futureVision?.future_vision_mr || staticFutureVision.future_vision_mr,
                futureVision?.future_vision_en || staticFutureVision.future_vision_en
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
