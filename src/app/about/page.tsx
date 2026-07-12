'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHero, SectionHeading } from '@/components/shared';
import { Building2, Target, Award, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AboutIntro, AboutMission, AboutKeyFact } from '@/types';

// Fallback seed data in case database is empty or loading
const FALLBACK_INTRO = {
  content_mr: 'कृषी उत्पन्न बाजार समिती, मलकापूरची स्थापना शेतकऱ्यांच्या कल्याणासाठी आणि त्यांना त्यांच्या मालाला योग्य भाव मिळवून देण्यासाठी करण्यात आली आहे. ही समिती महाराष्ट्र कृषी उत्पन्न बाजार अधिनियम, १९६३ अंतर्गत कार्यरत आहे. आमचे ध्येय पारदर्शक व्यवहार आणि आधुनिक सुविधा पुरवणे हे आहे. बाजार समिती शेतकरी, व्यापारी आणि आडत्यांमध्ये पारदर्शक संवाद साधण्यासाठी सदैव प्रयत्नशील आहे.',
  content_en: 'Agricultural Produce Market Committee, Malkapur was established for the welfare of farmers and to ensure fair prices for their agricultural produce. The committee operates under the Maharashtra Agricultural Produce Marketing (Development and Regulation) Act, 1963. Our goal is to provide transparent transactions and modern facilities. The market committee is always striving to facilitate transparent communication between farmers, traders, and commission agents.'
};

const FALLBACK_MISSIONS = [
  { text_mr: 'शेतकऱ्यांना योग्य आणि न्याय्य भाव मिळवून देणे.', text_en: 'Ensuring fair and just prices for farmers.' },
  { text_mr: 'बाजारातील सर्व व्यवहार पारदर्शक ठेवणे.', text_en: 'Keeping all market transactions transparent.' },
  { text_mr: 'आधुनिक तंत्रज्ञानाचा उपयोग करून माहिती सुलभ करणे.', text_en: 'Simplifying information using modern technology.' },
  { text_mr: 'शेतमालाची गुणवत्ता तपासणी आणि प्रमाणीकरण.', text_en: 'Quality inspection and certification of agricultural produce.' },
];

const FALLBACK_FACTS = [
  { value_mr: '१९६३', value_en: '1963', label_mr: 'स्थापना वर्ष', label_en: 'Est. Year' },
  { value_mr: '२ बाजार', value_en: '2 Markets', label_mr: 'बाजार केंद्रे', label_en: 'Market Centers' },
  { value_mr: '८+', value_en: '8+', label_mr: 'शेतमाल प्रकार', label_en: 'Commodity Types' },
  { value_mr: '५०००+', value_en: '5000+', label_mr: 'नोंदणीकृत शेतकरी', label_en: 'Registered Farmers' },
];

export default function AboutPage() {
  const { t, language } = useLanguage();
  const supabase = createClient();

  const [intro, setIntro] = useState<AboutIntro | null>(null);
  const [missions, setMissions] = useState<AboutMission[]>([]);
  const [facts, setFacts] = useState<AboutKeyFact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAboutData() {
      try {
        setLoading(true);
        
        // Fetch intro
        const introQuery = await supabase.from('about_intro').select('*').limit(1).maybeSingle();
        
        // Fetch missions
        const missionsQuery = await supabase.from('about_missions')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        // Fetch key facts
        const factsQuery = await supabase.from('about_key_facts')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (introQuery.data) setIntro(introQuery.data);
        if (missionsQuery.data) setMissions(missionsQuery.data);
        if (factsQuery.data) setFacts(factsQuery.data);

      } catch (error) {
        console.error('Failed to load about page data from Supabase:', error);
      } finally {
        setLoading(false);
      }
    }

    loadAboutData();
  }, [supabase]);

  // Determine text content based on database values or fallbacks
  const displayIntro = intro 
    ? (language === 'mr' ? intro.content_mr : intro.content_en)
    : (language === 'mr' ? FALLBACK_INTRO.content_mr : FALLBACK_INTRO.content_en);

  const displayMissions = missions.length > 0 
    ? missions 
    : FALLBACK_MISSIONS.map((m, idx) => ({ id: String(idx), text_mr: m.text_mr, text_en: m.text_en, is_active: true, sort_order: idx }));

  const displayFacts = facts.length > 0
    ? facts
    : FALLBACK_FACTS.map((f, idx) => ({ id: String(idx), value_mr: f.value_mr, value_en: f.value_en, label_mr: f.label_mr, label_en: f.label_en, is_active: true, sort_order: idx }));

  return (
    <div className="min-h-screen bg-gray-50/50">
      <PageHero
        titleMr="आमच्याबद्दल"
        titleEn="About Us"
        subtitleMr="कृषी उत्पन्न बाजार समिती, मलकापूरची स्थापना आणि उद्दिष्टे."
        subtitleEn="The establishment and objectives of Agricultural Produce Market Committee, Malkapur."
        breadcrumbs={[{ labelMr: 'आमच्याबद्दल', labelEn: 'About Us' }]}
      />

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700 text-green-700" />
          <p className="text-gray-500 font-semibold">{t('माहिती लोड होत आहे...', 'Loading page information...')}</p>
        </div>
      ) : (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 max-w-5xl space-y-14 animate-fadeIn">

          {/* Introduction */}
          <section className="space-y-6">
            <SectionHeading
              titleMr="बाजार समितीची ओळख"
              titleEn="About the Committee"
              icon={Building2}
              accentColor="green"
            />
            <div className="prose prose-green max-w-none text-gray-700 space-y-4 text-base leading-relaxed whitespace-pre-line">
              <p>{displayIntro}</p>
            </div>
          </section>

          {/* Mission */}
          <section className="space-y-6">
            <SectionHeading
              titleMr="आमचे ध्येय"
              titleEn="Our Mission"
              icon={Target}
              accentColor="amber"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {displayMissions.map((item, idx) => (
                <div key={item.id || idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
                  <div className="w-2 h-2 rounded-full bg-green-600 mt-2 shrink-0" aria-hidden />
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {language === 'mr' ? item.text_mr : item.text_en}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Key Facts */}
          <section className="space-y-6">
            <SectionHeading
              titleMr="महत्त्वाची माहिती"
              titleEn="Key Facts"
              icon={Award}
              accentColor="blue"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {displayFacts.map((stat, idx) => (
                <div key={stat.id || idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center hover:shadow-md transition-shadow">
                  <div className="text-2xl font-extrabold text-green-800 mb-1">
                    {language === 'mr' ? stat.value_mr : stat.value_en}
                  </div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                    {language === 'mr' ? stat.label_mr : stat.label_en}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      )}

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
