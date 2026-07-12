'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHero, SectionHeading, ServiceCard } from '@/components/shared';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Service, ServiceFacility, ServiceForm, ServiceFAQ } from '@/types';

// Fallback Static Data in case database tables are empty
const staticFarmerServices = [
  {
    labelMr: 'बाजार भाव माहिती',
    labelEn: 'Market Rates Information',
    descMr: 'दैनंदिन शेतमाल दर व आवक माहिती.',
    descEn: 'Daily commodity rates and arrivals.',
    icon: Lucide.TrendingUp,
    href: '/market-rates',
    accentColor: 'green' as const,
  },
  {
    labelMr: 'वजन सुविधा',
    labelEn: 'Weighing Facility',
    descMr: 'अधिकृत वजन काटे व पावती सहाय्य.',
    descEn: 'Official weighbridge and receipt support.',
    icon: Lucide.Scale,
    href: '/services',
    accentColor: 'blue' as const,
  },
  {
    labelMr: 'व्यापार सभागृह माहिती',
    labelEn: 'Trading Hall Information',
    descMr: 'विक्री क्षेत्र, बैठक व्यवस्था व प्रक्रिया माहिती.',
    descEn: 'Sale area, seating, and process information.',
    icon: Lucide.Building2,
    href: '/services',
    accentColor: 'amber' as const,
  },
  {
    labelMr: 'परवाना सहाय्य',
    labelEn: 'License Assistance',
    descMr: 'व्यापारी व सेवा परवान्यासाठी मार्गदर्शन.',
    descEn: 'Guidance for trader and service licenses.',
    icon: Lucide.BadgeCheck,
    href: '/contact',
    accentColor: 'teal' as const,
  },
  {
    labelMr: 'शेतकरी मार्गदर्शन केंद्र',
    labelEn: 'Farmer Guidance Center',
    descMr: 'नोंदणी, कागदपत्रे आणि बाजार सहाय्य.',
    descEn: 'Registration, documents, and market support.',
    icon: Lucide.UserRoundCheck,
    href: '/contact',
    accentColor: 'purple' as const,
  },
  {
    labelMr: 'तक्रार नोंदणी',
    labelEn: 'Complaint Registration',
    descMr: 'सेवा, वजन किंवा व्यवहाराबाबत तक्रार.',
    descEn: 'Complaint support for services and transactions.',
    icon: Lucide.MessageSquareWarning,
    href: '/contact',
    accentColor: 'rose' as const,
  },
];

const staticFacilities = [
  { titleMr: 'पार्किंग', titleEn: 'Parking', icon_name: 'ParkingCircle' },
  { titleMr: 'पिण्याचे पाणी', titleEn: 'Drinking Water', icon_name: 'Waves' },
  { titleMr: 'विश्रांती कक्ष', titleEn: 'Rest Area', icon_name: 'Sofa' },
  { titleMr: 'सुरक्षा', titleEn: 'Security', icon_name: 'ShieldCheck' },
  { titleMr: 'डिजिटल डिस्प्ले बोर्ड', titleEn: 'Digital Display Boards', icon_name: 'MonitorUp' },
  { titleMr: 'गोदाम माहिती', titleEn: 'Warehouse Information', icon_name: 'Warehouse' },
];

const staticForms = [
  {
    titleMr: 'शेतकरी नोंदणी फॉर्म',
    titleEn: 'Farmer Registration Form',
    descMr: 'शेतकरी सेवा आणि बाजार माहिती नोंदणीसाठी.',
    descEn: 'For farmer service and market information registration.',
    file_type: 'PDF',
  },
  {
    titleMr: 'व्यापारी नोंदणी फॉर्म',
    titleEn: 'Trader Registration Form',
    descMr: 'व्यापारी नोंदणी व प्राथमिक तपशीलासाठी.',
    descEn: 'For trader registration and basic details.',
    file_type: 'PDF',
  },
  {
    titleMr: 'परवाना अर्ज फॉर्म',
    titleEn: 'License Application Form',
    descMr: 'परवाना अर्ज प्रक्रियेसाठी आवश्यक नमुना.',
    descEn: 'Sample form required for license application.',
    file_type: 'PDF',
  },
];

const staticFaqs = [
  {
    qMr: 'बाजार भाव माहिती कुठे पाहता येईल?',
    qEn: 'Where can I view market rates?',
    aMr: 'दैनंदिन बाजार भाव वेबसाइटवरील बाजार भाव पृष्ठावर उपलब्ध आहेत.',
    aEn: 'Daily rates are available on the Market Rates page of this website.',
  },
  {
    qMr: 'परवाना सहाय्यासाठी कोणाशी संपर्क करावा?',
    qEn: 'Who should I contact for license assistance?',
    aMr: 'मुख्य कार्यालयातील सेवा कक्ष किंवा संपर्क पृष्ठावरील अधिकृत क्रमांक वापरा.',
    aEn: 'Contact the service desk at the main office or use the official number on the Contact page.',
  },
  {
    qMr: 'तक्रार ऑनलाइन नोंदवता येते का?',
    qEn: 'Can complaints be submitted online?',
    aMr: 'सध्या संपर्क पृष्ठावरील चौकशी व तक्रार फॉर्मद्वारे प्राथमिक नोंदणी करता येते.',
    aEn: 'Initial complaint registration can currently be made through the inquiry form on the Contact page.',
  },
  {
    qMr: 'फॉर्म डाउनलोड कसे करावे?',
    qEn: 'How do I download forms?',
    aMr: 'या पृष्ठावरील फॉर्म कार्ड नमुना डाउनलोड विभाग म्हणून दिले आहेत. अधिकृत प्रत कार्यालयातून मिळेल.',
    aEn: 'The form cards on this page are mock download entries. Official copies are available from the office.',
  },
];

export default function ServicesPage() {
  const { t, language } = useLanguage();
  const supabase = createClient();

  // Data states
  const [dbServices, setDbServices] = useState<any[]>([]);
  const [dbFacilities, setDbFacilities] = useState<ServiceFacility[]>([]);
  const [dbForms, setDbForms] = useState<ServiceForm[]>([]);
  const [dbFaqs, setDbFaqs] = useState<ServiceFAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllServicesData = async () => {
      try {
        setLoading(true);
        
        // Parallel fetching
        const [servicesRes, facilitiesRes, formsRes, faqsRes] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true).order('display_order', { ascending: true }),
          supabase.from('service_facilities').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('service_forms').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          supabase.from('service_faqs').select('*').eq('is_active', true).order('sort_order', { ascending: true })
        ]);

        if (servicesRes.data && servicesRes.data.length > 0) {
          const colors: ('green' | 'blue' | 'amber' | 'teal' | 'purple' | 'rose')[] = ['green', 'blue', 'amber', 'teal', 'purple', 'rose'];
          const mapped = servicesRes.data.map((item, idx) => {
            const IconComponent = (Lucide as any)[item.icon_name || 'Briefcase'] || Lucide.Briefcase;
            return {
              labelMr: item.title_mr,
              labelEn: item.title_en,
              descMr: item.description_mr || '',
              descEn: item.description_en || '',
              icon: IconComponent,
              href: item.icon_name === 'TrendingUp' ? '/market-rates' : item.icon_name === 'BadgeCheck' || item.icon_name === 'UserRoundCheck' || item.icon_name === 'MessageSquareWarning' ? '/contact' : '/services',
              accentColor: colors[idx % colors.length],
            };
          });
          setDbServices(mapped);
        } else {
          setDbServices(staticFarmerServices);
        }

        setDbFacilities(facilitiesRes.data && facilitiesRes.data.length > 0 ? facilitiesRes.data : []);
        setDbForms(formsRes.data && formsRes.data.length > 0 ? formsRes.data : []);
        setDbFaqs(faqsRes.data && faqsRes.data.length > 0 ? faqsRes.data : []);

      } catch (err) {
        console.error('Error fetching dynamic services data:', err);
        setDbServices(staticFarmerServices);
      } finally {
        setLoading(false);
      }
    };

    fetchAllServicesData();
  }, [supabase]);

  // Fallbacks for display
  const displayFacilities = dbFacilities.length > 0 ? dbFacilities : staticFacilities.map((f, i) => ({
    id: String(i),
    title_mr: f.titleMr,
    title_en: f.titleEn,
    icon_name: f.icon_name,
    sort_order: i,
    is_active: true,
    created_at: '',
    updated_at: '',
  }));

  const displayForms = dbForms.length > 0 ? dbForms : staticForms.map((f, i) => ({
    id: String(i),
    title_mr: f.titleMr,
    title_en: f.titleEn,
    description_mr: f.descMr,
    description_en: f.descEn,
    file_url: null,
    file_name: null,
    file_type: f.file_type,
    sort_order: i,
    is_active: true,
    created_at: '',
    updated_at: '',
  }));

  const displayFaqs = dbFaqs.length > 0 ? dbFaqs : staticFaqs.map((f, i) => ({
    id: String(i),
    question_mr: f.qMr,
    question_en: f.qEn,
    answer_mr: f.aMr,
    answer_en: f.aEn,
    sort_order: i,
    is_active: true,
    created_at: '',
    updated_at: '',
  }));

  return (
    <div className="bg-white min-h-screen">
      <PageHero
        titleMr="सेवा व सुविधा"
        titleEn="Services & Facilities"
        subtitleMr="मलकापूर कृषी उत्पन्न बाजार समितीकडून शेतकरी, व्यापारी आणि नागरिकांसाठी उपलब्ध सेवा, सुविधा आणि सहाय्य."
        subtitleEn="Citizen and farmer-facing services, facilities, and downloadable forms offered by APMC Malkapur."
        badgeMr="शेतकरी सेवा | नागरिक सहाय्य"
        badgeEn="Farmer Services | Citizen Support"
        breadcrumbs={[{ labelMr: 'सेवा', labelEn: 'Services' }]}
      />

      {/* 1. शेतकरी सेवा / Farmer Services */}
      <section className="py-16 sm:py-20 animate-fadeIn">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <SectionHeading
            titleMr="शेतकरी सेवा"
            titleEn="Farmer Services"
            subtitleMr="दैनंदिन बाजार व्यवहारासाठी आवश्यक प्रमुख सेवा."
            subtitleEn="Core services needed for day-to-day market activity."
            icon={Lucide.Landmark}
            accentColor="green"
          />

          {loading ? (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse bg-gray-50 border border-gray-100">
                  <CardHeader className="h-28" />
                  <CardContent className="h-10" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {dbServices.map((service, idx) => (
                <ServiceCard key={`${service.labelEn}-${idx}`} {...service} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. उपलब्ध सुविधा / Facilities */}
      <section className="bg-gray-50/50 py-16 sm:py-20 border-y border-gray-100/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <SectionHeading
            titleMr="उपलब्ध सुविधा"
            titleEn="Facilities Available"
            subtitleMr="बाजार आवारात शेतकरी आणि नागरिकांसाठी उपलब्ध मूलभूत सुविधा."
            subtitleEn="Basic facilities available for farmers and citizens inside the market campus."
            icon={Lucide.ClipboardCheck}
            accentColor="amber"
          />
          
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayFacilities.map((facility) => {
              const Icon = (Lucide as any)[facility.icon_name || 'ClipboardCheck'] || Lucide.ClipboardCheck;
              return (
                <Card key={facility.id} className="hover:shadow-md hover:border-green-200 transition-all bg-white border border-gray-100">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-green-50 text-green-700 flex items-center justify-center shrink-0">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                      {t(facility.title_mr, facility.title_en)}
                    </h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. डाउनलोड फॉर्म / Downloadable Forms */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <SectionHeading
            titleMr="डाउनलोड फॉर्म"
            titleEn="Downloadable Forms"
            subtitleMr="विविध परवाना, नोंदणी व नागरिक सेवांचे आवश्यक नमुने व अर्ज डाउनलोड करा."
            subtitleEn="Download application templates and forms required for licensing and registrations."
            icon={Lucide.FileDown}
            accentColor="blue"
          />
          
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayForms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col justify-between border border-gray-100 bg-white">
                <CardHeader className="p-6 pb-4">
                  <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                    <Lucide.FileText className="h-5 w-5" aria-hidden />
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900 leading-snug">
                    {t(form.title_mr, form.title_en)}
                  </CardTitle>
                  <CardDescription className="text-xs text-gray-500 pt-1 leading-relaxed">
                    {t(form.description_mr || '', form.description_en || '')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  {form.file_url ? (
                    <Button asChild className="w-full bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer rounded-xl py-2">
                      <a href={form.file_url} target="_blank" rel="noreferrer" download>
                        <Lucide.Download className="mr-2 h-4 w-4" aria-hidden />
                        {t('डाउनलोड करा (PDF)', 'Download (PDF)')}
                      </a>
                    </Button>
                  ) : (
                    <Button disabled className="w-full bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed rounded-xl py-2">
                      <Lucide.AlertCircle className="mr-2 h-4 w-4" />
                      {t('फाइल उपलब्ध नाही', 'File Unavailable')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. वारंवार विचारले जाणारे प्रश्न / FAQs */}
      <section className="bg-gray-50 py-16 sm:py-20 border-t border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <SectionHeading
            titleMr="वारंवार विचारले जाणारे प्रश्न"
            titleEn="Frequently Asked Questions"
            subtitleMr="सेवा व बाजार आवाराबाबत सामान्य शंका व निरसन."
            subtitleEn="Common questions and answers regarding market operations and services."
            icon={Lucide.HelpCircle}
            accentColor="green"
          />
          
          <div className="mt-10 space-y-3">
            {displayFaqs.map((faq) => (
              <details key={faq.id} className="group rounded-xl border border-gray-200 bg-white shadow-sm open:border-green-300 transition-all duration-300">
                <summary className="cursor-pointer list-none px-5 py-4 font-bold text-gray-900 flex items-center justify-between gap-4 select-none text-sm sm:text-base">
                  {t(faq.question_mr, faq.question_en)}
                  <span className="text-green-700 font-extrabold text-lg group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-gray-600 border-t border-gray-50 pt-3">
                  {t(faq.answer_mr, faq.answer_en)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <section className="bg-gradient-to-br from-green-900 to-emerald-950 py-14 sm:py-16 text-white text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-xl">
          <h2 className="text-xl sm:text-2xl font-extrabold">{t('सेवा सहाय्यासाठी संपर्क करा', 'Contact Support for Services')}</h2>
          <p className="mt-3 text-emerald-100 text-xs sm:text-sm leading-relaxed">
            {t(
              'फॉर्म, परवाना, वजन सुविधा किंवा तक्रारीसाठी अधिकृत बाजार समिती कार्यालयाशी संपर्क साधा.',
              'Reach out to the official APMC office for any assistance regarding licenses, forms, or complaints.'
            )}
          </p>
          <Button asChild size="lg" className="mt-8 bg-amber-500 text-green-950 hover:bg-amber-600 font-bold cursor-pointer rounded-xl">
            <Link href="/contact">
              <Lucide.Phone className="mr-2 h-5 w-5" aria-hidden />
              {t('संपर्क करा', 'Contact Support')}
            </Link>
          </Button>
        </div>
      </section>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.99); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.35s ease-out; }
      `}</style>
    </div>
  );
}
