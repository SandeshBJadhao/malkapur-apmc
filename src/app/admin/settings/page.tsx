'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SiteSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

type ToastType = 'success' | 'error';
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const SETTINGS_ROW_ID = '00000000-0000-0000-0000-000000000000';

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold transition-all duration-300 animate-slide-in',
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          {t.type === 'success' ? (
            <Lucide.CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <Lucide.XCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <Lucide.X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminSettingsPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  // Tab states for sectioning the settings
  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'social'>('general');

  // Form states
  const [marketName, setMarketName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [officeTimings, setOfficeTimings] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', SETTINGS_ROW_ID)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setMarketName(data.market_name || '');
        setAddress(data.address || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setOfficeTimings(data.office_timings || '');
        setSocialFacebook(data.social_facebook || '');
        setSocialTwitter(data.social_twitter || '');
        setSocialInstagram(data.social_instagram || '');
        setSocialYoutube(data.social_youtube || '');
      }
    } catch (err: any) {
      addToast('error', err.message || t('साइट सेटिंग्ज लोड करण्यात अयशस्वी', 'Failed to fetch site settings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marketName.trim()) {
      addToast('error', t('बाजार नाव हे आवश्यक फील्ड आहे.', 'Market Name is a required field.'));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: SETTINGS_ROW_ID,
        market_name: marketName.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        office_timings: officeTimings.trim() || null,
        social_facebook: socialFacebook.trim() || null,
        social_twitter: socialTwitter.trim() || null,
        social_instagram: socialInstagram.trim() || null,
        social_youtube: socialYoutube.trim() || null,
      };

      const { error } = await supabase
        .from('site_settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      addToast('success', t('साइट सेटिंग्ज यशस्वीरित्या अद्ययावत केल्या!', 'Site settings updated successfully!'));
      fetchSettings();
    } catch (err: any) {
      addToast('error', err.message || t('सेटिंग्ज जतन करण्यात अयशस्वी', 'Failed to save settings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <Lucide.Loader2 className="h-8 w-8 text-green-700 animate-spin" />
        <p className="mt-3 text-sm text-gray-500">{t('साइट सेटिंग्ज लोड होत आहेत...', 'Loading site settings...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{t('साइट सेटिंग्ज', 'Site Settings')}</h1>
        <p className="text-sm text-gray-500">{t('जागतिक मेटाडेटा, संपर्क तपशील, कामकाजाचे तास आणि सोशल मीडिया एकत्रीकरण कॉन्फिगर करा', 'Configure global metadata, contact details, working hours, and social media integrations')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation Tabs */}
        <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap md:whitespace-normal justify-start w-full",
              activeTab === 'general'
                ? "bg-green-900 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-100"
            )}
          >
            <Lucide.Info className="h-4 w-4 shrink-0" />
            {t('सामान्य माहिती', 'General Info')}
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap md:whitespace-normal justify-start w-full",
              activeTab === 'contact'
                ? "bg-green-900 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-100"
            )}
          >
            <Lucide.Phone className="h-4 w-4 shrink-0" />
            {t('संपर्क आणि वेळ', 'Contact & Timings')}
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap md:whitespace-normal justify-start w-full",
              activeTab === 'social'
                ? "bg-green-900 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-100"
            )}
          >
            <Lucide.Share2 className="h-4 w-4 shrink-0" />
            {t('सोशल मीडिया', 'Social Media')}
          </button>
        </div>

        {/* Content Card Form */}
        <form onSubmit={handleSave} className="flex-1 space-y-6">
          <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            {activeTab === 'general' && (
              <>
                <CardHeader className="border-b bg-gray-50/50">
                  <CardTitle className="text-base font-bold">{t('सामान्य माहिती', 'General Information')}</CardTitle>
                  <CardDescription>{t('APMC बाजार केंद्राचे प्राथमिक नाव आणि पत्ता कॉन्फिगर करा.', 'Configure primary name and address of the APMC market center.')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="market_name" className="text-xs font-bold text-gray-700">{t('बाजार नाव (मराठी/इंग्रजी)', 'Market Name (Marathi/English)')} <span className="text-red-500">*</span></Label>
                    <Input
                      id="market_name"
                      required
                      value={marketName}
                      onChange={(e) => setMarketName(e.target.value)}
                      placeholder="उदा. कृषी उत्पन्न बाजार समिती, मलकापूर"
                      className="border-gray-200 focus-visible:ring-green-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-xs font-bold text-gray-700">{t('भौतिक पत्ता', 'Physical Address')}</Label>
                    <Textarea
                      id="address"
                      rows={4}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="उदा. मुख्य बाजार आवार, राष्ट्रीय महामार्ग ६, मलकापूर..."
                      className="border-gray-200 focus-visible:ring-green-600 resize-none"
                    />
                  </div>
                </CardContent>
              </>
            )}

            {activeTab === 'contact' && (
              <>
                <CardHeader className="border-b bg-gray-50/50">
                  <CardTitle className="text-base font-bold">{t('संपर्क आणि वेळ', 'Contact & Timings')}</CardTitle>
                  <CardDescription>{t('संपर्क पृष्ठावर दाखवले जाणारे दूरध्वनी क्रमांक, ईमेल पत्ते आणि कामकाजाचे तास सेट करा.', 'Setup telephone numbers, email addresses, and working hours displayed on the contact page.')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-bold text-gray-700">{t('फोन / हेल्पलाइन नंबर', 'Phone / Helpline Numbers')}</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="उदा. ०७२६७-२२२०५२"
                        className="border-gray-200 focus-visible:ring-green-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-bold text-gray-700">{t('अधिकृत ईमेल', 'Official Email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="उदा. apmc.malkapur@yahoo.in"
                        className="border-gray-200 focus-visible:ring-green-600"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="office_timings" className="text-xs font-bold text-gray-700">{t('कार्यालय आणि बाजार वेळ', 'Office & Market Timings')}</Label>
                    <Textarea
                      id="office_timings"
                      rows={4}
                      value={officeTimings}
                      onChange={(e) => setOfficeTimings(e.target.value)}
                      placeholder="उदा. कार्यालय: १०:०० AM ते ०६:०० PM (रविवार सुट्टी)&#10;बाजार वेळ: १०:०० AM ते ०५:०० PM"
                      className="border-gray-200 focus-visible:ring-green-600 resize-none"
                    />
                  </div>
                </CardContent>
              </>
            )}

            {activeTab === 'social' && (
              <>
                <CardHeader className="border-b bg-gray-50/50">
                  <CardTitle className="text-base font-bold">{t('सोशल मीडिया एकत्रीकरण', 'Social Media Integration')}</CardTitle>
                  <CardDescription>{t('वेबसाईट फूटरमध्ये सानुकूल दुवे दाखवण्यासाठी सोशल मीडिया प्रोफाइल जोडा.', 'Link social media profiles to display custom links in the website footer.')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="social_facebook" className="text-xs font-bold text-gray-700">{t('Facebook URL', 'Facebook URL')}</Label>
                      <Input
                        id="social_facebook"
                        value={socialFacebook}
                        onChange={(e) => setSocialFacebook(e.target.value)}
                        placeholder="https://facebook.com/your-page"
                        className="border-gray-200 focus-visible:ring-green-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="social_twitter" className="text-xs font-bold text-gray-700">{t('Twitter / X URL', 'Twitter / X URL')}</Label>
                      <Input
                        id="social_twitter"
                        value={socialTwitter}
                        onChange={(e) => setSocialTwitter(e.target.value)}
                        placeholder="https://twitter.com/your-handle"
                        className="border-gray-200 focus-visible:ring-green-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="social_instagram" className="text-xs font-bold text-gray-700">{t('Instagram URL', 'Instagram URL')}</Label>
                      <Input
                        id="social_instagram"
                        value={socialInstagram}
                        onChange={(e) => setSocialInstagram(e.target.value)}
                        placeholder="https://instagram.com/your-handle"
                        className="border-gray-200 focus-visible:ring-green-600"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="social_youtube" className="text-xs font-bold text-gray-700">{t('YouTube Channel URL', 'YouTube Channel URL')}</Label>
                      <Input
                        id="social_youtube"
                        value={socialYoutube}
                        onChange={(e) => setSocialYoutube(e.target.value)}
                        placeholder="https://youtube.com/c/your-channel"
                        className="border-gray-200 focus-visible:ring-green-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 bg-white p-4 rounded-2xl border shadow-sm">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={fetchSettings}
              className="cursor-pointer"
            >
              {t('बदल रद्द करा', 'Reset Changes')}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer"
            >
              {saving ? <Lucide.Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lucide.Save className="h-4 w-4 mr-2" />}
              {saving ? t('जतन होत आहे...', 'Saving...') : t('साइट सेटिंग्ज जतन करा', 'Save Site Settings')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
