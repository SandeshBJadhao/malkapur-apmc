'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Commodity, MarketRate, CommodityVariety } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Loader2,
  Sprout,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Calendar,
  Landmark,
  CheckCircle2,
  XCircle,
  Upload,
  Camera,
  Sparkles,
  Eye,
  Send,
  ShieldCheck,
  CircleDashed,
  TriangleAlert,
  ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'commodities' | 'rates' | 'ai-import';

type ToastType = 'success' | 'error';

type ImportItem = {
  id: string;
  commodity_id: string | null;
  commodity_name_raw: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  min_arrivals: number;
  max_arrivals: number;
  modal_arrivals: number;
  unit: string;
  market_center: string;
  confidence: number;
  is_flagged: boolean;
  admin_action: 'keep' | 'skip';
  commodity?: { id: string; name_mr: string; name_en: string } | null;
  variety?: string;
};
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

type CommodityForm = {
  name_mr: string;
  name_en: string;
  category: string;
  unit: string;
  is_active: boolean;
  msamb_variety: string;
};

type RateForm = {
  commodity_id: string;
  date: string;
  market_center: string;
  min_price: string;
  max_price: string;
  modal_price: string;
  min_arrivals: string;
  max_arrivals: string;
  modal_arrivals: string;
  unit: string;
  variety: string;
};

const EMPTY_COMMODITY_FORM: CommodityForm = {
  name_mr: '',
  name_en: '',
  category: 'oilseeds',
  unit: 'क्विंटल',
  is_active: true,
  msamb_variety: '',
};

const EMPTY_RATE_FORM: RateForm = {
  commodity_id: '',
  date: new Date().toISOString().split('T')[0],
  market_center: 'malkapur_main',
  min_price: '',
  max_price: '',
  modal_price: '',
  min_arrivals: '',
  max_arrivals: '',
  modal_arrivals: '',
  unit: 'क्विंटल',
  variety: '',
};


const CATEGORIES = [
  { value: 'cereals',    label: 'धान्य (Cereals)' },
  { value: 'oilseeds',  label: 'तेलबिया (Oilseeds)' },
  { value: 'pulses',    label: 'कडधान्ये (Pulses)' },
  { value: 'fibers',    label: 'तंतुमय पिके (Fibers)' },
  { value: 'vegetables',label: 'भाजीपाला (Vegetables)' },
  { value: 'fruits',    label: 'फळे (Fruits)' },
  { value: 'spices',    label: 'मसाले (Spices)' },
  { value: 'other',     label: 'इतर (Other)' },
];

const MARKET_CENTERS = [
  { value: 'malkapur_main', label: 'मल्कापूर मुख्य बाजार (Malkapur Main)' },
  { value: 'nanda_sub',     label: 'नांदा उप-बाजार (Nanda Sub-Market)' },
];

const ROWS_PER_PAGE = 10;

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Toast notification */
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold animate-slide-in',
            t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() => onRemove(t.id)}
            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Modal wrapper */
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/** Confirm Delete Dialog */
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-full bg-red-100 shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
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
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {t('हटवा', 'Delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Form field row */
function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/** Empty state */
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
      <div className="p-4 rounded-2xl bg-gray-100">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <p className="font-semibold text-gray-700 text-base">{title}</p>
      <p className="text-sm text-gray-400 max-w-xs">{description}</p>
    </div>
  );
}

/** Skeleton row for loading */
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminMarketRatesPage() {
  const supabase = createClient();
  const { t } = useLanguage();

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState<Tab>('commodities');

  // ─────────────────────────────────────────────────────────────────────────
  // AI IMPORT STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFilePreview, setImportFilePreview] = useState<string | null>(null);
  const [importDate, setImportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [importCenter, setImportCenter] = useState<string>('malkapur_main');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSession, setImportSession] = useState<{ id: string; date_for: string; market_center: string } | null>(null);
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [importCommodities, setImportCommodities] = useState<{ id: string; name_mr: string; name_en: string }[]>([]);
  const [editingImportIdx, setEditingImportIdx] = useState<number | null>(null);
  const [editImportForm, setEditImportForm] = useState<Partial<ImportItem>>({});
  const [publishLoading, setPublishLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const importFileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Toast ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  let toastCounter = 0;
  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // COMMODITIES STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [commoditiesLoading, setCommoditiesLoading] = useState(true);
  const [commoditySearch, setCommoditySearch] = useState('');

  // Varieties states
  const [varietiesMap, setVarietiesMap] = useState<Record<string, CommodityVariety[]>>({});
  const [modalVarieties, setModalVarieties] = useState<(Omit<CommodityVariety, 'id' | 'commodity_id'> & { id?: string })[]>([]);
  const [newVarMr, setNewVarMr] = useState('');
  const [newVarEn, setNewVarEn] = useState('');
  const [editingVarIdx, setEditingVarIdx] = useState<number | null>(null);
  const [editVarForm, setEditVarForm] = useState<{ name_mr: string; name_en: string }>({ name_mr: '', name_en: '' });

  // Modal state
  const [commodityModal, setCommodityModal] = useState<'add' | 'edit' | null>(null);
  const [editingCommodity, setEditingCommodity] = useState<Commodity | null>(null);
  const [commodityForm, setCommodityForm] = useState<CommodityForm>(EMPTY_COMMODITY_FORM);
  const [commoditySaving, setCommoditySaving] = useState(false);

  // Delete state
  const [deletingCommodityId, setDeletingCommodityId] = useState<string | null>(null);
  const [commodityDeleteLoading, setCommodityDeleteLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // RATES STATE
  // ─────────────────────────────────────────────────────────────────────────
  const [rates, setRates] = useState<(MarketRate & { commodities?: Commodity })[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesPage, setRatesPage] = useState(1);
  const [ratesSearch, setRatesSearch] = useState('');
  const [ratesDateFilter, setRatesDateFilter] = useState('');
  const [ratesCenterFilter, setRatesCenterFilter] = useState('all');

  // Modal state
  const [rateModal, setRateModal] = useState<'add' | 'edit' | null>(null);
  const [editingRate, setEditingRate] = useState<MarketRate | null>(null);
  const [rateForm, setRateForm] = useState<RateForm>(EMPTY_RATE_FORM);
  const [rateSaving, setRateSaving] = useState(false);
  const [rateFormError, setRateFormError] = useState<string | null>(null);

  // Delete state
  const [deletingRateId, setDeletingRateId] = useState<string | null>(null);
  const [rateDeleteLoading, setRateDeleteLoading] = useState(false);

  // ─── MSAMB Sync State ─────────────────────────────────────────────────────
  const [msambFetching, setMsambFetching] = useState(false);

  // ─── Cleanup & View Mode State ───────────────────────────────────────────
  const [ratesViewMode, setRatesViewMode] = useState<'latest' | 'all'>('latest');
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────────────────
  const fetchCommodities = useCallback(async () => {
    setCommoditiesLoading(true);
    try {
      // Fetch commodities
      const { data: commData, error: commError } = await supabase
        .from('commodities')
        .select('*')
        .order('name_en', { ascending: true });
      if (commError) throw commError;

      // Fetch all varieties
      const { data: varData, error: varError } = await supabase
        .from('commodity_varieties')
        .select('*')
        .order('sort_order', { ascending: true });
      if (varError) throw varError;

      // Group varieties by commodity_id
      const vMap: Record<string, CommodityVariety[]> = {};
      (varData || []).forEach((v) => {
        if (!vMap[v.commodity_id]) {
          vMap[v.commodity_id] = [];
        }
        vMap[v.commodity_id].push(v);
      });

      setVarietiesMap(vMap);
      setCommodities(commData || []);
    } catch {
      addToast('error', t('शेतमाल लोड करण्यात त्रुटी झाली.', 'Failed to load commodities.'));
    } finally {
      setCommoditiesLoading(false);
    }
  }, [supabase, addToast]);

  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const { data, error } = await supabase
        .from('market_rates')
        .select(`
          *,
          commodities ( id, name_mr, name_en, category, unit, is_active, created_at, updated_at )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRates(data || []);
    } catch {
      addToast('error', t('बाजार भाव लोड करण्यात त्रुटी झाली.', 'Failed to load market rates.'));
    } finally {
      setRatesLoading(false);
    }
  }, [supabase, addToast]);

  useEffect(() => {
    fetchCommodities();
  }, [fetchCommodities]);

  useEffect(() => {
    if (activeTab === 'rates') fetchRates();
  }, [activeTab, fetchRates]);

  // ─────────────────────────────────────────────────────────────────────────
  // COMMODITY CRUD
  // ─────────────────────────────────────────────────────────────────────────
  const openAddCommodity = () => {
    setCommodityForm(EMPTY_COMMODITY_FORM);
    setModalVarieties([]);
    setEditingCommodity(null);
    setCommodityModal('add');
    setNewVarMr('');
    setNewVarEn('');
    setEditingVarIdx(null);
  };

  const openEditCommodity = (c: Commodity) => {
    setEditingCommodity(c);
    setCommodityForm({
      name_mr: c.name_mr,
      name_en: c.name_en,
      category: c.category,
      unit: c.unit,
      is_active: c.is_active,
      msamb_variety: c.msamb_variety || '',
    });
    const currentVars = varietiesMap[c.id] || [];
    setModalVarieties(currentVars.map(v => ({
      id: v.id,
      name_mr: v.name_mr,
      name_en: v.name_en,
      sort_order: v.sort_order
    })));
    setCommodityModal('edit');
    setNewVarMr('');
    setNewVarEn('');
    setEditingVarIdx(null);
  };

  const closeCommodityModal = () => {
    setCommodityModal(null);
    setEditingCommodity(null);
    setModalVarieties([]);
    setNewVarMr('');
    setNewVarEn('');
    setEditingVarIdx(null);
  };

  const handleAddModalVariety = () => {
    const mr = newVarMr.trim();
    const en = newVarEn.trim();
    if (!mr || !en) {
      addToast('error', t('जात/प्रतीचे मराठी आणि इंग्रजी नाव दोन्ही आवश्यक आहेत.', 'Both Marathi and English names are required.'));
      return;
    }
    if (modalVarieties.some(v => v.name_mr.toLowerCase() === mr.toLowerCase() || v.name_en.toLowerCase() === en.toLowerCase())) {
      addToast('error', t('ही जात/प्रत आधीच जोडलेली आहे.', 'This variety is already added.'));
      return;
    }

    setModalVarieties((prev) => [
      ...prev,
      { name_mr: mr, name_en: en, sort_order: prev.length },
    ]);
    setNewVarMr('');
    setNewVarEn('');
  };

  const handleDeleteModalVariety = (idx: number) => {
    setModalVarieties((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      return filtered.map((v, i) => ({ ...v, sort_order: i }));
    });
    if (editingVarIdx === idx) {
      setEditingVarIdx(null);
    }
  };

  const startInlineEditVariety = (idx: number) => {
    const v = modalVarieties[idx];
    setEditVarForm({ name_mr: v.name_mr, name_en: v.name_en });
    setEditingVarIdx(idx);
  };

  const handleSaveInlineVariety = (idx: number) => {
    const mr = editVarForm.name_mr.trim();
    const en = editVarForm.name_en.trim();
    if (!mr || !en) {
      addToast('error', t('दोन्ही नावे आवश्यक आहेत.', 'Both names are required.'));
      return;
    }

    const hasDup = modalVarieties.some((v, i) => 
      i !== idx && (v.name_mr.toLowerCase() === mr.toLowerCase() || v.name_en.toLowerCase() === en.toLowerCase())
    );
    if (hasDup) {
      addToast('error', t('ही जात/प्रत आधीच यादीत आहे.', 'This variety is already in the list.'));
      return;
    }

    setModalVarieties((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, name_mr: mr, name_en: en } : v))
    );
    setEditingVarIdx(null);
  };

  const handleMoveVariety = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= modalVarieties.length) return;

    setModalVarieties((prev) => {
      const list = [...prev];
      const temp = list[idx];
      list[idx] = list[targetIdx];
      list[targetIdx] = temp;
      return list.map((v, i) => ({ ...v, sort_order: i }));
    });
    if (editingVarIdx !== null) {
      setEditingVarIdx(null);
    }
  };

  const saveCommodity = async () => {
    if (!commodityForm.name_mr.trim() || !commodityForm.name_en.trim()) {
      addToast('error', t('मराठी आणि इंग्रजी नाव आवश्यक आहे.', 'Marathi and English names are required.'));
      return;
    }
    setCommoditySaving(true);
    try {
      if (commodityModal === 'add') {
        const { data, error } = await supabase.from('commodities').insert({
          name_mr: commodityForm.name_mr.trim(),
          name_en: commodityForm.name_en.trim(),
          category: commodityForm.category,
          unit: commodityForm.unit.trim() || 'क्विंटल',
          is_active: commodityForm.is_active,
          msamb_variety: commodityForm.msamb_variety.trim(),
        }).select();
        if (error) throw error;

        const newCommId = data?.[0]?.id;
        if (newCommId && modalVarieties.length > 0) {
          const varsToInsert = modalVarieties.map((v) => ({
            commodity_id: newCommId,
            name_mr: v.name_mr,
            name_en: v.name_en,
            sort_order: v.sort_order,
          }));
          const { error: varError } = await supabase
            .from('commodity_varieties')
            .insert(varsToInsert);
          if (varError) throw varError;
        }

        addToast('success', t('शेतमाल यशस्वीरित्या जोडला गेला!', 'Commodity added successfully!'));
      } else if (commodityModal === 'edit' && editingCommodity) {
        const { error } = await supabase
          .from('commodities')
          .update({
            name_mr: commodityForm.name_mr.trim(),
            name_en: commodityForm.name_en.trim(),
            category: commodityForm.category,
            unit: commodityForm.unit.trim() || 'क्विंटल',
            is_active: commodityForm.is_active,
            msamb_variety: commodityForm.msamb_variety.trim(),
          })
          .eq('id', editingCommodity.id);
        if (error) throw error;

        const { error: delError } = await supabase
          .from('commodity_varieties')
          .delete()
          .eq('commodity_id', editingCommodity.id);
        if (delError) throw delError;

        if (modalVarieties.length > 0) {
          const varsToInsert = modalVarieties.map((v) => ({
            commodity_id: editingCommodity.id,
            name_mr: v.name_mr,
            name_en: v.name_en,
            sort_order: v.sort_order,
          }));
          const { error: insError } = await supabase
            .from('commodity_varieties')
            .insert(varsToInsert);
          if (insError) throw insError;
        }

        addToast('success', t('शेतमाल यशस्वीरित्या अद्ययावत केला!', 'Commodity updated successfully!'));
      }
      await fetchCommodities();
      closeCommodityModal();
    } catch (err: any) {
      addToast('error', err?.message || t('जतन करण्यात त्रुटी. पुन्हा प्रयत्न करा.', 'Error saving. Please try again.'));
    } finally {
      setCommoditySaving(false);
    }
  };

  const confirmDeleteCommodity = async () => {
    if (!deletingCommodityId) return;
    setCommodityDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('commodities')
        .delete()
        .eq('id', deletingCommodityId);
      if (error) throw error;
      addToast('success', t('शेतमाल यशस्वीरित्या हटवले!', 'Commodity deleted successfully!'));
      await fetchCommodities();
    } catch (err: any) {
      addToast('error', err?.message || t('हटवण्यात त्रुटी झाली. त्याच्याशी संबंधित दर असू शकतात.', 'Failed to delete. There may be rates associated with it.'));
    } finally {
      setCommodityDeleteLoading(false);
      setDeletingCommodityId(null);
    }
  };

  // Toggle active status inline
  const toggleCommodityActive = async (c: Commodity) => {
    try {
      const { error } = await supabase
        .from('commodities')
        .update({ is_active: !c.is_active })
        .eq('id', c.id);
      if (error) throw error;
      setCommodities((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, is_active: !x.is_active } : x))
      );
      addToast('success', !c.is_active 
        ? t('शेतमाल सक्रिय केला.', 'Commodity activated.') 
        : t('शेतमाल निष्क्रिय केला.', 'Commodity deactivated.')
      );
    } catch {
      addToast('error', t('स्थिती बदलण्यात त्रुटी.', 'Error updating status.'));
    }
  };

  // Filtered commodities for list
  const filteredCommodities = useMemo(() => {
    const q = commoditySearch.toLowerCase();
    if (!q) return commodities;
    return commodities.filter(
      (c) =>
        c.name_mr.toLowerCase().includes(q) ||
        c.name_en.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commodities, commoditySearch]);

  // ─────────────────────────────────────────────────────────────────────────
  // RATES CRUD
  // ─────────────────────────────────────────────────────────────────────────
  const openAddRate = () => {
    const defaultComm = commodities.find((c) => c.is_active);
    setRateForm({
      ...EMPTY_RATE_FORM,
      commodity_id: defaultComm?.id || '',
      unit: defaultComm?.unit || 'क्विंटल',
      variety: defaultComm?.msamb_variety || '',
    });
    setEditingRate(null);
    setRateFormError(null);
    setRateModal('add');
  };

  const openEditRate = (r: MarketRate) => {
    setEditingRate(r);
    setRateForm({
      commodity_id: r.commodity_id,
      date: r.date,
      market_center: r.market_center || 'malkapur_main',
      min_price: String(r.min_price),
      max_price: String(r.max_price),
      modal_price: String(r.modal_price),
      min_arrivals: String(r.min_arrivals ?? 0),
      max_arrivals: String(r.max_arrivals ?? 0),
      modal_arrivals: String(r.modal_arrivals ?? 0),
      unit: r.unit,
      variety: r.variety || '',
    });
    setRateFormError(null);
    setRateModal('edit');
  };

  const closeRateModal = () => {
    setRateModal(null);
    setEditingRate(null);
    setRateFormError(null);
  };

  const validateRateForm = (): string | null => {
    if (!rateForm.commodity_id) return t('शेतमाल निवडणे आवश्यक आहे.', 'Selecting a commodity is required.');
    if (!rateForm.date) return t('दिनांक आवश्यक आहे.', 'Date is required.');
    const min = parseFloat(rateForm.min_price);
    const max = parseFloat(rateForm.max_price);
    const modal = parseFloat(rateForm.modal_price);
    const min_arr = parseFloat(rateForm.min_arrivals);
    const max_arr = parseFloat(rateForm.max_arrivals);
    const modal_arr = parseFloat(rateForm.modal_arrivals);
    if (isNaN(min) || min < 0) return t('किमान दर (Min Price) वैध आहे का तपासा.', 'Check if Min Price is valid.');
    if (isNaN(max) || max < 0) return t('कमाल दर (Max Price) वैध आहे का तपासा.', 'Check if Max Price is valid.');
    if (isNaN(modal) || modal < 0) return t('सर्वसाधारण दर (Modal Price) वैध आहे का तपासा.', 'Check if Modal Price is valid.');
    if (isNaN(min_arr) || min_arr < 0) return t('किमान दराला आवक वैध आहे का तपासा.', 'Check if Min Arrivals is valid.');
    if (isNaN(max_arr) || max_arr < 0) return t('कमाल दराला आवक वैध आहे का तपासा.', 'Check if Max Arrivals is valid.');
    if (isNaN(modal_arr) || modal_arr < 0) return t('सर्वसाधारण दराला आवक वैध आहे का तपासा.', 'Check if Modal Arrivals is valid.');
    if (min > max) return t('किमान दर हा कमाल दरापेक्षा जास्त असू शकत नाही.', 'Min Price cannot be greater than Max Price.');
    if (modal < min || modal > max) return t('सर्वसाधारण दर किमान आणि कमाल दरांच्या दरम्यान असणे आवश्यक आहे.', 'Modal Price must be between Min Price and Max Price.');
    return null;
  };

  const saveRate = async () => {
    const err = validateRateForm();
    if (err) { setRateFormError(err); return; }
    setRateFormError(null);
    setRateSaving(true);

    const payload = {
      commodity_id: rateForm.commodity_id,
      date: rateForm.date,
      market_center: rateForm.market_center,
      min_price: parseFloat(rateForm.min_price),
      max_price: parseFloat(rateForm.max_price),
      modal_price: parseFloat(rateForm.modal_price),
      min_arrivals: parseFloat(rateForm.min_arrivals),
      max_arrivals: parseFloat(rateForm.max_arrivals),
      modal_arrivals: parseFloat(rateForm.modal_arrivals),
      unit: rateForm.unit.trim() || 'क्विंटल',
      variety: rateForm.variety.trim(),
    };

    try {
      if (rateModal === 'add') {
        const { error } = await supabase.from('market_rates').insert(payload);
        if (error) throw error;
        addToast('success', t('दर यशस्वीरित्या जोडला गेला!', 'Rate added successfully!'));
      } else if (rateModal === 'edit' && editingRate) {
        const { error } = await supabase
          .from('market_rates')
          .update(payload)
          .eq('id', editingRate.id);
        if (error) throw error;
        addToast('success', t('दर यशस्वीरित्या अद्ययावत केला!', 'Rate updated successfully!'));
      }
      await fetchRates();
      closeRateModal();
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('unique') || msg.includes('duplicate')) {
        setRateFormError(t('या तारखेला, बाजार केंद्र व शेतमालाचा दर आधीच नोंदवला आहे. संपादित करा.', 'Rates for this date, market center, and commodity are already registered. Please edit the existing entry.'));
      } else {
        setRateFormError(msg || t('जतन करण्यात त्रुटी. पुन्हा प्रयत्न करा.', 'Error saving. Please try again.'));
      }
    } finally {
      setRateSaving(false);
    }
  };

  const confirmDeleteRate = async () => {
    if (!deletingRateId) return;
    setRateDeleteLoading(true);
    try {
      const { error } = await supabase.from('market_rates').delete().eq('id', deletingRateId);
      if (error) throw error;
      addToast('success', t('दर यशस्वीरित्या हटवला!', 'Rate entry deleted successfully!'));
      await fetchRates();
    } catch (err: any) {
      addToast('error', err?.message || t('हटवण्यात त्रुटी.', 'Failed to delete.'));
    } finally {
      setRateDeleteLoading(false);
      setDeletingRateId(null);
    }
  };

  // Filtered + paginated rates
  const filteredRates = useMemo(() => {
    let list = rates;

    if (ratesViewMode === 'latest' && !ratesDateFilter) {
      const seen = new Set<string>();
      list = rates.filter((r) => {
        const key = `${r.commodity_id}|${r.market_center || 'malkapur_main'}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    return list.filter((r) => {
      const q = ratesSearch.toLowerCase();
      if (q) {
        const nameMr = r.commodities?.name_mr?.toLowerCase() || '';
        const nameEn = r.commodities?.name_en?.toLowerCase() || '';
        if (!nameMr.includes(q) && !nameEn.includes(q)) return false;
      }
      if (ratesDateFilter && r.date !== ratesDateFilter) return false;
      if (ratesCenterFilter !== 'all' && (r.market_center || 'malkapur_main') !== ratesCenterFilter) return false;
      return true;
    });
  }, [rates, ratesSearch, ratesDateFilter, ratesCenterFilter, ratesViewMode]);

  const totalRatePages = Math.ceil(filteredRates.length / ROWS_PER_PAGE) || 1;
  const paginatedRates = useMemo(
    () => filteredRates.slice((ratesPage - 1) * ROWS_PER_PAGE, ratesPage * ROWS_PER_PAGE),
    [filteredRates, ratesPage]
  );

  // Sync commodity unit and default variety into rate form when commodity changes
  const handleRateCommodityChange = (id: string) => {
    const comm = commodities.find((c) => c.id === id);
    setRateForm((f) => ({
      ...f,
      commodity_id: id,
      unit: comm?.unit || f.unit,
      variety: comm?.msamb_variety || '',
    }));
  };



  const handleMSAMBFetch = async () => {
    setMsambFetching(true);
    try {
      const res = await fetch('/api/admin/msamb-fetch', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        let msg = t(
          `${data.syncedCount} दर MSAMB वरून यशस्वीरित्या सिंक झाले! ✅`,
          `${data.syncedCount} rates successfully synced from MSAMB! ✅`
        );
        if (data.unmatched && data.unmatched.length > 0) {
          msg += t(
            ` (जुळले नाहीत: ${data.unmatched.join(', ')})`,
            ` (unmatched: ${data.unmatched.join(', ')})`
          );
        }
        addToast(data.unmatched && data.unmatched.length > 0 ? 'error' : 'success', msg);
        await fetchRates();
      } else {
        addToast('error', data.error || t('MSAMB वरून दर मिळवण्यात अयशस्वी.', 'Failed to fetch rates from MSAMB.'));
      }
    } catch (err: any) {
      addToast('error', err?.message || t('सिंक करताना त्रुटी आली.', 'An error occurred during sync.'));
    } finally {
      setMsambFetching(false);
    }
  };

  const handleCleanup = async () => {
    setCleanupLoading(true);
    try {
      const res = await fetch('/api/admin/market-rates/cleanup', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast('success', t(
          `${data.deletedCount} जुन्या ऐतिहासिक नोंदी हटवल्या आणि ताजे दर सुरक्षित ठेवले! ✅`,
          `Deleted ${data.deletedCount} historical records, keeping only the latest rates! ✅`
        ));
        await fetchRates();
      } else {
        addToast('error', data.error || t('इतिहास साफ करण्यात त्रुटी.', 'Failed to clean history.'));
      }
    } catch (err: any) {
      addToast('error', err?.message || t('त्रुटी आली.', 'An error occurred.'));
    } finally {
      setCleanupLoading(false);
      setShowCleanupConfirm(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('बाजार भाव व्यवस्थापन', 'Market Rates Management')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('शेतमाल आणि दैनिक बाजार भाव नोंदी व्यवस्थापित करा', 'Manage commodities and daily market rate entries')}</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('commodities')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
              activeTab === 'commodities'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Sprout className="h-4 w-4" />
            {t('शेतमाल', 'Commodities')}
          </button>
          <button
            onClick={() => setActiveTab('rates')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
              activeTab === 'rates'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <TrendingUp className="h-4 w-4" />
            {t('बाजार भाव', 'Market Rates')}
          </button>
          <button
            onClick={() => { setActiveTab('ai-import'); setImportSession(null); setImportItems([]); setImportFile(null); setImportFilePreview(null); setImportError(null); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
              activeTab === 'ai-import'
                ? 'bg-white text-purple-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Sparkles className="h-4 w-4" />
            {t('AI आयात', 'AI Import')}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB: COMMODITIES
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'commodities' && (
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sprout className="h-5 w-5 text-green-700" />
                {t('शेतमाल यादी (Commodity Manager)', 'Commodity Manager')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t(`${commodities.length} शेतमाल · ${commodities.filter((c) => c.is_active).length} सक्रिय`, `${commodities.length} commodities · ${commodities.filter((c) => c.is_active).length} active`)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder={t('शेतमाल शोधा...', 'Search commodities...')}
                  value={commoditySearch}
                  onChange={(e) => setCommoditySearch(e.target.value)}
                  className="pl-9 w-52 text-sm h-9"
                />
              </div>
              <Button
                onClick={fetchCommodities}
                variant="outline"
                size="sm"
                className="cursor-pointer h-9"
                title={t('रिफ्रेश', 'Refresh')}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button onClick={openAddCommodity} size="sm" className="cursor-pointer h-9">
                <Plus className="h-4 w-4" />
                {t('शेतमाल जोडा', 'Add Commodity')}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="w-[200px]">{t('मराठी नाव', 'Marathi Name')}</TableHead>
                  <TableHead className="w-[200px]">{t('इंग्रजी नाव', 'English Name')}</TableHead>
                  <TableHead>{t('श्रेणी', 'Category')}</TableHead>
                  <TableHead>{t('एकक', 'Unit')}</TableHead>
                  <TableHead>{t('स्थिती', 'Status')}</TableHead>
                  <TableHead className="text-right pr-6">{t('कृती', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commoditiesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
                ) : filteredCommodities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                         icon={Sprout}
                         title={t('कोणतेही शेतमाल सापडले नाहीत', 'No commodities found')}
                         description={t('&quot;शेतमाल जोडा&quot; वर क्लिक करा आणि पहिला शेतमाल जोडा.', 'Click "Add Commodity" to add your first commodity.')}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCommodities.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-gray-900">{c.name_mr}</TableCell>
                      <TableCell className="text-gray-700">{c.name_en}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {CATEGORIES.find((cat) => cat.value === c.category)?.label?.split('(')[1]?.replace(')', '') || c.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">{c.unit}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleCommodityActive(c)}
                          title={c.is_active ? t('अक्रिय करण्यासाठी क्लिक करा', 'Click to deactivate') : t('सक्रिय करण्यासाठी क्लिक करा', 'Click to activate')}
                          className="cursor-pointer"
                        >
                          <Badge variant={c.is_active ? 'success' : 'destructive'}>
                            {c.is_active ? t('सक्रिय', 'Active') : t('अक्रिय', 'Inactive')}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditCommodity(c)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                            title={t('संपादित करा', 'Edit')}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingCommodityId(c.id)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            title={t('हटवा', 'Delete')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: MARKET RATES
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'rates' && (
        <Card>
          <CardHeader className="border-b border-gray-100 pb-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-700" />
                  {t('दैनिक बाजार भाव (Daily Market Rates)', 'Daily Market Rates')}
                </CardTitle>
                <CardDescription className="mt-1">
                  {filteredRates.length}{(ratesSearch || ratesDateFilter || ratesCenterFilter !== 'all') ? t(` (फिल्टर केलेल्या)`, ' (filtered)') : ''} {t('नोंदी', 'entries')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={fetchRates}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-9"
                  title={t('रिफ्रेश', 'Refresh')}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>

                <Button
                  onClick={handleMSAMBFetch}
                  disabled={msambFetching}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-9 border-green-300 text-green-700 hover:bg-green-50 gap-1.5"
                  title={t('MSAMB वरून दर सिंक करा', 'Sync rates from MSAMB portal')}
                >
                  {msambFetching ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {t('MSAMB वरून अपडेट', 'Update from MSAMB')}
                </Button>
                <Button
                  onClick={() => setShowCleanupConfirm(true)}
                  variant="outline"
                  size="sm"
                  className="cursor-pointer h-9 border-red-300 text-red-700 hover:bg-red-50 gap-1.5"
                  title={t('जुना इतिहास हटवा (फक्त ताजे दर ठेवा)', 'Delete old history, keeping only the latest rates')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('इतिहास साफ करा', 'Clean History')}
                </Button>
                <Button
                  onClick={openAddRate}
                  size="sm"
                  className="cursor-pointer h-9"
                  disabled={commodities.filter(c => c.is_active).length === 0}
                >
                  <Plus className="h-4 w-4" />
                  {t('दर नोंद जोडा', 'Add Rate Entry')}
                </Button>
              </div>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder={t('शेतमाल शोधा...', 'Search commodity...')}
                  value={ratesSearch}
                  onChange={(e) => { setRatesSearch(e.target.value); setRatesPage(1); }}
                  className="pl-9 w-48 text-sm h-9"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <Input
                  type="date"
                  value={ratesDateFilter}
                  onChange={(e) => { setRatesDateFilter(e.target.value); setRatesPage(1); }}
                  className="pl-9 w-44 text-sm h-9"
                />
              </div>
              <div className="relative">
                <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <Select
                  value={ratesCenterFilter}
                  onChange={(e) => { setRatesCenterFilter(e.target.value); setRatesPage(1); }}
                  className="pl-9 w-52 h-9 text-sm"
                >
                  <option value="all">{t('सर्व बाजार', 'All Markets')}</option>
                  {MARKET_CENTERS.map((mc) => (
                    <option key={mc.value} value={mc.value}>{t(mc.label.split(' (')[0], mc.label.split(' (')[1]?.replace(')', '') || mc.label)}</option>
                  ))}
                </Select>
              </div>
              <div className="relative">
                <Select
                  value={ratesViewMode}
                  onChange={(e) => { setRatesViewMode(e.target.value as 'latest' | 'all'); setRatesPage(1); }}
                  className="h-9 text-sm w-44"
                >
                  <option value="latest">{t('फक्त ताजे दर (Latest Only)', 'Latest Rates Only')}</option>
                  <option value="all">{t('सर्व इतिहास (All History)', 'All History')}</option>
                </Select>
              </div>
              {(ratesSearch || ratesDateFilter || ratesCenterFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 text-gray-500 cursor-pointer"
                  onClick={() => { setRatesSearch(''); setRatesDateFilter(''); setRatesCenterFilter('all'); setRatesPage(1); }}
                >
                  <X className="h-3.5 w-3.5 mr-1" /> {t('साफ करा', 'Clear')}
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead>{t('दिनांक', 'Date')}</TableHead>
                  <TableHead>{t('शेतमाल', 'Commodity')}</TableHead>
                  <TableHead>{t('जात/प्रत', 'Variety')}</TableHead>
                  <TableHead>{t('बाजार', 'Market')}</TableHead>
                  <TableHead className="text-right">{t('किमान ₹', 'Min ₹')}</TableHead>
                  <TableHead className="text-right">{t('कमाल ₹', 'Max ₹')}</TableHead>
                  <TableHead className="text-right">{t('सर्वसाधारण ₹', 'Modal ₹')}</TableHead>
                  <TableHead className="text-right">{t('आवक', 'Arrivals')}</TableHead>
                  <TableHead className="text-right pr-6">{t('कृती', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratesLoading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
                ) : paginatedRates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <EmptyState
                        icon={TrendingUp}
                        title={t('कोणताही दर सापडला नाही', 'No rates found')}
                        description={t('आजचे बाजार भाव नोंदवण्यासाठी "दर नोंद जोडा" वापरा.', "Use 'Add Rate Entry' to log today's market prices.")}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRates.map((r) => {
                    const center = MARKET_CENTERS.find((m) => m.value === (r.market_center || 'malkapur_main'));
                    const centerShort = r.market_center === 'nanda_sub' ? t('नांदा', 'Nanda') : t('मलकापूर', 'Malkapur');
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm font-medium text-gray-800 tabular-nums">{r.date}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 text-sm">{t(r.commodities?.name_mr || '—', r.commodities?.name_en || '—')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 font-medium">
                          {r.variety || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.market_center === 'nanda_sub' ? 'warning' : 'default'} className="text-xs">
                            {centerShort}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-gray-700">{formatCurrency(r.min_price)}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm text-gray-700">{formatCurrency(r.max_price)}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-bold text-green-700">{formatCurrency(r.modal_price)}</TableCell>
                        <TableCell className="text-right text-xs text-gray-500 tabular-nums">
                          <div>{r.modal_arrivals} {r.unit} <span className="text-[10px] text-gray-400">({t('सर्व.', 'Mod.')})</span></div>
                          <div className="text-[9px] text-gray-400 font-normal">
                            {t('किमान', 'Min')}: {r.min_arrivals} / {t('कमाल', 'Max')}: {r.max_arrivals}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditRate(r)}
                              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                              title={t('संपादित करा', 'Edit')}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingRateId(r.id)}
                              className="h-8 w-8 p-0 text-gray-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              title={t('हटवा', 'Delete')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalRatePages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {t(`${(ratesPage - 1) * ROWS_PER_PAGE + 1}–${Math.min(ratesPage * ROWS_PER_PAGE, filteredRates.length)} पैकी ${filteredRates.length} दाखवत आहे`, `Showing ${(ratesPage - 1) * ROWS_PER_PAGE + 1}–${Math.min(ratesPage * ROWS_PER_PAGE, filteredRates.length)} of ${filteredRates.length}`)}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRatesPage((p) => Math.max(1, p - 1))}
                    disabled={ratesPage === 1}
                    className="h-8 w-8 p-0 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-semibold text-gray-700">
                    {ratesPage} / {totalRatePages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRatesPage((p) => Math.min(totalRatePages, p + 1))}
                    disabled={ratesPage === totalRatePages}
                    className="h-8 w-8 p-0 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════ */}

      {/* ── Add / Edit Commodity ── */}
      {commodityModal && (
        <Modal
          title={commodityModal === 'add' ? t('+ नवीन शेतमाल जोडा', '+ Add Commodity') : t('शेतमाल संपादित करा', 'Edit Commodity')}
          onClose={closeCommodityModal}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('मराठी नाव', 'Marathi Name')} required>
                <Input
                  placeholder={t('उदा. सोयाबीन', 'e.g. Soyabean')}
                  value={commodityForm.name_mr}
                  onChange={(e) => setCommodityForm((f) => ({ ...f, name_mr: e.target.value }))}
                />
              </FormField>
              <FormField label={t('इंग्रजी नाव', 'English Name')} required>
                <Input
                  placeholder={t('उदा. Soyabean', 'e.g. Soyabean')}
                  value={commodityForm.name_en}
                  onChange={(e) => setCommodityForm((f) => ({ ...f, name_en: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('श्रेणी', 'Category')} required>
                <Select
                  value={commodityForm.category}
                  onChange={(e) => setCommodityForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{t(cat.label.split(' (')[0], cat.label.split(' (')[1]?.replace(')', '') || cat.label)}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label={t('एकक (युनिट)', 'Unit')} required hint={t('उदा. क्विंटल, किलो, टन', 'e.g. Quintal, Kg, Ton')}>
                <Input
                  placeholder={t('क्विंटल', 'Quintal')}
                  value={commodityForm.unit}
                  onChange={(e) => setCommodityForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('शेतमालाची जात / प्रत (MSAMB Default Variety)', 'MSAMB Default Variety')} hint={t('उदा. लोकल, पिवळा, लाल', 'e.g. Local, Yellow, Red')}>
                {modalVarieties.length > 0 ? (
                  <Select
                    value={commodityForm.msamb_variety}
                    onChange={(e) => setCommodityForm((f) => ({ ...f, msamb_variety: e.target.value }))}
                  >
                    <option value="">{t('-- निवडा (Select) --', '-- Select --')}</option>
                    {modalVarieties.map((v, i) => (
                      <option key={i} value={v.name_mr}>{v.name_mr}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    placeholder={t('उदा. लोकल', 'e.g. Local')}
                    value={commodityForm.msamb_variety}
                    onChange={(e) => setCommodityForm((f) => ({ ...f, msamb_variety: e.target.value }))}
                  />
                )}
              </FormField>
            </div>

            {/* Varieties management inside Commodity Modal */}
            <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
              <Label className="text-xs font-bold text-gray-800">
                {t('शेतमालाच्या जाती / प्रती (Varieties / Grades)', 'Varieties / Grades')}
              </Label>
              
              {/* Add variety form inline */}
              <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                  {t('नवीन जात / प्रत जोडा', 'Add New Variety')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-600">{t('जात (मराठी)', 'Variety (Marathi)')}</Label>
                    <Input
                      placeholder={t('उदा. लोकल', 'e.g. Local')}
                      value={newVarMr}
                      onChange={(e) => setNewVarMr(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-gray-600">{t('जात (इंग्रजी)', 'Variety (English)')}</Label>
                    <Input
                      placeholder={t('उदा. Local', 'e.g. Local')}
                      value={newVarEn}
                      onChange={(e) => setNewVarEn(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddModalVariety}
                    className="h-7 text-[11px] font-semibold cursor-pointer border-green-200 hover:bg-green-50 text-green-700 py-0"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t('यादीत जोडा', 'Add to List')}
                  </Button>
                </div>
              </div>

              {/* List of current varieties */}
              {modalVarieties.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-2 bg-gray-50/40 rounded-xl border border-dashed border-gray-200">
                  {t('कोणतीही जात/प्रत जोडलेली नाही.', 'No varieties added.')}
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-100 bg-white">
                  {modalVarieties.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1 min-w-0 pr-4">
                        {editingVarIdx === idx ? (
                          <div className="flex items-center gap-2">
                            <Input
                              className="h-7 text-xs w-1/2"
                              value={editVarForm.name_mr || ''}
                              onChange={(e) => setEditVarForm(prev => ({ ...prev, name_mr: e.target.value }))}
                              placeholder="मराठी"
                            />
                            <Input
                              className="h-7 text-xs w-1/2"
                              value={editVarForm.name_en || ''}
                              onChange={(e) => setEditVarForm(prev => ({ ...prev, name_en: e.target.value }))}
                              placeholder="English"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveInlineVariety(idx)}
                              className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingVarIdx(null)}
                              className="h-7 w-7 p-0 text-gray-400 hover:bg-gray-100 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-gray-900">{v.name_mr}</span>
                            <span className="text-[10px] text-gray-400">({v.name_en})</span>
                          </div>
                        )}
                      </div>
                      
                      {editingVarIdx !== idx && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={idx === 0}
                            onClick={() => handleMoveVariety(idx, 'up')}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title={t('वर हलवा', 'Move Up')}
                          >
                            <ChevronLeft className="h-3 w-3 rotate-90" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={idx === modalVarieties.length - 1}
                            onClick={() => handleMoveVariety(idx, 'down')}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title={t('खाली हलवा', 'Move Down')}
                          >
                            <ChevronLeft className="h-3 w-3 -rotate-90" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => startInlineEditVariety(idx)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title={t('संपादित करा', 'Edit')}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteModalVariety(idx)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title={t('हटवा', 'Delete')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setCommodityForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer',
                  commodityForm.is_active ? 'bg-green-600' : 'bg-gray-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                    commodityForm.is_active ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {commodityForm.is_active ? t('सक्रिय (Active)', 'Active') : t('अक्रिय (Inactive)', 'Inactive')}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={closeCommodityModal} disabled={commoditySaving} className="cursor-pointer">
                {t('रद्द करा', 'Cancel')}
              </Button>
              <Button onClick={saveCommodity} disabled={commoditySaving} className="cursor-pointer">
                {commoditySaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {t('जतन होत आहे...', 'Saving...')}</>
                ) : (
                  <><Check className="h-4 w-4" /> {commodityModal === 'add' ? t('जोडा', 'Add') : t('अद्ययावत करा', 'Update')}</>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Add / Edit Rate ── */}
      {rateModal && (
        <Modal
          title={rateModal === 'add' ? t('+ नवीन दर नोंदवा', '+ Add Rate Entry') : t('दर संपादित करा', 'Edit Rate')}
          onClose={closeRateModal}
        >
          <div className="space-y-4">
            {rateFormError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                {rateFormError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('शेतमाल', 'Commodity')} required>
                <Select
                  value={rateForm.commodity_id}
                  onChange={(e) => handleRateCommodityChange(e.target.value)}
                >
                  <option value="">{t('-- शेतमाल निवडा --', '-- Select Commodity --')}</option>
                  {commodities.filter((c) => c.is_active).map((c) => (
                    <option key={c.id} value={c.id}>
                      {t(c.name_mr, c.name_en)}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label={t('दिनांक', 'Date')} required>
                <Input
                  type="date"
                  value={rateForm.date}
                  onChange={(e) => setRateForm((f) => ({ ...f, date: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('बाजार केंद्र', 'Market Center')} required>
                <Select
                  value={rateForm.market_center}
                  onChange={(e) => setRateForm((f) => ({ ...f, market_center: e.target.value }))}
                >
                  {MARKET_CENTERS.map((mc) => (
                    <option key={mc.value} value={mc.value}>{t(mc.label.split(' (')[0], mc.label.split(' (')[1]?.replace(')', '') || mc.label)}</option>
                  ))}
                </Select>
              </FormField>

              <FormField label={t('एकक', 'Unit')}>
                <Input
                  placeholder={t('क्विंटल', 'Quintal')}
                  value={rateForm.unit}
                  onChange={(e) => setRateForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={t('शेतमालाची जात / प्रत', 'Variety / Grade')} hint={t('उदा. लोकल, पिवळा, लाल', 'e.g. Local, Yellow, Red')}>
                {(() => {
                  const dbVarieties = varietiesMap[rateForm.commodity_id] || [];
                  if (dbVarieties.length > 0) {
                    return (
                      <Select
                        value={rateForm.variety}
                        onChange={(e) => setRateForm((f) => ({ ...f, variety: e.target.value }))}
                      >
                        <option value="">{t('-- निवडा (Select) --', '-- Select --')}</option>
                        {dbVarieties.map((v) => (
                          <option key={v.id} value={v.name_mr}>
                            {t(`${v.name_mr} (${v.name_en})`, `${v.name_en} (${v.name_mr})`)}
                          </option>
                        ))}
                      </Select>
                    );
                  }
                  return (
                    <Input
                      placeholder={t('उदा. लोकल', 'e.g. Local')}
                      value={rateForm.variety}
                      onChange={(e) => setRateForm((f) => ({ ...f, variety: e.target.value }))}
                    />
                  );
                })()}
              </FormField>
            </div>

            {/* Price fields */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">{t('दर प्रति क्विंटल (₹/क्विंटल)', 'Price per Unit (₹)')}</p>
              <div className="grid grid-cols-3 gap-3">
                <FormField label={t('किमान', 'Min')} required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <Input
                      type="number"
                      placeholder="0"
                      min={0}
                      value={rateForm.min_price}
                      onChange={(e) => setRateForm((f) => ({ ...f, min_price: e.target.value }))}
                      className="pl-7"
                    />
                  </div>
                </FormField>
                <FormField label={t('कमाल', 'Max')} required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <Input
                      type="number"
                      placeholder="0"
                      min={0}
                      value={rateForm.max_price}
                      onChange={(e) => setRateForm((f) => ({ ...f, max_price: e.target.value }))}
                      className="pl-7"
                    />
                  </div>
                </FormField>
                <FormField label={t('सर्वसाधारण', 'Modal')} required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <Input
                      type="number"
                      placeholder="0"
                      min={0}
                      value={rateForm.modal_price}
                      onChange={(e) => setRateForm((f) => ({ ...f, modal_price: e.target.value }))}
                      className="pl-7"
                    />
                  </div>
                </FormField>
              </div>
            </div>

            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                {t('आवक (क्विंटल)', 'Arrivals (Quintal)')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label={t('किमान दराला आवक', 'Min Arrivals')}>
                  <Input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={rateForm.min_arrivals}
                    onChange={(e) => setRateForm((f) => ({ ...f, min_arrivals: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('कमाल दराला आवक', 'Max Arrivals')}>
                  <Input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={rateForm.max_arrivals}
                    onChange={(e) => setRateForm((f) => ({ ...f, max_arrivals: e.target.value }))}
                  />
                </FormField>
                <FormField label={t('सर्वसाधारण आवक', 'Modal Arrivals')} required>
                  <Input
                    type="number"
                    placeholder="0"
                    min={0}
                    value={rateForm.modal_arrivals}
                    onChange={(e) => setRateForm((f) => ({ ...f, modal_arrivals: e.target.value }))}
                  />
                </FormField>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={closeRateModal} disabled={rateSaving} className="cursor-pointer">
                {t('रद्द करा', 'Cancel')}
              </Button>
              <Button onClick={saveRate} disabled={rateSaving} className="cursor-pointer">
                {rateSaving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {t('जतन होत आहे...', 'Saving...')}</>
                ) : (
                  <><Check className="h-4 w-4" /> {rateModal === 'add' ? t('दर जोडा', 'Add Rate') : t('अद्ययावत करा', 'Update')}</>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Commodity Confirm ── */}
      {deletingCommodityId && (
        <ConfirmDialog
          title={t('शेतमाल हटवायचे?', 'Delete Commodity?')}
          description={t('ही क्रिया पूर्ववत केली जाऊ शकत नाही. या शेतमालाशी जोडलेले सर्व बाजार भाव देखील हटवले जातील.', 'This action cannot be undone. All market rates linked to this commodity will also be deleted.')}
          onConfirm={confirmDeleteCommodity}
          onCancel={() => setDeletingCommodityId(null)}
          loading={commodityDeleteLoading}
        />
      )}

      {/* ── Delete Rate Confirm ── */}
      {deletingRateId && (
        <ConfirmDialog
          title={t('दर नोंद हटवायची?', 'Delete Rate Entry?')}
          description={t('हा दर कायमचा हटवला जाईल. ही क्रिया पूर्ववत केली जाऊ शकत नाही.', 'This rate entry will be permanently deleted. This action cannot be undone.')}
          onConfirm={confirmDeleteRate}
          onCancel={() => setDeletingRateId(null)}
          loading={rateDeleteLoading}
        />
      )}

      {/* ── Clean History Confirm ── */}
      {showCleanupConfirm && (
        <ConfirmDialog
          title={t('ऐतिहासिक जुना डेटा हटवायचा?', 'Clean Historical Data?')}
          description={t(
            'तुम्ही नक्की जुना डेटा हटवू इच्छिता? या क्रियेमुळे प्रत्येक पिकाचे फक्त सर्वात ताजे दर सुरक्षित राहतील आणि मागील सर्व इतिहास कायमचा डिलीट होईल. ही क्रिया पूर्ववत केली जाऊ शकत नाही.',
            'Are you sure you want to clean history? This will keep only the latest rate for each commodity (per sub-market) and permanently delete all older historical records. This action cannot be undone.'
          )}
          onConfirm={handleCleanup}
          onCancel={() => setShowCleanupConfirm(false)}
          loading={cleanupLoading}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB: AI IMPORT
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ai-import' && (
        <div className="space-y-6">

          {/* ── Step 1: Upload Panel ── */}
          {!importSession && (
            <Card>
              <CardHeader className="border-b border-gray-100 pb-5">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  {t('AI द्वारे दर आयात करा', 'Import Rates via AI')}
                </CardTitle>
                <CardDescription>
                  {t('सौदा रजिस्टरचा फोटो अपलोड करा — Gemini AI आपोआप दर वाचेल', 'Upload a photo of the Sauda Register — Gemini AI will automatically read the rates')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">

                {/* Drop Zone */}
                <div
                  onClick={() => importFileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      setImportFile(file);
                      setImportFilePreview(URL.createObjectURL(file));
                      setImportError(null);
                    }
                  }}
                  className={cn(
                    'relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 group',
                    importFile
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/40'
                  )}
                >
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/heic,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImportFile(file);
                        setImportFilePreview(URL.createObjectURL(file));
                        setImportError(null);
                      }
                    }}
                  />
                  {importFilePreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={importFilePreview}
                        alt="Preview"
                        className="max-h-48 rounded-xl shadow object-contain"
                      />
                      <p className="text-sm font-medium text-purple-700">{importFile?.name}</p>
                      <p className="text-xs text-gray-400">{t('बदलण्यासाठी क्लिक करा', 'Click to change')}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 rounded-2xl bg-purple-100 group-hover:bg-purple-200 transition-colors">
                        <Camera className="h-8 w-8 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700">{t('सौदा रजिस्टरचा फोटो येथे टाका', 'Drop Sauda Register photo here')}</p>
                        <p className="text-sm text-gray-400 mt-1">{t('किंवा क्लिक करून फाइल निवडा', 'or click to select file')}</p>
                      </div>
                      <p className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
                        JPG · PNG · HEIC · WEBP &nbsp;|&nbsp; Max 10 MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Date and Market Center */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      <Calendar className="h-3.5 w-3.5 inline mr-1" />
                      {t('दिनांक (ज्या तारखेचे दर आहेत)', 'Date (rates are for this date)')}
                    </Label>
                    <Input
                      type="date"
                      value={importDate}
                      onChange={(e) => setImportDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">
                      <Landmark className="h-3.5 w-3.5 inline mr-1" />
                      {t('बाजार केंद्र', 'Market Center')}
                    </Label>
                    <Select
                      value={importCenter}
                      onChange={(e) => setImportCenter(e.target.value)}
                    >
                      {MARKET_CENTERS.map((mc) => (
                        <option key={mc.value} value={mc.value}>{mc.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Error */}
                {importError && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                    <TriangleAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    {importError}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={async () => {
                    if (!importFile) { setImportError(t('कृपया फोटो निवडा.', 'Please select a photo.')); return; }
                    if (!importDate) { setImportError(t('कृपया दिनांक निवडा.', 'Please select a date.')); return; }
                    setImportLoading(true);
                    setImportError(null);
                    try {
                      const fd = new FormData();
                      fd.append('image', importFile);
                      fd.append('market_center', importCenter);
                      fd.append('date_for', importDate);
                      const res = await fetch('/api/admin/import-rates/upload', { method: 'POST', body: fd });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || 'Upload failed');
                      setImportSession({ id: data.session.id, date_for: data.session.date_for || importDate, market_center: importCenter });
                      const itemsWithDefaultVariety = (data.items || []).map((item: any) => {
                        const commId = item.commodity_id;
                        const defaultVar = commId && varietiesMap[commId]?.length > 0 ? varietiesMap[commId][0].name_mr : '';
                        return {
                          ...item,
                          variety: item.variety || defaultVar || ''
                        };
                      });
                      setImportItems(itemsWithDefaultVariety);
                      setImportCommodities(data.commodities || []);
                      addToast('success', t(`${data.items?.length || 0} शेतमाल ओळखले!`, `${data.items?.length || 0} commodities extracted!`));
                    } catch (err: any) {
                      setImportError(err.message || t('त्रुटी झाली. पुन्हा प्रयत्न करा.', 'Error occurred. Please try again.'));
                    } finally {
                      setImportLoading(false);
                    }
                  }}
                  disabled={importLoading || !importFile}
                  className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer gap-2"
                >
                  {importLoading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> {t('Gemini AI प्रक्रिया करत आहे...', 'Gemini AI is processing...')}</>
                  ) : (
                    <><Sparkles className="h-5 w-5" /> {t('AI ने दर काढा', 'Extract Rates with AI')}</>
                  )}
                </Button>

                {/* Info box */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
                  <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{t('कोणतेही दर थेट प्रकाशित होणार नाहीत', 'No rates will be published directly')}</p>
                    <p className="text-blue-600 mt-0.5">{t('AI काढलेले दर प्रथम पुनरावलोकन टेबलमध्ये दिसतील. आपण तपासल्यानंतरच प्रकाशित होतील.', 'AI-extracted rates will appear in the review table first. They will only be published after your approval.')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step 2: Review Table ── */}
          {importSession && importItems.length > 0 && (
            <Card>
              <CardHeader className="border-b border-gray-100 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      {t('AI निष्कर्ष — दर तपासा', 'AI Results — Review Rates')}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {importSession.date_for}</span>
                      <span className="flex items-center gap-1"><Landmark className="h-3.5 w-3.5" /> {MARKET_CENTERS.find(m => m.value === importSession.market_center)?.label.split(' (')[0]}</span>
                      <span className="text-green-600 font-medium">{importItems.filter(i => i.confidence >= 85).length} {t('खात्रीपूर्वक', 'confident')}</span>
                      <span className="text-yellow-600 font-medium">{importItems.filter(i => i.confidence >= 70 && i.confidence < 85).length} {t('तपासा', 'check')}</span>
                      <span className="text-red-600 font-medium">{importItems.filter(i => i.confidence < 70).length} {t('सुधारा', 'fix')}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {importFilePreview && (
                      <Button variant="outline" size="sm" onClick={() => setShowImageModal(true)} className="cursor-pointer gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> {t('फोटो पाहा', 'View Photo')}
                      </Button>
                    )}
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { setImportSession(null); setImportItems([]); setImportFile(null); setImportFilePreview(null); }}
                      className="cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" /> {t('पुन्हा सुरू करा', 'Start Over')}
                    </Button>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> {t('85%+ — खात्रीपूर्वक', '85%+ — Confident')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> {t('70–84% — एकदा तपासा', '70–84% — Check once')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> {t('<70% — सुधारणे आवश्यक', '<70% — Needs fix')}</span>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="w-10 pl-4">{t('स्थिती', 'Status')}</TableHead>
                        <TableHead>{t('शेतमाल', 'Commodity')}</TableHead>
                        <TableHead>{t('जात/प्रत', 'Variety')}</TableHead>
                        <TableHead className="text-right">{t('किमान ₹', 'Min ₹')}</TableHead>
                        <TableHead className="text-right">{t('कमाल ₹', 'Max ₹')}</TableHead>
                        <TableHead className="text-right">{t('सर्वसाधारण ₹', 'Modal ₹')}</TableHead>
                        <TableHead className="text-right">{t('किमान आवक', 'Min Arr')}</TableHead>
                        <TableHead className="text-right">{t('कमाल आवक', 'Max Arr')}</TableHead>
                        <TableHead className="text-right">{t('सर्वसाधारण आवक', 'Modal Arr')}</TableHead>
                        <TableHead className="text-center w-28">{t('कृती', 'Actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importItems.map((item, idx) => {
                        const isEditing = editingImportIdx === idx;
                        const isSkipped = item.admin_action === 'skip';
                        const conf = item.confidence;
                        const dotColor = conf >= 85 ? 'bg-green-400' : conf >= 70 ? 'bg-yellow-400' : 'bg-red-400';
                        const rowBg = isSkipped ? 'opacity-40 bg-gray-50' : conf < 70 ? 'bg-red-50/30' : '';

                        return (
                          <TableRow key={item.id} className={rowBg}>
                            {/* Status dot */}
                            <TableCell className="pl-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                                <span className="text-xs text-gray-400 tabular-nums">{conf}%</span>
                              </div>
                            </TableCell>

                            {/* Commodity */}
                            <TableCell>
                              {isEditing ? (
                                <Select
                                  value={editImportForm.commodity_id || ''}
                                  onChange={(e) => {
                                    const newCommId = e.target.value;
                                    const comm = importCommodities.find(c => c.id === newCommId);
                                    const defaultVar = newCommId && varietiesMap[newCommId]?.length > 0 ? varietiesMap[newCommId][0].name_mr : '';
                                    setEditImportForm(f => ({
                                      ...f,
                                      commodity_id: newCommId,
                                      commodity_name_raw: comm?.name_mr || f.commodity_name_raw,
                                      variety: defaultVar || '',
                                    }));
                                  }}
                                  className="w-44 text-sm"
                                >
                                  <option value="">{t('-- निवडा --', '-- Select --')}</option>
                                  {importCommodities.map(c => (
                                    <option key={c.id} value={c.id}>{c.name_mr} / {c.name_en}</option>
                                  ))}
                                </Select>
                              ) : (
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {item.commodity?.name_mr || item.commodity_name_raw}
                                  </p>
                                  {item.commodity?.name_en && (
                                    <p className="text-xs text-gray-400">{item.commodity.name_en}</p>
                                  )}
                                  {!item.commodity_id && (
                                    <Badge variant="destructive" className="text-[10px] mt-0.5">Not matched</Badge>
                                  )}
                                </div>
                              )}
                            </TableCell>

                            {/* Variety */}
                            <TableCell>
                              {isEditing ? (
                                (() => {
                                  const commId = editImportForm.commodity_id || '';
                                  const commVarieties = varietiesMap[commId] || [];
                                  if (commVarieties.length > 0) {
                                    return (
                                      <Select
                                        value={editImportForm.variety || ''}
                                        onChange={(e) => setEditImportForm(f => ({ ...f, variety: e.target.value }))}
                                        className="w-32 text-sm"
                                      >
                                        <option value="">{t('-- निवडा --', '-- Select --')}</option>
                                        {commVarieties.map(v => (
                                          <option key={v.id} value={v.name_mr}>
                                            {v.name_mr} {v.name_en ? `/ ${v.name_en}` : ''}
                                          </option>
                                        ))}
                                      </Select>
                                    );
                                  } else {
                                    return (
                                      <Input
                                        type="text"
                                        value={editImportForm.variety || ''}
                                        onChange={(e) => setEditImportForm(f => ({ ...f, variety: e.target.value }))}
                                        className="w-32 text-sm h-9"
                                        placeholder={t('उदा. लोकल', 'e.g. Local')}
                                      />
                                    );
                                  }
                                })()
                              ) : (
                                <span className="text-sm text-gray-600">{item.variety || '—'}</span>
                              )}
                            </TableCell>

                            {/* Min Price */}
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input type="number" value={editImportForm.min_price ?? ''} onChange={e => setEditImportForm(f => ({ ...f, min_price: Number(e.target.value) }))} className="w-24 text-right text-sm ml-auto" />
                              ) : (
                                <span className="tabular-nums">₹{item.min_price?.toLocaleString('en-IN')}</span>
                              )}
                            </TableCell>

                            {/* Max Price */}
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input type="number" value={editImportForm.max_price ?? ''} onChange={e => setEditImportForm(f => ({ ...f, max_price: Number(e.target.value) }))} className="w-24 text-right text-sm ml-auto" />
                              ) : (
                                <span className="tabular-nums">₹{item.max_price?.toLocaleString('en-IN')}</span>
                              )}
                            </TableCell>

                            {/* Modal Price */}
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input type="number" value={editImportForm.modal_price ?? ''} onChange={e => setEditImportForm(f => ({ ...f, modal_price: Number(e.target.value) }))} className="w-24 text-right text-sm ml-auto" />
                              ) : (
                                <span className="tabular-nums font-medium">₹{item.modal_price?.toLocaleString('en-IN')}</span>
                              )}
                            </TableCell>

                            {/* Min Arrivals */}
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input type="number" value={editImportForm.min_arrivals ?? ''} onChange={e => setEditImportForm(f => ({ ...f, min_arrivals: Number(e.target.value) }))} className="w-20 text-right text-sm ml-auto" />
                              ) : (
                                <span className="tabular-nums text-gray-600">{item.min_arrivals}</span>
                              )}
                            </TableCell>

                            {/* Max Arrivals */}
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input type="number" value={editImportForm.max_arrivals ?? ''} onChange={e => setEditImportForm(f => ({ ...f, max_arrivals: Number(e.target.value) }))} className="w-20 text-right text-sm ml-auto" />
                              ) : (
                                <span className="tabular-nums text-gray-600">{item.max_arrivals}</span>
                              )}
                            </TableCell>

                            {/* Modal Arrivals */}
                            <TableCell className="text-right">
                              {isEditing ? (
                                <Input type="number" value={editImportForm.modal_arrivals ?? ''} onChange={e => setEditImportForm(f => ({ ...f, modal_arrivals: Number(e.target.value) }))} className="w-20 text-right text-sm ml-auto" />
                              ) : (
                                <span className="tabular-nums font-semibold text-gray-700">{item.modal_arrivals}</span>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {isEditing ? (
                                  <>
                                    <Button size="sm" variant="ghost"
                                      onClick={() => {
                                        setImportItems(prev => prev.map((it, i) => i === idx ? { ...it, ...editImportForm, admin_action: 'keep' } : it));
                                        setEditingImportIdx(null);
                                      }}
                                      className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 cursor-pointer"
                                    ><Check className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" variant="ghost"
                                      onClick={() => setEditingImportIdx(null)}
                                      className="h-7 w-7 p-0 text-gray-400 hover:bg-gray-100 cursor-pointer"
                                    ><X className="h-3.5 w-3.5" /></Button>
                                  </>
                                ) : (
                                  <>
                                    <Button size="sm" variant="ghost"
                                      onClick={() => { setEditingImportIdx(idx); setEditImportForm({ ...item }); }}
                                      className="h-7 w-7 p-0 text-gray-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                      title={t('संपादित करा', 'Edit')}
                                    ><Pencil className="h-3.5 w-3.5" /></Button>
                                    <Button size="sm" variant="ghost"
                                      onClick={() => setImportItems(prev => prev.map((it, i) => i === idx ? { ...it, admin_action: it.admin_action === 'skip' ? 'keep' : 'skip' } : it))}
                                      className={cn('h-7 w-7 p-0 cursor-pointer', isSkipped ? 'text-gray-400 hover:text-green-600 hover:bg-green-50' : 'text-gray-500 hover:text-red-600 hover:bg-red-50')}
                                      title={isSkipped ? t('पुनर्स्थापित करा', 'Restore') : t('वगळा', 'Skip')}
                                    >{isSkipped ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}</Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer actions */}
                <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => {
                      const firstCommId = importCommodities[0]?.id || null;
                      const defaultVar = firstCommId && varietiesMap[firstCommId]?.length > 0 ? varietiesMap[firstCommId][0].name_mr : '';
                      const newItem: ImportItem = {
                        id: `new-${Date.now()}`,
                        commodity_id: firstCommId,
                        commodity_name_raw: importCommodities[0]?.name_mr || '',
                        min_price: 0, max_price: 0, modal_price: 0, min_arrivals: 0, max_arrivals: 0, modal_arrivals: 0,
                        unit: 'क्विंटल',
                        market_center: importSession.market_center,
                        confidence: 100,
                        is_flagged: false,
                        admin_action: 'keep',
                        commodity: importCommodities[0] || null,
                        variety: defaultVar || '',
                      };
                      setImportItems(prev => [...prev, newItem]);
                      setEditingImportIdx(importItems.length);
                      setEditImportForm({ ...newItem });
                    }}
                    className="cursor-pointer gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> {t('नवीन पंक्ती जोडा', 'Add Row')}
                  </Button>

                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500">
                      {importItems.filter(i => i.admin_action === 'keep').length} {t('प्रकाशित होतील', 'will be published')}
                    </p>
                    <Button
                      onClick={async () => {
                        const toPublish = importItems.filter(i => i.admin_action === 'keep' && i.commodity_id);
                        if (toPublish.length === 0) {
                          addToast('error', t('प्रकाशित करण्यासाठी किमान एक मंजूर दर असणे आवश्यक आहे.', 'At least one approved rate with a matched commodity is required.'));
                          return;
                        }
                        setPublishLoading(true);
                        try {
                          const res = await fetch('/api/admin/import-rates/publish', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              session_id: importSession.id,
                              items: toPublish,
                              date_for: importSession.date_for,
                              market_center: importSession.market_center,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Publish failed');
                          addToast('success', t(`${data.published_count} दर यशस्वीरित्या प्रकाशित झाले! वेबसाइट अपडेट झाली.`, `${data.published_count} rates published! Website updated.`));
                          setImportSession(null);
                          setImportItems([]);
                          setImportFile(null);
                          setImportFilePreview(null);
                          setActiveTab('rates');
                          fetchRates();
                        } catch (err: any) {
                          addToast('error', err.message || t('प्रकाशित करण्यात त्रुटी.', 'Error publishing rates.'));
                        } finally {
                          setPublishLoading(false);
                        }
                      }}
                      disabled={publishLoading}
                      className="bg-green-700 hover:bg-green-800 text-white cursor-pointer gap-2 h-10 px-5"
                    >
                      {publishLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> {t('प्रकाशित होत आहे...', 'Publishing...')}</>
                      ) : (
                        <><Send className="h-4 w-4" /> {t('मंजूर दर प्रकाशित करा', 'Publish Approved Rates')}</>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Image Preview Modal */}
          {showImageModal && importFilePreview && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => setShowImageModal(false)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-4 border-b">
                  <h3 className="font-bold text-gray-900">{t('मूळ सौदा रजिस्टर', 'Original Sauda Register')}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setShowImageModal(false)} className="cursor-pointer">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-4 overflow-auto max-h-[75vh]">
                  <img src={importFilePreview} alt="Sauda Register" className="w-full rounded-xl" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}



      {/* ── Toast Notifications ── */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── Animations ── */}
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(1rem) scale(0.96); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        .animate-slide-in { animation: slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
