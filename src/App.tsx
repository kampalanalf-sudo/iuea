import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Database,
  Disc3,
  DollarSign,
  Download,
  EyeOff,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { BottomAudioBar } from './components/BottomAudioBar';
import { CatalogManagerView } from './components/CatalogManagerView';
import { CommandOverviewView } from './components/CommandOverviewView';
import { LoginGatewayView } from './components/LoginGatewayView';
import { ProfilesAndManualsView } from './components/ProfilesAndManualsView';
import { ReleaseBuilderView } from './components/ReleaseBuilderView';
import { ReleaseInspectorModal } from './components/ReleaseInspectorModal';
import { RoyaltiesSplitsView } from './components/RoyaltiesSplitsView';
import { SupabaseGithubView } from './components/SupabaseGithubView';
import {
  INITIAL_ARTIST_PROFILE,
  INITIAL_PAYOUT_REQUESTS,
  INITIAL_RELEASES,
  INITIAL_ROYALTY_TRANSACTIONS,
} from './data/seedCatalog';
import {
  INITIAL_USER_PROFILES,
  PROFILE_CATEGORY_META,
} from './data/userProfiles';
import { testSupabaseConnection } from './lib/supabase';
import {
  createNewRelease,
  createPayoutRequest,
  deleteReleaseById,
  fetchAllDistributionData,
  updateArtistProfile,
  updateReleaseStatus,
} from './services/distributionService';
import {
  dispatchReleaseToWebhook,
  loadDspIntegrationConfig,
} from './services/dspIntegrationService';
import {
  ArtistProfile,
  DeliveryStatus,
  PayoutRequest,
  ReleaseItem,
  RoyaltyTransaction,
  SupabaseConfigState,
  TrackItem,
  UserProfileAccount,
} from './types/distribution';
import { audioEngine } from './utils/audioEngine';
import {
  clearVerifiedAuthSession,
  createVerifiedAuthSession,
  verifyActiveProfileFromSession,
} from './utils/authSession';
import { downloadProfileManualPdf } from './utils/pdfManualGenerator';

type NavView =
  | 'overview'
  | 'catalog'
  | 'builder'
  | 'royalties'
  | 'profiles-manuals'
  | 'supabase-github';

const LS_USER_PROFILES = 'tank_dist_user_profiles_v3';

export function App() {
  const [activeView, setActiveView] = useState<NavView>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const [releases, setReleases] = useState<ReleaseItem[]>(INITIAL_RELEASES);
  const [transactions, setTransactions] = useState<RoyaltyTransaction[]>(
    INITIAL_ROYALTY_TRANSACTIONS
  );
  const [payouts, setPayouts] = useState<PayoutRequest[]>(
    INITIAL_PAYOUT_REQUESTS
  );
  const [profile, setProfile] = useState<ArtistProfile>(INITIAL_ARTIST_PROFILE);
  const [inspectedRelease, setInspectedRelease] = useState<ReleaseItem | null>(
    null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Multi-Role User Profiles State
  const [userProfiles, setUserProfiles] = useState<UserProfileAccount[]>(() => {
    try {
      const saved = localStorage.getItem(LS_USER_PROFILES);
      if (saved) return JSON.parse(saved) as UserProfileAccount[];
    } catch {
      // ignore
    }
    return INITIAL_USER_PROFILES;
  });

  // Verified Authentication Session State (Strictly null until authenticated)
  const [authenticatedProfile, setAuthenticatedProfile] =
    useState<UserProfileAccount | null>(() => {
      const verified = verifyActiveProfileFromSession(userProfiles);
      return verified ? verified.profile : null;
    });

  const isAuthenticated = authenticatedProfile !== null;
  const isAdmin = Boolean(authenticatedProfile?.canSeeTechDetails);

  const [supabaseState, setSupabaseState] = useState<SupabaseConfigState>({
    url: '',
    anonKey: '',
    mode: 'hybrid-local',
    lastSyncedAt: new Date().toISOString(),
    connectedTables: 7,
    errorMessage: null,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4200);
  };

  const loadData = useCallback(async () => {
    const data = await fetchAllDistributionData();
    setReleases(data.releases);
    setTransactions(data.transactions);
    setPayouts(data.payouts);
    setProfile(data.profile);
  }, []);

  // Only load distribution data AFTER session authentication is verified
  useEffect(() => {
    if (!authenticatedProfile) return;
    loadData();
    testSupabaseConnection().then(setSupabaseState);
  }, [authenticatedProfile, loadData]);

  // Continuous Session Integrity Watchdog
  useEffect(() => {
    const verifyIntegrity = () => {
      const verified = verifyActiveProfileFromSession(userProfiles);
      if (!verified && authenticatedProfile) {
        audioEngine.pause();
        setAuthenticatedProfile(null);
        setProfileDropdownOpen(false);
      }
    };

    window.addEventListener('focus', verifyIntegrity);
    window.addEventListener('storage', verifyIntegrity);
    const timer = window.setInterval(verifyIntegrity, 15000);
    return () => {
      window.removeEventListener('focus', verifyIntegrity);
      window.removeEventListener('storage', verifyIntegrity);
      window.clearInterval(timer);
    };
  }, [userProfiles, authenticatedProfile]);

  // If user switches to a non-admin profile while on the admin-only 'supabase-github' view, redirect to 'overview'
  useEffect(() => {
    if (!isAdmin && activeView === 'supabase-github') {
      setActiveView('overview');
    }
  }, [isAdmin, activeView]);

  const handleSelectUserProfile = (nextProf: UserProfileAccount) => {
    createVerifiedAuthSession(nextProf);
    setAuthenticatedProfile(nextProf);
    setProfileDropdownOpen(false);
    const meta = PROFILE_CATEGORY_META[nextProf.category];
    showToast(
      `Signed in as ${nextProf.name} (${meta.shortBadge})${
        nextProf.canSeeTechDetails
          ? ' — Full Admin & Cloud Access Enabled'
          : ' — Clean Music Industry Workspace'
      }`
    );
  };

  const handleCreateUserProfile = (newProf: UserProfileAccount) => {
    const updated = [...userProfiles, newProf];
    setUserProfiles(updated);
    try {
      localStorage.setItem(LS_USER_PROFILES, JSON.stringify(updated));
    } catch {
      // ignore
    }
    showToast(
      `Registered profile for ${newProf.name}. Authenticate via Sign In to access this account.`
    );
  };

  const handleSignOut = () => {
    audioEngine.pause();
    clearVerifiedAuthSession();
    setAuthenticatedProfile(null);
    setProfileDropdownOpen(false);
  };

  const handleSwitchProfileRequiresAuth = (targetProf: UserProfileAccount) => {
    if (authenticatedProfile && targetProf.id === authenticatedProfile.id) {
      setProfileDropdownOpen(false);
      return;
    }
    handleSignOut();
  };

  const handlePlayTrack = (track: TrackItem, release: ReleaseItem) => {
    audioEngine.playTrack(track, release.title, release.coverArtUrl);
  };

  const handleCreateRelease = async (newRel: ReleaseItem) => {
    const updated = await createNewRelease(newRel);
    setReleases(updated);
    setActiveView('overview');

    const dspCfg = loadDspIntegrationConfig();
    if (dspCfg.autoDispatchOnRelease && dspCfg.deliveryWebhookUrl.trim()) {
      const { log } = await dispatchReleaseToWebhook(newRel, dspCfg);
      showToast(
        `Release "${newRel.title}" (${newRel.upcCode}) deployed & dispatched via ${dspCfg.aggregatorProvider.toUpperCase()} webhook (${log.httpStatus})!`
      );
    } else {
      showToast(
        `Release "${newRel.title}" (${newRel.upcCode}) deployed to ${newRel.storesSelected.length} streaming stores!`
      );
    }

    if (newRel.tracks[0]) {
      audioEngine.playTrack(
        newRel.tracks[0],
        newRel.title,
        newRel.coverArtUrl
      );
    }
  };

  const handleUpdateReleaseStatus = async (
    releaseId: string,
    status: DeliveryStatus
  ) => {
    const updated = await updateReleaseStatus(releaseId, status);
    setReleases(updated);
    const updatedRel = updated.find((r) => r.id === releaseId) || null;
    setInspectedRelease(updatedRel);
    showToast(`Pipeline status updated to "${status}".`);
  };

  const handleDeleteRelease = async (releaseId: string) => {
    const updated = await deleteReleaseById(releaseId);
    setReleases(updated);
    showToast('Release removed from active catalog.');
  };

  const handleRequestPayout = async (
    amountUsd: number,
    method: string,
    destination: string
  ) => {
    const updatedPayouts = await createPayoutRequest(
      amountUsd,
      method,
      destination
    );
    setPayouts(updatedPayouts);
    showToast(`Royalty payout of $${amountUsd.toFixed(2)} settled via ${method}.`);
  };

  const handleUpdateProfile = async (next: ArtistProfile) => {
    const saved = await updateArtistProfile(next);
    setProfile(saved);
    showToast('Artist & Label profile updated.');
  };

  // Filter releases by role scope if applicable
  const scopedReleases = React.useMemo(() => {
    if (!authenticatedProfile) return [];
    if (
      authenticatedProfile.category === 'tank_admin' ||
      authenticatedProfile.category === 'label_exec' ||
      authenticatedProfile.associatedArtists.includes('ALL CATALOG ARTISTS')
    ) {
      return releases;
    }
    const matched = releases.filter((r) => {
      const artistMatch = authenticatedProfile.associatedArtists.some(
        (assoc) =>
          r.primaryArtist.toLowerCase().includes(assoc.toLowerCase()) ||
          r.featuredArtists.toLowerCase().includes(assoc.toLowerCase())
      );
      const splitMatch = r.splits.some((s) =>
        s.collaboratorName
          .toLowerCase()
          .includes(authenticatedProfile.name.toLowerCase())
      );
      return artistMatch || splitMatch;
    });
    return matched.length > 0 ? matched : releases;
  }, [releases, authenticatedProfile]);

  // STRICT AUTHENTICATION GATE: Block all workspace access unless a verified session is active
  if (!isAuthenticated || !authenticatedProfile) {
    return (
      <LoginGatewayView
        profiles={userProfiles}
        onAuthenticated={handleSelectUserProfile}
        onRegisterProfile={handleCreateUserProfile}
      />
    );
  }

  const activeUserProfile = authenticatedProfile;

  const navItems: {
    id: NavView;
    label: string;
    badge?: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
    {
      id: 'catalog',
      label: 'Catalog & Releases',
      badge: String(scopedReleases.length),
      icon: Disc3,
    },
    {
      id: 'builder',
      label: 'Distribute Release',
      badge: 'NEW',
      icon: PlusCircle,
    },
    { id: 'royalties', label: 'Royalties & Splits', icon: DollarSign },
    {
      id: 'profiles-manuals',
      label: 'Profiles & Manuals',
      badge: `${userProfiles.length} ROLES`,
      icon: Users,
    },
    // STRICT ADMIN-ONLY NAVIGATION ITEM: Only Tank Admin ever sees Supabase & GitHub!
    ...(isAdmin
      ? [
          {
            id: 'supabase-github' as NavView,
            label: 'Supabase & GitHub',
            badge: supabaseState.mode === 'live-supabase' ? 'LIVE' : 'ADMIN',
            icon: Database,
          },
        ]
      : []),
  ];

  const activeCategoryMeta = PROFILE_CATEGORY_META[activeUserProfile.category];

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-[#F3F4F6] flex flex-col">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-[#141923] border border-[#D4FF00] shadow-2xl flex items-center gap-2.5 text-xs font-mono-tech text-[#F3F4F6]">
          <CheckCircle2 className="w-4 h-4 text-[#D4FF00] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-1">
        {/* Left Studio Sidebar Rail (Desktop) */}
        <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 bg-[#101218] border-r border-[#232836] fixed top-0 bottom-[74px] left-0 z-30">
          <div>
            {/* Brand Emblem */}
            <div className="h-16 px-5 border-b border-[#232836] flex items-center justify-between">
              <div
                onClick={() => setActiveView('overview')}
                className="flex items-center gap-3 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#D4FF00] text-[#0A0B0E] flex items-center justify-center font-display font-black text-lg tracking-tighter shadow-[0_0_20px_rgba(212,255,0,0.3)]">
                  T
                </div>
                <div>
                  <div className="font-display font-extrabold text-sm tracking-tight text-[#F3F4F6] leading-none">
                    TANK
                  </div>
                  <div className="text-[10px] font-mono-tech text-[#D4FF00] tracking-widest mt-0.5">
                    DISTRIBUTION
                  </div>
                </div>
              </div>
              <span
                className="px-1.5 py-0.5 text-[9px] font-mono-tech font-bold rounded text-[#0A0B0E]"
                style={{ backgroundColor: activeUserProfile.accentColor }}
              >
                {activeCategoryMeta.shortBadge}
              </span>
            </div>

            {/* Primary Navigation */}
            <nav className="p-3.5 space-y-1">
              <div className="px-3 py-2 text-[10px] font-mono-tech uppercase tracking-wider text-[#6B7280]">
                {activeCategoryMeta.shortBadge} WORKSPACE
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold shadow-[0_0_18px_rgba(212,255,0,0.2)]'
                        : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#181B24]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-mono-tech rounded ${
                          isActive
                            ? 'bg-[#0A0B0E]/20 text-[#0A0B0E] font-bold'
                            : 'bg-[#1C202B] text-[#D4FF00]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Active User, Manual & Sign Out */}
          <div className="p-4 space-y-2 border-t border-[#232836]">
            <div
              onClick={() => setActiveView('profiles-manuals')}
              className="p-3 rounded-xl bg-[#141720] hover:bg-[#191D28] border border-[#232836] space-y-1 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] font-mono-tech">
                <span className="text-[#9CA3AF] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  {activeCategoryMeta.shortBadge}
                </span>
                <span className="text-[#D4FF00] underline">Switch User</span>
              </div>
              <div className="text-xs font-bold text-[#F3F4F6] truncate">
                {activeUserProfile.name}
              </div>
              <div className="text-[10px] font-mono-tech text-[#6B7280] truncate">
                {activeUserProfile.email}
              </div>
            </div>

            <button
              onClick={() =>
                downloadProfileManualPdf(activeUserProfile.category)
              }
              className="w-full py-2 px-3 rounded-lg bg-[#181B24] hover:bg-[#222736] border border-[#2A3042] text-xs font-mono-tech text-[#D4FF00] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {activeCategoryMeta.shortBadge} PDF Manual
            </button>

            <div className="grid grid-cols-2 gap-2">
              {scopedReleases[0]?.tracks[0] && (
                <button
                  onClick={() =>
                    handlePlayTrack(
                      scopedReleases[0].tracks[0],
                      scopedReleases[0]
                    )
                  }
                  className="py-1.5 px-2.5 rounded-lg bg-[#12151E] hover:bg-[#1C202E] border border-[#232836] text-[11px] font-mono-tech text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
                  Audio Test
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="py-1.5 px-2.5 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/30 text-[11px] font-mono-tech text-[#FCA5A5] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Top Utility Header */}
          <header className="sticky top-0 z-20 h-16 bg-[#0A0B0E]/90 backdrop-blur-md border-b border-[#232836] px-4 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-[#141720] border border-[#232836] text-[#F3F4F6]"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>

              {/* STRICT ADMIN CHECK: Only Tank Admin sees Supabase & GitHub pills! */}
              {isAdmin ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveView('supabase-github')}
                    className="px-3 py-1.5 rounded-lg bg-[#141720] hover:bg-[#1B202C] border border-[#232836] flex items-center gap-2 text-xs font-mono-tech cursor-pointer transition-colors"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        supabaseState.mode === 'live-supabase'
                          ? 'bg-[#10B981]'
                          : 'bg-[#D4FF00]'
                      }`}
                    />
                    <Database className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[#F3F4F6]">
                      Supabase:{' '}
                      <strong className="text-[#10B981]">
                        {supabaseState.mode === 'live-supabase'
                          ? 'Live Connected'
                          : 'PG Schema + Hybrid'}
                      </strong>
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveView('supabase-github')}
                    className="hidden sm:flex px-3 py-1.5 rounded-lg bg-[#141720] hover:bg-[#1B202C] border border-[#232836] items-center gap-2 text-xs font-mono-tech cursor-pointer transition-colors"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-[#F3F4F6]" />
                    <span className="text-[#9CA3AF]">
                      kampalanalf-sudo/iuea
                    </span>
                  </button>
                </div>
              ) : (
                /* Non-Admin Clean Music Industry Context Pill */
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-[#141720] border border-[#232836] flex items-center gap-2 text-xs">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: activeUserProfile.accentColor }}
                    />
                    <span className="font-semibold text-[#F3F4F6]">
                      {activeUserProfile.organization}
                    </span>
                    <span className="hidden md:inline text-[#6B7280] font-mono-tech">
                      • {activeCategoryMeta.shortBadge} PORTAL
                    </span>
                  </div>
                  <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[10px] font-mono-tech text-[#10B981]">
                    <EyeOff className="w-3 h-3" />
                    Tech-Free Workspace
                  </span>
                </div>
              )}
            </div>

            {/* Right Header Controls: Interactive Profile Switcher + PDF Manual + Sign Out */}
            <div className="flex items-center gap-2.5">
              {/* Role & Profile Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="px-3 py-1.5 rounded-lg bg-[#141720] hover:bg-[#1C202E] border border-[#2A3042] flex items-center gap-2 text-xs cursor-pointer transition-colors"
                  title="Switch User Profile or Sign Out"
                >
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center font-mono-tech font-bold text-[10px] text-[#0A0B0E]"
                    style={{ backgroundColor: activeUserProfile.accentColor }}
                  >
                    {activeUserProfile.avatarBadge}
                  </span>
                  <div className="hidden sm:block text-left">
                    <div className="text-[11px] font-bold text-[#F3F4F6] leading-tight">
                      {activeUserProfile.name}
                    </div>
                    <div
                      className="text-[9px] font-mono-tech leading-tight"
                      style={{ color: activeUserProfile.accentColor }}
                    >
                      {activeCategoryMeta.shortBadge}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#12151E] border border-[#2E3548] shadow-2xl py-2 z-50">
                    <div className="px-3.5 py-2 border-b border-[#232836] flex items-center justify-between">
                      <span className="text-[10px] font-mono-tech uppercase text-[#9CA3AF]">
                        ACTIVE SESSION ACCOUNT
                      </span>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setActiveView('profiles-manuals');
                        }}
                        className="text-[10px] font-mono-tech text-[#D4FF00] hover:underline cursor-pointer"
                      >
                        Role Manuals →
                      </button>
                    </div>
                    <div className="px-3.5 py-3 border-b border-[#1C202B] flex items-center justify-between bg-[#181D2B]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-mono-tech font-bold text-[10px] text-[#0A0B0E] shrink-0"
                          style={{ backgroundColor: activeUserProfile.accentColor }}
                        >
                          {activeUserProfile.avatarBadge}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#F3F4F6] truncate">
                            {activeUserProfile.name}
                          </div>
                          <div className="text-[10px] font-mono-tech text-[#9CA3AF] truncate">
                            {activeCategoryMeta.shortBadge} • {activeUserProfile.email}
                          </div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-tech bg-[#D4FF00] text-[#0A0B0E] font-bold shrink-0">
                        AUTHENTICATED
                      </span>
                    </div>
                    <div className="px-3.5 pt-2 mt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full py-2 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#FCA5A5] text-xs font-mono-tech font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out / Authenticate Another User
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Manual Button */}
              <button
                onClick={() => setActiveView('profiles-manuals')}
                className="hidden md:flex px-3 py-2 rounded-lg bg-[#141720] hover:bg-[#1C202E] border border-[#232836] items-center gap-1.5 text-xs font-mono-tech text-[#D4FF00] cursor-pointer"
                title="View Role Profiles & PDF Navigation Manuals"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Manuals</span>
              </button>

              <button
                onClick={() => setActiveView('builder')}
                className="px-3.5 py-2 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Release</span>
              </button>

              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg bg-[#141720] hover:bg-[#EF4444]/20 border border-[#232836] hover:border-[#EF4444]/40 text-[#9CA3AF] hover:text-[#FCA5A5] cursor-pointer transition-colors"
                title="Sign Out to Login Screen"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Mobile Drawer Navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-[#101218] border-b border-[#232836] p-4 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                      isActive
                        ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                        : 'text-[#9CA3AF]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2.5 rounded-lg text-xs font-semibold text-[#FCA5A5] flex items-center gap-3"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Main Workspace Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 max-w-[1560px] w-full mx-auto studio-grid-bg">
            {activeView === 'overview' && (
              <CommandOverviewView
                releases={scopedReleases}
                payouts={payouts}
                activeProfile={activeUserProfile}
                onPlayTrack={handlePlayTrack}
                onSelectRelease={setInspectedRelease}
                onNavigateNewRelease={() => setActiveView('builder')}
                onNavigateRoyalties={() => setActiveView('royalties')}
              />
            )}

            {activeView === 'catalog' && (
              <CatalogManagerView
                releases={scopedReleases}
                onPlayTrack={handlePlayTrack}
                onSelectRelease={setInspectedRelease}
                onNavigateNewRelease={() => setActiveView('builder')}
              />
            )}

            {activeView === 'builder' && (
              <ReleaseBuilderView
                existingCount={releases.length}
                onCreateRelease={handleCreateRelease}
                onCancel={() => setActiveView('overview')}
              />
            )}

            {activeView === 'royalties' && (
              <RoyaltiesSplitsView
                releases={scopedReleases}
                transactions={transactions}
                payouts={payouts}
                onRequestPayout={handleRequestPayout}
              />
            )}

            {activeView === 'profiles-manuals' && (
              <ProfilesAndManualsView
                profiles={userProfiles}
                activeProfile={activeUserProfile}
                onSelectProfile={handleSwitchProfileRequiresAuth}
                onCreateProfile={handleCreateUserProfile}
              />
            )}

            {activeView === 'supabase-github' && isAdmin && (
              <SupabaseGithubView
                supabaseState={supabaseState}
                onSupabaseStateChange={setSupabaseState}
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onRefreshData={loadData}
                releases={releases}
              />
            )}
          </main>
        </div>
      </div>

      {/* Release Detail Inspector Modal */}
      <ReleaseInspectorModal
        release={inspectedRelease}
        isAdmin={isAdmin}
        onClose={() => setInspectedRelease(null)}
        onPlayTrack={handlePlayTrack}
        onUpdateStatus={handleUpdateReleaseStatus}
        onDeleteRelease={handleDeleteRelease}
      />

      {/* Persistent Studio Bottom Audio Bar */}
      <BottomAudioBar releases={scopedReleases} />
    </div>
  );
}
export default App;
