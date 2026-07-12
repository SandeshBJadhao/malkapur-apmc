'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Initiative, GovScheme, Achievement, InitiativeTimeline, InitiativeSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as Lucide from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

const INITIATIVE_CATEGORIES = [
  { value: 'Digital Mandi', label: 'Digital Mandi / ई-नाम' },
  { value: 'Education', label: 'Education / प्रशिक्षण' },
  { value: 'Infrastructure', label: 'Infrastructure / पायाभूत सुविधा' },
  { value: 'Welfare', label: 'Welfare / शेतकरी कल्याण' },
  { value: 'Other', label: 'Other / इतर' },
];

const SCHEME_ICONS = [
  { value: 'Network', label: 'Network (डिजिटल बाजार)' },
  { value: 'BadgeIndianRupee', label: 'Rupee (सरकारी योजना)' },
  { value: 'Sprout', label: 'Sprout (शेती/पीक)' },
  { value: 'GraduationCap', label: 'Education (प्रशिक्षण)' },
  { value: 'Landmark', label: 'Landmark (शासकीय)' },
  { value: 'Building2', label: 'Building (पायाभूत सुविधा)' },
  { value: 'HelpCircle', label: 'Help (इतर)' }
];

const ACHIEVEMENT_ICONS = [
  { value: 'Users', label: 'Users (शेतकरी)' },
  { value: 'Store', label: 'Store (व्यापारी)' },
  { value: 'TrendingUp', label: 'TrendingUp (दैनंदिन आवक)' },
  { value: 'Sprout', label: 'Sprout (शेतमाल)' },
  { value: 'BarChart3', label: 'Chart (कामकाज आढावा)' },
  { value: 'HelpCircle', label: 'Help (इतर)' }
];

const ACCENT_COLORS = [
  { value: 'green', label: 'Green / हिरवा' },
  { value: 'amber', label: 'Amber / पिवळा' },
  { value: 'blue', label: 'Blue / निळा' },
  { value: 'rose', label: 'Rose / लाल' }
];

type ToastType = 'success' | 'error';
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

type InitiativeForm = {
  title_mr: string;
  title_en: string;
  description_mr: string;
  description_en: string;
  image_url: string;
  category: string;
  display_order: number;
  is_published: boolean;
};

const EMPTY_INITIATIVE_FORM: InitiativeForm = {
  title_mr: '',
  title_en: '',
  description_mr: '',
  description_en: '',
  image_url: '',
  category: 'Digital Mandi',
  display_order: 1,
  is_published: true,
};

type SchemeForm = {
  title_mr: string;
  title_en: string;
  desc_mr: string;
  desc_en: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_SCHEME_FORM: SchemeForm = {
  title_mr: '',
  title_en: '',
  desc_mr: '',
  desc_en: '',
  icon_name: 'Network',
  sort_order: 1,
  is_active: true,
};

type AchievementForm = {
  label_mr: string;
  label_en: string;
  value: string;
  subtext_mr: string;
  subtext_en: string;
  icon_name: string;
  accent_color: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_ACHIEVEMENT_FORM: AchievementForm = {
  label_mr: '',
  label_en: '',
  value: '',
  subtext_mr: '',
  subtext_en: '',
  icon_name: 'Users',
  accent_color: 'green',
  sort_order: 1,
  is_active: true,
};

type TimelineForm = {
  year: string;
  title_mr: string;
  title_en: string;
  desc_mr: string;
  desc_en: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_TIMELINE_FORM: TimelineForm = {
  year: '',
  title_mr: '',
  title_en: '',
  desc_mr: '',
  desc_en: '',
  sort_order: 1,
  is_active: true,
};

// ─── Subcomponents ───────────────────────────────────────────────────────────

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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Lucide.X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200"
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
          <Button variant="destructive" onClick={onConfirm} disabled={loading} className="cursor-pointer">
            {loading ? <Lucide.Loader2 className="h-4 w-4 animate-spin" /> : <Lucide.Trash2 className="h-4 w-4" />}
            {t('हटवा', 'Delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminInitiativesPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  
  // Navigation / Tabs state
  const [activeTab, setActiveTab] = useState<'initiatives' | 'schemes' | 'achievements' | 'timeline' | 'vision'>('initiatives');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Current Initiatives State
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [isInitiativeModalOpen, setIsInitiativeModalOpen] = useState(false);
  const [editingInitiative, setEditingInitiative] = useState<Initiative | null>(null);
  const [deletingInitiative, setDeletingInitiative] = useState<Initiative | null>(null);
  const [initiativeForm, setInitiativeForm] = useState<InitiativeForm>(EMPTY_INITIATIVE_FORM);
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 2. Government Schemes State
  const [schemes, setSchemes] = useState<GovScheme[]>([]);
  const [isSchemeModalOpen, setIsSchemeModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<GovScheme | null>(null);
  const [deletingScheme, setDeletingScheme] = useState<GovScheme | null>(null);
  const [schemeForm, setSchemeForm] = useState<SchemeForm>(EMPTY_SCHEME_FORM);

  // 3. Achievements State
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [deletingAchievement, setDeletingAchievement] = useState<Achievement | null>(null);
  const [achievementForm, setAchievementForm] = useState<AchievementForm>(EMPTY_ACHIEVEMENT_FORM);

  // 4. Timeline State
  const [timeline, setTimeline] = useState<InitiativeTimeline[]>([]);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [editingTimeline, setEditingTimeline] = useState<InitiativeTimeline | null>(null);
  const [deletingTimeline, setDeletingTimeline] = useState<InitiativeTimeline | null>(null);
  const [timelineForm, setTimelineForm] = useState<TimelineForm>(EMPTY_TIMELINE_FORM);

  // 5. Future Vision State
  const [visionSettings, setVisionSettings] = useState<InitiativeSettings | null>(null);
  const [futureVisionMr, setFutureVisionMr] = useState('');
  const [futureVisionEn, setFutureVisionEn] = useState('');

  // Toast Helpers
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

  // ─── Fetching Functions ────────────────────────────────────────────────────
  
  const fetchInitiatives = async () => {
    try {
      const { data, error } = await supabase
        .from('initiatives')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setInitiatives(data || []);
    } catch (err: any) {
      addToast('error', err.message || t('उपक्रम लोड करण्यात अयशस्वी', 'Failed to load initiatives'));
    }
  };

  const fetchSchemes = async () => {
    try {
      const { data, error } = await supabase
        .from('gov_schemes')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setSchemes(data || []);
    } catch (err: any) {
      addToast('error', err.message || t('शासकीय योजना लोड करण्यात अयशस्वी', 'Failed to load government schemes'));
    }
  };

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setAchievements(data || []);
    } catch (err: any) {
      addToast('error', err.message || t('यशस्वी उपलब्धी लोड करण्यात अयशस्वी', 'Failed to load achievements'));
    }
  };

  const fetchTimeline = async () => {
    try {
      const { data, error } = await supabase
        .from('initiative_timeline')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setTimeline(data || []);
    } catch (err: any) {
      addToast('error', err.message || t('महत्त्वाचे टप्पे लोड करण्यात अयशस्वी', 'Failed to load timeline milestones'));
    }
  };

  const fetchVision = async () => {
    try {
      const { data, error } = await supabase
        .from('initiative_settings')
        .select('*')
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setVisionSettings(data[0]);
        setFutureVisionMr(data[0].future_vision_mr || '');
        setFutureVisionEn(data[0].future_vision_en || '');
      }
    } catch (err: any) {
      addToast('error', err.message || t('भविष्यातील दिशा सेटिंग्ज लोड करण्यात अयशस्वी', 'Failed to load future vision settings'));
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchInitiatives(),
      fetchSchemes(),
      fetchAchievements(),
      fetchTimeline(),
      fetchVision()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // ─── Image Upload Handler ──────────────────────────────────────────────────

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('error', t('कृपया फक्त प्रतिमा फाईल निवडा.', 'Please select an image file only.'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('error', t('फाईल खूप मोठी आहे. कमाल आकार ५MB असावा.', 'File is too large. Max size should be 5MB.'));
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(15);
      
      const ext = file.name.split('.').pop();
      const fileName = `initiative-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const filePath = `images/${fileName}`;

      setUploadProgress(40);

      const { error: uploadError } = await supabase.storage
        .from('initiatives')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      setUploadProgress(75);

      const { data: urlData } = supabase.storage.from('initiatives').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      setInitiativeForm((prev) => ({ ...prev, image_url: publicUrl }));
      setUploadProgress(100);
      addToast('success', t('प्रतिमा यशस्वीरित्या अपलोड झाली!', 'Image uploaded successfully!'));
    } catch (err: any) {
      addToast('error', err.message || t('प्रतिमा अपलोड करण्यात अयशस्वी', 'Failed to upload image'));
    } finally {
      setUploadingImage(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // ─── Submit Handlers ───────────────────────────────────────────────────────

  // 1. Current Initiatives
  const handleInitiativeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initiativeForm.title_mr.trim() || !initiativeForm.title_en.trim()) {
      addToast('error', t('कृपया सर्व आवश्यक फील्ड भरा.', 'Please fill in all required fields.'));
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        title_mr: initiativeForm.title_mr.trim(),
        title_en: initiativeForm.title_en.trim(),
        description_mr: initiativeForm.description_mr.trim() || null,
        description_en: initiativeForm.description_en.trim() || null,
        image_url: initiativeForm.image_url.trim() || null,
        category: initiativeForm.category,
        display_order: Number(initiativeForm.display_order),
        is_published: initiativeForm.is_published,
      };

      if (editingInitiative) {
        const { error } = await supabase
          .from('initiatives')
          .update(payload)
          .eq('id', editingInitiative.id);

        if (error) throw error;
        addToast('success', t('उपक्रम यशस्वीरित्या अद्ययावत केला!', 'Initiative updated successfully!'));
      } else {
        const { error } = await supabase.from('initiatives').insert([payload]);
        if (error) throw error;
        addToast('success', t('उपक्रम यशस्वीरित्या जोडला गेला!', 'Initiative added successfully!'));
      }

      setIsInitiativeModalOpen(false);
      fetchInitiatives();
    } catch (err: any) {
      addToast('error', err.message || t('क्रिया अयशस्वी', 'Operation failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitiativeDelete = async () => {
    if (!deletingInitiative) return;
    try {
      setActionLoading(true);
      const { error } = await supabase.from('initiatives').delete().eq('id', deletingInitiative.id);
      if (error) throw error;
      addToast('success', t('उपक्रम यशस्वीरित्या हटवला!', 'Initiative deleted successfully!'));
      setDeletingInitiative(null);
      fetchInitiatives();
    } catch (err: any) {
      addToast('error', err.message || t('हटवण्यात अडचण आली', 'Delete operation failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitiativeTogglePublish = async (init: Initiative) => {
    try {
      const { error } = await supabase
        .from('initiatives')
        .update({ is_published: !init.is_published })
        .eq('id', init.id);
      if (error) throw error;
      addToast('success', init.is_published 
        ? t('उपक्रम मसुदा म्हणून जतन केला!', 'Initiative saved as draft!') 
        : t('उपक्रम प्रकाशित केला!', 'Initiative published!')
      );
      fetchInitiatives();
    } catch (err: any) {
      addToast('error', err.message || t('स्थिती बदलण्यात अयशस्वी', 'Status change failed'));
    }
  };

  // 2. Government Schemes
  const handleSchemeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeForm.title_mr.trim() || !schemeForm.title_en.trim() || !schemeForm.desc_mr.trim() || !schemeForm.desc_en.trim()) {
      addToast('error', t('कृपया सर्व आवश्यक फील्ड भरा.', 'Please fill in all required fields.'));
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        title_mr: schemeForm.title_mr.trim(),
        title_en: schemeForm.title_en.trim(),
        desc_mr: schemeForm.desc_mr.trim(),
        desc_en: schemeForm.desc_en.trim(),
        icon_name: schemeForm.icon_name,
        sort_order: Number(schemeForm.sort_order),
        is_active: schemeForm.is_active,
      };

      if (editingScheme) {
        const { error } = await supabase
          .from('gov_schemes')
          .update(payload)
          .eq('id', editingScheme.id);
        if (error) throw error;
        addToast('success', t('योजना यशस्वीरित्या अद्ययावत केली!', 'Government scheme updated successfully!'));
      } else {
        const { error } = await supabase.from('gov_schemes').insert([payload]);
        if (error) throw error;
        addToast('success', t('योजना यशस्वीरित्या जोडली गेली!', 'Government scheme added successfully!'));
      }

      setIsSchemeModalOpen(false);
      fetchSchemes();
    } catch (err: any) {
      addToast('error', err.message || t('क्रिया अयशस्वी', 'Operation failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchemeDelete = async () => {
    if (!deletingScheme) return;
    try {
      setActionLoading(true);
      const { error } = await supabase.from('gov_schemes').delete().eq('id', deletingScheme.id);
      if (error) throw error;
      addToast('success', t('योजना यशस्वीरित्या हटवली!', 'Government scheme deleted successfully!'));
      setDeletingScheme(null);
      fetchSchemes();
    } catch (err: any) {
      addToast('error', err.message || t('हटवण्यात अडचण आली', 'Delete operation failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSchemeToggleActive = async (scheme: GovScheme) => {
    try {
      const { error } = await supabase
        .from('gov_schemes')
        .update({ is_active: !scheme.is_active })
        .eq('id', scheme.id);
      if (error) throw error;
      addToast('success', scheme.is_active 
        ? t('योजना निष्क्रिय केली!', 'Scheme deactivated!') 
        : t('योजना सक्रिय केली!', 'Scheme activated!')
      );
      fetchSchemes();
    } catch (err: any) {
      addToast('error', err.message || t('स्थिती बदलण्यात अयशस्वी', 'Status change failed'));
    }
  };

  // 3. Achievements
  const handleAchievementFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievementForm.label_mr.trim() || !achievementForm.label_en.trim() || !achievementForm.value.trim()) {
      addToast('error', t('कृपया सर्व आवश्यक फील्ड भरा.', 'Please fill in all required fields.'));
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        label_mr: achievementForm.label_mr.trim(),
        label_en: achievementForm.label_en.trim(),
        value: achievementForm.value.trim(),
        subtext_mr: achievementForm.subtext_mr.trim() || null,
        subtext_en: achievementForm.subtext_en.trim() || null,
        icon_name: achievementForm.icon_name,
        accent_color: achievementForm.accent_color,
        sort_order: Number(achievementForm.sort_order),
        is_active: achievementForm.is_active,
      };

      if (editingAchievement) {
        const { error } = await supabase
          .from('achievements')
          .update(payload)
          .eq('id', editingAchievement.id);
        if (error) throw error;
        addToast('success', t('यशस्वी उपलब्धी यशस्वीरित्या अद्ययावत केली!', 'Achievement updated successfully!'));
      } else {
        const { error } = await supabase.from('achievements').insert([payload]);
        if (error) throw error;
        addToast('success', t('यशस्वी उपलब्धी यशस्वीरित्या जोडली गेली!', 'Achievement added successfully!'));
      }

      setIsAchievementModalOpen(false);
      fetchAchievements();
    } catch (err: any) {
      addToast('error', err.message || t('क्रिया अयशस्वी', 'Operation failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAchievementDelete = async () => {
    if (!deletingAchievement) return;
    try {
      setActionLoading(true);
      const { error } = await supabase.from('achievements').delete().eq('id', deletingAchievement.id);
      if (error) throw error;
      addToast('success', t('यशस्वी उपलब्धी यशस्वीरित्या हटवली!', 'Achievement deleted successfully!'));
      setDeletingAchievement(null);
      fetchAchievements();
    } catch (err: any) {
      addToast('error', err.message || t('हटवण्यात अडचण आली', 'Delete operation failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAchievementToggleActive = async (ach: Achievement) => {
    try {
      const { error } = await supabase
        .from('achievements')
        .update({ is_active: !ach.is_active })
        .eq('id', ach.id);
      if (error) throw error;
      addToast('success', ach.is_active 
        ? t('उपलब्धी निष्क्रिय केली!', 'Achievement deactivated!') 
        : t('उपलब्धी सक्रिय केली!', 'Achievement activated!')
      );
      fetchAchievements();
    } catch (err: any) {
      addToast('error', err.message || t('स्थिती बदलण्यात अयशस्वी', 'Status change failed'));
    }
  };

  // 4. Timeline
  const handleTimelineFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineForm.year.trim() || !timelineForm.title_mr.trim() || !timelineForm.title_en.trim() || !timelineForm.desc_mr.trim() || !timelineForm.desc_en.trim()) {
      addToast('error', t('कृपया सर्व आवश्यक फील्ड भरा.', 'Please fill in all required fields.'));
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        year: timelineForm.year.trim(),
        title_mr: timelineForm.title_mr.trim(),
        title_en: timelineForm.title_en.trim(),
        desc_mr: timelineForm.desc_mr.trim(),
        desc_en: timelineForm.desc_en.trim(),
        sort_order: Number(timelineForm.sort_order),
        is_active: timelineForm.is_active,
      };

      if (editingTimeline) {
        const { error } = await supabase
          .from('initiative_timeline')
          .update(payload)
          .eq('id', editingTimeline.id);
        if (error) throw error;
        addToast('success', t('टप्पा यशस्वीरित्या अद्ययावत केला!', 'Timeline milestone updated successfully!'));
      } else {
        const { error } = await supabase.from('initiative_timeline').insert([payload]);
        if (error) throw error;
        addToast('success', t('टप्पा यशस्वीरित्या जोडला गेला!', 'Timeline milestone added successfully!'));
      }

      setIsTimelineModalOpen(false);
      fetchTimeline();
    } catch (err: any) {
      addToast('error', err.message || t('क्रिया अयशस्वी', 'Operation failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleTimelineDelete = async () => {
    if (!deletingTimeline) return;
    try {
      setActionLoading(true);
      const { error } = await supabase.from('initiative_timeline').delete().eq('id', deletingTimeline.id);
      if (error) throw error;
      addToast('success', t('टप्पा यशस्वीरित्या हटवला!', 'Timeline milestone deleted successfully!'));
      setDeletingTimeline(null);
      fetchTimeline();
    } catch (err: any) {
      addToast('error', err.message || t('हटवण्यात अडचण आली', 'Delete operation failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleTimelineToggleActive = async (timeItem: InitiativeTimeline) => {
    try {
      const { error } = await supabase
        .from('initiative_timeline')
        .update({ is_active: !timeItem.is_active })
        .eq('id', timeItem.id);
      if (error) throw error;
      addToast('success', timeItem.is_active 
        ? t('टप्पा निष्क्रिय केला!', 'Timeline milestone deactivated!') 
        : t('टप्पा सक्रिय केला!', 'Timeline milestone activated!')
      );
      fetchTimeline();
    } catch (err: any) {
      addToast('error', err.message || t('स्थिती बदलण्यात अयशस्वी', 'Status change failed'));
    }
  };

  // 5. Future Vision Settings
  const handleVisionSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!futureVisionMr.trim() || !futureVisionEn.trim()) {
      addToast('error', t('कृपया भविष्यातील दिशा मजकूर मराठी आणि इंग्रजीमध्ये भरा.', 'Please fill in the future vision text in both Marathi and English.'));
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        id: '11111111-1111-1111-1111-111111111111',
        future_vision_mr: futureVisionMr.trim(),
        future_vision_en: futureVisionEn.trim()
      };

      const { error } = await supabase
        .from('initiative_settings')
        .upsert(payload);

      if (error) throw error;
      addToast('success', t('भविष्यातील दिशा यशस्वीरित्या जतन केली!', 'Future vision saved successfully!'));
      fetchVision();
    } catch (err: any) {
      addToast('error', err.message || t('जतन करण्यात अडचण आली', 'Failed to save settings'));
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Swap/Reordering Handlers ──────────────────────────────────────────────

  const handleMoveOrder = async (
    index: number,
    direction: 'up' | 'down',
    table: 'initiatives' | 'gov_schemes' | 'achievements' | 'initiative_timeline'
  ) => {
    const list = 
      table === 'initiatives' ? initiatives : 
      table === 'gov_schemes' ? schemes :
      table === 'achievements' ? achievements : timeline;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const itemA = list[index];
    const itemB = list[targetIndex];

    try {
      const orderField = table === 'initiatives' ? 'display_order' : 'sort_order';
      const tempOrder = (itemA as any)[orderField];

      const { error: err1 } = await supabase
        .from(table)
        .update({ [orderField]: (itemB as any)[orderField] })
        .eq('id', itemA.id);

      if (err1) throw err1;

      const { error: err2 } = await supabase
        .from(table)
        .update({ [orderField]: tempOrder })
        .eq('id', itemB.id);

      if (err2) throw err2;

      // Reload appropriate data
      if (table === 'initiatives') fetchInitiatives();
      if (table === 'gov_schemes') fetchSchemes();
      if (table === 'achievements') fetchAchievements();
      if (table === 'initiative_timeline') fetchTimeline();
    } catch (err: any) {
      addToast('error', err.message || t('पुनर्क्रमवारी अयशस्वी', 'Reordering failed'));
    }
  };

  // ─── Modals Opener ─────────────────────────────────────────────────────────

  // 1. Current Initiatives Modal
  const handleOpenInitiativeAdd = () => {
    setEditingInitiative(null);
    setInitiativeForm({
      ...EMPTY_INITIATIVE_FORM,
      display_order: initiatives.length > 0 ? Math.max(...initiatives.map(i => i.display_order)) + 1 : 1,
    });
    setImageUploadMode('upload');
    setIsInitiativeModalOpen(true);
  };

  const handleOpenInitiativeEdit = (init: Initiative) => {
    setEditingInitiative(init);
    setInitiativeForm({
      title_mr: init.title_mr || '',
      title_en: init.title_en || '',
      description_mr: init.description_mr || '',
      description_en: init.description_en || '',
      image_url: init.image_url || '',
      category: init.category || 'Digital Mandi',
      display_order: init.display_order || 1,
      is_published: init.is_published,
    });
    setImageUploadMode(init.image_url ? 'url' : 'upload');
    setIsInitiativeModalOpen(true);
  };

  // 2. Schemes Modal
  const handleOpenSchemeAdd = () => {
    setEditingScheme(null);
    setSchemeForm({
      ...EMPTY_SCHEME_FORM,
      sort_order: schemes.length > 0 ? Math.max(...schemes.map(s => s.sort_order)) + 1 : 1,
    });
    setIsSchemeModalOpen(true);
  };

  const handleOpenSchemeEdit = (scheme: GovScheme) => {
    setEditingScheme(scheme);
    setSchemeForm({
      title_mr: scheme.title_mr || '',
      title_en: scheme.title_en || '',
      desc_mr: scheme.desc_mr || '',
      desc_en: scheme.desc_en || '',
      icon_name: scheme.icon_name || 'Network',
      sort_order: scheme.sort_order || 1,
      is_active: scheme.is_active,
    });
    setIsSchemeModalOpen(true);
  };

  // 3. Achievements Modal
  const handleOpenAchievementAdd = () => {
    setEditingAchievement(null);
    setAchievementForm({
      ...EMPTY_ACHIEVEMENT_FORM,
      sort_order: achievements.length > 0 ? Math.max(...achievements.map(a => a.sort_order)) + 1 : 1,
    });
    setIsAchievementModalOpen(true);
  };

  const handleOpenAchievementEdit = (ach: Achievement) => {
    setEditingAchievement(ach);
    setAchievementForm({
      label_mr: ach.label_mr || '',
      label_en: ach.label_en || '',
      value: ach.value || '',
      subtext_mr: ach.subtext_mr || '',
      subtext_en: ach.subtext_en || '',
      icon_name: ach.icon_name || 'Users',
      accent_color: ach.accent_color || 'green',
      sort_order: ach.sort_order || 1,
      is_active: ach.is_active,
    });
    setIsAchievementModalOpen(true);
  };

  // 4. Timeline Modal
  const handleOpenTimelineAdd = () => {
    setEditingTimeline(null);
    setTimelineForm({
      ...EMPTY_TIMELINE_FORM,
      sort_order: timeline.length > 0 ? Math.max(...timeline.map(t => t.sort_order)) + 1 : 1,
    });
    setIsTimelineModalOpen(true);
  };

  const handleOpenTimelineEdit = (timeItem: InitiativeTimeline) => {
    setEditingTimeline(timeItem);
    setTimelineForm({
      year: timeItem.year || '',
      title_mr: timeItem.title_mr || '',
      title_en: timeItem.title_en || '',
      desc_mr: timeItem.desc_mr || '',
      desc_en: timeItem.desc_en || '',
      sort_order: timeItem.sort_order || 1,
      is_active: timeItem.is_active,
    });
    setIsTimelineModalOpen(true);
  };

  // Filtered queries for currently active list (only used for local search)
  const filteredInitiatives = useMemo(() => {
    if (!searchQuery.trim()) return initiatives;
    const q = searchQuery.toLowerCase();
    return initiatives.filter(
      (init) =>
        init.title_mr.toLowerCase().includes(q) ||
        init.title_en.toLowerCase().includes(q) ||
        (init.description_mr && init.description_mr.toLowerCase().includes(q)) ||
        (init.description_en && init.description_en.toLowerCase().includes(q)) ||
        (init.category && init.category.toLowerCase().includes(q))
    );
  }, [initiatives, searchQuery]);

  const filteredSchemes = useMemo(() => {
    if (!searchQuery.trim()) return schemes;
    const q = searchQuery.toLowerCase();
    return schemes.filter(
      (s) =>
        s.title_mr.toLowerCase().includes(q) ||
        s.title_en.toLowerCase().includes(q) ||
        s.desc_mr.toLowerCase().includes(q) ||
        s.desc_en.toLowerCase().includes(q)
    );
  }, [schemes, searchQuery]);

  const filteredAchievements = useMemo(() => {
    if (!searchQuery.trim()) return achievements;
    const q = searchQuery.toLowerCase();
    return achievements.filter(
      (a) =>
        a.label_mr.toLowerCase().includes(q) ||
        a.label_en.toLowerCase().includes(q) ||
        a.value.toLowerCase().includes(q)
    );
  }, [achievements, searchQuery]);

  const filteredTimeline = useMemo(() => {
    if (!searchQuery.trim()) return timeline;
    const q = searchQuery.toLowerCase();
    return timeline.filter(
      (t) =>
        t.year.toLowerCase().includes(q) ||
        t.title_mr.toLowerCase().includes(q) ||
        t.title_en.toLowerCase().includes(q)
    );
  }, [timeline, searchQuery]);

  // Tab Definitions
  const tabs = [
    { id: 'initiatives', label: t('सध्याचे उपक्रम', 'Current Initiatives'), icon: Lucide.Sparkles },
    { id: 'schemes', label: t('शासकीय योजना', 'Government Schemes'), icon: Lucide.Landmark },
    { id: 'achievements', label: t('यशस्वी उपलब्धी', 'Achievements'), icon: Lucide.BarChart3 },
    { id: 'timeline', label: t('महत्त्वाचे टप्पे', 'Timeline'), icon: Lucide.CalendarDays },
    { id: 'vision', label: t('भविष्यातील दिशा', 'Future Vision'), icon: Lucide.TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('उपक्रम व विकास पृष्ठ व्यवस्थापन', 'Manage Initiatives & Development')}</h1>
          <p className="text-sm text-gray-500">{t('उपक्रम पृष्ठावरील सर्व पाच विभागांमधील माहिती व्यवस्थापित करा.', 'Edit all 5 sections displayed on the public Initiatives page.')}</p>
        </div>
        
        {activeTab !== 'vision' && (
          <Button 
            onClick={() => {
              if (activeTab === 'initiatives') handleOpenInitiativeAdd();
              if (activeTab === 'schemes') handleOpenSchemeAdd();
              if (activeTab === 'achievements') handleOpenAchievementAdd();
              if (activeTab === 'timeline') handleOpenTimelineAdd();
            }} 
            className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer shrink-0"
          >
            <Lucide.Plus className="h-4 w-4 mr-2" />
            {activeTab === 'initiatives' && t('उपक्रम जोडा', 'Add Initiative')}
            {activeTab === 'schemes' && t('योजना जोडा', 'Add Scheme')}
            {activeTab === 'achievements' && t('उपलब्धी जोडा', 'Add Achievement')}
            {activeTab === 'timeline' && t('नवीन टप्पा जोडा', 'Add Milestone')}
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchQuery('');
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer border border-transparent',
                activeTab === tab.id
                  ? 'bg-green-50 text-green-800 border-green-200 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className={cn('h-4 w-4', activeTab === tab.id ? 'text-green-700' : 'text-gray-400')} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {activeTab !== 'vision' && (
        <Card className="border border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="relative max-w-sm w-full">
              <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={
                  activeTab === 'initiatives' ? t('उपक्रम शोधा...', 'Search initiatives...') :
                  activeTab === 'schemes' ? t('योजना शोधा...', 'Search schemes...') :
                  activeTab === 'achievements' ? t('नोंद शोधा...', 'Search achievements...') :
                  t('टप्पे शोधा...', 'Search timeline...')
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50/50 border-gray-200"
              />
            </div>
            <div className="text-xs text-gray-400 font-semibold flex items-center gap-2">
              <Lucide.RefreshCw 
                className={cn("h-4.5 w-4.5 text-gray-400 hover:text-green-700 cursor-pointer", loading && "animate-spin")} 
                onClick={loadAllData} 
              />
              {t('एकूण:', 'Total:')} {
                activeTab === 'initiatives' ? initiatives.length : 
                activeTab === 'schemes' ? schemes.length : 
                activeTab === 'achievements' ? achievements.length : timeline.length
              } {t('नोंदी', 'items')}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Lucide.Loader2 className="h-8 w-8 text-green-700 animate-spin" />
                <p className="mt-3 text-sm text-gray-500">{t('माहिती लोड होत आहे...', 'Loading...')}</p>
              </div>
            ) : (
              <>
                {/* ─── TAB 1: CURRENT INITIATIVES TABLE ─── */}
                {activeTab === 'initiatives' && (
                  filteredInitiatives.length === 0 ? (
                    <div className="py-20 text-center">
                      <Lucide.Lightbulb className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-bold text-gray-800">{t('कोणतेही उपक्रम सापडले नाहीत', 'No initiatives found')}</h3>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50/70">
                          <TableRow>
                            <TableHead className="w-12 text-center">{t('क्रम', 'Order')}</TableHead>
                            <TableHead>{t('चित्र प्रिव्ह्यू', 'Image')}</TableHead>
                            <TableHead>{t('शीर्षक', 'Title')}</TableHead>
                            <TableHead>{t('श्रेणी', 'Category')}</TableHead>
                            <TableHead>{t('स्थिती', 'Status')}</TableHead>
                            <TableHead className="w-32 text-right">{t('कृती', 'Actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInitiatives.map((init, index) => {
                            const catObj = INITIATIVE_CATEGORIES.find((c) => c.value === init.category);
                            return (
                              <TableRow key={init.id} className="hover:bg-gray-50/50">
                                <TableCell className="font-bold text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs text-gray-500 mb-1">{init.display_order}</span>
                                    <div className="flex gap-1">
                                      <button
                                        disabled={index === 0}
                                        onClick={() => handleMoveOrder(index, 'up', 'initiatives')}
                                        className="p-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                      >
                                        <Lucide.ChevronUp className="h-3 w-3" />
                                      </button>
                                      <button
                                        disabled={index === initiatives.length - 1}
                                        onClick={() => handleMoveOrder(index, 'down', 'initiatives')}
                                        className="p-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                      >
                                        <Lucide.ChevronDown className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="relative h-10 w-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-250">
                                    {init.image_url ? (
                                      <Image src={init.image_url} alt={init.title_en} fill sizes="64px" className="object-cover" />
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50">
                                        <Lucide.Image className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-bold text-gray-900">
                                  <div className="space-y-0.5">
                                    <div>{init.title_mr}</div>
                                    <div className="text-xs text-gray-500 font-normal">{init.title_en}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-800 font-semibold text-[11px]">
                                    {catObj ? t(catObj.label.split(' / ')[1] || catObj.value, catObj.value) : t('इतर', 'Other')}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <button onClick={() => handleInitiativeTogglePublish(init)} className="focus:outline-none cursor-pointer">
                                    <Badge variant="outline" className={cn(
                                      "px-2.5 py-0.5 text-xs font-bold rounded-full",
                                      init.is_published ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                    )}>
                                      {init.is_published ? t('प्रकाशित', 'Published') : t('मसुदा', 'Draft')}
                                    </Badge>
                                  </button>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <Button variant="outline" size="icon" className="h-8 w-8 hover:border-green-650 hover:text-green-700 cursor-pointer" onClick={() => handleOpenInitiativeEdit(init)}>
                                      <Lucide.Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:border-red-600 hover:bg-red-50 cursor-pointer" onClick={() => setDeletingInitiative(init)}>
                                      <Lucide.Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )
                )}

                {/* ─── TAB 2: GOVERNMENT SCHEMES TABLE ─── */}
                {activeTab === 'schemes' && (
                  filteredSchemes.length === 0 ? (
                    <div className="py-20 text-center">
                      <Lucide.Landmark className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-bold text-gray-800">{t('कोणतीही सरकारी योजना आढळली नाही', 'No government schemes found')}</h3>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50/70">
                          <TableRow>
                            <TableHead className="w-12 text-center">{t('क्रम', 'Order')}</TableHead>
                            <TableHead className="w-16">{t('आयकॉन', 'Icon')}</TableHead>
                            <TableHead>{t('योजना नाव', 'Scheme Title')}</TableHead>
                            <TableHead>{t('वर्णन', 'Description')}</TableHead>
                            <TableHead>{t('स्थिती', 'Status')}</TableHead>
                            <TableHead className="w-32 text-right">{t('कृती', 'Actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSchemes.map((scheme, index) => {
                            const IconComponent = (Lucide as any)[scheme.icon_name] || Lucide.HelpCircle;
                            return (
                              <TableRow key={scheme.id} className="hover:bg-gray-50/50">
                                <TableCell className="font-bold text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs text-gray-500 mb-1">{scheme.sort_order}</span>
                                    <div className="flex gap-1">
                                      <button
                                        disabled={index === 0}
                                        onClick={() => handleMoveOrder(index, 'up', 'gov_schemes')}
                                        className="p-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                      >
                                        <Lucide.ChevronUp className="h-3 w-3" />
                                      </button>
                                      <button
                                        disabled={index === schemes.length - 1}
                                        onClick={() => handleMoveOrder(index, 'down', 'gov_schemes')}
                                        className="p-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                      >
                                        <Lucide.ChevronDown className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="h-8 w-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center border">
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                </TableCell>
                                <TableCell className="font-bold text-gray-900">
                                  <div className="space-y-0.5">
                                    <div>{scheme.title_mr}</div>
                                    <div className="text-xs text-gray-500 font-normal">{scheme.title_en}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-xs text-gray-650">
                                  <div className="truncate">{scheme.desc_mr}</div>
                                  <div className="truncate text-gray-400 font-normal mt-0.5">{scheme.desc_en}</div>
                                </TableCell>
                                <TableCell>
                                  <button onClick={() => handleSchemeToggleActive(scheme)} className="focus:outline-none cursor-pointer">
                                    <Badge variant="outline" className={cn(
                                      "px-2.5 py-0.5 text-xs font-bold rounded-full",
                                      scheme.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-105 text-gray-600 border-gray-250"
                                    )}>
                                      {scheme.is_active ? t('सक्रिय', 'Active') : t('निष्क्रिय', 'Inactive')}
                                    </Badge>
                                  </button>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <Button variant="outline" size="icon" className="h-8 w-8 hover:border-green-650 hover:text-green-700 cursor-pointer" onClick={() => handleOpenSchemeEdit(scheme)}>
                                      <Lucide.Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:border-red-600 hover:bg-red-50 cursor-pointer" onClick={() => setDeletingScheme(scheme)}>
                                      <Lucide.Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )
                )}

                {/* ─── TAB 3: ACHIEVEMENTS TABLE ─── */}
                {activeTab === 'achievements' && (
                  filteredAchievements.length === 0 ? (
                    <div className="py-20 text-center">
                      <Lucide.BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-bold text-gray-800">{t('कोणतीही उपलब्धी आढळली नाही', 'No achievements found')}</h3>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50/70">
                          <TableRow>
                            <TableHead className="w-12 text-center">{t('क्रम', 'Order')}</TableHead>
                            <TableHead className="w-16">{t('आयकॉन', 'Icon')}</TableHead>
                            <TableHead>{t('शीर्षक/लेबल', 'Label')}</TableHead>
                            <TableHead>{t('मूल्य/संख्या', 'Value')}</TableHead>
                            <TableHead>{t('रंग थीम', 'Theme')}</TableHead>
                            <TableHead>{t('स्थिती', 'Status')}</TableHead>
                            <TableHead className="w-32 text-right">{t('कृती', 'Actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAchievements.map((ach, index) => {
                            const IconComponent = (Lucide as any)[ach.icon_name] || Lucide.HelpCircle;
                            const colorObj = ACCENT_COLORS.find(c => c.value === ach.accent_color);
                            return (
                              <TableRow key={ach.id} className="hover:bg-gray-50/50">
                                <TableCell className="font-bold text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs text-gray-500 mb-1">{ach.sort_order}</span>
                                    <div className="flex gap-1">
                                      <button
                                        disabled={index === 0}
                                        onClick={() => handleMoveOrder(index, 'up', 'achievements')}
                                        className="p-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                      >
                                        <Lucide.ChevronUp className="h-3 w-3" />
                                      </button>
                                      <button
                                        disabled={index === achievements.length - 1}
                                        onClick={() => handleMoveOrder(index, 'down', 'achievements')}
                                        className="p-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                      >
                                        <Lucide.ChevronDown className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="h-8 w-8 rounded-lg bg-gray-50 text-gray-700 flex items-center justify-center border">
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                </TableCell>
                                <TableCell className="font-bold text-gray-900">
                                  <div className="space-y-0.5">
                                    <div>{ach.label_mr}</div>
                                    <div className="text-xs text-gray-500 font-normal">{ach.label_en}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="font-bold text-green-750">{ach.value}</TableCell>
                                <TableCell>
                                  <Badge className={cn(
                                    "text-[10px] font-bold uppercase",
                                    ach.accent_color === 'green' ? 'bg-green-100 text-green-800' :
                                    ach.accent_color === 'amber' ? 'bg-amber-100 text-amber-800' :
                                    ach.accent_color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                    'bg-rose-100 text-rose-800'
                                  )}>
                                    {colorObj ? colorObj.label.split(' / ')[1] : ach.accent_color}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <button onClick={() => handleAchievementToggleActive(ach)} className="focus:outline-none cursor-pointer">
                                    <Badge variant="outline" className={cn(
                                      "px-2.5 py-0.5 text-xs font-bold rounded-full",
                                      ach.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-105 text-gray-600 border-gray-250"
                                    )}>
                                      {ach.is_active ? t('सक्रिय', 'Active') : t('निष्क्रिय', 'Inactive')}
                                    </Badge>
                                  </button>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <Button variant="outline" size="icon" className="h-8 w-8 hover:border-green-650 hover:text-green-700 cursor-pointer" onClick={() => handleOpenAchievementEdit(ach)}>
                                      <Lucide.Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:border-red-600 hover:bg-red-50 cursor-pointer" onClick={() => setDeletingAchievement(ach)}>
                                      <Lucide.Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )
                )}

                {/* ─── TAB 4: TIMELINE TABLE ─── */}
                {activeTab === 'timeline' && (
                  filteredTimeline.length === 0 ? (
                    <div className="py-20 text-center">
                      <Lucide.CalendarDays className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-bold text-gray-800">{t('कोणताही टप्पा आढळला नाही', 'No timeline milestones found')}</h3>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50/70">
                          <TableRow>
                            <TableHead className="w-12 text-center">{t('क्रम', 'Order')}</TableHead>
                            <TableHead className="w-20">{t('वर्ष', 'Year')}</TableHead>
                            <TableHead>{t('टप्पा शीर्षक', 'Milestone Title')}</TableHead>
                            <TableHead>{t('तपशील', 'Description')}</TableHead>
                            <TableHead>{t('स्थिती', 'Status')}</TableHead>
                            <TableHead className="w-32 text-right">{t('कृती', 'Actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTimeline.map((timeItem, index) => {
                            return (
                              <TableRow key={timeItem.id} className="hover:bg-gray-50/50">
                                <TableCell className="font-bold text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs text-gray-500 mb-1">{timeItem.sort_order}</span>
                                    <div className="flex gap-1">
                                      <button
                                        disabled={index === 0}
                                        onClick={() => handleMoveOrder(index, 'up', 'initiative_timeline')}
                                        className="p-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                      >
                                        <Lucide.ChevronUp className="h-3 w-3" />
                                      </button>
                                      <button
                                        disabled={index === timeline.length - 1}
                                        onClick={() => handleMoveOrder(index, 'down', 'initiative_timeline')}
                                        className="p-0.5 border rounded bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                                      >
                                        <Lucide.ChevronDown className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-amber-100 text-amber-800 font-bold px-3 py-1 border border-amber-200">
                                    {timeItem.year}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-bold text-gray-900">
                                  <div className="space-y-0.5">
                                    <div>{timeItem.title_mr}</div>
                                    <div className="text-xs text-gray-500 font-normal">{timeItem.title_en}</div>
                                  </div>
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-xs text-gray-650">
                                  <div className="truncate">{timeItem.desc_mr}</div>
                                  <div className="truncate text-gray-400 font-normal mt-0.5">{timeItem.desc_en}</div>
                                </TableCell>
                                <TableCell>
                                  <button onClick={() => handleTimelineToggleActive(timeItem)} className="focus:outline-none cursor-pointer">
                                    <Badge variant="outline" className={cn(
                                      "px-2.5 py-0.5 text-xs font-bold rounded-full",
                                      timeItem.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-105 text-gray-600 border-gray-250"
                                    )}>
                                      {timeItem.is_active ? t('सक्रिय', 'Active') : t('निष्क्रिय', 'Inactive')}
                                    </Badge>
                                  </button>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <Button variant="outline" size="icon" className="h-8 w-8 hover:border-green-650 hover:text-green-700 cursor-pointer" onClick={() => handleOpenTimelineEdit(timeItem)}>
                                      <Lucide.Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:border-red-600 hover:bg-red-50 cursor-pointer" onClick={() => setDeletingTimeline(timeItem)}>
                                      <Lucide.Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── TAB 5: FUTURE VISION FORM ─── */}
      {activeTab === 'vision' && (
        <Card className="border border-gray-200 shadow-sm max-w-4xl">
          <CardHeader>
            <CardTitle>{t('भविष्यातील दिशा (Future Vision)', 'Future Vision Statement')}</CardTitle>
            <CardDescription>{t('बाजार समितीचे भविष्य आणि डिजिटल उद्दिष्टांविषयीचा प्रमुख मजकूर संपादित करा.', 'Edit the long-term vision text featured in the green panel at the bottom of the page.')}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-10 flex justify-center">
                <Lucide.Loader2 className="h-8 w-8 text-green-750 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleVisionSave} className="space-y-6">
                <FormField label={t('भविष्यातील दिशा मजकूर (मराठी)', 'Future Vision Text (Marathi)')} required>
                  <Textarea
                    rows={8}
                    required
                    value={futureVisionMr}
                    onChange={(e) => setFutureVisionMr(e.target.value)}
                    placeholder={t('मराठीत मजकूर लिहा...', 'Write vision text in Marathi...')}
                    className="border-gray-200 focus-visible:ring-green-600 font-medium resize-none leading-relaxed"
                  />
                  <div className="text-[10px] text-gray-400 font-semibold text-right">
                    {futureVisionMr.length} {t('अक्षरे', 'characters')}
                  </div>
                </FormField>

                <FormField label={t('भविष्यातील दिशा मजकूर (इंग्रजी)', 'Future Vision Text (English)')} required>
                  <Textarea
                    rows={8}
                    required
                    value={futureVisionEn}
                    onChange={(e) => setFutureVisionEn(e.target.value)}
                    placeholder={t('Write vision text in English...', 'Write vision text in English...')}
                    className="border-gray-200 focus-visible:ring-green-600 font-medium resize-none leading-relaxed"
                  />
                  <div className="text-[10px] text-gray-400 font-semibold text-right">
                    {futureVisionEn.length} {t('अक्षरे', 'characters')}
                  </div>
                </FormField>

                <div className="flex justify-end pt-4 border-t">
                  <Button type="submit" disabled={actionLoading} className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer px-6">
                    {actionLoading ? <Lucide.Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lucide.Save className="h-4 w-4 mr-2" />}
                    {t('मजकूर जतन करा', 'Save Vision Statement')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── ADD/EDIT INITIATIVE MODAL (TAB 1) ─── */}
      {isInitiativeModalOpen && (
        <Modal 
          title={editingInitiative ? t('उपक्रम तपशील संपादित करा', 'Edit Initiative details') : t('नवीन उपक्रम जोडा', 'Add New Initiative Card')} 
          onClose={() => setIsInitiativeModalOpen(false)}
        >
          <form onSubmit={handleInitiativeFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('शीर्षक (मराठी)', 'Title (Marathi)')} required>
                <Input
                  required
                  value={initiativeForm.title_mr}
                  onChange={(e) => setInitiativeForm({ ...initiativeForm, title_mr: e.target.value })}
                  placeholder="उदा. ई-नाम राष्ट्रीय बाजार"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
              <FormField label={t('शीर्षक (इंग्रजी)', 'Title (English)')} required>
                <Input
                  required
                  value={initiativeForm.title_en}
                  onChange={(e) => setInitiativeForm({ ...initiativeForm, title_en: e.target.value })}
                  placeholder="e.g. e-NAM National Market Integration"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
            </div>

            <FormField label={t('वर्णन (मराठी)', 'Description (Marathi)')}>
              <Textarea
                rows={3}
                value={initiativeForm.description_mr}
                onChange={(e) => setInitiativeForm({ ...initiativeForm, description_mr: e.target.value })}
                placeholder="उदा. शेतकऱ्यांना देशभरातील खरेदीदारांशी जोडणारी प्रणाली."
                className="border-gray-200 focus-visible:ring-green-600 resize-none"
              />
            </FormField>

            <FormField label={t('वर्णन (इंग्रजी)', 'Description (English)')}>
              <Textarea
                rows={3}
                value={initiativeForm.description_en}
                onChange={(e) => setInitiativeForm({ ...initiativeForm, description_en: e.target.value })}
                placeholder="e.g. Connecting farmers to buyers nationwide."
                className="border-gray-200 focus-visible:ring-green-600 resize-none"
              />
            </FormField>

            {/* DUAL IMAGE INPUT (UPLOAD / URL) */}
            <div className="space-y-2 p-3 border border-gray-150 rounded-xl bg-gray-50/50">
              <div className="flex justify-between items-center pb-2 border-b">
                <Label className="text-xs font-bold text-gray-700">{t('उपक्रम छायाचित्र', 'Initiative Image')}</Label>
                <div className="flex gap-1 bg-white border rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setImageUploadMode('upload')}
                    className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors",
                      imageUploadMode === 'upload' ? "bg-green-700 text-white" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    {t('अपलोड', 'Upload File')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUploadMode('url')}
                    className={cn(
                      "px-2 py-1 text-[10px] font-bold rounded-md cursor-pointer transition-colors",
                      imageUploadMode === 'url' ? "bg-green-700 text-white" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    {t('लिंक पेस्ट करा', 'Paste URL')}
                  </button>
                </div>
              </div>

              {imageUploadMode === 'upload' ? (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white hover:border-green-500 transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      id="initiative-image-file"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="text-center space-y-1">
                      {uploadingImage ? (
                        <div className="flex flex-col items-center">
                          <Lucide.Loader2 className="h-6 w-6 text-green-700 animate-spin mb-1" />
                          <p className="text-xs font-semibold text-gray-550">{t('अपलोड होत आहे...', 'Uploading image...')} {uploadProgress}%</p>
                        </div>
                      ) : (
                        <>
                          <Lucide.Upload className="h-6 w-6 text-gray-400 mx-auto" />
                          <p className="text-xs font-bold text-gray-700">{t('प्रतिमा निवडा', 'Select Image File')}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">{t('कमाल आकार: ५MB', 'Max size: 5MB')}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-1">
                  <Input
                    value={initiativeForm.image_url}
                    onChange={(e) => setInitiativeForm({ ...initiativeForm, image_url: e.target.value })}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="border-gray-200 focus-visible:ring-green-600 bg-white"
                  />
                </div>
              )}

              {/* Show uploaded image preview */}
              {initiativeForm.image_url && (
                <div className="mt-2 flex items-center gap-3 bg-white p-2 border rounded-lg">
                  <div className="relative h-12 w-20 rounded border overflow-hidden shrink-0">
                    <Image src={initiativeForm.image_url} alt="Preview" fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('प्रिव्ह्यू', 'Preview')}</div>
                    <div className="text-xs text-gray-700 truncate font-semibold">{initiativeForm.image_url}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInitiativeForm((prev) => ({ ...prev, image_url: '' }))}
                    className="p-1 rounded-full text-red-500 hover:bg-red-50 cursor-pointer"
                    title={t('काढून टाका', 'Remove')}
                  >
                    <Lucide.Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('श्रेणी', 'Category')} required>
                <select
                  value={initiativeForm.category}
                  onChange={(e) => setInitiativeForm({ ...initiativeForm, category: e.target.value })}
                  className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  {INITIATIVE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={t('क्रमवारी', 'Display Order')} required>
                <Input
                  required
                  type="number"
                  min={1}
                  value={initiativeForm.display_order}
                  onChange={(e) => setInitiativeForm({ ...initiativeForm, display_order: Number(e.target.value) })}
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="is_published"
                type="checkbox"
                checked={initiativeForm.is_published}
                onChange={(e) => setInitiativeForm({ ...initiativeForm, is_published: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600 cursor-pointer"
              />
              <Label htmlFor="is_published" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                {t('लगेच प्रकाशित करा (वेबसाइटवर दिसेल)', 'Publish immediately (Publicly visible)')}
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setIsInitiativeModalOpen(false)} disabled={actionLoading} className="cursor-pointer">
                {t('रद्द करा', 'Cancel')}
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer">
                {actionLoading ? <Lucide.Loader2 className="h-4 w-4 animate-spin" /> : <Lucide.Save className="h-4 w-4 mr-2" />}
                {t('उपक्रम जतन करा', 'Save Initiative')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── ADD/EDIT GOVERNMENT SCHEME MODAL (TAB 2) ─── */}
      {isSchemeModalOpen && (
        <Modal 
          title={editingScheme ? t('योजना तपशील संपादित करा', 'Edit Scheme details') : t('नवीन योजना जोडा', 'Add New Scheme Card')} 
          onClose={() => setIsSchemeModalOpen(false)}
        >
          <form onSubmit={handleSchemeFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('योजना नाव (मराठी)', 'Scheme Title (Marathi)')} required>
                <Input
                  required
                  value={schemeForm.title_mr}
                  onChange={(e) => setSchemeForm({ ...schemeForm, title_mr: e.target.value })}
                  placeholder="उदा. पीएम किसान"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
              <FormField label={t('योजना नाव (इंग्रजी)', 'Scheme Title (English)')} required>
                <Input
                  required
                  value={schemeForm.title_en}
                  onChange={(e) => setSchemeForm({ ...schemeForm, title_en: e.target.value })}
                  placeholder="e.g. PM Kisan"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
            </div>

            <FormField label={t('योजना वर्णन (मराठी)', 'Description (Marathi)')} required>
              <Textarea
                rows={3}
                required
                value={schemeForm.desc_mr}
                onChange={(e) => setSchemeForm({ ...schemeForm, desc_mr: e.target.value })}
                placeholder="उदा. शेतकरी लाभ योजनांबाबत माहिती व मार्गदर्शन."
                className="border-gray-200 focus-visible:ring-green-600 resize-none"
              />
            </FormField>

            <FormField label={t('योजना वर्णन (इंग्रजी)', 'Description (English)')} required>
              <Textarea
                rows={3}
                required
                value={schemeForm.desc_en}
                onChange={(e) => setSchemeForm({ ...schemeForm, desc_en: e.target.value })}
                placeholder="e.g. Information and guidance for farmer benefit schemes."
                className="border-gray-200 focus-visible:ring-green-600 resize-none"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('आयकॉन चिन्ह', 'Icon Symbol')} required>
                <select
                  value={schemeForm.icon_name}
                  onChange={(e) => setSchemeForm({ ...schemeForm, icon_name: e.target.value })}
                  className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  {SCHEME_ICONS.map((ico) => (
                    <option key={ico.value} value={ico.value}>
                      {ico.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={t('क्रमवारी', 'Display Order')} required>
                <Input
                  required
                  type="number"
                  min={1}
                  value={schemeForm.sort_order}
                  onChange={(e) => setSchemeForm({ ...schemeForm, sort_order: Number(e.target.value) })}
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="scheme_is_active"
                type="checkbox"
                checked={schemeForm.is_active}
                onChange={(e) => setSchemeForm({ ...schemeForm, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600 cursor-pointer"
              />
              <Label htmlFor="scheme_is_active" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                {t('सक्रिय करा (वेबसाइटवर दिसेल)', 'Activate immediately (Publicly visible)')}
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setIsSchemeModalOpen(false)} disabled={actionLoading} className="cursor-pointer">
                {t('रद्द करा', 'Cancel')}
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer">
                {actionLoading ? <Lucide.Loader2 className="h-4 w-4 animate-spin" /> : <Lucide.Save className="h-4 w-4 mr-2" />}
                {t('योजना जतन करा', 'Save Scheme')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── ADD/EDIT ACHIEVEMENT MODAL (TAB 3) ─── */}
      {isAchievementModalOpen && (
        <Modal 
          title={editingAchievement ? t('उपलब्धी संपादित करा', 'Edit Achievement Card') : t('नवीन यशस्वी उपलब्धी जोडा', 'Add Achievement Card')} 
          onClose={() => setIsAchievementModalOpen(false)}
        >
          <form onSubmit={handleAchievementFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('लेबल/शीर्षक (मराठी)', 'Label (Marathi)')} required>
                <Input
                  required
                  value={achievementForm.label_mr}
                  onChange={(e) => setAchievementForm({ ...achievementForm, label_mr: e.target.value })}
                  placeholder="उदा. नोंदणीकृत शेतकरी"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
              <FormField label={t('लेबल/शीर्षक (इंग्रजी)', 'Label (English)')} required>
                <Input
                  required
                  value={achievementForm.label_en}
                  onChange={(e) => setAchievementForm({ ...achievementForm, label_en: e.target.value })}
                  placeholder="e.g. Registered Farmers"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
            </div>

            <FormField label={t('आकडेवारी संख्या/मूल्य (उदा. 8,500+)', 'Value/Stat (e.g. 8,500+)')} required>
              <Input
                required
                value={achievementForm.value}
                onChange={(e) => setAchievementForm({ ...achievementForm, value: e.target.value })}
                placeholder="उदा. ८,५००+"
                className="border-gray-200 focus-visible:ring-green-600"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('दुय्यम मजकूर (मराठी)', 'Subtext (Marathi)')}>
                <Input
                  value={achievementForm.subtext_mr}
                  onChange={(e) => setAchievementForm({ ...achievementForm, subtext_mr: e.target.value })}
                  placeholder="उदा. बाजार सेवांशी जोडलेले"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
              <FormField label={t('दुय्यम मजकूर (इंग्रजी)', 'Subtext (English)')}>
                <Input
                  value={achievementForm.subtext_en}
                  onChange={(e) => setAchievementForm({ ...achievementForm, subtext_en: e.target.value })}
                  placeholder="e.g. Connected with market"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('आयकॉन चिन्ह', 'Icon Symbol')} required>
                <select
                  value={achievementForm.icon_name}
                  onChange={(e) => setAchievementForm({ ...achievementForm, icon_name: e.target.value })}
                  className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  {ACHIEVEMENT_ICONS.map((ico) => (
                    <option key={ico.value} value={ico.value}>
                      {ico.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label={t('रंग थीम', 'Theme Accent Color')} required>
                <select
                  value={achievementForm.accent_color}
                  onChange={(e) => setAchievementForm({ ...achievementForm, accent_color: e.target.value })}
                  className="w-full flex h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                >
                  {ACCENT_COLORS.map((col) => (
                    <option key={col.value} value={col.value}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('क्रमवारी', 'Display Order')} required>
                <Input
                  required
                  type="number"
                  min={1}
                  value={achievementForm.sort_order}
                  onChange={(e) => setAchievementForm({ ...achievementForm, sort_order: Number(e.target.value) })}
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="achievement_is_active"
                type="checkbox"
                checked={achievementForm.is_active}
                onChange={(e) => setAchievementForm({ ...achievementForm, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600 cursor-pointer"
              />
              <Label htmlFor="achievement_is_active" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                {t('सक्रिय करा (वेबसाइटवर दिसेल)', 'Activate immediately (Publicly visible)')}
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setIsAchievementModalOpen(false)} disabled={actionLoading} className="cursor-pointer">
                {t('रद्द करा', 'Cancel')}
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer">
                {actionLoading ? <Lucide.Loader2 className="h-4 w-4 animate-spin" /> : <Lucide.Save className="h-4 w-4 mr-2" />}
                {t('उपलब्धी जतन करा', 'Save Achievement')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── ADD/EDIT TIMELINE MODAL (TAB 4) ─── */}
      {isTimelineModalOpen && (
        <Modal 
          title={editingTimeline ? t('टप्पा तपशील संपादित करा', 'Edit Timeline Milestone') : t('नवीन टप्पा जोडा', 'Add Timeline Milestone')} 
          onClose={() => setIsTimelineModalOpen(false)}
        >
          <form onSubmit={handleTimelineFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('वर्ष (उदा. 2026)', 'Year (e.g. 2026)')} required>
                <Input
                  required
                  value={timelineForm.year}
                  onChange={(e) => setTimelineForm({ ...timelineForm, year: e.target.value })}
                  placeholder="उदा. २०२६"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
              <FormField label={t('क्रमवारी', 'Display Order')} required>
                <Input
                  required
                  type="number"
                  min={1}
                  value={timelineForm.sort_order}
                  onChange={(e) => setTimelineForm({ ...timelineForm, sort_order: Number(e.target.value) })}
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('शीर्षक (मराठी)', 'Milestone Title (Marathi)')} required>
                <Input
                  required
                  value={timelineForm.title_mr}
                  onChange={(e) => setTimelineForm({ ...timelineForm, title_mr: e.target.value })}
                  placeholder="उदा. डिजिटल माहिती उपक्रम"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
              <FormField label={t('शीर्षक (इंग्रजी)', 'Milestone Title (English)')} required>
                <Input
                  required
                  value={timelineForm.title_en}
                  onChange={(e) => setTimelineForm({ ...timelineForm, title_en: e.target.value })}
                  placeholder="e.g. Digital Information Initiative"
                  className="border-gray-200 focus-visible:ring-green-600"
                />
              </FormField>
            </div>

            <FormField label={t('तपशील/वर्णन (मराठी)', 'Milestone Description (Marathi)')} required>
              <Textarea
                rows={3}
                required
                value={timelineForm.desc_mr}
                onChange={(e) => setTimelineForm({ ...timelineForm, desc_mr: e.target.value })}
                placeholder="उदा. दर आणि सूचना नागरिकांपर्यंत जलद पोहोचवण्यावर भर."
                className="border-gray-200 focus-visible:ring-green-600 resize-none"
              />
            </FormField>

            <FormField label={t('तपशील/वर्णन (इंग्रजी)', 'Milestone Description (English)')} required>
              <Textarea
                rows={3}
                required
                value={timelineForm.desc_en}
                onChange={(e) => setTimelineForm({ ...timelineForm, desc_en: e.target.value })}
                placeholder="e.g. Focused on faster delivery of rates and notices to citizens."
                className="border-gray-200 focus-visible:ring-green-600 resize-none"
              />
            </FormField>

            <div className="flex items-center gap-2 pt-2">
              <input
                id="timeline_is_active"
                type="checkbox"
                checked={timelineForm.is_active}
                onChange={(e) => setTimelineForm({ ...timelineForm, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600 cursor-pointer"
              />
              <Label htmlFor="timeline_is_active" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                {t('सक्रिय करा (वेबसाइटवर दिसेल)', 'Activate immediately (Publicly visible)')}
              </Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setIsTimelineModalOpen(false)} disabled={actionLoading} className="cursor-pointer">
                {t('रद्द करा', 'Cancel')}
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer">
                {actionLoading ? <Lucide.Loader2 className="h-4 w-4 animate-spin" /> : <Lucide.Save className="h-4 w-4 mr-2" />}
                {t('टप्पा जतन करा', 'Save Milestone')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── CONFIRM DELETE DIALOGS ─── */}
      {deletingInitiative && (
        <ConfirmDialog
          title={t('उपक्रम हटवायचा?', 'Delete Initiative Card?')}
          description={t(`तुम्हाला खात्री आहे की तुम्ही "${deletingInitiative.title_mr}" उपक्रम कायमचा हटवू इच्छिता? ही क्रिया पूर्ववत केली जाऊ शकत नाही.`, `Are you sure you want to permanently delete "${deletingInitiative.title_en}"? This action cannot be undone.`)}
          onConfirm={handleInitiativeDelete}
          onCancel={() => setDeletingInitiative(null)}
          loading={actionLoading}
        />
      )}

      {deletingScheme && (
        <ConfirmDialog
          title={t('योजना हटवायची?', 'Delete Scheme Card?')}
          description={t(`तुम्हाला खात्री आहे की तुम्ही "${deletingScheme.title_mr}" योजना कायमची हटवू इच्छिता?`, `Are you sure you want to permanently delete "${deletingScheme.title_en}"?`)}
          onConfirm={handleSchemeDelete}
          onCancel={() => setDeletingScheme(null)}
          loading={actionLoading}
        />
      )}

      {deletingAchievement && (
        <ConfirmDialog
          title={t('यशस्वी उपलब्धी हटवायची?', 'Delete Achievement?')}
          description={t(`तुम्हाला खात्री आहे की तुम्ही "${deletingAchievement.label_mr}" उपलब्धी कायमची हटवू इच्छिता?`, `Are you sure you want to permanently delete "${deletingAchievement.label_en}"?`)}
          onConfirm={handleAchievementDelete}
          onCancel={() => setDeletingAchievement(null)}
          loading={actionLoading}
        />
      )}

      {deletingTimeline && (
        <ConfirmDialog
          title={t('टप्पा हटवायचा?', 'Delete Milestone?')}
          description={t(`तुम्हाला खात्री आहे की तुम्ही "${deletingTimeline.title_mr}" टप्पा कायमचा हटवू इच्छिता?`, `Are you sure you want to permanently delete "${deletingTimeline.title_en}"?`)}
          onConfirm={handleTimelineDelete}
          onCancel={() => setDeletingTimeline(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
