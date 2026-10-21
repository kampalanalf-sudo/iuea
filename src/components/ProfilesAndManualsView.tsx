import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  Lock,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  PROFILE_CATEGORY_META,
  PROFILE_NAVIGATION_MANUALS,
} from '../data/userProfiles';
import {
  ProfileCategory,
  UserProfileAccount,
} from '../types/distribution';
import {
  downloadAllProfileManualsCombinedPdf,
  downloadProfileManualPdf,
} from '../utils/pdfManualGenerator';

interface ProfilesAndManualsViewProps {
  profiles: UserProfileAccount[];
  activeProfile: UserProfileAccount;
  onSelectProfile: (profile: UserProfileAccount) => void;
  onCreateProfile: (newProfile: UserProfileAccount) => void;
}

export const ProfilesAndManualsView: React.FC<ProfilesAndManualsViewProps> = ({
  profiles,
  activeProfile,
  onSelectProfile,
  onCreateProfile,
}) => {
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    'all' | ProfileCategory
  >('all');
  const [activeManualCategory, setActiveManualCategory] =
    useState<ProfileCategory>(activeProfile.category);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create New Profile Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCategory, setNewCategory] = useState<ProfileCategory>('artiste');
  const [newOrg, setNewOrg] = useState('');
  const [newLocation, setNewLocation] = useState('Kampala, Uganda');
  const [newArtistsInput, setNewArtistsInput] = useState('');
  const [newBio, setNewBio] = useState('');

  const filteredProfiles =
    selectedCategoryFilter === 'all'
      ? profiles
      : profiles.filter((p) => p.category === selectedCategoryFilter);

  const activeManual =
    PROFILE_NAVIGATION_MANUALS.find(
      (m) => m.category === activeManualCategory
    ) || PROFILE_NAVIGATION_MANUALS[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const meta = PROFILE_CATEGORY_META[newCategory];
    const initials = newName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const isTankAdmin = newCategory === 'tank_admin';
    const associated = newArtistsInput.trim()
      ? newArtistsInput
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : isTankAdmin
      ? ['ALL CATALOG ARTISTS']
      : [newName.trim().toUpperCase()];

    const defaultPermissions: Record<ProfileCategory, string[]> = {
      tank_admin: [
        'View & Configure Supabase / PostgreSQL / GitHub Cloud Studio',
        'Inspect & Export Raw DDEX ERN 4.3 XML Manifests',
        'Approve, Review, or Remove Any Release in Catalog',
        'Create & Manage All User Profiles & Role Categories',
      ],
      artiste: [
        'Upload New Singles, EPs & Albums via 4-Step Release Builder',
        'Generate or Upload 3000×3000px Cover Artwork',
        'Assign Collaborator Royalty Splits on Own Releases',
        'Track Personal Streaming Velocity & Withdraw Artist Royalties',
      ],
      music_manager: [
        'Multi-Artist Roster View (Filter & Inspect All Managed Artistes)',
        'Schedule & Coordinate New Release Submissions on Behalf of Roster',
        'Audit Collaborator & Management Commission Splits',
        'Export Official CSV Financial Statements for Artist Accounting',
      ],
      label_exec: [
        'Full Label Catalog & Master Registry Oversight',
        'Manage Release Pipeline Statuses (Draft, In Review, Delivered)',
        'Audit Master Phonographic (℗) & Artwork (©) Copyrights',
        'Oversee Label Royalty Pool & Multi-Territory Statements',
      ],
      producer_collab: [
        'View All Releases & Tracks With Active Producer/Engineer Credits',
        'Audition Master Audio & Verify LUFS / True Peak Loudness',
        'Verify Royalty Split Allocation Percentages',
        'Withdraw Producer Royalty Share Directly to Wise or Bank Wire',
      ],
    };

    const created: UserProfileAccount = {
      id: `usr-${Date.now()}`,
      name: newName.trim(),
      displayRole: meta.label,
      category: newCategory,
      email: newEmail.trim(),
      avatarBadge: initials || 'TK',
      accentColor: meta.color,
      organization: newOrg.trim() || 'Independent Roster',
      location: newLocation.trim() || 'Global',
      associatedArtists: associated,
      commissionOrShareNote: isTankAdmin
        ? 'Platform Administrator • Full System & Cloud Privileges'
        : `${meta.shortBadge} Account • Verified Portal Access`,
      bio:
        newBio.trim() ||
        meta.description,
      permissions: defaultPermissions[newCategory],
      canSeeTechDetails: isTankAdmin,
    };

    onCreateProfile(created);
    setActiveManualCategory(created.category);
    setShowCreateModal(false);
    setNewName('');
    setNewEmail('');
    setNewOrg('');
    setNewArtistsInput('');
    setNewBio('');
  };

  return (
    <div className="space-y-8">
      {/* Top Active Role & Security Isolation Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-[#12151E] via-[#161B28] to-[#12151E] border border-[#262D40] flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-mono-tech font-bold text-[#0A0B0E]"
              style={{ backgroundColor: activeProfile.accentColor }}
            >
              ACTIVE SESSION: {PROFILE_CATEGORY_META[activeProfile.category].shortBadge}
            </span>

            {activeProfile.canSeeTechDetails ? (
              <span className="px-3 py-1 rounded-full text-[11px] font-mono-tech font-semibold bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/40 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                TECH & CLOUD DETAILS VISIBLE (TANK ADMIN EXCLUSIVE)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-[11px] font-mono-tech font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40 flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5" />
                TECH DETAILS HIDDEN (CLEAN MUSIC INDUSTRY PORTAL)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F3F4F6]">
            USER PROFILES, ROLE CATEGORIES & PDF MANUALS
          </h1>
          <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-3xl">
            Switch between **Tank Admin**, **Artistes**, **Music Managers**,
            **Record Label Executives**, and **Producers** to experience strict
            role-based access control — or download the official step-by-step
            **PDF Navigation Manual** for each profile category.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => downloadAllProfileManualsCombinedPdf()}
            className="px-4 py-2.5 rounded-lg bg-[#1C202B] hover:bg-[#262C3C] border border-[#2E3548] text-xs font-mono-tech font-bold text-[#D4FF00] flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download All 5 Manuals (.PDF)
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-extrabold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(212,255,0,0.25)] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            CREATE NEW PROFILE
          </button>
        </div>
      </div>

      {/* Role Category Overview Strip (5 Categories) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {(Object.keys(PROFILE_CATEGORY_META) as ProfileCategory[]).map((cat) => {
          const meta = PROFILE_CATEGORY_META[cat];
          const count = profiles.filter((p) => p.category === cat).length;
          const isSelected = selectedCategoryFilter === cat;
          return (
            <div
              key={cat}
              onClick={() =>
                setSelectedCategoryFilter(isSelected ? 'all' : cat)
              }
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#1A1F2E] border-[#D4FF00]'
                  : 'bg-[#141720] border-[#232836] hover:border-[#343C52]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold text-[#0A0B0E]"
                    style={{ backgroundColor: meta.color }}
                  >
                    {meta.shortBadge}
                  </span>
                  <span className="text-xs font-mono-tech text-[#9CA3AF]">
                    {count} {count === 1 ? 'Profile' : 'Profiles'}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#F3F4F6] mt-2.5">
                  {meta.label}
                </div>
                <p className="text-[11px] text-[#9CA3AF] mt-1 line-clamp-3">
                  {meta.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#1F2433] flex items-center justify-between">
                <span className="text-[10px] font-mono-tech text-[#6B7280] flex items-center gap-1">
                  {cat === 'tank_admin' ? (
                    <>
                      <Shield className="w-3 h-3 text-[#D4FF00]" />
                      Tech Access: YES
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-[#10B981]" />
                      Tech Hidden
                    </>
                  )}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadProfileManualPdf(cat);
                  }}
                  className="text-[10px] font-mono-tech text-[#D4FF00] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" />
                  PDF Guide
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Profiles Directory Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#D4FF00]" />
            <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
              Registered Platform Profiles ({filteredProfiles.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-[#0A0B0E] p-1 rounded-lg border border-[#232836]">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-2.5 py-1 rounded text-xs font-mono-tech cursor-pointer ${
                selectedCategoryFilter === 'all'
                  ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              All ({profiles.length})
            </button>
            {(Object.keys(PROFILE_CATEGORY_META) as ProfileCategory[]).map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-mono-tech cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {PROFILE_CATEGORY_META[cat].shortBadge}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProfiles.map((prof) => {
            const isCurrent = prof.id === activeProfile.id;
            const catMeta = PROFILE_CATEGORY_META[prof.category];
            return (
              <div
                key={prof.id}
                className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'bg-[#181E2C] border-[#D4FF00] shadow-[0_0_24px_rgba(212,255,0,0.12)]'
                    : 'bg-[#141720] border-[#232836] hover:border-[#343C52]'
                }`}
              >
                <div className="space-y-4">
                  {/* Profile Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-extrabold text-base text-[#0A0B0E] shrink-0"
                        style={{ backgroundColor: prof.accentColor }}
                      >
                        {prof.avatarBadge}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-[#F3F4F6]">
                            {prof.name}
                          </h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#D4FF00] text-[#0A0B0E]">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#9CA3AF]">
                          {prof.displayRole}
                        </div>
                        <div className="text-[11px] font-mono-tech text-[#6B7280] mt-0.5">
                          {prof.email} • {prof.location}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role Category & Tech Visibility Pill */}
                  <div className="p-3 rounded-lg bg-[#0E1117] border border-[#1E2330] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono-tech">
                      <span className="text-[#9CA3AF]">CATEGORY:</span>
                      <span
                        className="font-bold"
                        style={{ color: prof.accentColor }}
                      >
                        {catMeta.shortBadge}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono-tech">
                      <span className="text-[#9CA3AF]">ROSTER / SCOPE:</span>
                      <span className="text-[#F3F4F6] truncate max-w-[180px]">
                        {prof.associatedArtists.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono-tech">
                      <span className="text-[#9CA3AF]">TECH DETAILS:</span>
                      {prof.canSeeTechDetails ? (
                        <span className="text-[#D4FF00] font-bold">
                          VISIBLE (Supabase & GitHub)
                        </span>
                      ) : (
                        <span className="text-[#10B981]">
                          HIDDEN (Clean Creator View)
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    {prof.bio}
                  </p>

                  {/* Permissions List */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono-tech uppercase text-[#6B7280]">
                      PROFILE PERMISSIONS
                    </div>
                    {prof.permissions.map((perm) => (
                      <div
                        key={perm}
                        className="flex items-start gap-2 text-xs text-[#D1D5DB]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                        <span>{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-5 border-t border-[#232836] flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      onSelectProfile(prof);
                      setActiveManualCategory(prof.category);
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                        : 'bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E]'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    {isCurrent ? 'Currently Active' : 'Switch to Profile'}
                  </button>

                  <button
                    onClick={() => downloadProfileManualPdf(prof.category)}
                    className="py-2.5 px-3 rounded-lg bg-[#1C202B] hover:bg-[#262C3C] border border-[#2E3548] text-xs font-mono-tech text-[#F3F4F6] flex items-center gap-1.5 cursor-pointer"
                    title={`Download ${catMeta.shortBadge} PDF Navigation Manual`}
                  >
                    <Download className="w-3.5 h-3.5 text-[#D4FF00]" />
                    PDF Manual
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive PDF Manuals Reader & Download Center */}
      <div className="rounded-xl bg-[#141720] border border-[#232836] overflow-hidden">
        <div className="p-6 bg-[#161A24] border-b border-[#232836] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono-tech text-[#D4FF00] uppercase mb-1">
              <BookOpen className="w-4 h-4" />
              OFFICIAL ROLE-BASED DOCUMENTATION & PDF HANDBOOKS
            </div>
            <h2 className="text-xl font-extrabold text-[#F3F4F6]">
              SITE NAVIGATION MANUALS BY PROFILE CATEGORY
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Select any profile category below to read its interactive navigation
              manual or download the formatted `.PDF` file
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`./manuals/${activeManual.pdfFileName}`}
              download={activeManual.pdfFileName}
              onClick={(e) => {
                e.preventDefault();
                downloadProfileManualPdf(activeManual.category);
              }}
              className="px-4 py-2.5 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-extrabold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download {activeManual.pdfFileName}
            </a>
          </div>
        </div>

        {/* Manual Category Selector Tabs */}
        <div className="px-6 bg-[#10131B] border-b border-[#232836] flex items-center gap-2 overflow-x-auto">
          {PROFILE_NAVIGATION_MANUALS.map((m) => {
            const isSelected = m.category === activeManualCategory;
            const meta = PROFILE_CATEGORY_META[m.category];
            return (
              <button
                key={m.category}
                onClick={() => setActiveManualCategory(m.category)}
                className={`px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#D4FF00] text-[#D4FF00]'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                {meta.shortBadge} MANUAL
              </button>
            );
          })}
        </div>

        {/* Manual Content Body */}
        <div className="p-6 space-y-6">
          {/* Manual Header Summary Box */}
          <div className="p-5 rounded-xl bg-[#0E1117] border border-[#232836] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="text-xs font-mono-tech text-[#D4FF00]">
                FILE: /manuals/{activeManual.pdfFileName}
              </div>
              <h3 className="text-lg font-extrabold text-[#F3F4F6]">
                {activeManual.roleTitle}
              </h3>
              <p className="text-xs text-[#9CA3AF]">{activeManual.subtitle}</p>
              <div className="pt-2 text-xs text-[#10B981] font-mono-tech">
                Access Scope: {activeManual.accessScopeSummary}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
              <button
                onClick={() => downloadProfileManualPdf(activeManual.category)}
                className="px-4 py-2 rounded-lg bg-[#1C202B] hover:bg-[#262C3C] border border-[#2E3548] text-xs font-mono-tech text-[#D4FF00] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Save Individual PDF
              </button>
              <button
                onClick={() => downloadAllProfileManualsCombinedPdf()}
                className="px-4 py-2 rounded-lg bg-[#1C202B] hover:bg-[#262C3C] border border-[#2E3548] text-xs font-mono-tech text-[#F3F4F6] flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#10B981]" />
                Save Combined Master PDF
              </button>
            </div>
          </div>

          {/* Step-by-Step Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {activeManual.sections.map((sec) => (
              <div
                key={sec.stepNumber}
                className="p-5 rounded-xl bg-[#181B24] border border-[#232836] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#D4FF00] text-[#0A0B0E]">
                      {sec.stepNumber}
                    </span>
                    <span className="text-[11px] font-mono-tech text-[#10B981]">
                      {sec.navigationPath}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#F3F4F6]">
                    {sec.title}
                  </h4>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    {sec.summary}
                  </p>

                  <div className="space-y-2 pt-1">
                    {sec.actionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-[#E5E7EB]"
                      >
                        <span className="w-5 h-5 rounded bg-[#0E1117] border border-[#2A3042] text-[#D4FF00] font-mono-tech text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0E1117] border border-[#232836] flex items-start gap-2 text-xs text-[#9CA3AF]">
                  <Sparkles className="w-4 h-4 text-[#D4FF00] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#F3F4F6]">Pro Tip:</strong>{' '}
                    {sec.proTip}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="p-5 rounded-xl bg-[#0E1117] border border-[#232836] space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono-tech uppercase text-[#D4FF00]">
              <HelpCircle className="w-4 h-4" />
              FREQUENTLY ASKED QUESTIONS ({PROFILE_CATEGORY_META[activeManual.category].shortBadge})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeManual.faq.map((f, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg bg-[#141720] border border-[#1E2330] space-y-1"
                >
                  <div className="text-xs font-bold text-[#F3F4F6]">
                    Q: {f.q}
                  </div>
                  <div className="text-xs text-[#9CA3AF] leading-relaxed">
                    A: {f.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create New User Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141A] border border-[#2A3042] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 bg-[#161922] border-b border-[#232836] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono-tech uppercase text-[#D4FF00]">
                  ROLE-BASED ACCOUNT PROVISIONING
                </span>
                <h3 className="text-lg font-bold text-[#F3F4F6]">
                  Create New User Profile
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg bg-[#1C202B] text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  Profile Role Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as ProfileCategory)
                  }
                  className="w-full h-11 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs font-semibold text-[#D4FF00] outline-none"
                >
                  <option value="artiste">
                    Artiste / Recording Artist (Tech Details Hidden)
                  </option>
                  <option value="music_manager">
                    Music Manager — Multi-Artist Roster (Tech Details Hidden)
                  </option>
                  <option value="label_exec">
                    Record Label & A&R Executive (Tech Details Hidden)
                  </option>
                  <option value="producer_collab">
                    Producer / Songwriter / Collaborator (Tech Details Hidden)
                  </option>
                  <option value="tank_admin">
                    Tank Admin — System & Operations (Full Tech/Supabase Access)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                    Full Name / Stage Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                    Organization / Imprint
                  </label>
                  <input
                    type="text"
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                    City / Territory
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  Associated / Managed Artistes (comma separated)
                </label>
                <input
                  type="text"
                  value={newArtistsInput}
                  onChange={(e) => setNewArtistsInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                  Profile Bio / Role Notes
                </label>
                <textarea
                  rows={2}
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#0E1117] border border-[#232836] flex items-center gap-2 text-[11px] font-mono-tech">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0" />
                <span className="text-[#9CA3AF]">
                  {newCategory === 'tank_admin'
                    ? 'This profile WILL have full visibility into Supabase, GitHub, SQL & DDEX XML.'
                    : 'All technical details (Supabase, GitHub, SQL, DDEX XML) will be strictly HIDDEN for this profile.'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#1C202B] text-xs font-semibold text-[#9CA3AF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#D4FF00] text-[#0A0B0E] font-extrabold text-xs cursor-pointer"
                >
                  Create & Activate Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
