'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHero, SectionHeading } from '@/components/shared';
import { Image as ImageIcon, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface GalleryItem {
  id: string;
  titleMr: string;
  titleEn: string;
  category: 'yard' | 'infra' | 'events' | 'other';
  imageUrl: string;
}

const FALLBACK_ITEMS: GalleryItem[] = [
  {
    id: '1',
    titleMr: 'मुख्य बाजार आवार (शेतीमाल लिलाव क्षेत्र)',
    titleEn: 'Main Market Yard (Bidding Area)',
    category: 'yard',
    imageUrl: 'https://images.unsplash.com/photo-1595841696662-ac484d3d1912?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '2',
    titleMr: 'आधुनिक धान्य साठवणूक गोदाम (वेअरहाऊस)',
    titleEn: 'Modern Grain Storage Warehouse',
    category: 'infra',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '3',
    titleMr: 'शेतकरी प्रशिक्षण व मार्गदर्शन परिषद',
    titleEn: 'Farmer Training & Guidance Conference',
    category: 'events',
    imageUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '4',
    titleMr: 'संगणकीकृत वजन काटा व बिलिंग कक्ष',
    titleEn: 'Computerized Weighbridge & Billing Desk',
    category: 'infra',
    imageUrl: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '5',
    titleMr: 'बाजार समितीचा हिरवा व सौरऊर्जा परिसर',
    titleEn: 'Solar-Powered Eco-Friendly Mandi Campus',
    category: 'infra',
    imageUrl: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: '6',
    titleMr: 'कापूस खरेदी व ग्रेडिंग विभाग',
    titleEn: 'Cotton Grading & Procurement Section',
    category: 'yard',
    imageUrl: 'https://images.unsplash.com/photo-1598986646512-93d5be8c0ed4?q=80&w=1200&auto=format&fit=crop',
  },
];

export default function GalleryPage() {
  const { t, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(FALLBACK_ITEMS);
  const supabase = createClient();

  useEffect(() => {
    async function fetchGallery() {
      try {
        const { data, error } = await supabase
          .from('gallery_items')
          .select('*')
          .eq('is_published', true)
          .order('sort_order', { ascending: true });

        if (data && data.length > 0) {
          setGalleryItems(
            data.map((item) => ({
              id: item.id,
              titleMr: item.title_mr || item.title_en || '',
              titleEn: item.title_en || item.title_mr || '',
              category: (item.category as GalleryItem['category']) || 'other',
              imageUrl: item.image_url,
            }))
          );
        }
        // If DB is empty, fallback items remain as-is
      } catch {
        // Silently fall back to default items
      }
    }
    fetchGallery();
  }, []);

  const categories = [
    { key: 'all',    labelMr: 'सर्व छायाचित्रे',     labelEn: 'All Photos' },
    { key: 'yard',   labelMr: 'बाजार आवार',           labelEn: 'Market Yard' },
    { key: 'infra',  labelMr: 'पायाभूत सुविधा',       labelEn: 'Infrastructure' },
    { key: 'events', labelMr: 'कार्यक्रम व बैठका',    labelEn: 'Events & Meetings' },
    { key: 'other',  labelMr: 'इतर',                  labelEn: 'Other' },
  ];

  const filteredItems = activeFilter === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeFilter);

  // ── Lightbox helpers ────────────────────────────────────────────────────────
  const openLightbox  = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
  }, [lightboxIndex, filteredItems.length]);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
  }, [lightboxIndex, filteredItems.length]);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      closeLightbox();
      if (e.key === 'ArrowLeft')   goPrev();
      if (e.key === 'ArrowRight')  goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, goPrev, goNext]);

  // Lock body scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIndex]);

  const activeLightboxItem = lightboxIndex !== null ? filteredItems[lightboxIndex] : null;

  return (
    <div className="bg-gray-50/50 min-h-screen pb-16">
      <PageHero
        titleMr="छायाचित्र गॅलरी"
        titleEn="Photo Gallery"
        subtitleMr="मलकापूर कृषी उत्पन्न बाजार समितीच्या पायाभूत सुविधा, लिलाव प्रक्रिया आणि विविध उपक्रमांची झलक."
        subtitleEn="Visual showcase of Malkapur APMC infrastructure, bidding actions, events, and facilities."
        breadcrumbs={[{ labelMr: 'गॅलरी', labelEn: 'Gallery' }]}
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200/60 pb-6">
          <SectionHeading
            titleMr="बाजार समितीची झलक"
            titleEn="Glimpses of APMC Campus"
            subtitleMr="अधिकृत छायाचित्रे"
            subtitleEn="Official photo database"
            icon={ImageIcon}
            className="pl-0 border-l-0"
          />

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                id={`gallery-filter-${cat.key}`}
                onClick={() => { setActiveFilter(cat.key); setLightboxIndex(null); }}
                className={cn(
                  'px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg border transition-all duration-200 active:scale-95 cursor-pointer',
                  activeFilter === cat.key
                    ? 'bg-green-700 text-white border-green-700 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                {t(cat.labelMr, cat.labelEn)}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="py-24 text-center text-gray-400 text-lg font-medium">
            {t('कोणतेही छायाचित्र उपलब्ध नाही.', 'No photos available for this category.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item, idx) => (
              <button
                key={item.id}
                id={`gallery-item-${item.id}`}
                onClick={() => openLightbox(idx)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group flex flex-col text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                aria-label={`View ${language === 'mr' ? item.titleMr : item.titleEn}`}
              >
                {/* Image */}
                <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={language === 'mr' ? item.titleMr : item.titleEn}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white scale-90 group-hover:scale-100 transition-transform duration-300">
                      <ZoomIn className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="p-5 flex-grow flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-green-800 transition-colors">
                    {language === 'mr' ? item.titleMr : item.titleEn}
                  </h3>
                  <span className="p-1 bg-gray-50 text-gray-400 group-hover:text-green-700 group-hover:bg-green-50 rounded transition-colors shrink-0">
                    <ZoomIn className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox Modal ───────────────────────────────────────────────────── */}
      {activeLightboxItem && (
        <div
          id="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={language === 'mr' ? activeLightboxItem.titleMr : activeLightboxItem.titleEn}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fadeIn"
          onClick={closeLightbox}
        >
          {/* Inner panel — stop propagation so clicks inside don't close */}
          <div
            className="relative flex flex-col items-center w-full max-w-5xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              id="gallery-lightbox-close"
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors z-10 cursor-pointer"
              aria-label="Close"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Counter */}
            <p className="absolute -top-12 left-0 text-white/60 text-sm font-medium select-none">
              {(lightboxIndex ?? 0) + 1} / {filteredItems.length}
            </p>

            {/* Image */}
            <div className="relative w-full rounded-xl overflow-hidden bg-gray-900 shadow-2xl" style={{ aspectRatio: '16/9' }}>
              <Image
                src={activeLightboxItem.imageUrl}
                alt={language === 'mr' ? activeLightboxItem.titleMr : activeLightboxItem.titleEn}
                fill
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-contain"
                priority
              />
            </div>

            {/* Title */}
            <p className="mt-4 text-white/90 text-base font-semibold text-center px-4">
              {language === 'mr' ? activeLightboxItem.titleMr : activeLightboxItem.titleEn}
            </p>

            {/* Prev / Next */}
            {filteredItems.length > 1 && (
              <>
                <button
                  id="gallery-lightbox-prev"
                  onClick={goPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-12 bg-white/10 hover:bg-white/25 text-white rounded-full p-2 backdrop-blur-sm transition-colors cursor-pointer"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  id="gallery-lightbox-next"
                  onClick={goNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-12 bg-white/10 hover:bg-white/25 text-white rounded-full p-2 backdrop-blur-sm transition-colors cursor-pointer"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease; }
      `}</style>
    </div>
  );
}
