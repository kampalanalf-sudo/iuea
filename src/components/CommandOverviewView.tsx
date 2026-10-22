import React, { useState } from 'react';
import {
  Activity,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Disc3,
  DollarSign,
  ExternalLink,
  Globe2,
  Play,
  Plus,
  Radio,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { PROFILE_CATEGORY_META } from '../data/userProfiles';
import { DspApiWebhookPanel } from './DspApiWebhookPanel';
import {
  DeliveryStatus,
  PayoutRequest,
  ReleaseItem,
  TrackItem,
  UserProfileAccount,
} from '../types/distribution';
import { downloadProfileManualPdf } from '../utils/pdfManualGenerator';

interface CommandOverviewViewProps {
  releases: ReleaseItem[];
  payouts: PayoutRequest[];
  activeProfile: UserProfileAccount;
  onPlayTrack: (track: TrackItem, release: ReleaseItem) => void;
  onSelectRelease: (release: ReleaseItem) => void;
  onNavigateNewRelease: () => void;
  onNavigateRoyalties: () => void;
}

export const CommandOverviewView: React.FC<CommandOverviewViewProps> = ({
  releases,
  payouts,
  activeProfile,
  onPlayTrack,
  onSelectRelease,
  onNavigateNewRelease,
  onNavigateRoyalties,
}) => {
  const [metricMode, setMetricMode] = useState<'streams' | 'revenue'>('streams');
  const [statusFilter, setStatusFilter] = useState<'All' | DeliveryStatus>('All');
  const [copiedUpc, setCopiedUpc] = useState<string | null>(null);

  const isAdmin = activeProfile.canSeeTechDetails;
  const roleMeta = PROFILE_CATEGORY_META[activeProfile.category];

  const totalStreams = releases.reduce((acc, r) => acc + r.totalStreams, 0);
  const grossRoyalties = releases.reduce((acc, r) => acc + r.totalRoyalties, 0);
  const totalWithdrawn = payouts.reduce((acc, p) => acc + p.amountUsd, 0);
  const availableBalance = Math.max(0, grossRoyalties - totalWithdrawn);

  const deliveredReleases = releases.filter((r) => r.status === 'Delivered').length;
  const totalTracks = releases.reduce((acc, r) => acc + r.tracks.length, 0);
  const uniqueStores = new Set<string>();
  releases.forEach((r) => r.storesSelected.forEach((s) => uniqueStores.add(s)));

  const filteredReleases =
    statusFilter === 'All'
      ? releases
      : releases.filter((r) => r.status === statusFilter);

  const handleCopyUpc = (upc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(upc);
    setCopiedUpc(upc);
    setTimeout(() => setCopiedUpc(null), 1600);
  };

  const getHeroTitle = () => {
    switch (activeProfile.category) {
      case 'tank_admin':
        return 'TANK ADMIN OPERATIONS CONSOLE';
      case 'artiste':
        return `ARTISTE STUDIO PORTAL — ${activeProfile.name.toUpperCase()}`;
      case 'music_manager':
        return `ROSTER MANAGEMENT DESK — ${activeProfile.organization.toUpperCase()}`;
      case 'label_exec':
        return `LABEL & A&R COMMAND — ${activeProfile.organization.toUpperCase()}`;
      case 'producer_collab':
        return `PRODUCER & COLLABORATOR HUB — ${activeProfile.name.toUpperCase()}`;
    }
  };

  const getHeroSubtitle = () => {
    switch (activeProfile.category) {
      case 'tank_admin':
        return 'Full system administration: global lossless master ingestion, automated 100% royalty routing, user profile governance, and live Supabase + GitHub cloud telemetry.';
      case 'artiste':
        return 'Distribute your music to global streaming platforms, design studio cover artwork, manage collaborator splits, and collect 100% of your net streaming royalties.';
      case 'music_manager':
        return 'Coordinate multi-artist release schedules, monitor global streaming velocity, and audit management commission splits.';
      case 'label_exec':
        return 'Executive catalog oversight: manage imprint releases, master copyrights (℗ & ©), global store delivery footprints, and quarterly label royalty pools.';
      case 'producer_collab':
        return 'Audition credited 24-bit studio masters, verify your locked producer & engineering royalty split percentages, and cash out earnings directly.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Role-Adaptive Hero Banner */}
      <div className="relative rounded-xl bg-gradient-to-r from-[#12151E] via-[#161A26] to-[#12151E] border border-[#252B3B] p-6 overflow-hidden">
        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full bg-[#D4FF00]/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/30 text-[#D4FF00] text-[11px] font-mono-tech font-semibold mb-2.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              {isAdmin
                ? 'TANK ADMIN EXCLUSIVE • SUPABASE + GITHUB + DDEX ERN 4.3 NODE ACTIVE'
                : `${roleMeta.shortBadge} PORTAL • ${activeProfile.commissionOrShareNote.toUpperCase()}`}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F3F4F6] tracking-tight">
              {getHeroTitle()}
            </h1>
            <p className="text-sm text-[#9CA3AF] mt-1 max-w-2xl">
              {getHeroSubtitle()}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => downloadProfileManualPdf(activeProfile.category)}
              className="px-3.5 py-2.5 rounded-lg bg-[#1A1E2B] hover:bg-[#232838] border border-[#2C3347] text-xs font-mono-tech font-semibold text-[#D4FF00] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              {roleMeta.shortBadge} PDF Manual
            </button>
            <button
              onClick={onNavigateRoyalties}
              className="px-4 py-2.5 rounded-lg bg-[#1A1E2B] hover:bg-[#232838] border border-[#2C3347] text-xs font-semibold text-[#F3F4F6] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <DollarSign className="w-4 h-4 text-[#10B981]" />
              Withdraw Royalties
            </button>
            <button
              onClick={onNavigateNewRelease}
              className="px-5 py-2.5 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-bold text-xs flex items-center gap-2 shadow-[0_0_24px_rgba(212,255,0,0.25)] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              DISTRIBUTE NEW RELEASE
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards (100% Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[#141720] border border-[#232836]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Total Catalog Streams
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#D4FF00]/10 border border-[#D4FF00]/25 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#D4FF00]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono-tech font-bold text-[#F3F4F6] mt-2">
            {totalStreams.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1F2432] text-xs">
            <span className="text-[#9CA3AF] font-mono-tech">
              {releases.length} Registered Release{releases.length === 1 ? '' : 's'}
            </span>
            <span className="text-[#6B7280] font-mono-tech">
              {uniqueStores.size} Stores Selected
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#141720] border border-[#232836]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Net Royalty Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 border border-[#10B981]/25 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#10B981]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono-tech font-bold text-[#10B981] mt-2">
            $
            {availableBalance.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1F2432] text-xs">
            <span className="text-[#D4FF00] font-mono-tech font-semibold">
              100% Creator Share
            </span>
            <span className="text-[#6B7280] font-mono-tech">
              Gross: ${grossRoyalties.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#141720] border border-[#232836]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Active Catalog Masters
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FF6B2C]/10 border border-[#FF6B2C]/25 flex items-center justify-center">
              <Disc3 className="w-4 h-4 text-[#FF6B2C]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono-tech font-bold text-[#F3F4F6] mt-2">
            {releases.length} Release{releases.length === 1 ? '' : 's'}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1F2432] text-xs">
            <span className="text-[#F3F4F6] font-mono-tech">
              {totalTracks} Master Track{totalTracks === 1 ? '' : 's'}
            </span>
            <span className="text-[#10B981] font-mono-tech">
              {deliveredReleases} Delivered
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#141720] border border-[#232836]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              {isAdmin ? 'DDEX Delivery Status' : 'Store Delivery Status'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/25 flex items-center justify-center">
              <Globe2 className="w-4 h-4 text-[#38BDF8]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono-tech font-bold text-[#F3F4F6] mt-2">
            {uniqueStores.size} Stores
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1F2432] text-xs">
            <span className="text-[#38BDF8] font-mono-tech">
              Lossless Audio Spec
            </span>
            <span className="text-[#6B7280] font-mono-tech">24-Bit WAV</span>
          </div>
        </div>
      </div>

      {/* 2-Column Main Analytical Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 65% (8 cols): Release Performance Telemetry */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#232836]">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#D4FF00]" />
                  <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
                    Catalog Streaming & Royalty Telemetry
                  </h2>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Live performance across your distributed releases
                </p>
              </div>

              <div className="flex rounded-lg bg-[#0A0B0E] p-0.5 border border-[#232836]">
                <button
                  onClick={() => setMetricMode('streams')}
                  className={`px-3 py-1 rounded-md text-xs font-mono-tech cursor-pointer transition-colors ${
                    metricMode === 'streams'
                      ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  Streams
                </button>
                <button
                  onClick={() => setMetricMode('revenue')}
                  className={`px-3 py-1 rounded-md text-xs font-mono-tech cursor-pointer transition-colors ${
                    metricMode === 'revenue'
                      ? 'bg-[#10B981] text-[#0A0B0E] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  Royalty USD
                </button>
              </div>
            </div>

            {releases.length === 0 ? (
              <div className="mt-6 h-52 flex flex-col items-center justify-center text-center p-6 bg-[#0E1016] rounded-lg border border-[#1E2330]">
                <Disc3 className="w-8 h-8 text-[#D4FF00] mb-2" />
                <div className="text-sm font-bold text-[#F3F4F6]">
                  No Releases Distributed Yet
                </div>
                <p className="text-xs text-[#9CA3AF] max-w-md mt-1">
                  Submit your first Single, EP, or Album in the Release Builder to
                  track live streaming and royalty telemetry here.
                </p>
                <button
                  onClick={onNavigateNewRelease}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#D4FF00] text-[#0A0B0E] font-bold text-xs cursor-pointer"
                >
                  + Distribute First Release
                </button>
              </div>
            ) : (
              <div className="mt-6 h-52 flex items-end gap-4 px-4 pt-6 pb-2 bg-[#0E1016] rounded-lg border border-[#1E2330]">
                {releases.slice(0, 8).map((rel) => {
                  const val =
                    metricMode === 'streams'
                      ? rel.totalStreams
                      : rel.totalRoyalties;
                  const maxVal = Math.max(
                    ...releases.map((r) =>
                      metricMode === 'streams' ? r.totalStreams : r.totalRoyalties
                    ),
                    1
                  );
                  const heightPct = Math.max(
                    12,
                    Math.round((val / maxVal) * 100)
                  );
                  return (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelease(rel)}
                      className="flex-1 h-full flex flex-col items-center justify-end group cursor-pointer"
                    >
                      <div className="mb-1.5 text-[10px] font-mono-tech text-[#9CA3AF] group-hover:text-[#D4FF00]">
                        {metricMode === 'streams'
                          ? val.toLocaleString()
                          : `$${val.toFixed(2)}`}
                      </div>
                      <div className="w-full max-w-[48px] bg-[#1A1F2C] rounded-t-md overflow-hidden flex items-end h-[130px]">
                        <div
                          className={`w-full rounded-t-md ${
                            metricMode === 'streams'
                              ? 'bg-[#D4FF00]'
                              : 'bg-[#10B981]'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <div className="mt-2 text-[10px] font-mono-tech text-[#9CA3AF] truncate max-w-[90px]">
                        {rel.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 35% (4 cols): Store Delivery Pipeline */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#232836]">
              <div>
                <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
                  {isAdmin ? 'DDEX Store Pipeline' : 'Store Delivery Tracker'}
                </h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Release delivery status across streaming stores
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#10B981]/15 text-[#10B981]">
                {isAdmin ? 'ERN 4.3 LIVE' : 'ACTIVE'}
              </span>
            </div>

            {releases.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#9CA3AF]">
                No releases in the store delivery pipeline yet.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {releases.slice(0, 4).map((rel) => {
                  const pct =
                    rel.storesSelected.length > 0
                      ? Math.round(
                          (rel.storesDelivered / rel.storesSelected.length) * 100
                        )
                      : 100;
                  return (
                    <div
                      key={rel.id}
                      onClick={() => onSelectRelease(rel)}
                      className="p-3.5 rounded-lg bg-[#181B24] border border-[#232836] hover:border-[#D4FF00]/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#F3F4F6] truncate">
                          {rel.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono-tech rounded-full shrink-0 ${
                            rel.status === 'Delivered'
                              ? 'bg-[#10B981]/15 text-[#10B981]'
                              : rel.status === 'In Review'
                              ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                              : 'bg-[#6B7280]/20 text-[#9CA3AF]'
                          }`}
                        >
                          {rel.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono-tech text-[#9CA3AF] mt-1.5">
                        <span>UPC: {rel.upcCode}</span>
                        <span>
                          {rel.storesDelivered}/{rel.storesSelected.length} Stores
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#0F1219] rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full ${
                            rel.status === 'Delivered'
                              ? 'bg-[#10B981]'
                              : 'bg-[#F59E0B]'
                          }`}
                          style={{ width: `${Math.max(15, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-[#232836]">
            <div className="p-3.5 rounded-lg bg-[#0E1117] border border-[#232836] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#D4FF00] shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-[#F3F4F6]">
                    Distribute a new release
                  </div>
                  <div className="text-[#6B7280]">
                    Auto-assigns free UPC & ISRC codes
                  </div>
                </div>
              </div>
              <button
                onClick={onNavigateNewRelease}
                className="px-3 py-1.5 rounded bg-[#D4FF00] text-[#0A0B0E] font-bold text-xs shrink-0 cursor-pointer"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Quick-Table */}
      <div className="rounded-xl bg-[#141720] border border-[#232836] overflow-hidden">
        <div className="p-5 border-b border-[#232836] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
              Active Distribution Catalog & Master Registry
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Click any release to inspect tracks, store delivery status, or
              royalty splits
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0A0B0E] p-1 rounded-lg border border-[#232836]">
            {(['All', 'Delivered', 'In Review', 'Draft'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-mono-tech cursor-pointer transition-colors ${
                  statusFilter === st
                    ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                    : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredReleases.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="text-sm font-bold text-[#F3F4F6]">
              Your Catalog Is Currently Empty
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Click &quot;Distribute New Release&quot; to upload your first master
              and generate UPC &amp; ISRC codes.
            </p>
            <button
              onClick={onNavigateNewRelease}
              className="px-4 py-2 rounded-lg bg-[#D4FF00] text-[#0A0B0E] font-bold text-xs cursor-pointer"
            >
              Distribute New Release
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#232836] bg-[#10131B] text-[11px] font-mono-tech uppercase text-[#6B7280]">
                  <th className="py-3.5 px-5">Release / Artist</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">UPC / First ISRC</th>
                  <th className="py-3.5 px-4">Store Status</th>
                  <th className="py-3.5 px-4 text-right">Total Streams</th>
                  <th className="py-3.5 px-4 text-right">Net Royalties</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2330] text-sm">
                {filteredReleases.map((rel) => {
                  const firstTrack = rel.tracks[0];
                  return (
                    <tr
                      key={rel.id}
                      onClick={() => onSelectRelease(rel)}
                      className="hover:bg-[#191D28] transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#2B3145] shrink-0">
                            <img
                              src={rel.coverArtUrl}
                              alt={rel.title}
                              className="w-full h-full object-cover"
                            />
                            {firstTrack && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPlayTrack(firstTrack, rel);
                                }}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#D4FF00] transition-opacity cursor-pointer"
                              >
                                <Play className="w-5 h-5 fill-current" />
                              </button>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[#F3F4F6] group-hover:text-[#D4FF00] transition-colors flex items-center gap-2">
                              {rel.title}
                              {rel.explicit && (
                                <span className="px-1.5 py-0.2 text-[9px] font-mono-tech bg-[#232836] text-[#D4FF00] rounded">
                                  E
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#9CA3AF]">
                              {rel.primaryArtist} •{' '}
                              <span className="text-[#6B7280]">
                                {rel.tracks.length} track
                                {rel.tracks.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded text-xs font-mono-tech font-semibold bg-[#1C202B] text-[#F3F4F6] border border-[#2B3145]">
                          {rel.releaseType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono-tech text-[#D4FF00]">
                            {rel.upcCode}
                          </span>
                          <button
                            onClick={(e) => handleCopyUpc(rel.upcCode, e)}
                            className="text-[#6B7280] hover:text-[#F3F4F6] cursor-pointer"
                          >
                            {copiedUpc === rel.upcCode ? (
                              <Check className="w-3.5 h-3.5 text-[#10B981]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] font-mono-tech text-[#6B7280]">
                          {firstTrack?.isrcCode || ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono-tech font-semibold ${
                            rel.status === 'Delivered'
                              ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                              : rel.status === 'In Review'
                              ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                              : 'bg-[#6B7280]/20 text-[#9CA3AF] border border-[#6B7280]/30'
                          }`}
                        >
                          {rel.status === 'Delivered' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {rel.status} ({rel.storesDelivered}/
                          {rel.storesSelected.length})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tech font-semibold text-[#F3F4F6]">
                        {rel.totalStreams.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tech font-bold text-[#10B981]">
                        $
                        {rel.totalRoyalties.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRelease(rel);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#1E2330] hover:bg-[#D4FF00] text-[#F3F4F6] hover:text-[#0A0B0E] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          Inspect
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tank Admin Exclusive: DSP API Keys, GS1/ISRC Registry Prefixes & Distribution Webhook Panel */}
      {isAdmin && <DspApiWebhookPanel releases={releases} />}
    </div>
  );
};
