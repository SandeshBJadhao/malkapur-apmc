'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHero, SectionHeading } from '@/components/shared';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  Info, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
    }, 800);
  };

  const contactDetails = [
    {
      icon: MapPin,
      titleMr: 'पत्ता',
      titleEn: 'Address',
      contentMr: 'कृषी उत्पन्न बाजार समिती, मुख्य बाजार आवार, राष्ट्रीय महामार्ग ६, मलकापूर, जि. बुलढाणा - ४४३१०१, महाराष्ट्र',
      contentEn: 'Agricultural Produce Market Committee, Main Yard, National Highway 6, Malkapur, Buldhana District - 443101, Maharashtra, India',
    },
    {
      icon: Phone,
      titleMr: 'संपर्क क्रमांक',
      titleEn: 'Phone Numbers',
      contentMr: 'कार्यालय: ०७२६७-२२२०५२\nनियंत्रण कक्ष: +९१ ९४२३४ ५६७८९\nतक्रार कक्ष: +९१ ९८७६५ ४३२१०',
      contentEn: 'Office: 07267-222052\nControl Room: +91 94234 56789\nHelpline: +91 98765 43210',
    },
    {
      icon: Mail,
      titleMr: 'ईमेल',
      titleEn: 'Email Addresses',
      contentMr: 'apmc.malkapur@yahoo.in\nsupport@apmcmalkapur.org',
      contentEn: 'apmc.malkapur@yahoo.in\nsupport@apmcmalkapur.org',
    },
    {
      icon: Clock,
      titleMr: 'कामकाजाची वेळ',
      titleEn: 'Working Hours',
      contentMr: 'कार्यालय: १०:०० AM ते ०६:०० PM (रविवार सुट्टी)\nबाजार वेळ: १०:०० AM ते ०५:०० PM',
      contentEn: 'Office Hours: 10:00 AM to 06:00 PM (Sunday Closed)\nMarket Timings: 10:00 AM to 05:00 PM',
    }
  ];

  return (
    <div className="bg-gray-50/50 min-h-screen pb-16">
      <PageHero
        titleMr="आमच्याशी संपर्क साधा"
        titleEn="Contact Us"
        subtitleMr="कृषी उत्पन्न बाजार समिती, मलकापूर यांच्याशी संपर्क साधण्यासाठी पत्ते, दूरध्वनी क्रमांक आणि ईमेल आयडी."
        subtitleEn="Get in touch with Malkapur APMC. Find our office locations, telephone numbers, and email contacts."
        breadcrumbs={[
          { labelMr: 'संपर्क', labelEn: 'Contact' }
        ]}
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-16">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Info cards */}
          <div className="lg:col-span-5 space-y-6">
            <SectionHeading
              titleMr="संपर्क माहिती"
              titleEn="Contact Information"
              subtitleMr="अधिकृत कार्यालय व मदत कक्ष"
              subtitleEn="Official offices and helpline channels"
              icon={Building2}
              className="pl-0 border-l-0 mb-4"
            />

            <div className="space-y-6">
              {contactDetails.map((detail, idx) => {
                const Icon = detail.icon;
                return (
                  <Card key={idx} className="border border-gray-100 hover:border-green-200 transition-all duration-300 shadow-sm">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="p-3 bg-green-50 text-green-700 rounded-xl shrink-0 mt-0.5">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5 flex-grow">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                          {language === 'mr' ? detail.titleMr : detail.titleEn}
                        </h3>
                        <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed">
                          {language === 'mr' ? detail.contentMr : detail.contentEn}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className="lg:col-span-7 space-y-6">
            <SectionHeading
              titleMr="चौकशी किंवा तक्रार अर्ज"
              titleEn="Inquiry & Complaint Form"
              subtitleMr="थेट आमच्या टीमशी संपर्क साधण्यासाठी खालील अर्ज भरा"
              subtitleEn="Fill out the form below to reach out to our administrative team"
              icon={Send}
              className="pl-0 border-l-0 mb-4"
            />

            <Card className="border border-gray-100 shadow-md p-6 sm:p-8 bg-white rounded-2xl relative overflow-hidden">
              <CardContent className="p-0">
                {submitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="h-16 w-16 bg-green-50 text-green-700 rounded-full flex items-center justify-center mx-auto border border-green-100 shadow-inner">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {t('अर्ज यशस्वीरित्या सादर केला!', 'Form Submitted Successfully!')}
                      </h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                        {t(
                          'आपल्या संदेशाची नोंद झाली आहे. आमची टीम लवकरच आपल्याशी संपर्क करेल. धन्यवाद!',
                          'Thank you for reaching out. Your message has been successfully logged. Our administrative team will respond shortly.'
                        )}
                      </p>
                    </div>
                    <Button 
                      onClick={() => setSubmitted(false)}
                      className="bg-green-700 hover:bg-green-800 text-white font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {t('नवीन अर्ज भरा', 'Send Another Message')}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold text-gray-700">
                          {t('शेतकरी/व्यापाऱ्याचे नाव *', 'Your Name *')}
                        </label>
                        <Input
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={t('पूर्ण नाव टाका', 'Enter full name')}
                          className="border-gray-200 focus-visible:ring-green-600 rounded-lg bg-gray-50/30"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold text-gray-700">
                          {t('संपर्क क्रमांक *', 'Mobile Number *')}
                        </label>
                        <Input
                          required
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={t('मोबाईल नंबर टाका', 'Enter 10-digit mobile number')}
                          className="border-gray-200 focus-visible:ring-green-600 rounded-lg bg-gray-50/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold text-gray-700">
                          {t('ईमेल आयडी (पर्यायी)', 'Email Address (Optional)')}
                        </label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder={t('उदा. name@example.com', 'e.g. name@example.com')}
                          className="border-gray-200 focus-visible:ring-green-600 rounded-lg bg-gray-50/30"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold text-gray-700">
                          {t('विषय *', 'Subject *')}
                        </label>
                        <Input
                          required
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder={t('उदा. बाजार दर, पेमेंट, सेवा', 'e.g. Market Rates, Payment, Services')}
                          className="border-gray-200 focus-visible:ring-green-600 rounded-lg bg-gray-50/30"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold text-gray-700">
                        {t('तुमचा संदेश/तक्रार *', 'Your Message / Complaint *')}
                      </label>
                      <Textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={t('येथे संदेश टाईप करा...', 'Write details here...')}
                        className="border-gray-200 focus-visible:ring-green-600 rounded-lg bg-gray-50/30 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="h-4 w-4 shrink-0" />
                      <span>{t('संदेश पाठवा', 'Send Message')}</span>
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Map Section */}
        <section className="space-y-6">
          <SectionHeading
            titleMr="मुख्य बाजार नकाशा व स्थान"
            titleEn="APMC Location on Map"
            subtitleMr="मलकापूर मुख्य बाजार आवार राष्ट्रीय महामार्ग ६ लगत आहे"
            subtitleEn="Our main market yard is conveniently located along National Highway 6"
            className="pl-0 border-l-0 mb-4"
          />

          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-md">
            {/* Visual Placeholder for Google Map */}
            <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <MapPin className="h-12 w-12 text-rose-500 animate-bounce" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-gray-900 text-lg">
                  {t('कृषी उत्पन्न बाजार समिती, मलकापूर', 'Agricultural Produce Market Committee, Malkapur')}
                </h4>
                <p className="text-gray-500 text-sm max-w-md">
                  {t(
                    'राष्ट्रीय महामार्ग ६, मलकापूर, जिल्हा बुलढाणा, महाराष्ट्र, भारत',
                    'National Highway 6, Malkapur, Buldhana District, Maharashtra, India'
                  )}
                </p>
              </div>
              
              <a 
                href="https://maps.google.com/?q=APMC+Malkapur+Buldhana"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all hover:shadow text-sm"
              >
                {t('गुगल मॅपवर पहा', 'View on Google Maps')}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
