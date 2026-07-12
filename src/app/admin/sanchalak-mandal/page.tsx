'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CommitteeMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import * as Lucide from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

type RoleType = 'leadership' | 'board' | 'employee' | 'officer';
type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const ROLE_OPTIONS: { value: RoleType; labelMr: string; labelEn: string; color: string }[] = [
  { value: 'leadership', labelMr: 'प्रमुख पदाधिकारी',   labelEn: 'Leadership',  color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'board',      labelMr: 'संचालक मंडळ',         labelEn: 'Board Member', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'officer',    labelMr: 'अधिकारी',              labelEn: 'Officer',      color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'employee',   labelMr: 'कर्मचारी',             labelEn: 'Employee',     color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

const EMPTY_FORM: Omit<CommitteeMember, 'id' | 'created_at' | 'updated_at'> = {
  name_mr: '',
  name_en: '',
  role_type: 'board',
  designation_mr: '',
  designation_en: '',
  department_mr: '',
  department_en: '',
  phone: '',
  email: '',
  image_url: '',
  term_start: '',
  term_end: '',
  village_mr: '',
  village_en: '',
  sort_order: 0,
  is_active: true,
};

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border text-sm font-semibold transition-all duration-300',
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
          <button onClick={() => onRemove(t.id)} className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer">
            <Lucide.X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminSanchalakMandalPage() {
  const supabase = createClient();
  const { t } = useLanguage();
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<RoleType | 'all'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  };

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('committee_members')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      addToast('error', err.message || t('सदस्य लोड करण्यात अयशस्वी', 'Failed to fetch members'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const openAddModal = () => {
    setEditingMember(null);
    setForm(EMPTY_FORM);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEditModal = (member: CommitteeMember) => {
    setEditingMember(member);
    setForm({
      name_mr: member.name_mr,
      name_en: member.name_en,
      role_type: member.role_type,
      designation_mr: member.designation_mr,
      designation_en: member.designation_en,
      department_mr: member.department_mr || '',
      department_en: member.department_en || '',
      phone: member.phone || '',
      email: member.email || '',
      image_url: member.image_url || '',
      term_start: member.term_start || '',
      term_end: member.term_end || '',
      village_mr: member.village_mr || '',
      village_en: member.village_en || '',
      sort_order: member.sort_order,
      is_active: member.is_active,
    });
    setImagePreview(member.image_url || null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMember(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast('error', t('कृपया वैध चित्र फाइल निवडा.', 'Please select a valid image file.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', t('चित्र ५ MB पेक्षा लहान असणे आवश्यक आहे.', 'Image must be smaller than 5 MB.'));
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const ext = file.name.split('.').pop();
      const fileName = `member-${Date.now()}.${ext}`;
      const filePath = `photos/${fileName}`;

      setUploadProgress(40);

      const { error: uploadError } = await supabase.storage
        .from('committee-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setUploadProgress(80);

      const { data: urlData } = supabase.storage
        .from('committee-photos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      setImagePreview(publicUrl);
      setUploadProgress(100);
      addToast('success', t('फोटो यशस्वीरित्या अपलोड केला!', 'Photo uploaded successfully!'));
    } catch (err: any) {
      addToast('error', err.message || t('चित्र अपलोड अयशस्वी', 'Image upload failed'));
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name_mr.trim() || !form.name_en.trim()) {
      addToast('error', t('मराठी आणि इंग्रजी दोन्ही नावे आवश्यक आहेत.', 'Both Marathi and English names are required.'));
      return;
    }
    if (!form.designation_mr.trim() || !form.designation_en.trim()) {
      addToast('error', t('मराठी आणि इंग्रजी दोन्ही पदे आवश्यक आहेत.', 'Both Marathi and English designations are required.'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name_mr: form.name_mr.trim(),
        name_en: form.name_en.trim(),
        role_type: form.role_type,
        designation_mr: form.designation_mr.trim(),
        designation_en: form.designation_en.trim(),
        department_mr: form.department_mr?.trim() || null,
        department_en: form.department_en?.trim() || null,
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        image_url: form.image_url?.trim() || null,
        term_start: form.term_start?.trim() || null,
        term_end: form.term_end?.trim() || null,
        village_mr: form.village_mr?.trim() || null,
        village_en: form.village_en?.trim() || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      };

      if (editingMember) {
        const { error } = await supabase
          .from('committee_members')
          .update(payload)
          .eq('id', editingMember.id);
        if (error) throw error;
        addToast('success', t('सदस्य यशस्वीरित्या अद्ययावत केला!', 'Member updated successfully!'));
      } else {
        const { error } = await supabase
          .from('committee_members')
          .insert(payload);
        if (error) throw error;
        addToast('success', t('सदस्य यशस्वीरित्या जोडला!', 'Member added successfully!'));
      }

      closeModal();
      fetchMembers();
    } catch (err: any) {
      addToast('error', err.message || t('सदस्य जतन करण्यात अयशस्वी', 'Failed to save member'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('committee_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
      addToast('success', t('सदस्य हटवला.', 'Member deleted.'));
      setDeleteConfirmId(null);
      fetchMembers();
    } catch (err: any) {
      addToast('error', err.message || t('सदस्य हटवण्यात अयशस्वी', 'Failed to delete member'));
    }
  };

  const toggleActive = async (member: CommitteeMember) => {
    try {
      const { error } = await supabase
        .from('committee_members')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);
      if (error) throw error;
      fetchMembers();
    } catch (err: any) {
      addToast('error', t('स्थिती बदलण्यात अयशस्वी', 'Failed to toggle status'));
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesRole = filterRole === 'all' || m.role_type === filterRole;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      m.name_mr.toLowerCase().includes(query) ||
      m.name_en.toLowerCase().includes(query) ||
      m.designation_en.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const roleCounts = {
    all: members.length,
    leadership: members.filter((m) => m.role_type === 'leadership').length,
    board: members.filter((m) => m.role_type === 'board').length,
    officer: members.filter((m) => m.role_type === 'officer').length,
    employee: members.filter((m) => m.role_type === 'employee').length,
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('संचालक मंडळ सदस्य', 'Board Members')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('सार्वजनिक वेबसाईटवर दाखवले जाणारे समिती सदस्य, अधिकारी आणि कर्मचारी व्यवस्थापित करा', 'Manage committee members, officers, and staff shown on the public website')}</p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer shrink-0"
        >
          <Lucide.UserPlus className="h-4 w-4 mr-2" />
          {t('नवीन सदस्य जोडा', 'Add New Member')}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={t('नाव किंवा पदावरून शोधा...', 'Search by name or designation...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 border-gray-200 focus-visible:ring-green-600"
          />
        </div>
        {/* Role Filter Chips */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {([
            ['all', t('सर्व', 'All')],
            ['leadership', t('नेतृत्व', 'Leadership')],
            ['board', t('मंडळ', 'Board')],
            ['officer', t('अधिकारी', 'Officers')],
            ['employee', t('कर्मचारी', 'Staff')],
          ] as [RoleType | 'all', string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterRole(key)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer',
                filterRole === key
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {label} ({roleCounts[key]})
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="border-b bg-gray-50/30">
          <CardTitle className="text-base font-bold">
            {t(`सदस्य (${filteredMembers.length})`, `Members (${filteredMembers.length})`)}
          </CardTitle>
          <CardDescription>{t('कोणत्याही सदस्याचे तपशील बदलण्यासाठी संपादित करा क्लिक करा', 'Click Edit to modify any member\'s details')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Lucide.Loader2 className="h-8 w-8 text-green-700 animate-spin" />
              <p className="text-sm text-gray-500">{t('सदस्य लोड होत आहेत...', 'Loading members...')}</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Lucide.Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">{t('कोणतेही सदस्य सापडले नाहीत', 'No members found')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4 text-left w-10">#</th>
                    <th className="py-3 px-4 text-left">{t('फोटो', 'Photo')}</th>
                    <th className="py-3 px-4 text-left">{t('नाव', 'Name')}</th>
                    <th className="py-3 px-4 text-left">{t('भूमिका / पद', 'Role / Designation')}</th>
                    <th className="py-3 px-4 text-left">{t('कार्यकाळ', 'Tenure')}</th>
                    <th className="py-3 px-4 text-left">{t('संपर्क', 'Contact')}</th>
                    <th className="py-3 px-4 text-center">{t('स्थिती', 'Status')}</th>
                    <th className="py-3 px-4 text-right">{t('कृती', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMembers.map((member) => {
                    const role = ROLE_OPTIONS.find((r) => r.value === member.role_type);
                    return (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 text-gray-400 text-xs font-medium">{member.sort_order}</td>
                        <td className="py-3 px-4">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                            {member.image_url ? (
                              <Image src={member.image_url} alt={member.name_en} width={40} height={40} className="object-cover w-full h-full" />
                            ) : (
                              <Lucide.User className="h-5 w-5 text-green-700" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-gray-900 leading-snug">{member.name_mr}</p>
                          <p className="text-xs text-gray-400">{member.name_en}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={cn('text-xs border font-semibold', role?.color)}>{role?.labelEn}</Badge>
                          <p className="text-xs text-gray-600 mt-1">{member.designation_en}</p>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {member.term_start && member.term_end
                            ? `${member.term_start} – ${member.term_end}`
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          {member.phone && (
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <Lucide.Phone className="h-3 w-3" />{member.phone}
                            </p>
                          )}
                          {member.email && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Lucide.Mail className="h-3 w-3" />{member.email}
                            </p>
                          )}
                          {!member.phone && !member.email && <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => toggleActive(member)}
                            className={cn(
                              'text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors',
                              member.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            )}
                          >
                            {member.is_active ? t('सक्रिय', 'Active') : t('अक्रिय', 'Inactive')}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(member)}
                              className="h-8 px-3 text-xs cursor-pointer border-gray-200 hover:border-green-600 hover:text-green-700"
                            >
                              <Lucide.Pencil className="h-3 w-3 mr-1" />{t('संपादित करा', 'Edit')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmId(member.id)}
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

      {/* ── Add / Edit Modal ──────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingMember ? t('सदस्य संपादित करा', 'Edit Member') : t('नवीन सदस्य जोडा', 'Add New Member')}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editingMember ? t('या समिती सदस्याचे तपशील अद्ययावत करा.', 'Update the details for this committee member.') : t('नवीन समिती सदस्य जोडण्यासाठी तपशील भरा.', 'Fill in the details to add a new committee member.')}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
              >
                <Lucide.X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Photo Upload Section */}
              <div className="space-y-3">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('प्रोफाइल फोटो', 'Profile Photo')}</Label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="h-20 w-20 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <Image src={imagePreview} alt="Preview" width={80} height={80} className="object-cover w-full h-full rounded-xl" />
                    ) : (
                      <Lucide.UserCircle className="h-10 w-10 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
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
                      className="cursor-pointer border-green-600 text-green-700 hover:bg-green-50"
                    >
                      {uploading ? (
                        <><Lucide.Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('अपलोड होत आहे...', 'Uploading...')}</>
                      ) : (
                        <><Lucide.Upload className="h-4 w-4 mr-2" />{t('फोटो अपलोड करा', 'Upload Photo')}</>
                      )}
                    </Button>
                    {uploading && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                    <p className="text-xs text-gray-400">{t('JPG/PNG, कमाल ५ MB. किंवा खाली URL पेस्ट करा.', 'JPG/PNG, max 5 MB. Or paste a URL below.')}</p>
                    <Input
                      type="url"
                      value={form.image_url || ''}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, image_url: e.target.value }));
                        setImagePreview(e.target.value || null);
                      }}
                      placeholder={t('किंवा चित्र URL पेस्ट करा...', 'Or paste image URL...')}
                      className="border-gray-200 focus-visible:ring-green-600 text-xs"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Role Type */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('भूमिका प्रकार', 'Role Type')} <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ROLE_OPTIONS.map((role) => (
                    <button
                      type="button"
                      key={role.value}
                      onClick={() => setForm((prev) => ({ ...prev, role_type: role.value }))}
                      className={cn(
                        'p-2.5 rounded-xl border text-xs font-semibold text-center cursor-pointer transition-all',
                        form.role_type === role.value
                          ? 'bg-green-700 text-white border-green-700 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <span className="block">{role.labelEn}</span>
                      <span className="block text-[10px] opacity-70 mt-0.5">{role.labelMr}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name_mr" className="text-xs font-bold text-gray-700">
                    {t('नाव (मराठी)', 'Name (Marathi)')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name_mr"
                    required
                    value={form.name_mr}
                    onChange={(e) => setForm((prev) => ({ ...prev, name_mr: e.target.value }))}
                    placeholder="मा. श्री. नाव..."
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name_en" className="text-xs font-bold text-gray-700">
                    {t('नाव (इंग्रजी)', 'Name (English)')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name_en"
                    required
                    value={form.name_en}
                    onChange={(e) => setForm((prev) => ({ ...prev, name_en: e.target.value }))}
                    placeholder={t('मा. श्री. नाव...', 'Hon. Shri. Name...')}
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
              </div>

              {/* Designations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="desig_mr" className="text-xs font-bold text-gray-700">
                    {t('पद (मराठी)', 'Designation (Marathi)')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="desig_mr"
                    required
                    value={form.designation_mr}
                    onChange={(e) => setForm((prev) => ({ ...prev, designation_mr: e.target.value }))}
                    placeholder="सभापती / संचालक..."
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="desig_en" className="text-xs font-bold text-gray-700">
                    {t('पद (इंग्रजी)', 'Designation (English)')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="desig_en"
                    required
                    value={form.designation_en}
                    onChange={(e) => setForm((prev) => ({ ...prev, designation_en: e.target.value }))}
                    placeholder={t('अध्यक्ष / संचालक...', 'Chairman / Director...')}
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
              </div>

              {/* Tenure */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="term_start" className="text-xs font-bold text-gray-700">{t('कार्यकाळ सुरुवात (वर्ष)', 'Term Start (Year)')}</Label>
                  <Input
                    id="term_start"
                    value={form.term_start || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, term_start: e.target.value }))}
                    placeholder="2023"
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="term_end" className="text-xs font-bold text-gray-700">{t('कार्यकाळ समाप्ती (वर्ष / "सध्या")', 'Term End (Year / "Present")')}</Label>
                  <Input
                    id="term_end"
                    value={form.term_end || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, term_end: e.target.value }))}
                    placeholder={t('सध्या', 'Present')}
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-bold text-gray-700">{t('संपर्क फोन', 'Contact Phone')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 98220 12345"
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-gray-700">{t('Gmail / ईमेल', 'Gmail / Email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="member@apmcmalkapur.org"
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
              </div>

              {/* Village / Constituency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="village_mr" className="text-xs font-bold text-gray-700">{t('गाव / मतदारसंघ (मराठी)', 'Village / Constituency (Marathi)')}</Label>
                  <Input
                    id="village_mr"
                    value={form.village_mr || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, village_mr: e.target.value }))}
                    placeholder="मलकापूर (सहकारी गट)"
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="village_en" className="text-xs font-bold text-gray-700">{t('गाव / मतदारसंघ (इंग्रजी)', 'Village / Constituency (English)')}</Label>
                  <Input
                    id="village_en"
                    value={form.village_en || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, village_en: e.target.value }))}
                    placeholder="Malkapur (Cooperative Group)"
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
              </div>

              {/* Department (for staff) */}
              {(form.role_type === 'officer' || form.role_type === 'employee') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dept_mr" className="text-xs font-bold text-gray-700">{t('विभाग (मराठी)', 'Department (Marathi)')}</Label>
                    <Input
                      id="dept_mr"
                      value={form.department_mr || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, department_mr: e.target.value }))}
                      placeholder="प्रशासन विभाग"
                      className="border-gray-200 focus-visible:ring-green-600"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dept_en" className="text-xs font-bold text-gray-700">{t('विभाग (इंग्रजी)', 'Department (English)')}</Label>
                    <Input
                      id="dept_en"
                      value={form.department_en || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, department_en: e.target.value }))}
                      placeholder={t('प्रशासन विभाग', 'Administration Dept')}
                      className="border-gray-200 focus-visible:ring-green-600"
                    />
                  </div>
                </div>
              )}

              {/* Sort Order + Active */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="space-y-1.5 w-28">
                  <Label htmlFor="sort_order" className="text-xs font-bold text-gray-700">{t('क्रम', 'Sort Order')}</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) }))}
                    className="border-gray-200 focus-visible:ring-green-600"
                  />
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4 accent-green-700 rounded cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-gray-700">{t('सक्रिय (वेबसाईटवर दृश्यमान)', 'Active (visible on website)')}</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeModal} className="cursor-pointer">
                  {t('रद्द करा', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={saving || uploading}
                  className="bg-green-700 hover:bg-green-800 text-white font-bold cursor-pointer"
                >
                  {saving ? (
                    <><Lucide.Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('जतन होत आहे...', 'Saving...')}</>
                  ) : (
                    <><Lucide.Save className="h-4 w-4 mr-2" />{editingMember ? t('सदस्य अद्ययावत करा', 'Update Member') : t('सदस्य जोडा', 'Add Member')}</>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <Lucide.Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{t('सदस्य हटवा', 'Delete Member')}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{t('ही क्रिया पूर्ववत केली जाऊ शकत नाही. सदस्य कायमचा काढला जाईल.', 'This action cannot be undone. The member will be permanently removed.')}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="cursor-pointer">{t('रद्द करा', 'Cancel')}</Button>
              <Button
                onClick={() => handleDelete(deleteConfirmId)}
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                <Lucide.Trash2 className="h-4 w-4 mr-2" />{t('हटवा', 'Delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
