'use client';

import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { CommitteeMember } from '@/types';
import { mockCommitteeMembers } from '@/lib/mock-data/sanchalak-mandal';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Phone, 
  Building, 
  ShieldCheck,
  Users
} from 'lucide-react';
import { 
  PageHero, 
  SectionHeading, 
  ProfileCard, 
  DataTable, 
  LoadingSpinner,
  DataTableColumn
} from '@/components/shared';

export default function SanchalakMandalPage() {
  const { t, language } = useLanguage();
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetchMembers() {
      try {
        const { data, error } = await supabase
          .from('committee_members')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (data && data.length > 0) {
          setMembers(data);
        } else {
          setMembers(mockCommitteeMembers);
        }
      } catch (error) {
        console.warn('Failed to fetch from Supabase, using mock data:', error);
        setMembers(mockCommitteeMembers);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, [supabase]);

  // Filters for sections
  const leadershipMembers = members.filter(m => m.role_type === 'leadership');
  const boardMembers = members.filter(m => m.role_type === 'board');
  const staffMembers = members.filter(m => m.role_type === 'employee' || m.role_type === 'officer');

  // Filter staff based on search query
  const filteredStaff = staffMembers.filter(staff => {
    const query = searchQuery.toLowerCase();
    const name = (language === 'mr' ? staff.name_mr : staff.name_en).toLowerCase();
    const designation = (language === 'mr' ? staff.designation_mr : staff.designation_en).toLowerCase();
    const department = (language === 'mr' ? (staff.department_mr || '') : (staff.department_en || '')).toLowerCase();
    
    return name.includes(query) || designation.includes(query) || department.includes(query);
  });

  const columns: DataTableColumn<CommitteeMember>[] = [
    {
      key: 'name',
      headerMr: 'नाव',
      headerEn: 'Name',
      className: 'font-semibold text-gray-900 py-4.5',
      render: (row) => language === 'mr' ? row.name_mr : row.name_en
    },
    {
      key: 'department',
      headerMr: 'विभाग',
      headerEn: 'Department',
      className: 'text-gray-600 text-sm',
      render: (row) => row.department_mr ? (
        <span className="inline-flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          {language === 'mr' ? row.department_mr : row.department_en}
        </span>
      ) : <span className="text-gray-300">-</span>
    },
    {
      key: 'designation',
      headerMr: 'पद',
      headerEn: 'Designation',
      className: 'text-gray-600',
      render: (row) => (
        <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50/30 text-xs px-2.5 py-0.5 rounded font-medium">
          {language === 'mr' ? row.designation_mr : row.designation_en}
        </Badge>
      )
    },
    {
      key: 'phone',
      headerMr: 'संपर्क',
      headerEn: 'Contact',
      alignRight: true,
      className: 'py-4.5',
      render: (row) => row.phone ? (
        <a 
          href={`tel:${row.phone}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100/80 px-3 py-1 rounded-lg transition-colors ml-auto justify-end"
        >
          <Phone className="h-3 w-3 shrink-0" />
          <span>{row.phone}</span>
        </a>
      ) : (
        <span className="text-gray-300 text-sm">-</span>
      )
    }
  ];

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <PageHero
        titleMr="संचालक मंडळ व अधिकारी"
        titleEn="Board of Directors & Officers"
        subtitleMr="कृषी उत्पन्न बाजार समिती, मलकापूरच्या कारभाराचे नेतृत्व करणारे प्रमुख पदाधिकारी, संचालक आणि कर्मचाऱ्यांची अधिकृत यादी."
        subtitleEn="Official directory of the key leaders, directors, and administrative staff heading the Agricultural Produce Market Committee, Malkapur."
        breadcrumbs={[
          { labelMr: 'संचालक मंडळ', labelEn: 'Sanchalak Mandal' }
        ]}
      />

      <div className="container mx-auto px-4 py-12 max-w-7xl space-y-16">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Key Leadership Section */}
            <section className="space-y-8">
              <SectionHeading
                titleMr="प्रमुख पदाधिकारी"
                titleEn="Key Leadership"
                subtitleMr="बाजार समितीचे व्यवस्थापन आणि कारभार सांभाळणारे मुख्य अधिकारी"
                subtitleEn="Executive members directing and managing the market committee"
                icon={ShieldCheck}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {leadershipMembers.map((member) => (
                  <ProfileCard 
                    key={member.id} 
                    member={member}
                    variant="leadership"
                  />
                ))}
              </div>
            </section>

            {/* Board Members Grid */}
            <section className="space-y-8">
              <SectionHeading
                titleMr="संचालक मंडळ सदस्य"
                titleEn="Board Members"
                subtitleMr="विविध मतदारसंघातून आणि गावांमधून निवडून आलेले संचालक सदस्य"
                subtitleEn="Elected directors representing various cooperative constituencies and regions"
                icon={Users}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {boardMembers.map((member) => (
                  <ProfileCard
                    key={member.id}
                    member={member}
                    variant="board"
                  />
                ))}
              </div>
            </section>

            {/* Employees & Officers Section */}
            <section className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-green-600 pl-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
                    <Building className="h-7 w-7 text-green-700" />
                    {t('अधिकारी व कर्मचारी', 'Officers & Staff')}
                  </h2>
                  <p className="text-gray-500 mt-1 text-sm md:text-base">
                    {t('बाजार समितीचे कामकाज सुरळीत चालवणारी कार्यालयीन व प्रशासकीय टीम', 'Administrative and executive staff managing daily market operations')}
                  </p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t('कर्मचारी व अधिकारी शोधा...', 'Search officers and staff...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border-gray-200 focus-visible:ring-green-600 rounded-lg shadow-sm bg-white"
                  />
                </div>
              </div>

              {/* Data Table */}
              <DataTable
                columns={columns}
                rows={filteredStaff}
                getRowKey={(row) => row.id}
                emptyMr="सध्या कोणतीही माहिती उपलब्ध नाही किंवा शोध निकष जुळले नाहीत."
                emptyEn="No information available or search criteria did not match."
              />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
