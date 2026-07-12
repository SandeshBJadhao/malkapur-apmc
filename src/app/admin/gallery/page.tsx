'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GalleryItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

type ToastType = 'success' | 'error';
interface Toast { id: number; type: ToastType; message: string; }

const CATEGORIES = [
  { key: 'yard',   labelMr: 'बाजार आवार',        labelEn: 'Market Yard' },
  { key: 'infra',  labelMr: 'पायाभूत सुविधा',    labelEn: 'Infrastructure' },
  { key: 'events', labelMr: 'कार्यक्रम व बैठका', labelEn: 'Events & Meetings' },
  { key: 'other',  labelMr: 'इतर',               labelEn: 'Other' },
];

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold',
            t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          {t.type === 'success' ? <Lucide.CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <Lucide.XCircle className="h-4 w-4 text-red-600 shrink-0" />}
          <span>{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer"><Lucide.X className="h-3.5 w-3.5" /></button>
        </div>
      ))}
    </div>
  );
}

export default function AdminGalleryPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title_mr: '', title_en: '', category: 'other', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 4500);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      addToast('error', err.message || t('गॅलरी लोड करण्यात अयशस्वी', 'Failed to fetch gallery'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 10 * 1024 * 1024) {
      addToast('error', `${file.name}: ${t('फाइल खूप मोठी आहे (कमाल १० MB).', 'File too large (max 10 MB).')}`);
      return;
    }

    const uploadId = `${Date.now()}-${Math.random()}`;
    const ext = file.name.split('.').pop();
    const fileName = `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `images/${fileName}`;

    setUploadingFiles((prev) => [...prev, { id: uploadId, name: file.name, progress: 0, status: 'uploading' }]);

    try {
      setUploadingFiles((prev) => prev.map((f) => f.id === uploadId ? { ...f, progress: 30 } : f));

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      setUploadingFiles((prev) => prev.map((f) => f.id === uploadId ? { ...f, progress: 70 } : f));

      const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      const { error: insertError } = await supabase.from('gallery_items').insert({
        title_mr: file.name.replace(/\.[^/.]+$/, ''),
        title_en: file.name.replace(/\.[^/.]+$/, ''),
        image_url: publicUrl,
        category: 'other',
        sort_order: items.length + 1,
        is_published: true,
      });

      if (insertError) throw insertError;

      setUploadingFiles((prev) => prev.map((f) => f.id === uploadId ? { ...f, progress: 100, status: 'done' } : f));
      setTimeout(() => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadId));
        fetchItems();
      }, 1500);
    } catch (err: any) {
      setUploadingFiles((prev) => prev.map((f) => f.id === uploadId ? { ...f, status: 'error', error: err.message } : f));
      addToast('error', `${file.name}: ${err.message}`);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [items.length]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const openEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setEditForm({
      title_mr: item.title_mr || '',
      title_en: item.title_en || '',
      category: item.category || 'other',
      sort_order: item.sort_order || 0,
    });
  };

  const handleEditSave = async () => {
    if (!editingItem) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('gallery_items').update({
        title_mr: editForm.title_mr.trim() || null,
        title_en: editForm.title_en.trim() || null,
        category: editForm.category,
        sort_order: editForm.sort_order,
      }).eq('id', editingItem.id);
      if (error) throw error;
      addToast('success', t('गॅलरी आयटम अद्ययावत केला!', 'Gallery item updated!'));
      setEditingItem(null);
      fetchItems();
    } catch (err: any) {
      addToast('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    try {
      // Extract storage path from URL
      const urlParts = item.image_url.split('/gallery/');
      if (urlParts.length > 1) {
        await supabase.storage.from('gallery').remove([urlParts[1]]);
      }
      const { error } = await supabase.from('gallery_items').delete().eq('id', id);
      if (error) throw error;
      addToast('success', t('चित्र हटवले.', 'Image deleted.'));
      setDeleteConfirmId(null);
      fetchItems();
    } catch (err: any) {
      addToast('error', err.message);
    }
  };

  const togglePublish = async (item: GalleryItem) => {
    try {
      const { error } = await supabase.from('gallery_items').update({ is_published: !item.is_published }).eq('id', item.id);
      if (error) throw error;
      fetchItems();
    } catch (err: any) {
      addToast('error', t('प्रकाशन स्थिती बदलण्यात अयशस्वी', 'Failed to toggle publish status'));
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('गॅलरी व्यवस्थापन', 'Manage Gallery')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('सार्वजनिक गॅलरी पृष्ठावर दाखवले जाणारे फोटो अपलोड करा आणि व्यवस्थापित करा', 'Upload and manage photos shown in the public gallery page')}</p>
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer shrink-0"
        >
          <Lucide.Upload className="h-4 w-4 mr-2" />
          {t('चित्रे अपलोड करा', 'Upload Images')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-purple-500 bg-purple-50 scale-[1.01]'
            : 'border-gray-200 bg-white hover:border-purple-400 hover:bg-purple-50/30'
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={cn('p-4 rounded-full transition-colors', isDragging ? 'bg-purple-200' : 'bg-gray-100')}>
            <Lucide.ImagePlus className={cn('h-7 w-7 transition-colors', isDragging ? 'text-purple-700' : 'text-gray-400')} />
          </div>
          <div>
            <p className="font-semibold text-gray-700">{t('येथे चित्रे ड्रॉप करा किंवा अपलोड करण्यासाठी क्लिक करा', 'Drop images here or click to upload')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('JPG, PNG, WebP · अनेक फाइल्स सपोर्टेड · प्रत्येकी कमाल १० MB', 'JPG, PNG, WebP · Multiple files supported · Max 10 MB each')}</p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-gray-50/30 py-3 px-5">
            <CardTitle className="text-sm font-bold">{t(`${uploadingFiles.length} फाइल(स) अपलोड होत आहे...`, `Uploading ${uploadingFiles.length} file(s)...`)}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {uploadingFiles.map((f) => (
              <div key={f.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700 truncate flex-1 mr-2">{f.name}</span>
                  <span className={cn('font-semibold shrink-0', f.status === 'done' ? 'text-emerald-600' : f.status === 'error' ? 'text-red-600' : 'text-gray-500')}>
                    {f.status === 'done' ? t('✓ पूर्ण', '✓ Done') : f.status === 'error' ? t('✗ अयशस्वी', '✗ Failed') : `${f.progress}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn('h-1.5 rounded-full transition-all duration-300', f.status === 'error' ? 'bg-red-400' : f.status === 'done' ? 'bg-emerald-500' : 'bg-purple-500')}
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Gallery Grid */}
      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-gray-50/30">
          <CardTitle className="text-base font-bold">{t(`गॅलरी आयटम (${items.length})`, `Gallery Items (${items.length})`)}</CardTitle>
          <CardDescription>{t('शीर्षक, श्रेणी किंवा प्रकाशन स्थिती अद्ययावत करण्यासाठी संपादित करा क्लिक करा', 'Click Edit to update title, category or publish status')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Lucide.Loader2 className="h-8 w-8 text-purple-700 animate-spin" />
              <p className="text-sm text-gray-500">{t('गॅलरी लोड होत आहे...', 'Loading gallery...')}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Lucide.FileImage className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-500">{t('अद्याप कोणतेही चित्र अपलोड केले नाही', 'No images uploaded yet')}</p>
              <p className="text-sm mt-1">{t('सुरू करण्यासाठी वरील अपलोड बटण वापरा किंवा चित्रे ड्रॅग करा.', 'Use the upload button or drag & drop images above to get started.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => (
                <div key={item.id} className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gray-200 overflow-hidden">
                    <Image
                      src={item.image_url}
                      alt={item.title_en || 'Gallery image'}
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 bg-white/90 hover:bg-white rounded-lg cursor-pointer transition-colors"
                      >
                        <Lucide.Pencil className="h-4 w-4 text-gray-700" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-2 bg-white/90 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <Lucide.Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                    {/* Published badge */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={() => togglePublish(item)}
                        className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-colors',
                          item.is_published
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        )}
                      >
                        {item.is_published ? t('प्रकाशित', 'Published') : t('लपवलेले', 'Hidden')}
                      </button>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{item.title_en || t('शीर्षक नाही', 'Untitled')}</p>
                    <p className="text-xs text-gray-400">{CATEGORIES.find((c) => c.key === item.category)?.labelEn || item.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">{t('गॅलरी आयटम संपादित करा', 'Edit Gallery Item')}</h2>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-400 hover:text-gray-600">
                <Lucide.X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Preview */}
              <div className="relative w-full rounded-xl overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
                <Image src={editingItem.image_url} alt="Preview" fill className="object-cover" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">{t('शीर्षक (मराठी)', 'Title (Marathi)')}</Label>
                  <Input
                    value={editForm.title_mr}
                    onChange={(e) => setEditForm((p) => ({ ...p, title_mr: e.target.value }))}
                    placeholder="मराठी शीर्षक..."
                    className="border-gray-200 focus-visible:ring-purple-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">{t('शीर्षक (इंग्रजी)', 'Title (English)')}</Label>
                  <Input
                    value={editForm.title_en}
                    onChange={(e) => setEditForm((p) => ({ ...p, title_en: e.target.value }))}
                    placeholder="English title..."
                    className="border-gray-200 focus-visible:ring-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">{t('श्रेणी', 'Category')}</Label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.labelEn} / {c.labelMr}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700">{t('क्रम', 'Sort Order')}</Label>
                  <Input
                    type="number"
                    value={editForm.sort_order}
                    onChange={(e) => setEditForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                    className="border-gray-200 focus-visible:ring-purple-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditingItem(null)} className="cursor-pointer">{t('रद्द करा', 'Cancel')}</Button>
                <Button
                  onClick={handleEditSave}
                  disabled={saving}
                  className="bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer"
                >
                  {saving ? <Lucide.Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lucide.Save className="h-4 w-4 mr-2" />}
                  {t('बदल जतन करा', 'Save Changes')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <Lucide.Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{t('चित्र हटवा', 'Delete Image')}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t('हे चित्र स्टोरेजमधून कायमचे हटवले जाईल. ही क्रिया पूर्ववत केली जाऊ शकत नाही.', 'This will permanently delete the image from storage. Cannot be undone.')}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="cursor-pointer">{t('रद्द करा', 'Cancel')}</Button>
              <Button onClick={() => handleDelete(deleteConfirmId)} className="bg-red-600 hover:bg-red-700 text-white cursor-pointer">
                <Lucide.Trash2 className="h-4 w-4 mr-2" />{t('हटवा', 'Delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
