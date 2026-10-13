import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Disc3,
  Download,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import { PROFILE_CATEGORY_META } from '../data/userProfiles';
import {
  ProfileCategory,
  UserProfileAccount,
} from '../types/distribution';
import {
  downloadAllProfileManualsCombinedPdf,
  downloadProfileManualPdf,
} from '../utils/pdfManualGenerator';

interface LoginGatewayViewProps {
  profiles: UserProfileAccount[];
  onAuthenticated: (profile: UserProfileAccount) => void;
  onRegisterProfile: (newProfile: UserProfileAccount) => void;
}

export const LoginGatewayView: React.FC<LoginGatewayViewProps> = ({
  profiles,
  onAuthenticated,
  onRegisterProfile,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<
    'all' | ProfileCategory
  >('all');

  // Sign-in form state
  const [email, setEmail] = useState('artist@kampalanights.ug');
  const [password, setPassword] = useState('Artiste#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Registration form state
  const [regCategory, setRegCategory] = useState<ProfileCategory>('artiste');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regLocation, setRegLocation] = useState('Kampala, Uganda');
  const [regArtists, setRegArtists] = useState('');

  const visibleAccounts =
    selectedRoleFilter === 'all'
      ? profiles
      : profiles.filter((p) => p.category === selectedRoleFilter);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    const matched = profiles.find(
      (p) => p.email.toLowerCase() === normalizedEmail
    );

    if (!matched) {
      setErrorMsg(
        'No account found with that email address. Click any role account card on the left to fill valid credentials, or switch to "Register New Account".'
      );
      return;
    }

    const expectedPassword = matched.password || 'Tank#2026';
    if (password !== expectedPassword) {
      setErrorMsg(
        `Invalid password for ${matched.email}. (Hint: Use "${expectedPassword}" or click "Fill Credentials" on the account card.)`
      );
      return;
    }

    onAuthenticated({
      ...matched,
      lastLoginAt: new Date().toISOString(),
    });
  };

  const handleFillAccount = (acc: UserProfileAccount) => {
    setAuthMode('signin');
    setErrorMsg(null);
    setEmail(acc.email);
    setPassword(acc.password || 'Tank#2026');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    const exists = profiles.some(
      (p) => p.email.toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (exists) {
      setErrorMsg(
        'An account with this email already exists. Please sign in instead.'
      );
      return;
    }

    const meta = PROFILE_CATEGORY_META[regCategory];
    const initials = regName
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const isTankAdmin = regCategory === 'tank_admin';
    const associated = regArtists.trim()
      ? regArtists
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : isTankAdmin
      ? ['ALL CATALOG ARTISTS']
      : [regName.trim().toUpperCase()];

    const defaultPermissions: Record<ProfileCategory, string[]> = {
      tank_admin: [
        'View & Configure Cloud Infrastructure & Repository Studio',
        'Inspect & Export Raw Distribution XML Manifests',
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

    const newAccount: UserProfileAccount = {
      id: `usr-${Date.now()}`,
      name: regName.trim(),
      displayRole: meta.label,
      category: regCategory,
      email: regEmail.trim(),
      password: regPassword,
      avatarBadge: initials || 'TK',
      accentColor: meta.color,
      organization: regOrg.trim() || 'Independent Roster',
      location: regLocation.trim() || 'Global',
      associatedArtists: associated,
      commissionOrShareNote: isTankAdmin
        ? 'Platform Administrator • Full System Privileges'
        : `${meta.shortBadge} Account • 100% Net Royalty Portal`,
      bio: meta.description,
      permissions: defaultPermissions[regCategory],
      canSeeTechDetails: isTankAdmin,
      lastLoginAt: new Date().toISOString(),
    };

    onRegisterProfile(newAccount);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F3F4F6] flex flex-col justify-between studio-grid-bg relative overflow-hidden">
      {/* Subtle Ambient Studio Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#D4FF00]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#10B981]/5 blur-3xl pointer-events-none" />

      {/* Top Brand Header Bar */}
      <header className="relative z-10 h-16 px-6 lg:px-12 border-b border-[#232836] bg-[#0A0B0E]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#D4FF00] text-[#0A0B0E] flex items-center justify-center font-display font-black text-lg tracking-tighter shadow-[0_0_20px_rgba(212,255,0,0.3)]">
            T
          </div>
          <div>
            <div className="font-display font-extrabold text-sm tracking-tight text-[#F3F4F6] leading-none">
              TANK DISTRIBUTION
            </div>
            <div className="text-[10px] font-mono-tech text-[#D4FF00] tracking-widest mt-0.5">
              GLOBAL MUSIC & ROYALTY PORTAL
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadAllProfileManualsCombinedPdf()}
            className="px-3.5 py-1.5 rounded-lg bg-[#141720] hover:bg-[#1C202E] border border-[#2A3042] text-xs font-mono-tech text-[#D4FF00] flex items-center gap-2 cursor-pointer transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download User Manuals (.PDF)</span>
            <span className="sm:hidden">PDF Manuals</span>
          </button>
        </div>
      </header>

      {/* Main 2-Column Login & Role Directory Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Role Portal Directory & 1-Click Demo Credentials */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/30 text-[#D4FF00] text-xs font-mono-tech font-semibold">
              <Disc3 className="w-3.5 h-3.5 animate-spin" />
              MULTI-ROLE ACCESS GATEWAY • 150+ STREAMING STORES
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F3F4F6] tracking-tight">
              SELECT YOUR PORTAL OR SIGN IN
            </h1>
            <p className="text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
              Tank Distribution provides dedicated workspaces for **Artistes**,
              **Music Managers**, **Record Labels & A&R**, **Producers**, and
              **Tank Admins**. Click any account below to auto-fill its login
              credentials or sign in immediately.
            </p>
          </div>

          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#10131B] p-1.5 rounded-xl border border-[#232836]">
            <button
              type="button"
              onClick={() => setSelectedRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-tech cursor-pointer transition-colors ${
                selectedRoleFilter === 'all'
                  ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              All Roles ({profiles.length})
            </button>
            {(Object.keys(PROFILE_CATEGORY_META) as ProfileCategory[]).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedRoleFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono-tech cursor-pointer transition-colors ${
                    selectedRoleFilter === cat
                      ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {PROFILE_CATEGORY_META[cat].shortBadge}
                </button>
              )
            )}
          </div>

          {/* Account Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {visibleAccounts.map((acc) => {
              const catMeta = PROFILE_CATEGORY_META[acc.category];
              const isSelectedEmail =
                email.toLowerCase() === acc.email.toLowerCase();

              return (
                <div
                  key={acc.id}
                  onClick={() => handleFillAccount(acc)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelectedEmail
                      ? 'bg-[#181E2C] border-[#D4FF00] shadow-[0_0_24px_rgba(212,255,0,0.12)]'
                      : 'bg-[#141720] border-[#232836] hover:border-[#363F58]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-extrabold text-sm text-[#0A0B0E] shrink-0"
                          style={{ backgroundColor: acc.accentColor }}
                        >
                          {acc.avatarBadge}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#F3F4F6] truncate">
                            {acc.name}
                          </div>
                          <div className="text-[11px] text-[#9CA3AF] truncate">
                            {acc.organization}
                          </div>
                        </div>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold text-[#0A0B0E] shrink-0"
                        style={{ backgroundColor: acc.accentColor }}
                      >
                        {catMeta.shortBadge}
                      </span>
                    </div>

                    <div className="mt-3 p-2.5 rounded-lg bg-[#0E1117] border border-[#1E2330] font-mono-tech text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">EMAIL:</span>
                        <span className="text-[#F3F4F6] truncate ml-2">
                          {acc.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#6B7280]">PASSWORD:</span>
                        <span className="text-[#D4FF00]">
                          {acc.password || 'Tank#2026'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#1E2330] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadProfileManualPdf(acc.category);
                      }}
                      className="text-[11px] font-mono-tech text-[#9CA3AF] hover:text-[#D4FF00] flex items-center gap-1 cursor-pointer"
                      title="Download PDF Site Navigation Manual for this role"
                    >
                      <Download className="w-3 h-3" />
                      PDF Guide
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAuthenticated({
                          ...acc,
                          lastLoginAt: new Date().toISOString(),
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Instant Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Dedicated Login & Registration Box */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-[#141720] border border-[#2A3042] shadow-2xl overflow-hidden">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 bg-[#0E1117] border-b border-[#232836]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMsg(null);
                }}
                className={`py-4 text-xs font-mono-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-colors ${
                  authMode === 'signin'
                    ? 'border-[#D4FF00] text-[#D4FF00] bg-[#141720]'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Sign In to Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg(null);
                }}
                className={`py-4 text-xs font-mono-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-colors ${
                  authMode === 'register'
                    ? 'border-[#D4FF00] text-[#D4FF00] bg-[#141720]'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Create Account
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#FCA5A5] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {authMode === 'signin' ? (
                <form onSubmit={handleSignInSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#F3F4F6]">
                      Welcome Back
                    </h2>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      Enter your credentials or select a user card on the left
                      to access your role-specific workspace.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@tankdistribution.io"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0A0B0E] border border-[#2A3042] focus:border-[#D4FF00] text-sm font-mono-tech text-[#F3F4F6] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-mono-tech uppercase text-[#9CA3AF]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] font-mono-tech text-[#D4FF00] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Hide
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Show
                          </>
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0A0B0E] border border-[#2A3042] focus:border-[#D4FF00] text-sm font-mono-tech text-[#F3F4F6] outline-none"
                      />
                    </div>
                  </div>

                  {/* Preview Matched Role Pill */}
                  {(() => {
                    const matched = profiles.find(
                      (p) =>
                        p.email.toLowerCase() === email.trim().toLowerCase()
                    );
                    if (!matched) return null;
                    const meta = PROFILE_CATEGORY_META[matched.category];
                    return (
                      <div className="p-3.5 rounded-xl bg-[#0E1117] border border-[#232836] flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center font-mono-tech font-bold text-xs text-[#0A0B0E]"
                            style={{ backgroundColor: matched.accentColor }}
                          >
                            {matched.avatarBadge}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-[#F3F4F6]">
                              {matched.name}
                            </div>
                            <div className="text-[10px] font-mono-tech text-[#10B981]">
                              Portal: {meta.label}
                            </div>
                          </div>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      </div>
                    );
                  })()}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 rounded-xl bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,255,0,0.28)] transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    SIGN IN TO WORKSPACE
                  </button>

                  <div className="pt-4 border-t border-[#232836] flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                      Role-isolated session security
                    </span>
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-[#D4FF00] font-semibold hover:underline cursor-pointer"
                    >
                      New user? Register →
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#F3F4F6]">
                      Create Platform Account
                    </h2>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      Select your role category to provision a tailored
                      distribution workspace.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                      Account Role Category *
                    </label>
                    <select
                      value={regCategory}
                      onChange={(e) =>
                        setRegCategory(e.target.value as ProfileCategory)
                      }
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs font-bold text-[#D4FF00] outline-none"
                    >
                      <option value="artiste">
                        Artiste / Recording Artist (Creator Portal)
                      </option>
                      <option value="music_manager">
                        Music Manager (Multi-Artist Roster Portal)
                      </option>
                      <option value="label_exec">
                        Record Label & A&R Executive (Imprint Portal)
                      </option>
                      <option value="producer_collab">
                        Producer / Songwriter / Collaborator (Split Portal)
                      </option>
                      <option value="tank_admin">
                        Tank Admin (System & Operations Admin)
                      </option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                        Full Name / Stage Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Zuri K"
                        className="w-full h-10 px-3 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="zuri@afrosound.ug"
                        className="w-full h-10 px-3 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs font-mono-tech text-[#F3F4F6] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                        Create Password *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full h-10 px-3 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs font-mono-tech text-[#F3F4F6] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                        Label / Management / Org
                      </label>
                      <input
                        type="text"
                        value={regOrg}
                        onChange={(e) => setRegOrg(e.target.value)}
                        placeholder="e.g. Zuri Sound Collective"
                        className="w-full h-10 px-3 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                      Associated / Managed Artistes (comma separated)
                    </label>
                    <input
                      type="text"
                      value={regArtists}
                      onChange={(e) => setRegArtists(e.target.value)}
                      placeholder="e.g. KAMPALA NIGHTS, SORA VANE"
                      className="w-full h-10 px-3 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 rounded-xl bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,255,0,0.28)] transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    CREATE ACCOUNT & ENTER PORTAL
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer Bar */}
      <footer className="relative z-10 py-4 px-6 lg:px-12 border-t border-[#232836] bg-[#0A0B0E]/90 text-xs text-[#6B7280] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          <span>
            TANK DISTRIBUTION • 100% Net Creator Royalty Platform • Role-Based
            Access Control
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono-tech text-[11px]">
          <span>5 Role Portals</span>
          <span>•</span>
          <span>PDF Navigation Manuals Included</span>
        </div>
      </footer>
    </div>
  );
};
