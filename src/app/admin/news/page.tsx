'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NewsItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

type CategoryType = 'market_update' | 'agri_training' | 'govt_scheme' | 'arrivals_report' | 'other';
type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const CATEGORY_OPTIONS: { value: CategoryType; labelMr: string; labelEn: string; color: string }[] = [
  { value: 'market_update',   labelMr: 'बाजार अपडेट',  labelEn: 'Market Update',   color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'agri_training',   labelMr: 'कृषी शिक्षण',  labelEn: 'Agri Training',   color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'govt_scheme',     labelMr: 'शासकीय योजना', labelEn: 'Govt Schemes',    color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'arrivals_report', labelMr: 'आवक वृत्त',   labelEn: 'Arrivals Report',  color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'other',           labelMr: 'इतर घडामोडी',  labelEn: 'Other Updates',   color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

const EMPTY_FORM: Omit<NewsItem, 'id' | 'created_at' | 'updated_at'> = {
  title_mr: '',
  title_en: '',
  content_mr: '',
  content_en: '',
  excerpt_mr: '',
  excerpt_en: '',
  cover_image_url: '',
  category: 'other',
  is_published: true,
  published_at: '',
  author: 'APMC Admin',
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

export default function AdminNewsPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<CategoryType | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  };

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchNews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .order('published_at', { ascending: false });
      if (error) throw error;
      setNews(data || []);
    } catch (err: any) {
      addToast('error', err.message || t('बातम्या लोड करण्यात अडचण आली', 'Failed to fetch news'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const openAddModal = () => {
    setEditingNews(null);
    setForm({
      ...EMPTY_FORM,
      published_at: new Date().toISOString().split('T')[0],
    });
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEditModal = (item: NewsItem) => {
    setEditingNews(item);
    setForm({
      title_mr: item.title_mr,
      title_en: item.title_en || '',
      content_mr: item.content_mr,
      content_en: item.content_en || '',
      excerpt_mr: item.excerpt_mr || '',
      excerpt_en: item.excerpt_en || '',
      cover_image_url: item.cover_image_url || '',
      category: item.category as CategoryType,
      is_published: item.is_published,
      published_at: item.published_at ? new Date(item.published_at).toISOString().split('T')[0] : '',
      author: item.author || 'APMC Admin',
    });
    setImagePreview(item.cover_image_url || null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingNews(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('error', t('कृपया वैध इमेज फाईल निवडा.', 'Please select a valid image file.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', t('इमेज ५ MB पेक्षा लहान असणे आवश्यक आहे.', 'Image must be smaller than 5 MB.'));
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `news-${Date.now()}.${ext}`;
      const filePath = `covers/${fileName}`;

      setUploadProgress(40);

      const { error: uploadError } = await supabase.storage
        .from('news-covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      const { data: urlData } = supabase.storage
        .from('news-covers')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setForm((prev) => ({ ...prev, cover_image_url: publicUrl }));
      setImagePreview(publicUrl);
      setUploadProgress(100);
      addToast('success', t('मुखपृष्ठ चित्र यशस्वीरित्या अपलोड केले!', 'Cover photo uploaded successfully!'));
    } catch (err: any) {
      addToast('error', err.message || t('इमेज अपलोड अयशस्वी', 'Image upload failed'));
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_mr.trim() || !form.content_mr.trim()) {
      addToast('error', t('मराठी शीर्षक आणि मजकूर आवश्यक आहे.', 'Marathi Title and Content are required.'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title_mr: form.title_mr.trim(),
        title_en: form.title_en?.trim() || null,
        content_mr: form.content_mr.trim(),
        content_en: form.content_en?.trim() || null,
        excerpt_mr: form.excerpt_mr?.trim() || null,
        excerpt_en: form.excerpt_en?.trim() || null,
        cover_image_url: form.cover_image_url?.trim() || null,
        category: form.category,
        is_published: form.is_published,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : new Date().toISOString(),
        author: form.author.trim() || 'APMC Admin',
      };

      if (editingNews) {
        const { error } = await supabase
          .from('news_items')
          .update(payload)
          .eq('id', editingNews.id);
        if (error) throw error;
        addToast('success', t('बातमी यशस्वीरित्या अद्ययावत केली!', 'News article updated successfully!'));
      } else {
        const { error } = await supabase
          .from('news_items')
          .insert(payload);
        if (error) throw error;
        addToast('success', t('बातमी यशस्वीरित्या प्रकाशित केली!', 'News article published successfully!'));
      }

      closeModal();
      fetchNews();
    } catch (err: any) {
      addToast('error', err.message || t('बातमी जतन करण्यात अडचण आली', 'Failed to save news article'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const item = news.find((n) => n.id === id);
      if (item?.cover_image_url) {
        const urlParts = item.cover_image_url.split('/news-covers/');
        if (urlParts.length > 1) {
          await supabase.storage.from('news-covers').remove([urlParts[1]]);
        }
      }
      const { error } = await supabase
        .from('news_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      addToast('success', t('बातमी हटवली.', 'News article deleted.'));
      setDeleteConfirmId(null);
      fetchNews();
    } catch (err: any) {
      addToast('error', err.message || t('बातमी हटवण्यात अडचण आली', 'Failed to delete news article'));
    }
  };

  const togglePublish = async (item: NewsItem) => {
    try {
      const { error } = await supabase
        .from('news_items')
        .update({ is_published: !item.is_published })
        .eq('id', item.id);
      if (error) throw error;
      fetchNews();
    } catch (err: any) {
      addToast('error', t('स्थिती बदलण्यात अडचण आली', 'Failed to toggle status'));
    }
  };

  const filteredNews = news.filter((n) => {
    const matchesCategory = filterCategory === 'all' || n.category === filterCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      n.title_mr.toLowerCase().includes(query) ||
      (n.title_en && n.title_en.toLowerCase().includes(query)) ||
      (n.excerpt_mr && n.excerpt_mr.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('बातम्या व माध्यम व्यवस्थापन', 'Manage News & Press')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('शेतकऱ्यांसाठी बातम्या, माहिती आणि प्रशिक्षण अहवाल प्रकाशित करा', 'Publish articles, updates, and training reports for farmers')}</p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer shrink-0"
        >
          <Lucide.PlusCircle className="h-4 w-4 mr-2" />
          {t('बातमी जोडा', 'Add News Article')}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 min-w-0 w-full">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t('शीर्षक किंवा सारांश द्वारे शोधा...', 'Search news by title or summary...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-gray-200 focus-visible:ring-blue-600"
          />
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setFilterCategory('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer',
              filterCategory === 'all' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
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
                filterCategory === cat.value ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {t(cat.labelMr, cat.labelEn)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of news */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Lucide.Loader2 className="h-8 w-8 text-blue-750 text-blue-700 animate-spin" />
          <p className="text-sm text-gray-500">{t('बातम्या लोड होत आहेत...', 'Loading articles...')}</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <Card className="p-16 text-center text-gray-400 border border-dashed rounded-2xl">
          <Lucide.Newspaper className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">{t('कोणतीही बातमी सापडली नाही', 'No news articles found')}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item) => {
            const cat = CATEGORY_OPTIONS.find((c) => c.value === item.category);
            return (
              <Card key={item.id} className="border border-gray-200 hover:shadow-lg transition-all rounded-2xl overflow-hidden bg-white flex flex-col group">
                <div className="relative aspect-video bg-gray-100 overflow-hidden shrink-0">
                  {item.cover_image_url ? (
                    <Image src={item.cover_image_url} alt={item.title_en || 'News Image'} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Lucide.Image className="h-8 w-8" /></div>
                  )}
                  <Badge className={cn('absolute top-3 left-3 text-[10px] uppercase font-bold border', cat?.color)}>{cat ? t(cat.labelMr, cat.labelEn) : ''}</Badge>
                  <button
                    onClick={() => togglePublish(item)}
                    className={cn(
                      'absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer backdrop-blur-sm',
                      item.is_published ? 'bg-emerald-500/90 text-white border-emerald-600' : 'bg-gray-500/90 text-white border-gray-600'
                    )}
                  >
                    {item.is_published ? t('प्रकाशित', 'Published') : t('मसुदा', 'Draft')}
                  </button>
                </div>
                <CardContent className="p-5 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Lucide.Calendar className="h-3 w-3" />{item.published_at ? new Date(item.published_at).toLocaleDateString('en-IN') : t('आज', 'Today')}</span>
                      <span className="flex items-center gap-1"><Lucide.User className="h-3 w-3" />{item.author}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">{item.title_mr}</h3>
                    <p className="text-xs text-gray-500 line-clamp-3">{item.excerpt_mr || item.content_mr}</p>
                  </div>
                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(item)}
                      className="h-8 text-xs cursor-pointer border-gray-200 hover:border-blue-600 hover:text-blue-700"
                    >
                      <Lucide.Pencil className="h-3 w-3 mr-1" />{t('संपादित करा', 'Edit')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="h-8 text-xs cursor-pointer border-gray-200 hover:border-red-400 hover:text-red-650 hover:text-red-600"
                    >
                      <Lucide.Trash2 className="h-3 w-3 mr-1" />{t('हटवा', 'Delete')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingNews ? t('बातमी संपादित करा', 'Edit News Article') : t('नवीन बातमी जोडा', 'Publish News Article')}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{t('अपडेट, प्रसिद्धीपत्रक किंवा मार्गदर्शन ब्लॉग लिहा', 'Write updates, press releases, or guidance blogs')}</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"><Lucide.X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Category */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('बातम्यांची श्रेणी', 'News Category')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CATEGORY_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setForm((p) => ({ ...p, category: c.value }))}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-semibold text-center cursor-pointer transition-all',
                        form.category === c.value ? 'bg-blue-700 text-white border-blue-700 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <span>{c.labelEn}</span>
                      <span className="block text-[9px] opacity-70 mt-0.5">{c.labelMr}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('मुखपृष्ठ चित्र', 'Cover Image')}</Label>
                <div className="flex items-start gap-4">
                  <div className="relative aspect-video w-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                    ) : (
                      <Lucide.Image className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-grow space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="cursor-pointer border-blue-600 text-blue-700 hover:bg-blue-50"
                    >
                      {uploading ? <><Lucide.Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('अपलोड होत आहे...', 'Uploading...')}</> : <><Lucide.Upload className="h-4 w-4 mr-2" />{t('चित्र अपलोड करा', 'Upload Image')}</>}
                    </Button>
                    <p className="text-xs text-gray-400">{t('JPG/PNG, कमाल ५ MB. किंवा खाली सार्वजनिक URL पेस्ट करा.', 'JPG/PNG, max 5 MB. Or paste public URL below.')}</p>
                    <Input
                      type="url"
                      value={form.cover_image_url || ''}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, cover_image_url: e.target.value }));
                        setImagePreview(e.target.value || null);
                      }}
                      placeholder={t('मुखपृष्ठ चित्राची URL येथे पेस्ट करा...', 'Paste cover image URL...')}
                      className="border-gray-200 focus-visible:ring-blue-600 text-xs"
                    />
                  </div>
                </div>
                {uploading && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>

              {/* Toggles + Author */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-gray-50 p-4 rounded-xl border">
                <div className="space-y-1.5">
                  <Label htmlFor="author" className="text-xs font-bold text-gray-700">{t('लेखक', 'Author')}</Label>
                  <Input
                    id="author"
                    value={form.author}
                    onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
                    className="border-gray-200 bg-white focus-visible:ring-blue-600 h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 mt-4 sm:justify-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                      className="w-4 h-4 accent-blue-700 rounded cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-700">{t('प्रकाशित', 'Published')}</span>
                  </label>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pub_date" className="text-xs font-bold text-gray-700">{t('प्रकाशन दिनांक', 'Publish Date')}</Label>
                  <Input
                    id="pub_date"
                    type="date"
                    value={form.published_at || ''}
                    onChange={(e) => setForm((p) => ({ ...p, published_at: e.target.value }))}
                    className="border-gray-200 bg-white focus-visible:ring-blue-600 h-8 text-xs"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title_mr" className="text-xs font-bold text-gray-700">{t('शीर्षक (मराठी) *', 'Title (Marathi) *')} <span className="text-red-500">*</span></Label>
                  <Input
                    id="title_mr"
                    required
                    value={form.title_mr}
                    onChange={(e) => setForm((p) => ({ ...p, title_mr: e.target.value }))}
                    placeholder="उदा. सोयाबीन खरेदी प्रक्रिया..."
                    className="border-gray-200 focus-visible:ring-blue-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title_en" className="text-xs font-bold text-gray-700">{t('शीर्षक (इंग्रजी)', 'Title (English)')}</Label>
                  <Input
                    id="title_en"
                    value={form.title_en || ''}
                    onChange={(e) => setForm((p) => ({ ...p, title_en: e.target.value }))}
                    placeholder="e.g. Soyabean Procurement Process..."
                    className="border-gray-200 focus-visible:ring-blue-600"
                  />
                </div>
              </div>

              {/* Summary / Excerpt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="exc_mr" className="text-xs font-bold text-gray-700">{t('सारांश (मराठी)', 'Summary / Excerpt (Marathi)')}</Label>
                  <Textarea
                    id="exc_mr"
                    rows={2}
                    value={form.excerpt_mr || ''}
                    onChange={(e) => setForm((p) => ({ ...p, excerpt_mr: e.target.value }))}
                    placeholder="थोडक्यात माहिती लिहा..."
                    className="border-gray-200 focus-visible:ring-blue-600 resize-none text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exc_en" className="text-xs font-bold text-gray-700">{t('सारांश (इंग्रजी)', 'Summary / Excerpt (English)')}</Label>
                  <Textarea
                    id="exc_en"
                    rows={2}
                    value={form.excerpt_en || ''}
                    onChange={(e) => setForm((p) => ({ ...p, excerpt_en: e.target.value }))}
                    placeholder="Write short summary here..."
                    className="border-gray-200 focus-visible:ring-blue-600 resize-none text-xs"
                  />
                </div>
              </div>

              {/* Content body */}
              <div className="space-y-1.5">
                <Label htmlFor="content_mr" className="text-xs font-bold text-gray-700">{t('संपूर्ण बातमी (मराठी) *', 'Full Content Article Body (Marathi) *')} <span className="text-red-500">*</span></Label>
                <Textarea
                  id="content_mr"
                  required
                  rows={6}
                  value={form.content_mr}
                  onChange={(e) => setForm((p) => ({ ...p, content_mr: e.target.value }))}
                  placeholder="संपूर्ण बातमी येथे लिहा..."
                  className="border-gray-200 focus-visible:ring-blue-600 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="content_en" className="text-xs font-bold text-gray-700">{t('संपूर्ण बातमी (इंग्रजी)', 'Full Content Article Body (English)')}</Label>
                <Textarea
                  id="content_en"
                  rows={6}
                  value={form.content_en || ''}
                  onChange={(e) => setForm((p) => ({ ...p, content_en: e.target.value }))}
                  placeholder="Write full english news article here..."
                  className="border-gray-200 focus-visible:ring-blue-600 resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeModal} className="cursor-pointer">{t('रद्द करा', 'Cancel')}</Button>
                <Button
                  type="submit"
                  disabled={saving || uploading}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer"
                >
                  {saving ? <><Lucide.Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('जतन होत आहे...', 'Saving...')}</> : <><Lucide.Save className="h-4 w-4 mr-2" />{t('बातमी जतन करा', 'Publish News')}</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl"><Lucide.Trash2 className="h-5 w-5 text-red-600" /></div>
              <div>
                <h3 className="font-bold text-gray-900">{t('बातमी हटवा', 'Delete Article')}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t('ही बातमी आणि त्याचे मुखपृष्ठ चित्र कायमचे हटवले जाईल.', 'This article and its cover image will be permanently deleted.')}</p>
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
