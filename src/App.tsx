import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Disc3,
  DollarSign,
  GitBranch,
  LayoutDashboard,
  Menu,
  PlusCircle,
  Radio,
  ShieldCheck,
  Volume2,
  X,
} from 'lucide-react';
import { BottomAudioBar } from './components/BottomAudioBar';
import { CatalogManagerView } from './components/CatalogManagerView';
import { CommandOverviewView } from './components/CommandOverviewView';
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
  ArtistProfile,
  DeliveryStatus,
  PayoutRequest,
  ReleaseItem,
  RoyaltyTransaction,
  SupabaseConfigState,
  TrackItem,
} from './types/distribution';
import { audioEngine } from './utils/audioEngine';

type NavView =
  | 'overview'
  | 'catalog'
  | 'builder'
  | 'royalties'
  | 'supabase-github';

export function App() {
  const [activeView, setActiveView] = useState<NavView>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = useCallback(async () => {
    const data = await fetchAllDistributionData();
    setReleases(data.releases);
    setTransactions(data.transactions);
    setPayouts(data.payouts);
    setProfile(data.profile);
  }, []);

  useEffect(() => {
    loadData();
    testSupabaseConnection().then(setSupabaseState);
  }, [loadData]);

  const handlePlayTrack = (track: TrackItem, release: ReleaseItem) => {
    audioEngine.playTrack(track, release.title, release.coverArtUrl);
  };

  const handleCreateRelease = async (newRel: ReleaseItem) => {
    const updated = await createNewRelease(newRel);
    setReleases(updated);
    setActiveView('overview');
    showToast(
      `Release "${newRel.title}" (${newRel.upcCode}) deployed to ${newRel.storesSelected.length} DSP stores!`
    );
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

  const navItems: { id: NavView; label: string; badge?: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Command Overview', icon: LayoutDashboard },
    {
      id: 'catalog',
      label: 'Catalog & Releases',
      badge: String(releases.length),
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
      id: 'supabase-github',
      label: 'Supabase & GitHub',
      badge: supabaseState.mode === 'live-supabase' ? 'LIVE' : 'SYNC',
      icon: Database,
    },
  ];

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
              <span className="px-1.5 py-0.5 text-[9px] font-mono-tech bg-[#1C202B] text-[#9CA3AF] rounded border border-[#2B3145]">
                v2.4
              </span>
            </div>

            {/* Primary Navigation */}
            <nav className="p-3.5 space-y-1">
              <div className="px-3 py-2 text-[10px] font-mono-tech uppercase tracking-wider text-[#6B7280]">
                DISTRIBUTION CONSOLE
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

          {/* Bottom Sidebar Studio Status Card */}
          <div className="p-4 space-y-3 border-t border-[#232836]">
            <div className="p-3.5 rounded-xl bg-[#141720] border border-[#232836] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono-tech">
                <span className="text-[#9CA3AF] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                  LABEL PLAN
                </span>
                <span className="text-[#D4FF00] font-bold">100% NET</span>
              </div>
              <div className="text-xs font-bold text-[#F3F4F6] truncate">
                {profile.artistName}
              </div>
              <div className="text-[10px] font-mono-tech text-[#6B7280] truncate">
                IPI: {profile.ipiNumber} • {profile.proAffiliation}
              </div>
            </div>

            {releases[0]?.tracks[0] && (
              <button
                onClick={() =>
                  handlePlayTrack(releases[0].tracks[0], releases[0])
                }
                className="w-full py-2 px-3 rounded-lg bg-[#181B24] hover:bg-[#222736] border border-[#2A3042] text-xs font-mono-tech text-[#D4FF00] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Test Studio Audio Engine
              </button>
            )}
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

              {/* Supabase & GitHub Integration Status Pills */}
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
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141720] border border-[#232836] text-xs font-mono-tech">
                <Radio className="w-3.5 h-3.5 text-[#D4FF00]" />
                <span className="text-[#9CA3AF]">DDEX NODE:</span>
                <span className="text-[#10B981] font-bold">ONLINE</span>
              </div>

              <button
                onClick={() => setActiveView('builder')}
                className="px-3.5 py-2 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Release</span>
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
            </div>
          )}

          {/* Main Workspace Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-28 max-w-[1560px] w-full mx-auto studio-grid-bg">
            {activeView === 'overview' && (
              <CommandOverviewView
                releases={releases}
                payouts={payouts}
                onPlayTrack={handlePlayTrack}
                onSelectRelease={setInspectedRelease}
                onNavigateNewRelease={() => setActiveView('builder')}
                onNavigateRoyalties={() => setActiveView('royalties')}
              />
            )}

            {activeView === 'catalog' && (
              <CatalogManagerView
                releases={releases}
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
                releases={releases}
                transactions={transactions}
                payouts={payouts}
                onRequestPayout={handleRequestPayout}
              />
            )}

            {activeView === 'supabase-github' && (
              <SupabaseGithubView
                supabaseState={supabaseState}
                onSupabaseStateChange={setSupabaseState}
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onRefreshData={loadData}
              />
            )}
          </main>
        </div>
      </div>

      {/* Release Detail Inspector Modal */}
      <ReleaseInspectorModal
        release={inspectedRelease}
        onClose={() => setInspectedRelease(null)}
        onPlayTrack={handlePlayTrack}
        onUpdateStatus={handleUpdateReleaseStatus}
        onDeleteRelease={handleDeleteRelease}
      />

      {/* Persistent Studio Bottom Audio Bar */}
      <BottomAudioBar releases={releases} />
    </div>
  );
}
export default App;
