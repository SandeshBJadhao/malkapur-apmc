'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { AboutIntro, AboutMission, AboutKeyFact } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as Lucide from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold transition-all duration-300 animate-slideUp',
            t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          {t.type === 'success' ? (
            <Lucide.CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <Lucide.XCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer">
            <Lucide.X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminAboutPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Page data states
  const [intro, setIntro] = useState<AboutIntro | null>(null);
  const [missions, setMissions] = useState<AboutMission[]>([]);
  const [facts, setFacts] = useState<AboutKeyFact[]>([]);
  
  // Loading states
  const [loadingIntro, setLoadingIntro] = useState(true);
  const [loadingMissions, setLoadingMissions] = useState(true);
  const [loadingFacts, setLoadingFacts] = useState(true);
  const [savingIntro, setSavingIntro] = useState(false);

  // Form states - Intro
  const [introMr, setIntroMr] = useState('');
  const [introEn, setIntroEn] = useState('');

  // Form states - Mission Modal
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<AboutMission | null>(null);
  const [missionMr, setMissionMr] = useState('');
  const [missionEn, setMissionEn] = useState('');
  const [missionOrder, setMissionOrder] = useState(10);
  const [missionActive, setMissionActive] = useState(true);
  const [savingMission, setSavingMission] = useState(false);

  // Form states - Fact Modal
  const [isFactModalOpen, setIsFactModalOpen] = useState(false);
  const [editingFact, setEditingFact] = useState<AboutKeyFact | null>(null);
  const [factValMr, setFactValMr] = useState('');
  const [factValEn, setFactValEn] = useState('');
  const [factLblMr, setFactLblMr] = useState('');
  const [factLblEn, setFactLblEn] = useState('');
  const [factOrder, setFactOrder] = useState(10);
  const [factActive, setFactActive] = useState(true);
  const [savingFact, setSavingFact] = useState(false);

  // Deletion states for custom modal
  const [deletingMissionId, setDeletingMissionId] = useState<string | null>(null);
  const [deletingFactId, setDeletingFactId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Helper to add toasts
  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Intro
  const fetchIntro = async () => {
    try {
      setLoadingIntro(true);
      const { data, error } = await supabase.from('about_intro').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (data) {
        setIntro(data);
        setIntroMr(data.content_mr);
        setIntroEn(data.content_en);
      }
    } catch (err: any) {
      console.error(err);
      showToast('परिचय माहिती लोड करण्यास अडचण आली / Error loading introduction', 'error');
    } finally {
      setLoadingIntro(false);
    }
  };

  // Fetch Missions
  const fetchMissions = async () => {
    try {
      setLoadingMissions(true);
      const { data, error } = await supabase.from('about_missions').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      setMissions(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('ध्येय माहिती लोड करण्यास अडचण आली / Error loading missions', 'error');
    } finally {
      setLoadingMissions(false);
    }
  };

  // Fetch Facts
  const fetchFacts = async () => {
    try {
      setLoadingFacts(true);
      const { data, error } = await supabase.from('about_key_facts').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      setFacts(data || []);
    } catch (err: any) {
      console.error(err);
      showToast('महत्त्वाची माहिती लोड करण्यास अडचण आली / Error loading key facts', 'error');
    } finally {
      setLoadingFacts(false);
    }
  };

  useEffect(() => {
    fetchIntro();
    fetchMissions();
    fetchFacts();
  }, []);

  // Save Intro
  const handleSaveIntro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!introMr.trim() || !introEn.trim()) {
      showToast('कृपया दोन्ही भाषांमधील माहिती भरा / Please enter content for both languages', 'error');
      return;
    }

    try {
      setSavingIntro(true);
      if (intro) {
        // Update existing row
        const { error } = await supabase
          .from('about_intro')
          .update({
            content_mr: introMr,
            content_en: introEn,
            updated_at: new Date().toISOString(),
          })
          .eq('id', intro.id);

        if (error) throw error;
        showToast('परिचय माहिती यशस्वीरीत्या जतन केली / Introduction updated successfully');
      } else {
        // Insert new row
        const { data, error } = await supabase
          .from('about_intro')
          .insert({
            content_mr: introMr,
            content_en: introEn,
          })
          .select()
          .single();

        if (error) throw error;
        setIntro(data);
        showToast('परिचय माहिती यशस्वीरीत्या जतन केली / Introduction saved successfully');
      }
    } catch (err: any) {
      console.error(err);
      showToast('जतन करण्यास अडचण आली / Failed to save introduction', 'error');
    } finally {
      setSavingIntro(false);
    }
  };

  // Add or Update Mission
  const handleSaveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionMr.trim() || !missionEn.trim()) {
      showToast('कृपया माहिती पूर्ण भरा / Please fill out all fields', 'error');
      return;
    }

    try {
      setSavingMission(true);
      if (editingMission) {
        // Update
        const { error } = await supabase
          .from('about_missions')
          .update({
            text_mr: missionMr,
            text_en: missionEn,
            sort_order: missionOrder,
            is_active: missionActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingMission.id);

        if (error) throw error;
        showToast('ध्येय सुधारित केले / Mission updated successfully');
      } else {
        // Create
        const { error } = await supabase.from('about_missions').insert({
          text_mr: missionMr,
          text_en: missionEn,
          sort_order: missionOrder,
          is_active: missionActive,
        });

        if (error) throw error;
        showToast('नवीन ध्येय जोडले / Mission added successfully');
      }

      setIsMissionModalOpen(false);
      setEditingMission(null);
      setMissionMr('');
      setMissionEn('');
      setMissionOrder(10);
      setMissionActive(true);
      fetchMissions();
    } catch (err: any) {
      console.error(err);
      showToast('क्रिया अयशस्वी / Operation failed', 'error');
    } finally {
      setSavingMission(false);
    }
  };

  // Delete Mission
  const confirmDeleteMission = async () => {
    if (!deletingMissionId) return;
    try {
      setDeleteLoading(true);
      const { error } = await supabase.from('about_missions').delete().eq('id', deletingMissionId);
      if (error) throw error;
      showToast(t('ध्येय हटवले / Mission deleted successfully', 'Mission deleted successfully'));
      fetchMissions();
    } catch (err: any) {
      console.error(err);
      showToast(t('ध्येय हटवण्यास अडचण आली / Failed to delete mission', 'Failed to delete mission'), 'error');
    } finally {
      setDeleteLoading(false);
      setDeletingMissionId(null);
    }
  };

  // Toggle Mission Status
  const handleToggleMissionStatus = async (item: AboutMission) => {
    try {
      const { error } = await supabase
        .from('about_missions')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      if (error) throw error;
      showToast(item.is_active ? 'ध्येय अक्रिय केले / Mission deactivated' : 'ध्येय सक्रिय केले / Mission activated');
      fetchMissions();
    } catch (err: any) {
      console.error(err);
      showToast('स्थिती बदलण्यास अडचण आली / Failed to toggle status', 'error');
    }
  };

  // Add or Update Fact
  const handleSaveFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factValMr.trim() || !factValEn.trim() || !factLblMr.trim() || !factLblEn.trim()) {
      showToast('कृपया माहिती पूर्ण भरा / Please fill out all fields', 'error');
      return;
    }

    try {
      setSavingFact(true);
      if (editingFact) {
        // Update
        const { error } = await supabase
          .from('about_key_facts')
          .update({
            value_mr: factValMr,
            value_en: factValEn,
            label_mr: factLblMr,
            label_en: factLblEn,
            sort_order: factOrder,
            is_active: factActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFact.id);

        if (error) throw error;
        showToast('माहिती सुधारित केली / Fact updated successfully');
      } else {
        // Create
        const { error } = await supabase.from('about_key_facts').insert({
          value_mr: factValMr,
          value_en: factValEn,
          label_mr: factLblMr,
          label_en: factLblEn,
          sort_order: factOrder,
          is_active: factActive,
        });

        if (error) throw error;
        showToast('नवीन माहिती जोडली / Fact added successfully');
      }

      setIsFactModalOpen(false);
      setEditingFact(null);
      setFactValMr('');
      setFactValEn('');
      setFactLblMr('');
      setFactLblEn('');
      setFactOrder(10);
      setFactActive(true);
      fetchFacts();
    } catch (err: any) {
      console.error(err);
      showToast('क्रिया अयशस्वी / Operation failed', 'error');
    } finally {
      setSavingFact(false);
    }
  };

  // Delete Fact
  const confirmDeleteFact = async () => {
    if (!deletingFactId) return;
    try {
      setDeleteLoading(true);
      const { error } = await supabase.from('about_key_facts').delete().eq('id', deletingFactId);
      if (error) throw error;
      showToast(t('माहिती हटवली / Fact deleted successfully', 'Fact deleted successfully'));
      fetchFacts();
    } catch (err: any) {
      console.error(err);
      showToast(t('माहिती हटवण्यास अडचण आली / Failed to delete key fact', 'Failed to delete key fact'), 'error');
    } finally {
      setDeleteLoading(false);
      setDeletingFactId(null);
    }
  };

  // Toggle Fact Status
  const handleToggleFactStatus = async (item: AboutKeyFact) => {
    try {
      const { error } = await supabase
        .from('about_key_facts')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);
      if (error) throw error;
      showToast(item.is_active ? 'माहिती अक्रिय केली / Fact deactivated' : 'माहिती सक्रिय केली / Fact activated');
      fetchFacts();
    } catch (err: any) {
      console.error(err);
      showToast('स्थिती बदलण्यास अडचण आली / Failed to toggle status', 'error');
    }
  };

  // Helper to open Mission Modal
  const openMissionModal = (item: AboutMission | null = null) => {
    if (item) {
      setEditingMission(item);
      setMissionMr(item.text_mr);
      setMissionEn(item.text_en);
      setMissionOrder(item.sort_order);
      setMissionActive(item.is_active);
    } else {
      setEditingMission(null);
      setMissionMr('');
      setMissionEn('');
      setMissionOrder(missions.length > 0 ? Math.max(...missions.map(m => m.sort_order)) + 10 : 10);
      setMissionActive(true);
    }
    setIsMissionModalOpen(true);
  };

  // Helper to open Fact Modal
  const openFactModal = (item: AboutKeyFact | null = null) => {
    if (item) {
      setEditingFact(item);
      setFactValMr(item.value_mr);
      setFactValEn(item.value_en);
      setFactLblMr(item.label_mr);
      setFactLblEn(item.label_en);
      setFactOrder(item.sort_order);
      setFactActive(item.is_active);
    } else {
      setEditingFact(null);
      setFactValMr('');
      setFactValEn('');
      setFactLblMr('');
      setFactLblEn('');
      setFactOrder(facts.length > 0 ? Math.max(...facts.map(f => f.sort_order)) + 10 : 10);
      setFactActive(true);
    }
    setIsFactModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Lucide.Info className="h-6 w-6 text-green-700 shrink-0" />
            {t('आमच्याबद्दल व्यवस्थापन', 'About Us Management')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('बाजार समितीचा परिचय, ध्येय आणि महत्त्वाची आकडेवारी येथून व्यवस्थापित करा. शेजारी दिलेले लाईव्ह प्रिव्ह्यू बदल दाखवते.', 'Manage APMC introduction, mission goals, and key statistics here. The live preview alongside shows changes instantly.')}
          </p>
        </div>
      </div>

      {/* SECTION 1: Introduction Text (Split-Screen Layout) */}
      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 text-green-700 rounded-lg">
              <Lucide.Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                {t('१. बाजार समिती ओळख', '1. Introduction Section')}
              </CardTitle>
              <CardDescription>
                {t('वेबसाईटवरील परिचय परिच्छेद सुधारित करा.', 'Edit the introduction paragraph shown on the website.')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            {/* Left: Input Form */}
            <div className="p-6 space-y-6">
              {loadingIntro ? (
                <div className="py-12 flex flex-col justify-center items-center gap-2 text-gray-500">
                  <Lucide.Loader2 className="h-6 w-6 animate-spin text-green-700" />
                  <span className="text-xs font-semibold">{t('ओळख लोड होत आहे...', 'Loading introduction...')}</span>
                </div>
              ) : (
                <form onSubmit={handleSaveIntro} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="intro-mr" className="text-xs font-bold text-gray-700 flex items-center gap-2">
                      <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded font-extrabold">मराठी (MR)</span>
                      {t('ओळख परिच्छेद', 'Introduction Paragraph')}
                    </Label>
                    <Textarea
                      id="intro-mr"
                      rows={5}
                      value={introMr}
                      onChange={(e) => setIntroMr(e.target.value)}
                      placeholder={t('बाजार समितीची माहिती मराठीमध्ये प्रविष्ट करा...', 'Enter APMC information in Marathi...')}
                      className="border-gray-200 focus:border-green-600 focus:ring-green-600 rounded-xl leading-relaxed text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intro-en" className="text-xs font-bold text-gray-700 flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-extrabold">ENGLISH (EN)</span>
                      {t('ओळख परिच्छेद (इंग्रजी)', 'Introduction Paragraph (English)')}
                    </Label>
                    <Textarea
                      id="intro-en"
                      rows={5}
                      value={introEn}
                      onChange={(e) => setIntroEn(e.target.value)}
                      placeholder={t('बाजार समितीची माहिती इंग्रजीमध्ये प्रविष्ट करा...', 'Enter the APMC introduction in English...')}
                      className="border-gray-200 focus:border-green-600 focus:ring-green-600 rounded-xl leading-relaxed text-sm"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      disabled={savingIntro}
                      className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer rounded-xl px-5 py-2"
                    >
                      {savingIntro ? (
                        <>
                          <Lucide.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t('जतन होत आहे...', 'Saving...')}
                        </>
                      ) : (
                        <>
                          <Lucide.Save className="h-4 w-4 mr-2" />
                          {t('ओळख जतन करा', 'Save Introduction')}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Right: Live Preview Panel */}
            <div className="p-6 bg-gray-50/50 flex flex-col justify-start">
              <div className="mb-4 flex items-center justify-between border-b pb-2 border-gray-250">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t('लाईव्ह प्रिव्ह्यू', 'Live Preview')}
                </span>
                <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  {t('बाजार समिती ओळख', 'APMC Introduction')}
                </span>
              </div>
              <div className="bg-white p-5 border border-gray-150 rounded-xl shadow-xs space-y-4 max-h-[380px] overflow-y-auto">
                <div className="border-l-4 border-green-700 pl-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase">{t('वेबसाईटवर असे दिसेल:', 'Shown on website:')}</h4>
                  <h3 className="text-sm font-extrabold text-gray-800">{t('बाजार समितीची ओळख', 'About the Committee')}</h3>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-line bg-gray-50/20 p-2.5 rounded border border-gray-100">
                  {introMr || t('मराठी माहिती खालील फॉर्ममध्ये भरा.', 'Please fill Marathi description.')}
                </p>
                <hr className="border-gray-100" />
                <p className="text-xs text-gray-500 leading-relaxed italic whitespace-pre-line bg-gray-50/20 p-2.5 rounded border border-gray-100">
                  {introEn || t('इंग्रजी माहिती खालील फॉर्ममध्ये भरा.', 'Please fill English description.')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Our Mission (Split-Screen Layout) */}
      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Lucide.Target className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  {t('२. आमचे ध्येय', '2. Our Mission Points')}
                </CardTitle>
                <CardDescription>
                  {t('ध्येय आणि उद्दिष्टांचे वैयक्तिक कार्डस् व्यवस्थापित करा.', 'Manage individual mission and objectives cards.')}
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => openMissionModal(null)}
              className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs px-4 py-2 h-auto cursor-pointer rounded-xl shrink-0"
            >
              <Lucide.PlusCircle className="h-4 w-4 mr-1.5" />
              {t('ध्येय जोडा', 'Add Mission')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            {/* Left: Input List */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {loadingMissions ? (
                <div className="py-12 flex justify-center items-center gap-2 text-gray-500">
                  <Lucide.Loader2 className="h-6 w-6 animate-spin text-green-700" />
                  <span className="text-xs font-semibold">{t('ध्येय लोड होत आहेत...', 'Loading missions...')}</span>
                </div>
              ) : missions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed rounded-2xl">
                  {t('कोणतीही ध्येय माहिती उपलब्ध नाही. जोडण्यासाठी \'ध्येय जोडा\' वर क्लिक करा.', "No mission points found. Click 'Add Mission' to add one.")}
                </div>
              ) : (
                <div className="space-y-3">
                  {missions.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'p-4 rounded-xl border flex items-center justify-between gap-4 transition-all bg-white shadow-xs',
                        item.is_active ? 'border-gray-200 hover:border-green-300' : 'border-gray-150 opacity-60 bg-gray-50'
                      )}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-gray-100 text-gray-700 font-extrabold text-[10px] px-2 py-0.5 rounded border border-gray-200">
                            {t('क्रम', 'Order')}: {item.sort_order}
                          </span>
                          {item.is_active ? (
                            <Badge className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold">{t('सक्रिय', 'Active')}</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-bold">{t('अक्रिय', 'Inactive')}</Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            <span className="text-green-800 text-[10px] font-extrabold mr-1">{t('मराठी', 'Marathi')}:</span>
                            {item.text_mr}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            <span className="text-blue-800 text-[9px] font-extrabold mr-1">English:</span>
                            {item.text_en}
                          </p>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleMissionStatus(item)}
                          title={item.is_active ? t('अक्रिय करा', 'Deactivate') : t('सक्रिय करा', 'Activate')}
                          className="h-8 w-8 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg cursor-pointer"
                        >
                          {item.is_active ? <Lucide.Eye className="h-4 w-4" /> : <Lucide.EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openMissionModal(item)}
                          title={t('सुधारित करा', 'Edit')}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                        >
                          <Lucide.Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingMissionId(item.id)}
                          title={t('हटवा', 'Delete')}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Lucide.Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Live Preview Panel */}
            <div className="p-6 bg-gray-50/50 flex flex-col justify-start">
              <div className="mb-4 flex items-center justify-between border-b pb-2 border-gray-250">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t('लाईव्ह प्रिव्ह्यू', 'Live Preview')}
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {t('आमचे ध्येय', 'Our Mission')}
                </span>
              </div>
              
              <div className="bg-white p-5 border border-gray-150 rounded-xl shadow-xs space-y-4 max-h-[440px] overflow-y-auto">
                <h4 className="text-xs font-bold text-gray-400 uppercase">{t('वेबसाईटवर असे दिसेल (Our Mission):', 'Shown on website (Our Mission):')}</h4>
                <div className="grid grid-cols-1 gap-3">
                  {missions.filter(m => m.is_active).map((item, idx) => (
                    <div key={item.id || idx} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3 hover:shadow-xs transition-shadow">
                      <div className="w-2 h-2 rounded-full bg-green-600 mt-2 shrink-0 animate-pulse" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-gray-800 leading-relaxed">{item.text_mr}</p>
                        <p className="text-[11px] text-gray-500 leading-relaxed italic">{item.text_en}</p>
                      </div>
                    </div>
                  ))}
                  {missions.filter(m => m.is_active).length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400 italic">{t('कोणतेही सक्रिय ध्येय प्रिव्ह्यू उपलब्ध नाही.', 'No active mission preview available.')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: Key Facts (Split-Screen Layout with Grid fix) */}
      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Lucide.Award className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  {t('३. महत्त्वाची माहिती', '3. Key Facts Stats')}
                </CardTitle>
                <CardDescription>
                  {t('बाजार समितीची आकडेवारी व सांख्यिकी कार्ड्स व्यवस्थापित करा.', 'Manage APMC stats and facts cards.')}
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => openFactModal(null)}
              className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs px-4 py-2 h-auto cursor-pointer rounded-xl shrink-0"
            >
              <Lucide.PlusCircle className="h-4 w-4 mr-1.5" />
              {t('माहिती जोडा', 'Add Fact')}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            {/* Left: Input List */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              {loadingFacts ? (
                <div className="py-12 flex justify-center items-center gap-2 text-gray-500">
                  <Lucide.Loader2 className="h-6 w-6 animate-spin text-green-700" />
                  <span className="text-xs font-semibold">{t('आकडेवारी लोड होत आहे...', 'Loading stats...')}</span>
                </div>
              ) : facts.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed rounded-2xl">
                  {t('कोणतीही आकडेवारी उपलब्ध नाही. जोडण्यासाठी \'माहिती जोडा\' वर क्लिक करा.', "No stat facts found. Click 'Add Fact' to add one.")}
                </div>
              ) : (
                <div className="space-y-3">
                  {facts.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        'p-4 rounded-xl border flex items-center justify-between gap-4 transition-all bg-white shadow-xs',
                        item.is_active ? 'border-gray-200 hover:border-blue-300' : 'border-gray-150 opacity-60 bg-gray-50'
                      )}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-gray-100 text-gray-700 font-extrabold text-[10px] px-2 py-0.5 rounded border border-gray-200">
                            {t('क्रम', 'Order')}: {item.sort_order}
                          </span>
                          {item.is_active ? (
                            <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">{t('सक्रिय', 'Active')}</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-500 border border-gray-200 text-[10px] font-bold">{t('अक्रिय', 'Inactive')}</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div className="min-w-0">
                            <span className="text-[10px] text-gray-400 font-bold block uppercase">{t('संख्या', 'Value')}</span>
                            <p className="text-sm font-extrabold text-green-800 truncate">
                              {item.value_mr} <span className="text-xs text-gray-400 font-normal">({item.value_en})</span>
                            </p>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-gray-400 font-bold block uppercase">{t('नाव', 'Label')}</span>
                            <p className="text-xs font-bold text-gray-700 truncate">
                              {item.label_mr} <span className="text-[10px] text-gray-400 font-normal">({item.label_en})</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFactStatus(item)}
                          title={item.is_active ? t('अक्रिय करा', 'Deactivate') : t('सक्रिय करा', 'Activate')}
                          className="h-8 w-8 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-lg cursor-pointer"
                        >
                          {item.is_active ? <Lucide.Eye className="h-4 w-4" /> : <Lucide.EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openFactModal(item)}
                          title={t('सुधारित करा', 'Edit')}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                        >
                          <Lucide.Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingFactId(item.id)}
                          title={t('हटवा', 'Delete')}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Lucide.Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Live Preview Panel */}
            <div className="p-6 bg-gray-50/50 flex flex-col justify-start">
              <div className="mb-4 flex items-center justify-between border-b pb-2 border-gray-250">
                <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {t('लाईव्ह प्रिव्ह्यू', 'Live Preview')}
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {t('महत्त्वाची माहिती', 'Key Facts')}
                </span>
              </div>

              <div className="bg-white p-5 border border-gray-150 rounded-xl shadow-xs space-y-4 max-h-[440px] overflow-y-auto">
                <h4 className="text-xs font-bold text-gray-400 uppercase">{t('वेबसाईटवर असे दिसेल (Key Facts):', 'Shown on website (Key Facts):')}</h4>
                <div className="grid grid-cols-2 gap-4">
                  {facts.filter(f => f.is_active).map((item, idx) => (
                    <div key={item.id || idx} className="bg-white rounded-xl border border-gray-150 shadow-xs p-4 text-center hover:shadow-sm transition-shadow min-w-0">
                      <div className="text-xl font-extrabold text-green-800 break-words leading-tight">
                        {item.value_mr}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide pt-1 leading-normal break-words">
                        {item.label_mr}
                      </div>
                    </div>
                  ))}
                  {facts.filter(f => f.is_active).length === 0 && (
                    <div className="col-span-2 text-center py-6 text-xs text-gray-400 italic">{t('कोणतीही सक्रिय आकडेवारी प्रिव्ह्यू उपलब्ध नाही.', 'No active statistics preview available.')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── MISSION ADD/EDIT MODAL ────────────────────────────────────────────────────── */}
      {isMissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            <div className="p-5 bg-gradient-to-r from-green-800 to-green-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">
                {editingMission ? t('ध्येय संपादित करा', 'Edit Mission Point') : t('नवीन ध्येय जोडा', 'Add Mission Point')}
              </h3>
              <button
                onClick={() => setIsMissionModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer hover:scale-105 transition-transform"
              >
                <Lucide.X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveMission} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="m-mr" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <span className="bg-green-600 text-white text-[9px] px-2 py-0.5 rounded font-extrabold">मराठी (MR)</span>
                  {t('ध्येय मजकूर', 'Mission Text')}
                </Label>
                <Input
                  id="m-mr"
                  value={missionMr}
                  onChange={(e) => setMissionMr(e.target.value)}
                  placeholder={t('उदा. शेतकऱ्यांना योग्य भाव मिळवून देणे.', 'e.g. Ensuring fair prices for farmers.')}
                  className="border-gray-250 focus:border-green-650 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-en" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-extrabold">ENGLISH (EN)</span>
                  {t('ध्येय मजकूर (इंग्रजी)', 'Mission Text (English)')}
                </Label>
                <Input
                  id="m-en"
                  value={missionEn}
                  onChange={(e) => setMissionEn(e.target.value)}
                  placeholder={t('उदा. Ensuring fair prices for farmers.', 'e.g. Ensuring fair prices for farmers.')}
                  className="border-gray-250 focus:border-green-650 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="m-order" className="text-xs font-bold text-gray-700">
                    {t('क्रम क्रमांक', 'Sort Order')}
                  </Label>
                  <Input
                    id="m-order"
                    type="number"
                    value={missionOrder}
                    onChange={(e) => setMissionOrder(parseInt(e.target.value) || 0)}
                    className="border-gray-250 focus:border-green-650 rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-150 rounded-xl bg-gray-50/50 mt-5">
                  <Label htmlFor="m-active" className="text-xs font-bold text-gray-700 cursor-pointer">
                    {t('सक्रिय आहे?', 'Active?')}
                  </Label>
                  <input
                    id="m-active"
                    type="checkbox"
                    checked={missionActive}
                    onChange={(e) => setMissionActive(e.target.checked)}
                    className="h-4.5 w-4.5 text-green-755 focus:ring-green-600 border-gray-300 rounded cursor-pointer accent-green-700"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMissionModalOpen(false)}
                  className="border-gray-250 hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer rounded-xl px-4 py-2"
                >
                  {t('रद्द करा', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={savingMission}
                  className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer rounded-xl px-4 py-2"
                >
                  {savingMission ? t('जतन होत आहे...', 'Saving...') : t('जतन करा', 'Save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── KEY FACT ADD/EDIT MODAL ────────────────────────────────────────────────────── */}
      {isFactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
            <div className="p-5 bg-gradient-to-r from-green-800 to-green-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">
                {editingFact ? t('माहिती सुधारित करा', 'Edit Key Fact Card') : t('नवीन आकडेवारी जोडा', 'Add Key Fact Card')}
              </h3>
              <button
                onClick={() => setIsFactModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer hover:scale-105 transition-transform"
              >
                <Lucide.X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveFact} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="f-val-mr" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <span className="bg-green-600 text-white text-[9px] px-2 py-0.5 rounded font-extrabold">मराठी (MR)</span>
                    {t('संख्या/मूल्य', 'Value/Stat')}
                  </Label>
                  <Input
                    id="f-val-mr"
                    value={factValMr}
                    onChange={(e) => setFactValMr(e.target.value)}
                    placeholder={t('उदा. १९६३ किंवा ५०००+', 'e.g. 1963 or 5000+')}
                    className="border-gray-250 focus:border-green-650 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="f-val-en" className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-extrabold">ENGLISH (EN)</span>
                    {t('संख्या/मूल्य (इंग्रजी)', 'Value/Stat (English)')}
                  </Label>
                  <Input
                    id="f-val-en"
                    value={factValEn}
                    onChange={(e) => setFactValEn(e.target.value)}
                    placeholder={t('उदा. 1963 or 5000+', 'e.g. 1963 or 5000+')}
                    className="border-gray-250 focus:border-green-650 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-lbl-mr" className="text-xs font-bold text-gray-705 flex items-center gap-1.5">
                  <span className="bg-green-600 text-white text-[9px] px-2 py-0.5 rounded font-extrabold">मराठी (MR)</span>
                  {t('लेबल/शीर्षक', 'Label/Title')}
                </Label>
                <Input
                  id="f-lbl-mr"
                  value={factLblMr}
                  onChange={(e) => setFactLblMr(e.target.value)}
                  placeholder={t('उदा. स्थापना वर्ष किंवा नोंदणीकृत शेतकरी', 'e.g. Est. Year or Registered Farmers')}
                  className="border-gray-250 focus:border-green-650 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="f-lbl-en" className="text-xs font-bold text-gray-705 flex items-center gap-1.5">
                  <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded font-extrabold">ENGLISH (EN)</span>
                  {t('लेबल/शीर्षक (इंग्रजी)', 'Label/Title (English)')}
                </Label>
                <Input
                  id="f-lbl-en"
                  value={factLblEn}
                  onChange={(e) => setFactLblEn(e.target.value)}
                  placeholder={t('उदा. Est. Year or Registered Farmers', 'e.g. Est. Year or Registered Farmers')}
                  className="border-gray-250 focus:border-green-650 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="f-order" className="text-xs font-bold text-gray-700">
                    {t('क्रम क्रमांक', 'Sort Order')}
                  </Label>
                  <Input
                    id="f-order"
                    type="number"
                    value={factOrder}
                    onChange={(e) => setFactOrder(parseInt(e.target.value) || 0)}
                    className="border-gray-250 focus:border-green-650 rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-150 rounded-xl bg-gray-50/50 mt-5">
                  <Label htmlFor="f-active" className="text-xs font-bold text-gray-700 cursor-pointer">
                    {t('सक्रिय आहे?', 'Active?')}
                  </Label>
                  <input
                    id="f-active"
                    type="checkbox"
                    checked={factActive}
                    onChange={(e) => setFactActive(e.target.checked)}
                    className="h-4.5 w-4.5 text-green-755 focus:ring-green-600 border-gray-300 rounded cursor-pointer accent-green-700"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFactModalOpen(false)}
                  className="border-gray-250 hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer rounded-xl px-4 py-2"
                >
                  {t('रद्द करा', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={savingFact}
                  className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer rounded-xl px-4 py-2"
                >
                  {savingFact ? t('जतन होत आहे...', 'Saving...') : t('जतन करा', 'Save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE MISSION CONFIRM DIALOG ── */}
      {deletingMissionId && (
        <ConfirmDialog
          title={t('ध्येय हटवायचे?', 'Delete Mission?')}
          description={t('हा ध्येय मुद्दा कायमचा हटवला जाईल. ही क्रिया पूर्ववत केली जाऊ शकत नाही.', 'This mission point will be permanently deleted. This action cannot be undone.')}
          onConfirm={confirmDeleteMission}
          onCancel={() => setDeletingMissionId(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── DELETE FACT CONFIRM DIALOG ── */}
      {deletingFactId && (
        <ConfirmDialog
          title={t('माहिती हटवायची?', 'Delete Stat Fact?')}
          description={t('ही आकडेवारी कायमची हटवली जाईल. ही क्रिया पूर्ववत केली जाऊ शकत नाही.', 'This stat fact card will be permanently deleted. This action cannot be undone.')}
          onConfirm={confirmDeleteFact}
          onCancel={() => setDeletingFactId(null)}
          loading={deleteLoading}
        />
      )}

      {/* Global CSS animations */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>

      {/* Toast notifications container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-150 p-6 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-red-100 shrink-0">
            <Lucide.AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-bold text-gray-900 text-base">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onCancel} disabled={loading} className="cursor-pointer">
            {t('रद्द करा', 'Cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading} className="cursor-pointer bg-red-650 hover:bg-red-750 text-white font-bold">
            {loading ? <Lucide.Loader2 className="h-4 w-4 animate-spin" /> : <Lucide.Trash2 className="h-4 w-4 mr-1 inline" />}
            {t('हटवा', 'Delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}
