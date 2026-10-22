import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { PROFILE_CATEGORY_META } from '../data/userProfiles';
import {
  ProfileCategory,
  UserProfileAccount,
} from '../types/distribution';

interface LoginGatewayViewProps {
  profiles: UserProfileAccount[];
  onAuthenticated: (profile: UserProfileAccount) => void;
  onRegisterProfile: (newProfile: UserProfileAccount) => void;
}

const ROLE_CATEGORIES_ORDER: ProfileCategory[] = [
  'artiste',
  'music_manager',
  'label_exec',
  'producer_collab',
  'tank_admin',
];

export const LoginGatewayView: React.FC<LoginGatewayViewProps> = ({
  profiles,
  onAuthenticated,
  onRegisterProfile,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign-in form state (starts completely blank — no placeholders, no passwords)
  const [email, setEmail] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState<ProfileCategory>('artiste');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Registration form state (starts completely blank — no placeholders, no passwords)
  const [regCategory, setRegCategory] = useState<ProfileCategory>('artiste');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regArtists, setRegArtists] = useState('');

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorMsg(
        'Access denied: Please enter your registered email address to authenticate.'
      );
      return;
    }

    const matchedByEmail = profiles.find(
      (p) => p.email.toLowerCase() === normalizedEmail
    );

    if (!matchedByEmail) {
      setErrorMsg(
        'Access denied: No registered account found for this email address. Please register an account first.'
      );
      return;
    }

    if (matchedByEmail.category !== selectedCategory) {
      setErrorMsg(
        'Access denied: The selected Role Category does not match the registered role for this email address.'
      );
      return;
    }

    onAuthenticated({
      ...matchedByEmail,
      lastLoginAt: new Date().toISOString(),
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!regName.trim() || !regEmail.trim()) {
      setErrorMsg('Please enter your full name and email address to register.');
      return;
    }

    const exists = profiles.some(
      (p) => p.email.toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (exists) {
      setErrorMsg(
        'An account with this email already exists. Please authenticate via Sign In.'
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
      avatarBadge: initials || 'TK',
      accentColor: meta.color,
      organization: regOrg.trim() || meta.shortBadge,
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
    setSelectedCategory(regCategory);
    setEmail('');
    setRegName('');
    setRegEmail('');
    setRegOrg('');
    setRegLocation('');
    setRegArtists('');
    setAuthMode('signin');
    setInfoMsg(
      `Account registered for ${newAccount.name}. Please authenticate with your registered email and role category below.`
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F3F4F6] flex flex-col justify-between studio-grid-bg relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#D4FF00]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#10B981]/5 blur-3xl pointer-events-none" />

      {/* Top Brand Header Bar (Locked Gate — No Unauthenticated Downloads or Shortcuts) */}
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
              AUTHENTICATED ACCESS GATEWAY
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141720] border border-[#2A3042] text-xs font-mono-tech text-[#10B981]">
          <Lock className="w-3.5 h-3.5" />
          <span>AUTHENTICATION REQUIRED</span>
        </div>
      </header>

      {/* Main 2-Column Locked Gate Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Role Access Architecture (Zero User Account Leaks Before Auth) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/30 text-[#D4FF00] text-xs font-mono-tech font-semibold">
              <Lock className="w-3.5 h-3.5" />
              PROTECTED DISTRIBUTION WORKSPACE
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F3F4F6] tracking-tight">
              AUTHENTICATE TO ACCESS PLATFORM
            </h1>
            <p className="text-sm text-[#9CA3AF] max-w-2xl leading-relaxed">
              Access to catalog distribution, release builders, royalty split
              ledgers, and role PDF navigation manuals is strictly restricted to
              authenticated users. Select your role category and sign in with
              your registered email address.
            </p>
          </div>

          {/* 5 Role Categories Overview (No Direct Entry, No Account Email Exposure) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {ROLE_CATEGORIES_ORDER.map((cat) => {
              const catMeta = PROFILE_CATEGORY_META[cat];
              const isSelectedRole = selectedCategory === cat;

              return (
                <div
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setRegCategory(cat);
                    setErrorMsg(null);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelectedRole
                      ? 'bg-[#181E2C] border-[#D4FF00] shadow-[0_0_24px_rgba(212,255,0,0.12)]'
                      : 'bg-[#141720] border-[#232836] hover:border-[#363F58]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: catMeta.color }}
                        />
                        <div className="text-sm font-bold text-[#F3F4F6] truncate">
                          {catMeta.label}
                        </div>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-mono-tech font-bold text-[#0A0B0E] shrink-0"
                        style={{ backgroundColor: catMeta.color }}
                      >
                        {catMeta.shortBadge}
                      </span>
                    </div>

                    <p className="mt-2.5 text-xs text-[#9CA3AF] leading-relaxed">
                      {catMeta.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#1E2330] flex items-center justify-between text-[10px] font-mono-tech text-[#6B7280]">
                    <span className="flex items-center gap-1 text-[#10B981]">
                      <Lock className="w-3 h-3" />
                      Verified Session Required
                    </span>
                    {isSelectedRole && (
                      <span className="text-[#D4FF00] font-bold">
                        ROLE SELECTED
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Mandatory Authentication & Account Registration Box */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl bg-[#141720] border border-[#2A3042] shadow-2xl overflow-hidden">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 bg-[#0E1117] border-b border-[#232836]">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-4 text-xs font-mono-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-colors ${
                  authMode === 'signin'
                    ? 'border-[#D4FF00] text-[#D4FF00] bg-[#141720]'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
                className={`py-4 text-xs font-mono-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 cursor-pointer transition-colors ${
                  authMode === 'register'
                    ? 'border-[#D4FF00] text-[#D4FF00] bg-[#141720]'
                    : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Register Account
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#FCA5A5] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-xs text-[#A7F3D0] flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              {authMode === 'signin' ? (
                <form onSubmit={handleSignInSubmit} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#F3F4F6]">
                      Authenticate Session
                    </h2>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      Select your registered role category and enter your email
                      address to verify your identity.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                      Role Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) =>
                        setSelectedCategory(e.target.value as ProfileCategory)
                      }
                      className="w-full h-11 px-3.5 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs font-bold text-[#D4FF00] outline-none"
                    >
                      <option value="artiste">
                        Artiste / Recording Artist
                      </option>
                      <option value="music_manager">
                        Music Manager
                      </option>
                      <option value="label_exec">
                        Record Label & A&R Executive
                      </option>
                      <option value="producer_collab">
                        Producer / Songwriter / Collaborator
                      </option>
                      <option value="tank_admin">
                        Tank Admin
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0A0B0E] border border-[#2A3042] focus:border-[#D4FF00] text-sm font-mono-tech text-[#F3F4F6] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 rounded-xl bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,255,0,0.28)] transition-all cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    AUTHENTICATE & SIGN IN
                  </button>

                  <div className="pt-4 border-t border-[#232836] flex items-center justify-between text-xs text-[#9CA3AF]">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                      Signed session token guard
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setErrorMsg(null);
                        setInfoMsg(null);
                      }}
                      className="text-[#D4FF00] font-semibold hover:underline cursor-pointer"
                    >
                      Register Account →
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#F3F4F6]">
                      Register Platform Account
                    </h2>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      Register your profile details first, then authenticate on
                      the Sign In screen.
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
                        Artiste / Recording Artist
                      </option>
                      <option value="music_manager">
                        Music Manager
                      </option>
                      <option value="label_exec">
                        Record Label & A&R Executive
                      </option>
                      <option value="producer_collab">
                        Producer / Songwriter / Collaborator
                      </option>
                      <option value="tank_admin">
                        Tank Admin
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
                        className="w-full h-10 px-3 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs font-mono-tech text-[#F3F4F6] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                        Label / Management / Org
                      </label>
                      <input
                        type="text"
                        value={regOrg}
                        onChange={(e) => setRegOrg(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                        City / Territory
                      </label>
                      <input
                        type="text"
                        value={regLocation}
                        onChange={(e) => setRegLocation(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1">
                      Associated / Managed Artistes
                    </label>
                    <input
                      type="text"
                      value={regArtists}
                      onChange={(e) => setRegArtists(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-[#0A0B0E] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 rounded-xl bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(212,255,0,0.28)] transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    REGISTER ACCOUNT
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
            TANK DISTRIBUTION • Mandatory Session Authentication • Role-Based
            Access Control
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono-tech text-[11px]">
          <span>Unauthenticated Access Blocked</span>
        </div>
      </footer>
    </div>
  );
};
