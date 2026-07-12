'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Notice } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

type CategoryType = 'general' | 'important' | 'tender' | 'meeting' | 'holiday';
type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const CATEGORY_OPTIONS: { value: CategoryType; labelMr: string; labelEn: string; color: string }[] = [
  { value: 'general',   labelMr: 'सर्वसाधारण',  labelEn: 'General',   color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'important', labelMr: 'महत्त्वपूर्ण', labelEn: 'Important', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'tender',    labelMr: 'निविदा',      labelEn: 'Tender',    color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'meeting',   labelMr: 'बैठक',        labelEn: 'Meeting',   color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'holiday',   labelMr: 'सुट्टी',       labelEn: 'Holiday',   color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

const EMPTY_FORM: Omit<Notice, 'id' | 'created_at' | 'updated_at'> = {
  title_mr: '',
  title_en: '',
  content_mr: '',
  content_en: '',
  category: 'general',
  is_important: false,
  is_published: true,
  published_at: '',
  expires_at: '',
  attachment_url: '',
};

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold transition-all duration-300',
            t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          {t.type === 'success' ? <Lucide.CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <Lucide.XCircle className="h-4 w-4 text-red-600 shrink-0" />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer">
            <Lucide.X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminNoticesPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<CategoryType | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  };

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('published_at', { ascending: false });
      if (error) throw error;
      setNotices(data || []);
    } catch (err: any) {
      addToast('error', err.message || t('सूचना लोड करण्यात अयशस्वी', 'Failed to fetch notices'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotices(); }, []);

  const openAddModal = () => {
    setEditingNotice(null);
    setForm({
      ...EMPTY_FORM,
      published_at: new Date().toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice);
    setForm({
      title_mr: notice.title_mr,
      title_en: notice.title_en || '',
      content_mr: notice.content_mr,
      content_en: notice.content_en || '',
      category: notice.category,
      is_important: notice.is_important,
      is_published: notice.is_published,
      published_at: notice.published_at ? new Date(notice.published_at).toISOString().split('T')[0] : '',
      expires_at: notice.expires_at ? new Date(notice.expires_at).toISOString().split('T')[0] : '',
      attachment_url: notice.attachment_url || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingNotice(null);
    setUploadProgress(0);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast('error', t('फाइल १० MB पेक्षा लहान असणे आवश्यक आहे.', 'File must be smaller than 10 MB.'));
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `notice-${Date.now()}.${ext}`;
      const filePath = `documents/${fileName}`;

      setUploadProgress(40);

      const { error: uploadError } = await supabase.storage
        .from('notices-attachments')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      const { data: urlData } = supabase.storage
        .from('notices-attachments')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setForm((prev) => ({ ...prev, attachment_url: publicUrl }));
      setUploadProgress(100);
      addToast('success', t('संलग्नक यशस्वीरित्या अपलोड केले!', 'Attachment uploaded successfully!'));
    } catch (err: any) {
      addToast('error', err.message || t('फाइल अपलोड अयशस्वी', 'File upload failed'));
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_mr.trim() || !form.content_mr.trim()) {
      addToast('error', t('मराठी शीर्षक आणि मराठी मजकूर आवश्यक आहे.', 'Marathi Title and Marathi Content are required.'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title_mr: form.title_mr.trim(),
        title_en: form.title_en?.trim() || null,
        content_mr: form.content_mr.trim(),
        content_en: form.content_en?.trim() || null,
        category: form.category,
        is_important: form.is_important,
        is_published: form.is_published,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        attachment_url: form.attachment_url?.trim() || null,
      };

      if (editingNotice) {
        const { error } = await supabase
          .from('notices')
          .update(payload)
          .eq('id', editingNotice.id);
        if (error) throw error;
        addToast('success', t('सूचना यशस्वीरित्या अद्ययावत केली!', 'Notice updated successfully!'));
      } else {
        const { error } = await supabase
          .from('notices')
          .insert(payload);
        if (error) throw error;
        addToast('success', t('सूचना यशस्वीरित्या प्रकाशित केली!', 'Notice published successfully!'));
      }

      closeModal();
      fetchNotices();
    } catch (err: any) {
      addToast('error', err.message || t('सूचना जतन करण्यात अयशस्वी', 'Failed to save notice'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const notice = notices.find((n) => n.id === id);
      if (notice?.attachment_url) {
        const urlParts = notice.attachment_url.split('/notices-attachments/');
        if (urlParts.length > 1) {
          await supabase.storage.from('notices-attachments').remove([urlParts[1]]);
        }
      }
      const { error } = await supabase
        .from('notices')
        .delete()
        .eq('id', id);
      if (error) throw error;
      addToast('success', t('सूचना हटवली.', 'Notice deleted.'));
      setDeleteConfirmId(null);
      fetchNotices();
    } catch (err: any) {
      addToast('error', err.message || t('सूचना हटवण्यात अयशस्वी', 'Failed to delete notice'));
    }
  };

  const togglePublish = async (notice: Notice) => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ is_published: !notice.is_published })
        .eq('id', notice.id);
      if (error) throw error;
      fetchNotices();
    } catch (err: any) {
      addToast('error', t('स्थिती बदलण्यात अयशस्वी', 'Failed to toggle status'));
    }
  };

  const filteredNotices = notices.filter((n) => {
    const matchesCategory = filterCategory === 'all' || n.category === filterCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      n.title_mr.toLowerCase().includes(query) ||
      (n.title_en && n.title_en.toLowerCase().includes(query)) ||
      n.content_mr.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('सूचना व्यवस्थापन', 'Manage Notices')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('परिपत्रके, निविदा, इशारे आणि अधिकृत घोषणा तयार करा व प्रकाशित करा', 'Create and publish circulars, tenders, alerts, and official announcements')}</p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-green-755 hover:bg-green-800 bg-green-700 text-white font-bold cursor-pointer shrink-0"
        >
          <Lucide.PlusCircle className="h-4 w-4 mr-2" />
          {t('नवीन सूचना जोडा', 'Add New Notice')}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 min-w-0 w-full">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t('सूचनेच्या शीर्षकाने किंवा मजकुराने शोधा...', 'Search by notice title or content...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-gray-200 focus-visible:ring-green-600"
          />
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setFilterCategory('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer',
              filterCategory === 'all' ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            )}
          >
            {t('सर्व श्रेणी', 'All Categories')}
          </button>
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer',
                filterCategory === cat.value ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {t(cat.labelMr, cat.labelEn)}
            </button>
          ))}
        </div>
      </div>

      {/* Notices Card */}
      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-gray-50/30">
          <CardTitle className="text-base font-bold">{t('सूचना परिपत्रक यादी', 'Notices Circular List')}</CardTitle>
          <CardDescription>{t('प्रकाशित परिपत्रके आणि संलग्नके पाहा, संपादित करा किंवा हटवा', 'View, edit, or delete published circulars and attachments')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Lucide.Loader2 className="h-8 w-8 text-green-700 animate-spin" />
              <p className="text-sm text-gray-500">{t('सूचना लोड होत आहेत...', 'Loading notices...')}</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Lucide.BellOff className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">{t('कोणतीही सूचना सापडली नाही', 'No notices found')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4 text-left">{t('श्रेणी', 'Category')}</th>
                    <th className="py-3 px-4 text-left">{t('सूचना शीर्षक', 'Notice Title')}</th>
                    <th className="py-3 px-4 text-left">{t('प्रकाशन दिनांक', 'Published On')}</th>
                    <th className="py-3 px-4 text-left">{t('मुदतसमाप्ती', 'Expiry')}</th>
                    <th className="py-3 px-4 text-center">{t('संलग्नक', 'Attachment')}</th>
                    <th className="py-3 px-4 text-center">{t('स्थिती', 'Status')}</th>
                    <th className="py-3 px-4 text-right">{t('कृती', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredNotices.map((notice) => {
                    const cat = CATEGORY_OPTIONS.find((c) => c.value === notice.category);
                    return (
                      <tr key={notice.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <Badge className={cn('text-xs border font-semibold', cat?.color)}>{cat ? t(cat.labelMr, cat.labelEn) : ''}</Badge>
                          {notice.is_important && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 uppercase animate-pulse">{t('इशारा', 'Alert')}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                          <p className="font-bold text-gray-900 leading-snug truncate">{notice.title_mr}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{notice.title_en || t('इंग्रजी शीर्षक नाही', 'No English Title')}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {notice.published_at ? new Date(notice.published_at).toLocaleDateString('en-IN') : t('त्वरित', 'Immediate')}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {notice.expires_at ? (
                            <span className={cn(new Date(notice.expires_at) < new Date() ? 'text-red-500 font-semibold' : 'text-gray-600')}>
                              {new Date(notice.expires_at).toLocaleDateString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-gray-300">{t('कधीही नाही', 'Never')}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {notice.attachment_url ? (
                            <a
                              href={notice.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                            >
                              <Lucide.FileDown className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => togglePublish(notice)}
                            className={cn(
                              'text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors',
                              notice.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            )}
                          >
                            {notice.is_published ? t('प्रकाशित', 'Published') : t('मसुदा', 'Draft')}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(notice)}
                              className="h-8 px-3 text-xs cursor-pointer border-gray-200 hover:border-green-600 hover:text-green-700"
                            >
                              <Lucide.Pencil className="h-3 w-3 mr-1" />{t('संपादित करा', 'Edit')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmId(notice.id)}
                              className="h-8 px-3 text-xs cursor-pointer border-gray-200 hover:border-red-400 hover:text-red-600"
                            >
                              <Lucide.Trash2 className="h-3 w-3 mr-1" />{t('हटवा', 'Delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingNotice ? t('सूचना संपादित करा', 'Edit Notice') : t('नवीन सूचना जोडा', 'Add New Notice')}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{t('वापरकर्त्यांसाठी इशारे, परिपत्रके किंवा घोषणा प्रकाशित करा', 'Publish alerts, circulars, or announcements for users')}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                <Lucide.X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('सूचना श्रेणी', 'Notice Category')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CATEGORY_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setForm((prev) => ({ ...prev, category: c.value }))}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-semibold text-center cursor-pointer transition-all',
                        form.category === c.value ? 'bg-green-700 text-white border-green-700 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <span>{c.labelEn}</span>
                      <span className="block text-[9px] opacity-70 mt-0.5">{c.labelMr}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF Attachment Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('परिपत्रक / सूचना PDF संलग्नक', 'Circular / Notice PDF Attachment')}</Label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-green-600 text-green-700 hover:bg-green-50"
                  >
                    {uploading ? (
                      <><Lucide.Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('अपलोड होत आहे...', 'Uploading...')}</>
                    ) : (
                      <><Lucide.Upload className="h-4 w-4 mr-2" />{t('दस्तऐवज अपलोड करा', 'Upload Document')}</>
                    )}
                  </Button>
                  {form.attachment_url && (
                    <div className="flex items-center gap-2 text-xs text-green-700 font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-150 truncate max-w-md">
                      <Lucide.FileText className="h-4 w-4 shrink-0" />
                      <a href={form.attachment_url} target="_blank" rel="noreferrer" className="truncate hover:underline">{t('संलग्न फाइल', 'Attached File')}</a>
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, attachment_url: '' }))}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <Lucide.X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                {uploading && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mt-1">
                    <div className="bg-green-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 items-center bg-gray-50 p-4 rounded-xl border">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_important}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_important: e.target.checked }))}
                    className="w-4 h-4 accent-green-700 rounded cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-red-700 flex items-center gap-1.5">
                    <Lucide.AlertCircle className="h-4 w-4" /> {t('महत्त्वपूर्ण (उच्च प्राधान्य / इशारा)', 'Important (High Priority / Alerts Ticker)')}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
                    className="w-4 h-4 accent-green-700 rounded cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-gray-700">{t('प्रकाशित (साइटवर दृश्यमान)', 'Published (Visible on site)')}</span>
                </label>
              </div>

              {/* Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title_mr" className="text-xs font-bold text-gray-700">{t('शीर्षक (मराठी)', 'Title (Marathi)')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="title_mr"
                    required
                    value={form.title_mr}
                    onChange={(e) => setForm((prev) => ({ ...prev, title_mr: e.target.value }))}
                    placeholder="उदा. कापूस खरेदी केंद्र लिलाव सुरू..."
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title_en" className="text-xs font-bold text-gray-700">{t('शीर्षक (इंग्रजी)', 'Title (English)')}</Label>
                  <Input
                    id="title_en"
                    value={form.title_en || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, title_en: e.target.value }))}
                    placeholder={t('उदा. Cotton Procurement Center Open...', 'e.g. Cotton Procurement Center Open...')}
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <Label htmlFor="content_mr" className="text-xs font-bold text-gray-700">{t('तपशीलवार सूचना मजकूर (मराठी)', 'Detailed Notice Content (Marathi)')} <span className="text-red-500">*</span></Label>
                <Textarea
                  id="content_mr"
                  required
                  rows={4}
                  value={form.content_mr}
                  onChange={(e) => setForm((prev) => ({ ...prev, content_mr: e.target.value }))}
                  placeholder="मजकूर येथे लिहा..."
                  className="border-gray-200 focus-visible:ring-green-600 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="content_en" className="text-xs font-bold text-gray-700">{t('तपशीलवार सूचना मजकूर (इंग्रजी)', 'Detailed Notice Content (English)')}</Label>
                <Textarea
                  id="content_en"
                  rows={4}
                  value={form.content_en || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, content_en: e.target.value }))}
                  placeholder={t('इंग्रजी मजकूर येथे लिहा...', 'Write english content details here...')}
                  className="border-gray-200 focus-visible:ring-green-600 resize-none"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="published_at" className="text-xs font-bold text-gray-700">{t('प्रकाशन दिनांक', 'Publish Date')}</Label>
                  <Input
                    id="published_at"
                    type="date"
                    value={form.published_at || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, published_at: e.target.value }))}
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expires_at" className="text-xs font-bold text-gray-700">{t('मुदतसमाप्ती दिनांक (ऐच्छिक - सूचना आपोआप लपवते)', 'Expiry Date (Optional - auto-hides notice)')}</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={form.expires_at || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, expires_at: e.target.value }))}
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeModal} className="cursor-pointer">{t('रद्द करा', 'Cancel')}</Button>
                <Button
                  type="submit"
                  disabled={saving || uploading}
                  className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer"
                >
                  {saving ? <><Lucide.Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('जतन होत आहे...', 'Saving...')}</> : <><Lucide.Save className="h-4 w-4 mr-2" />{t('सूचना जतन करा', 'Save Notice')}</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl"><Lucide.Trash2 className="h-5 w-5 text-red-600" /></div>
              <div>
                <h3 className="font-bold text-gray-900">{t('सूचना हटवा', 'Delete Notice')}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t('ही सूचना आणि तिचे PDF संलग्नक कायमचे हटवले जातील.', 'This notice and its PDF attachment will be deleted permanently.')}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="cursor-pointer">{t('रद्द करा', 'Cancel')}</Button>
              <Button onClick={() => handleDelete(deleteConfirmId)} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">{t('हटवा', 'Delete')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
