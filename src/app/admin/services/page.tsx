'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { Service, ServiceFacility, ServiceForm, ServiceFAQ } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import * as Lucide from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error';
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const AVAILABLE_ICONS = [
  { value: 'TrendingUp', label: 'Trending Up / Rates' },
  { value: 'Scale', label: 'Scale / Weighbridge' },
  { value: 'Building2', label: 'Building / Hall' },
  { value: 'BadgeCheck', label: 'Badge / License' },
  { value: 'UserRoundCheck', label: 'User / Guidance' },
  { value: 'MessageSquareWarning', label: 'Complaint / Notice' },
  { value: 'Landmark', label: 'Landmark / Bank' },
  { value: 'FileText', label: 'File / Form' },
  { value: 'Download', label: 'Download' },
  { value: 'Warehouse', label: 'Warehouse' },
  { value: 'ShieldCheck', label: 'Security' },
  { value: 'MonitorUp', label: 'Display Board' },
  { value: 'Waves', label: 'Water' },
  { value: 'Sofa', label: 'Rest Room' },
  { value: 'ParkingCircle', label: 'Parking' },
  { value: 'Briefcase', label: 'Briefcase' },
];

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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-150">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
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

export default function AdminServicesPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'services' | 'facilities' | 'forms' | 'faqs'>('services');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 1. Data States
  const [services, setServices] = useState<Service[]>([]);
  const [facilities, setFacilities] = useState<ServiceFacility[]>([]);
  const [forms, setForms] = useState<ServiceForm[]>([]);
  const [faqs, setFaqs] = useState<ServiceFAQ[]>([]);

  // 2. Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // 3. Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // 4. Modal Open States
  const [modalType, setModalType] = useState<'service' | 'facility' | 'form' | 'faq' | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ id: string; type: 'service' | 'facility' | 'form' | 'faq'; name: string } | null>(null);

  // 5. Active Edit Records
  const [editService, setEditService] = useState<Service | null>(null);
  const [editFacility, setEditFacility] = useState<ServiceFacility | null>(null);
  const [editForm, setEditForm] = useState<ServiceForm | null>(null);
  const [editFaq, setEditFaq] = useState<ServiceFAQ | null>(null);

  // 6. Form Fields
  // Service Fields
  const [serviceTitleMr, setServiceTitleMr] = useState('');
  const [serviceTitleEn, setServiceTitleEn] = useState('');
  const [serviceDescMr, setServiceDescMr] = useState('');
  const [serviceDescEn, setServiceDescEn] = useState('');
  const [serviceIcon, setServiceIcon] = useState('Briefcase');
  const [serviceOrder, setServiceOrder] = useState(1);
  const [serviceActive, setServiceActive] = useState(true);

  // Facility Fields
  const [facilityTitleMr, setFacilityTitleMr] = useState('');
  const [facilityTitleEn, setFacilityTitleEn] = useState('');
  const [facilityIcon, setFacilityIcon] = useState('ClipboardCheck');
  const [facilityOrder, setFacilityOrder] = useState(1);
  const [facilityActive, setFacilityActive] = useState(true);

  // Form Fields
  const [formTitleMr, setFormTitleMr] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formDescMr, setFormDescMr] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formFileType, setFormFileType] = useState('PDF');
  const [formOrder, setFormOrder] = useState(1);
  const [formActive, setFormActive] = useState(true);
  const [formFile, setFormFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [fileDeleted, setFileDeleted] = useState(false);

  // FAQ Fields
  const [faqQMr, setFaqQMr] = useState('');
  const [faqQEn, setFaqQEn] = useState('');
  const [faqAMr, setFaqAMr] = useState('');
  const [faqAEn, setFaqAEn] = useState('');
  const [faqOrder, setFaqOrder] = useState(1);
  const [faqActive, setFaqActive] = useState(true);

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

  // Fetch Operations
  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: servicesData, error: servicesErr } = await supabase.from('services').select('*').order('display_order', { ascending: true });
      const { data: facilitiesData, error: facilitiesErr } = await supabase.from('service_facilities').select('*').order('sort_order', { ascending: true });
      const { data: formsData, error: formsErr } = await supabase.from('service_forms').select('*').order('sort_order', { ascending: true });
      const { data: faqsData, error: faqsErr } = await supabase.from('service_faqs').select('*').order('sort_order', { ascending: true });

      if (servicesErr) throw servicesErr;
      if (facilitiesErr) throw facilitiesErr;
      if (formsErr) throw formsErr;
      if (faqsErr) throw faqsErr;

      setServices(servicesData || []);
      setFacilities(facilitiesData || []);
      setForms(formsData || []);
      setFaqs(faqsData || []);
    } catch (err: any) {
      console.error(err);
      addToast('error', err.message || 'माहिती लोड करण्यात अडचण आली / Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Search
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return { services, facilities, forms, faqs };
    }
    return {
      services: services.filter(s => s.title_mr.toLowerCase().includes(query) || s.title_en.toLowerCase().includes(query)),
      facilities: facilities.filter(f => f.title_mr.toLowerCase().includes(query) || f.title_en.toLowerCase().includes(query)),
      forms: forms.filter(f => f.title_mr.toLowerCase().includes(query) || f.title_en.toLowerCase().includes(query)),
      faqs: faqs.filter(f => f.question_mr.toLowerCase().includes(query) || f.question_en.toLowerCase().includes(query)),
    };
  }, [searchQuery, services, facilities, forms, faqs]);

  // Open Add Modals
  const openAddModal = (type: 'service' | 'facility' | 'form' | 'faq') => {
    setModalType(type);
    setIsFormOpen(true);
    if (type === 'service') {
      setEditService(null);
      setServiceTitleMr('');
      setServiceTitleEn('');
      setServiceDescMr('');
      setServiceDescEn('');
      setServiceIcon('Briefcase');
      setServiceOrder(services.length > 0 ? Math.max(...services.map(s => s.display_order)) + 10 : 10);
      setServiceActive(true);
    } else if (type === 'facility') {
      setEditFacility(null);
      setFacilityTitleMr('');
      setFacilityTitleEn('');
      setFacilityIcon('ClipboardCheck');
      setFacilityOrder(facilities.length > 0 ? Math.max(...facilities.map(f => f.sort_order)) + 10 : 10);
      setFacilityActive(true);
    } else if (type === 'form') {
      setEditForm(null);
      setFormTitleMr('');
      setFormTitleEn('');
      setFormDescMr('');
      setFormDescEn('');
      setFormFileType('PDF');
      setFormOrder(forms.length > 0 ? Math.max(...forms.map(f => f.sort_order)) + 10 : 10);
      setFormActive(true);
      setFormFile(null);
      setExistingFileUrl(null);
      setExistingFileName(null);
      setFileDeleted(false);
    } else if (type === 'faq') {
      setEditFaq(null);
      setFaqQMr('');
      setFaqQEn('');
      setFaqAMr('');
      setFaqAEn('');
      setFaqOrder(faqs.length > 0 ? Math.max(...faqs.map(f => f.sort_order)) + 10 : 10);
      setFaqActive(true);
    }
  };

  // Open Edit Modals
  const openEditModal = (type: 'service' | 'facility' | 'form' | 'faq', item: any) => {
    setModalType(type);
    setIsFormOpen(true);
    if (type === 'service') {
      const record = item as Service;
      setEditService(record);
      setServiceTitleMr(record.title_mr);
      setServiceTitleEn(record.title_en);
      setServiceDescMr(record.description_mr || '');
      setServiceDescEn(record.description_en || '');
      setServiceIcon(record.icon_name || 'Briefcase');
      setServiceOrder(record.display_order);
      setServiceActive(record.is_active);
    } else if (type === 'facility') {
      const record = item as ServiceFacility;
      setEditFacility(record);
      setFacilityTitleMr(record.title_mr);
      setFacilityTitleEn(record.title_en);
      setFacilityIcon(record.icon_name || 'ClipboardCheck');
      setFacilityOrder(record.sort_order);
      setFacilityActive(record.is_active);
    } else if (type === 'form') {
      const record = item as ServiceForm;
      setEditForm(record);
      setFormTitleMr(record.title_mr);
      setFormTitleEn(record.title_en);
      setFormDescMr(record.description_mr || '');
      setFormDescEn(record.description_en || '');
      setFormFileType(record.file_type || 'PDF');
      setFormOrder(record.sort_order);
      setFormActive(record.is_active);
      setFormFile(null);
      setExistingFileUrl(record.file_url);
      setExistingFileName(record.file_name);
      setFileDeleted(false);
    } else if (type === 'faq') {
      const record = item as ServiceFAQ;
      setEditFaq(record);
      setFaqQMr(record.question_mr);
      setFaqQEn(record.question_en);
      setFaqAMr(record.answer_mr);
      setFaqAEn(record.answer_en);
      setFaqOrder(record.sort_order);
      setFaqActive(record.is_active);
    }
  };

  // Form Submission
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (modalType === 'service') {
        const payload = {
          title_mr: serviceTitleMr,
          title_en: serviceTitleEn,
          description_mr: serviceDescMr,
          description_en: serviceDescEn,
          icon_name: serviceIcon,
          display_order: serviceOrder,
          is_active: serviceActive,
          updated_at: new Date().toISOString(),
        };

        if (editService) {
          const { error } = await supabase.from('services').update(payload).eq('id', editService.id);
          if (error) throw error;
          addToast('success', 'सेवा सुधारित केली / Service updated successfully');
        } else {
          const { error } = await supabase.from('services').insert(payload);
          if (error) throw error;
          addToast('success', 'नवीन सेवा जोडली / Service created successfully');
        }
      } 
      
      else if (modalType === 'facility') {
        const payload = {
          title_mr: facilityTitleMr,
          title_en: facilityTitleEn,
          icon_name: facilityIcon,
          sort_order: facilityOrder,
          is_active: facilityActive,
          updated_at: new Date().toISOString(),
        };

        if (editFacility) {
          const { error } = await supabase.from('service_facilities').update(payload).eq('id', editFacility.id);
          if (error) throw error;
          addToast('success', 'सुविधा सुधारित केली / Facility updated successfully');
        } else {
          const { error } = await supabase.from('service_facilities').insert(payload);
          if (error) throw error;
          addToast('success', 'नवीन सुविधा जोडली / Facility created successfully');
        }
      } 
      
      else if (modalType === 'form') {
        let finalFileUrl = existingFileUrl;
        let finalFileName = existingFileName;

        // If file was deleted or replaced, delete the old file from storage first
        if ((fileDeleted || formFile) && editForm?.file_url) {
          const parts = editForm.file_url.split('/public/service-forms/');
          if (parts.length > 1) {
            const oldPath = parts[1];
            await supabase.storage.from('service-forms').remove([oldPath]);
          }
          if (fileDeleted && !formFile) {
            finalFileUrl = null;
            finalFileName = null;
          }
        }

        if (formFile) {
          setUploadProgress(10);
          const ext = formFile.name.split('.').pop();
          const cleanName = `form-${Date.now()}.${ext}`;
          
          setUploadProgress(40);
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('service-forms')
            .upload(`forms/${cleanName}`, formFile, { cacheControl: '3600', upsert: true });

          if (uploadErr) throw uploadErr;

          setUploadProgress(80);
          const { data: publicUrlData } = supabase.storage
            .from('service-forms')
            .getPublicUrl(`forms/${cleanName}`);

          finalFileUrl = publicUrlData.publicUrl;
          finalFileName = formFile.name;
        }

        const payload = {
          title_mr: formTitleMr,
          title_en: formTitleEn,
          description_mr: formDescMr,
          description_en: formDescEn,
          file_url: finalFileUrl,
          file_name: finalFileName,
          file_type: formFileType,
          sort_order: formOrder,
          is_active: formActive,
          updated_at: new Date().toISOString(),
        };

        if (editForm) {
          const { error } = await supabase.from('service_forms').update(payload).eq('id', editForm.id);
          if (error) throw error;
          addToast('success', 'फॉर्म सुधारित केला / Form card updated successfully');
        } else {
          const { error } = await supabase.from('service_forms').insert(payload);
          if (error) throw error;
          addToast('success', 'नवीन फॉर्म कार्ड जोडले / Form card created successfully');
        }
      } 
      
      else if (modalType === 'faq') {
        const payload = {
          question_mr: faqQMr,
          question_en: faqQEn,
          answer_mr: faqAMr,
          answer_en: faqAEn,
          sort_order: faqOrder,
          is_active: faqActive,
          updated_at: new Date().toISOString(),
        };

        if (editFaq) {
          const { error } = await supabase.from('service_faqs').update(payload).eq('id', editFaq.id);
          if (error) throw error;
          addToast('success', 'प्रश्न सुधारित केला / FAQ updated successfully');
        } else {
          const { error } = await supabase.from('service_faqs').insert(payload);
          if (error) throw error;
          addToast('success', 'नवीन प्रश्न जोडला / FAQ created successfully');
        }
      }

      setIsFormOpen(false);
      setModalType(null);
      setUploadProgress(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      addToast('error', err.message || 'जतन करण्यास अडचण आली / Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Toggle-Status Directly
  const handleToggleActive = async (type: 'service' | 'facility' | 'form' | 'faq', id: string, currentVal: boolean) => {
    try {
      const targetTable = type === 'service' ? 'services' : type === 'facility' ? 'service_facilities' : type === 'form' ? 'service_forms' : 'service_faqs';
      const keyCol = type === 'service' ? 'is_active' : 'is_active'; // same

      const { error } = await supabase
        .from(targetTable)
        .update({ is_active: !currentVal, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      addToast('success', 'स्थिती बदलली / Status updated successfully');
      fetchData();
    } catch (err: any) {
      console.error(err);
      addToast('error', 'बदल करण्यास अडचण आली / Status update failed');
    }
  };

  // Delete Action Trigger
  const triggerDelete = (type: 'service' | 'facility' | 'form' | 'faq', item: any) => {
    const name = type === 'service' ? item.title_mr : type === 'facility' ? item.title_mr : type === 'form' ? item.title_mr : item.question_mr;
    setDeleteConfirmTarget({ id: item.id, type, name });
  };

  // Execute Delete
  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;
    setActionLoading(true);
    try {
      const { id, type } = deleteConfirmTarget;
      const targetTable = type === 'service' ? 'services' : type === 'facility' ? 'service_facilities' : type === 'form' ? 'service_forms' : 'service_faqs';
      
      if (type === 'form') {
        const targetForm = forms.find(f => f.id === id);
        if (targetForm?.file_url) {
          const parts = targetForm.file_url.split('/public/service-forms/');
          if (parts.length > 1) {
            const path = parts[1];
            await supabase.storage.from('service-forms').remove([path]);
          }
        }
      }

      const { error } = await supabase.from(targetTable).delete().eq('id', id);
      if (error) throw error;

      addToast('success', t('यशस्वीरित्या हटवले / Deleted successfully', 'Deleted successfully'));
      setDeleteConfirmTarget(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      addToast('error', err.message || t('हटवण्यात अडचण आली / Delete operation failed', 'Delete operation failed'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Lucide.Briefcase className="h-6 w-6 text-green-700 shrink-0" />
            {t('सेवा व सुविधा व्यवस्थापन', 'Services & Facilities Management')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('शेतकरी सेवा, उपलब्ध सुविधा, डाउनलोड फॉर्म्स आणि FAQ विभाग एकाच ठिकाणाहून व्यवस्थापित करा.', 'Manage farmer services, available facilities, downloadable forms, and FAQs in one place.')}
          </p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-gray-200/80 gap-1 bg-white p-1 rounded-xl border max-w-2xl">
        <button
          onClick={() => { setActiveTab('services'); setSearchQuery(''); }}
          className={cn(
            'flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5',
            activeTab === 'services' ? 'bg-green-700 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <Lucide.Landmark className="h-4 w-4" />
          {t('शेतकरी सेवा', 'Services')}
        </button>
        <button
          onClick={() => { setActiveTab('facilities'); setSearchQuery(''); }}
          className={cn(
            'flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5',
            activeTab === 'facilities' ? 'bg-green-700 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <Lucide.ClipboardCheck className="h-4 w-4" />
          {t('सुविधा', 'Facilities')}
        </button>
        <button
          onClick={() => { setActiveTab('forms'); setSearchQuery(''); }}
          className={cn(
            'flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5',
            activeTab === 'forms' ? 'bg-green-700 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <Lucide.Download className="h-4 w-4" />
          {t('डाउनलोड फॉर्म', 'Forms')}
        </button>
        <button
          onClick={() => { setActiveTab('faqs'); setSearchQuery(''); }}
          className={cn(
            'flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5',
            activeTab === 'faqs' ? 'bg-green-700 text-white shadow-xs' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <Lucide.HelpCircle className="h-4 w-4" />
          {t('FAQ प्रश्न', 'FAQs')}
        </button>
      </div>

      {/* Search & Add Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Lucide.Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'services' 
                ? t('सेवा शोधा...', 'Search services...') 
                : activeTab === 'facilities' 
                ? t('सुविधा शोधा...', 'Search facilities...') 
                : activeTab === 'forms' 
                ? t('फॉर्म शोधा...', 'Search forms...') 
                : t('FAQ प्रश्न शोधा...', 'Search FAQs...')
            }
            className="pl-10 border-gray-200 focus:border-green-600 rounded-xl"
          />
        </div>
        <Button
          onClick={() => openAddModal(activeTab === 'services' ? 'service' : activeTab === 'facilities' ? 'facility' : activeTab === 'forms' ? 'form' : 'faq')}
          className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer rounded-xl"
        >
          <Lucide.PlusCircle className="h-4.5 w-4.5 mr-2" />
          {activeTab === 'services' 
            ? t('सेवा जोडा', 'Add Service') 
            : activeTab === 'facilities' 
            ? t('सुविधा जोडा', 'Add Facility') 
            : activeTab === 'forms' 
            ? t('फॉर्म जोडा', 'Add Form') 
            : t('प्रश्न जोडा', 'Add FAQ')}
        </Button>
      </div>

      {/* Dynamic Tab Render Panels */}
      {loading ? (
        <div className="py-24 text-center flex flex-col justify-center items-center gap-2 text-gray-500">
          <Lucide.Loader2 className="h-8 w-8 animate-spin text-green-700" />
          <span className="text-sm font-semibold">माहिती लोड होत आहे...</span>
        </div>
      ) : (
        <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-0">
            {/* 1. Services Tab */}
            {activeTab === 'services' && (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="w-16 text-center">{t('क्रम', 'Order')}</TableHead>
                    <TableHead>{t('शीर्षक', 'Title')}</TableHead>
                    <TableHead>{t('तपशील', 'Description')}</TableHead>
                    <TableHead className="w-20 text-center">{t('चिन्ह', 'Icon')}</TableHead>
                    <TableHead className="w-24 text-center">{t('स्थिती', 'Status')}</TableHead>
                    <TableHead className="w-28 text-center">{t('कृती', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.services.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-400">{t('कोणतीही सेवा सापडली नाही.', 'No services found.')}</TableCell></TableRow>
                  ) : (
                    filteredItems.services.map((item) => {
                      const Icon = (Lucide as any)[item.icon_name || 'Briefcase'] || Lucide.Briefcase;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-center font-bold text-gray-500">{item.display_order}</TableCell>
                          <TableCell className="space-y-0.5">
                            <div className="font-bold text-gray-900">{item.title_mr}</div>
                            <div className="text-xs text-gray-500">{item.title_en}</div>
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 line-clamp-2 max-w-xs">{item.description_mr || '-'}</TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                              <Icon className="h-4.5 w-4.5 text-gray-600" />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleToggleActive('service', item.id, item.is_active)}
                              className="cursor-pointer active:scale-95 transition-transform"
                            >
                              {item.is_active ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200">{t('सक्रिय', 'Active')}</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-500 border-gray-250">{t('अक्रिय', 'Inactive')}</Badge>
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditModal('service', item)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 cursor-pointer">
                                <Lucide.Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => triggerDelete('service', item)} className="h-8 w-8 text-red-600 hover:bg-red-50 cursor-pointer">
                                <Lucide.Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            {/* 2. Facilities Tab */}
            {activeTab === 'facilities' && (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="w-16 text-center">{t('क्रम', 'Order')}</TableHead>
                    <TableHead>{t('सुविधा', 'Facility')}</TableHead>
                    <TableHead className="w-24 text-center">{t('चिन्ह', 'Icon')}</TableHead>
                    <TableHead className="w-24 text-center">{t('स्थिती', 'Status')}</TableHead>
                    <TableHead className="w-28 text-center">{t('कृती', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.facilities.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">{t('कोणतीही सुविधा सापडली नाही.', 'No facilities found.')}</TableCell></TableRow>
                  ) : (
                    filteredItems.facilities.map((item) => {
                      const Icon = (Lucide as any)[item.icon_name || 'ClipboardCheck'] || Lucide.ClipboardCheck;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-center font-bold text-gray-500">{item.sort_order}</TableCell>
                          <TableCell className="space-y-0.5">
                            <div className="font-bold text-gray-900">{item.title_mr}</div>
                            <div className="text-xs text-gray-500">{item.title_en}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                              <Icon className="h-4.5 w-4.5 text-gray-600" />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleToggleActive('facility', item.id, item.is_active)}
                              className="cursor-pointer active:scale-95 transition-transform"
                            >
                              {item.is_active ? (
                                <Badge className="bg-green-50 text-green-700 border-green-200">{t('सक्रिय', 'Active')}</Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-500 border-gray-250">{t('अक्रिय', 'Inactive')}</Badge>
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditModal('facility', item)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 cursor-pointer">
                                <Lucide.Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => triggerDelete('facility', item)} className="h-8 w-8 text-red-600 hover:bg-red-50 cursor-pointer">
                                <Lucide.Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}

            {/* 3. Forms Tab */}
            {activeTab === 'forms' && (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="w-16 text-center">{t('क्रम', 'Order')}</TableHead>
                    <TableHead>{t('फॉर्म नाव', 'Form Name')}</TableHead>
                    <TableHead>{t('तपशील', 'Description')}</TableHead>
                    <TableHead>{t('फाइल नाव / स्वरूप', 'File Name / Type')}</TableHead>
                    <TableHead className="w-24 text-center">{t('स्थिती', 'Status')}</TableHead>
                    <TableHead className="w-28 text-center">{t('कृती', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.forms.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-gray-400">{t('कोणताही फॉर्म सापडला नाही.', 'No forms found.')}</TableCell></TableRow>
                  ) : (
                    filteredItems.forms.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-bold text-gray-500">{item.sort_order}</TableCell>
                        <TableCell className="space-y-0.5">
                          <div className="font-bold text-gray-900">{item.title_mr}</div>
                          <div className="text-xs text-gray-500">{item.title_en}</div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 line-clamp-2 max-w-xs">{item.description_mr || '-'}</TableCell>
                        <TableCell>
                          {item.file_url ? (
                            <a
                              href={item.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-green-700 font-bold hover:underline inline-flex items-center gap-1.5 bg-green-50/50 px-2 py-1 rounded border border-green-150"
                            >
                              <Lucide.FileDown className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[150px]">{item.file_name || t('फाइल पहा', 'View File')}</span>
                              <Badge className="bg-green-100 text-green-800 border-0 hover:bg-green-100 text-[9px] scale-90">{item.file_type}</Badge>
                            </a>
                          ) : (
                            <span className="text-xs text-amber-600 italic font-semibold flex items-center gap-1">
                              <Lucide.AlertCircle className="h-3.5 w-3.5" />
                              {t('फाइल अपलोड नाही', 'No file uploaded')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleToggleActive('form', item.id, item.is_active)}
                            className="cursor-pointer active:scale-95 transition-transform"
                          >
                            {item.is_active ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200">{t('सक्रिय', 'Active')}</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500 border-gray-250">{t('अक्रिय', 'Inactive')}</Badge>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal('form', item)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 cursor-pointer">
                              <Lucide.Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerDelete('form', item)} className="h-8 w-8 text-red-600 hover:bg-red-50 cursor-pointer">
                              <Lucide.Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* 4. FAQs Tab */}
            {activeTab === 'faqs' && (
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="w-16 text-center">{t('क्रम', 'Order')}</TableHead>
                    <TableHead className="max-w-xs">{t('प्रश्न', 'Question')}</TableHead>
                    <TableHead className="max-w-sm">{t('उत्तर', 'Answer')}</TableHead>
                    <TableHead className="w-24 text-center">{t('स्थिती', 'Status')}</TableHead>
                    <TableHead className="w-28 text-center">{t('कृती', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.faqs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">{t('कोणताही प्रश्न सापडला नाही.', 'No FAQs found.')}</TableCell></TableRow>
                  ) : (
                    filteredItems.faqs.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-bold text-gray-500">{item.sort_order}</TableCell>
                        <TableCell className="space-y-1">
                          <div className="font-bold text-gray-900 leading-snug text-sm">{item.question_mr}</div>
                          <div className="text-xs text-gray-500 italic leading-snug">{item.question_en}</div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-600 line-clamp-3 max-w-sm leading-relaxed">{item.answer_mr}</TableCell>
                        <TableCell className="text-center">
                          <button
                            onClick={() => handleToggleActive('faq', item.id, item.is_active)}
                            className="cursor-pointer active:scale-95 transition-transform"
                          >
                            {item.is_active ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200">{t('सक्रिय', 'Active')}</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-500 border-gray-250">{t('अक्रिय', 'Inactive')}</Badge>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal('faq', item)} className="h-8 w-8 text-blue-600 hover:bg-blue-50 cursor-pointer">
                              <Lucide.Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => triggerDelete('faq', item)} className="h-8 w-8 text-red-600 hover:bg-red-50 cursor-pointer">
                              <Lucide.Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── ADD/EDIT FORM MODALS ────────────────────────────────────────────── */}
      {isFormOpen && modalType && (
        <Modal
          title={
            modalType === 'service'
              ? (editService ? 'सेवा सुधारित करा / Edit Service' : 'नवीन सेवा जोडा / Add Service')
              : modalType === 'facility'
              ? (editFacility ? 'सुविधा सुधारित करा / Edit Facility' : 'नवीन सुविधा जोडा / Add Facility')
              : modalType === 'form'
              ? (editForm ? 'डाउनलोड फॉर्म सुधारित करा / Edit Form Card' : 'नवीन डाउनलोड फॉर्म जोडा / Add Form Card')
              : (editFaq ? 'प्रश्न सुधारित करा / Edit FAQ Q&A' : 'नवीन प्रश्न जोडा / Add FAQ Q&A')
          }
          onClose={() => setIsFormOpen(false)}
        >
          <form onSubmit={handleSubmitForm} className="space-y-4">
            {/* SERVICE FORM FIELDS */}
            {modalType === 'service' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="s-title-mr" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-green-600 text-white text-[8px] px-1 rounded">MR</span> सेवा नाव (मराठी) *
                  </Label>
                  <Input id="s-title-mr" value={serviceTitleMr} onChange={(e) => setServiceTitleMr(e.target.value)} required placeholder="उदा. वजन सुविधा" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-title-en" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-blue-600 text-white text-[8px] px-1 rounded">EN</span> {t('EN सेवा शीर्षक (इंग्रजी) *', 'EN Service Title (English) *')}
                  </Label>
                  <Input id="s-title-en" value={serviceTitleEn} onChange={(e) => setServiceTitleEn(e.target.value)} required placeholder="e.g. Weighing Facility" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-desc-mr" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-green-600 text-white text-[8px] px-1 rounded">MR</span> सेवा वर्णन (मराठी)
                  </Label>
                  <Textarea id="s-desc-mr" rows={3} value={serviceDescMr} onChange={(e) => setServiceDescMr(e.target.value)} placeholder="मराठीमध्ये वर्णन लिहा..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="s-desc-en" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-blue-600 text-white text-[8px] px-1 rounded">EN</span> {t('EN वर्णन (इंग्रजी)', 'EN Description (English)')}
                  </Label>
                  <Textarea id="s-desc-en" rows={3} value={serviceDescEn} onChange={(e) => setServiceDescEn(e.target.value)} placeholder="Enter English description..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-icon" className="text-xs font-bold text-gray-700">आयकॉन / Icon</Label>
                    <select
                      id="s-icon"
                      value={serviceIcon}
                      onChange={(e) => setServiceIcon(e.target.value)}
                      className="w-full border border-gray-250 p-2 rounded-xl text-sm focus:border-green-600 bg-white"
                    >
                      {AVAILABLE_ICONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="s-order" className="text-xs font-bold text-gray-700">क्रम / Display Order</Label>
                    <Input id="s-order" type="number" value={serviceOrder} onChange={(e) => setServiceOrder(parseInt(e.target.value) || 1)} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                  <Label htmlFor="s-active" className="text-xs font-bold text-gray-700 cursor-pointer">सक्रिय आहे? / Active?</Label>
                  <input id="s-active" type="checkbox" checked={serviceActive} onChange={(e) => setServiceActive(e.target.checked)} className="h-4.5 w-4.5 accent-green-700 cursor-pointer" />
                </div>
              </>
            )}

            {/* FACILITY FORM FIELDS */}
            {modalType === 'facility' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="f-title-mr" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-green-600 text-white text-[8px] px-1 rounded">MR</span> सुविधा नाव (मराठी) *
                  </Label>
                  <Input id="f-title-mr" value={facilityTitleMr} onChange={(e) => setFacilityTitleMr(e.target.value)} required placeholder="उदा. पिण्याचे पाणी" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="f-title-en" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-blue-600 text-white text-[8px] px-1 rounded">EN</span> {t('EN सुविधा नाव (इंग्रजी) *', 'EN Facility Name (English) *')}
                  </Label>
                  <Input id="f-title-en" value={facilityTitleEn} onChange={(e) => setFacilityTitleEn(e.target.value)} required placeholder="e.g. Drinking Water" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="f-icon" className="text-xs font-bold text-gray-700">आयकॉन / Icon</Label>
                    <select
                      id="f-icon"
                      value={facilityIcon}
                      onChange={(e) => setFacilityIcon(e.target.value)}
                      className="w-full border border-gray-250 p-2 rounded-xl text-sm focus:border-green-600 bg-white"
                    >
                      {AVAILABLE_ICONS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="f-order" className="text-xs font-bold text-gray-700">क्रम / Display Order</Label>
                    <Input id="f-order" type="number" value={facilityOrder} onChange={(e) => setFacilityOrder(parseInt(e.target.value) || 1)} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                  <Label htmlFor="f-active" className="text-xs font-bold text-gray-700 cursor-pointer">सक्रिय आहे? / Active?</Label>
                  <input id="f-active" type="checkbox" checked={facilityActive} onChange={(e) => setFacilityActive(e.target.checked)} className="h-4.5 w-4.5 accent-green-700 cursor-pointer" />
                </div>
              </>
            )}

            {/* DOWNLOADABLE FORM FIELDS */}
            {modalType === 'form' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="fo-title-mr" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-green-600 text-white text-[8px] px-1 rounded">MR</span> फॉर्म नाव (मराठी) *
                  </Label>
                  <Input id="fo-title-mr" value={formTitleMr} onChange={(e) => setFormTitleMr(e.target.value)} required placeholder="उदा. व्यापारी परवाना अर्ज" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fo-title-en" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-blue-600 text-white text-[8px] px-1 rounded">EN</span> {t('EN फॉर्म शीर्षक (इंग्रजी) *', 'EN Form Title (English) *')}
                  </Label>
                  <Input id="fo-title-en" value={formTitleEn} onChange={(e) => setFormTitleEn(e.target.value)} required placeholder="e.g. Trader License Form" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fo-desc-mr" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-green-600 text-white text-[8px] px-1 rounded">MR</span> फॉर्म वर्णन (मराठी)
                  </Label>
                  <Input id="fo-desc-mr" value={formDescMr} onChange={(e) => setFormDescMr(e.target.value)} placeholder="मराठी वर्णन..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fo-desc-en" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-blue-600 text-white text-[8px] px-1 rounded">EN</span> {t('EN वर्णन (इंग्रजी)', 'EN Description (English)')}
                  </Label>
                  <Input id="fo-desc-en" value={formDescEn} onChange={(e) => setFormDescEn(e.target.value)} placeholder="English description..." />
                </div>

                {/* File Upload Section */}
                <div className="space-y-2 p-4 bg-gray-50 border border-dashed border-gray-250 rounded-2xl">
                  <Label className="text-xs font-bold text-gray-700 block">फाइल अपलोड (PDF, Word, Excel, इ.) *</Label>
                  {existingFileUrl && !fileDeleted && (
                    <div className="flex items-center justify-between text-xs bg-white border p-2.5 rounded-xl mb-2 shadow-2xs">
                      <span className="truncate max-w-[180px] text-gray-600 flex items-center gap-1.5 font-bold">
                        <Lucide.FileText className="h-4 w-4 text-green-700 shrink-0" />
                        {existingFileName || t('विद्यमान फाइल', 'Existing File')}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFileDeleted(true);
                          setExistingFileUrl(null);
                          setExistingFileName(null);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 text-[10px] font-bold px-2 rounded-lg cursor-pointer shrink-0"
                      >
                        <Lucide.Trash2 className="h-3.5 w-3.5 mr-1" />
                        फाइल हटवा / Remove
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setFormFile(e.target.files[0]);
                        }
                      }}
                      className="bg-white border-gray-200 focus:border-green-600 rounded-xl"
                    />
                    <p className="text-[10px] text-gray-400 font-medium">नवीन फाइल निवडल्यास आधीची फाइल बदलली जाईल.</p>
                  </div>

                  {uploadProgress !== null && (
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-[10px] font-bold text-green-800">
                        <span>{t('अपलोड होत आहे...', 'Uploading...')}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-700 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fo-type" className="text-xs font-bold text-gray-700">फाइल प्रकार / File Type</Label>
                    <select
                      id="fo-type"
                      value={formFileType}
                      onChange={(e) => setFormFileType(e.target.value)}
                      className="w-full border border-gray-250 p-2 rounded-xl text-sm focus:border-green-600 bg-white"
                    >
                      <option value="PDF">PDF</option>
                      <option value="DOCX">{t('Word (DOCX)', 'Word (DOCX)')}</option>
                      <option value="XLSX">{t('Excel (XLSX)', 'Excel (XLSX)')}</option>
                      <option value="Image">Image (PNG/JPG)</option>
                      <option value="Other">{t('इतर', 'Other')}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fo-order" className="text-xs font-bold text-gray-700">क्रम / Display Order</Label>
                    <Input id="fo-order" type="number" value={formOrder} onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                  <Label htmlFor="fo-active" className="text-xs font-bold text-gray-700 cursor-pointer">सक्रिय आहे? / Active?</Label>
                  <input id="fo-active" type="checkbox" checked={formActive} onChange={(e) => setFormActive(e.target.checked)} className="h-4.5 w-4.5 accent-green-700 cursor-pointer" />
                </div>
              </>
            )}

            {/* FAQ FORM FIELDS */}
            {modalType === 'faq' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="faq-q-mr" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-green-600 text-white text-[8px] px-1 rounded">MR</span> प्रश्न (मराठी) *
                  </Label>
                  <Input id="faq-q-mr" value={faqQMr} onChange={(e) => setFaqQMr(e.target.value)} required placeholder="उदा. बाजार भाव कुठे दिसतील?" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="faq-q-en" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-blue-600 text-white text-[8px] px-1 rounded">EN</span> {t('EN प्रश्न (इंग्रजी) *', 'EN Question (English) *')}
                  </Label>
                  <Input id="faq-q-en" value={faqQEn} onChange={(e) => setFaqQEn(e.target.value)} required placeholder="e.g. Where can I find market rates?" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="faq-a-mr" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-green-600 text-white text-[8px] px-1 rounded">MR</span> उत्तर (मराठी) *
                  </Label>
                  <Textarea id="faq-a-mr" rows={3} value={faqAMr} onChange={(e) => setFaqAMr(e.target.value)} required placeholder="उत्तर मराठीमध्ये लिहा..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="faq-a-en" className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <span className="bg-blue-600 text-white text-[8px] px-1 rounded">EN</span> {t('EN उत्तर (इंग्रजी) *', 'EN Answer (English) *')}
                  </Label>
                  <Textarea id="faq-a-en" rows={3} value={faqAEn} onChange={(e) => setFaqAEn(e.target.value)} required placeholder="Write answer in English..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="faq-order" className="text-xs font-bold text-gray-700">क्रम / Display Order</Label>
                    <Input id="faq-order" type="number" value={faqOrder} onChange={(e) => setFaqOrder(parseInt(e.target.value) || 1)} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                  <Label htmlFor="faq-active" className="text-xs font-bold text-gray-700 cursor-pointer">सक्रिय आहे? / Active?</Label>
                  <input id="faq-active" type="checkbox" checked={faqActive} onChange={(e) => setFaqActive(e.target.checked)} className="h-4.5 w-4.5 accent-green-700 cursor-pointer" />
                </div>
              </>
            )}

            {/* Submit & Cancel */}
            <div className="pt-4 border-t flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                className="border-gray-250 hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer rounded-xl"
                disabled={actionLoading}
              >
                {t('रद्द करा', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer rounded-xl"
              >
                {actionLoading ? (
                  <>
                    <Lucide.Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('जतन होत आहे...', 'Saving...')}
                  </>
                ) : (
                  t('जतन करा', 'Save')
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─── DELETE CONFIRM DIALOG ───────────────────────────────────────────── */}
      {deleteConfirmTarget && (
        <Modal title={t('हटवण्याची पुष्टी', 'Confirm Delete')} onClose={() => setDeleteConfirmTarget(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-full bg-red-100 shrink-0 text-red-600">
                <Lucide.AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-gray-900 text-base">{t('तुम्हाला खात्री आहे का?', 'Are you sure?')}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t('तुम्ही ', 'Do you want to delete ')}<strong>"{deleteConfirmTarget.name}"</strong>{t(' हटवू इच्छिता? ही कृती पूर्ववत करता येणार नाही.', '? This action cannot be undone.')}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={actionLoading}
                className="border-gray-250 cursor-pointer rounded-xl"
              >
                {t('रद्द करा', 'Cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleExecuteDelete}
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer rounded-xl"
              >
                {actionLoading ? (
                  <Lucide.Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lucide.Trash2 className="h-4 w-4 mr-2" />
                )}
                {t('हटवा', 'Delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CSS Animations */}
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

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
