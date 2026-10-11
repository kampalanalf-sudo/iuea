import React, { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
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
import {
  DeliveryStatus,
  PayoutRequest,
  ReleaseItem,
  TrackItem,
} from '../types/distribution';

interface CommandOverviewViewProps {
  releases: ReleaseItem[];
  payouts: PayoutRequest[];
  onPlayTrack: (track: TrackItem, release: ReleaseItem) => void;
  onSelectRelease: (release: ReleaseItem) => void;
  onNavigateNewRelease: () => void;
  onNavigateRoyalties: () => void;
}

const TELEMETRY_SERIES: Record<
  '7D' | '30D' | '90D' | '12M',
  { labels: string[]; streams: number[]; revenue: number[] }
> = {
  '7D': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    streams: [38200, 42900, 41100, 49800, 64200, 72500, 68900],
    revenue: [245, 278, 261, 318, 412, 468, 441],
  },
  '30D': {
    labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Now'],
    streams: [240000, 295000, 310000, 365000, 342000, 418000, 452000, 498000],
    revenue: [1520, 1890, 1980, 2340, 2190, 2680, 2910, 3240],
  },
  '90D': {
    labels: ['Aug W1', 'Aug W3', 'Sep W1', 'Sep W3', 'Oct W1', 'Oct W2'],
    streams: [320000, 410000, 495000, 530000, 510000, 576920],
    revenue: [2120, 2690, 3210, 3490, 3380, 3530],
  },
  '12M': {
    labels: ['Nov', 'Jan', 'Mar', 'May', 'Jul', 'Sep', 'Oct'],
    streams: [140000, 260000, 380000, 420000, 510000, 560000, 571920],
    revenue: [890, 1640, 2410, 2680, 3290, 3610, 3899],
  },
};

export const CommandOverviewView: React.FC<CommandOverviewViewProps> = ({
  releases,
  payouts,
  onPlayTrack,
  onSelectRelease,
  onNavigateNewRelease,
  onNavigateRoyalties,
}) => {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | '12M'>('30D');
  const [metricMode, setMetricMode] = useState<'streams' | 'revenue'>('streams');
  const [statusFilter, setStatusFilter] = useState<'All' | DeliveryStatus>('All');
  const [copiedUpc, setCopiedUpc] = useState<string | null>(null);

  const totalStreams = releases.reduce((acc, r) => acc + r.totalStreams, 0);
  const grossRoyalties = releases.reduce((acc, r) => acc + r.totalRoyalties, 0);
  const totalWithdrawn = payouts.reduce((acc, p) => acc + p.amountUsd, 0);
  const availableBalance = Math.max(0, grossRoyalties - totalWithdrawn * 0.25);

  const deliveredReleases = releases.filter((r) => r.status === 'Delivered').length;
  const totalTracks = releases.reduce((acc, r) => acc + r.tracks.length, 0);

  const filteredReleases =
    statusFilter === 'All'
      ? releases
      : releases.filter((r) => r.status === statusFilter);

  const activeSeries = TELEMETRY_SERIES[timeframe];
  const values =
    metricMode === 'streams' ? activeSeries.streams : activeSeries.revenue;
  const maxVal = Math.max(...values, 1);

  const handleCopyUpc = (upc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(upc);
    setCopiedUpc(upc);
    setTimeout(() => setCopiedUpc(null), 1600);
  };

  return (
    <div className="space-y-6">
      {/* Studio Hero Banner */}
      <div className="relative rounded-xl bg-gradient-to-r from-[#12151E] via-[#161A26] to-[#12151E] border border-[#252B3B] p-6 overflow-hidden">
        <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full bg-[#D4FF00]/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/30 text-[#D4FF00] text-[11px] font-mono-tech font-semibold mb-2.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              DDEX ERN 4.3 DIRECT NODE • SUPABASE + GITHUB SYNC ACTIVE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F3F4F6] tracking-tight">
              TANK DISTRIBUTION CONSOLE
            </h1>
            <p className="text-sm text-[#9CA3AF] mt-1 max-w-2xl">
              Global lossless master ingestion, automated 100% collaborator royalty
              routing, and real-time DSP store telemetry across 150+ streaming
              networks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-xl bg-[#141720] border border-[#232836] hover:border-[#32394E] transition-colors">
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
            <span className="text-[#10B981] font-mono-tech font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +24.8% vs prior 30d
            </span>
            <span className="text-[#6B7280] font-mono-tech">152 DSPs Live</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-xl bg-[#141720] border border-[#232836] hover:border-[#32394E] transition-colors">
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
              100% Artist Share
            </span>
            <span className="text-[#6B7280] font-mono-tech">
              Gross: ${grossRoyalties.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-xl bg-[#141720] border border-[#232836] hover:border-[#32394E] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              Active Catalog Masters
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#FF6B2C]/10 border border-[#FF6B2C]/25 flex items-center justify-center">
              <Disc3 className="w-4 h-4 text-[#FF6B2C]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono-tech font-bold text-[#F3F4F6] mt-2">
            {releases.length} Releases
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1F2432] text-xs">
            <span className="text-[#F3F4F6] font-mono-tech">
              {totalTracks} Lossless Tracks
            </span>
            <span className="text-[#10B981] font-mono-tech">
              {deliveredReleases} Live on DSPs
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-xl bg-[#141720] border border-[#232836] hover:border-[#32394E] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]">
              DDEX Delivery SLA
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 border border-[#38BDF8]/25 flex items-center justify-center">
              <Globe2 className="w-4 h-4 text-[#38BDF8]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-mono-tech font-bold text-[#F3F4F6] mt-2">
            99.8% Pass
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#1F2432] text-xs">
            <span className="text-[#38BDF8] font-mono-tech">
              Content ID Protected
            </span>
            <span className="text-[#6B7280] font-mono-tech">-14.0 LUFS Spec</span>
          </div>
        </div>
      </div>

      {/* 2-Column Main Analytical Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 65% (8 cols): Interactive Streaming & Revenue Telemetry Chart */}
        <div className="lg:col-span-8 p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#232836]">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#D4FF00]" />
                  <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
                    Global DSP Telemetry & Revenue Velocity
                  </h2>
                </div>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Aggregated real-time streams and settled royalty inflows across
                  Spotify, Apple Music, TikTok, Beatport & Audiomack
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-[#0A0B0E] p-0.5 border border-[#232836]">
                  <button
                    onClick={() => setMetricMode('streams')}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono-tech cursor-pointer transition-colors ${
                      metricMode === 'streams'
                        ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                        : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                    }`}
                  >
                    Streams
                  </button>
                  <button
                    onClick={() => setMetricMode('revenue')}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono-tech cursor-pointer transition-colors ${
                      metricMode === 'revenue'
                        ? 'bg-[#10B981] text-[#0A0B0E] font-bold'
                        : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                    }`}
                  >
                    Royalty USD
                  </button>
                </div>

                <div className="flex rounded-lg bg-[#0A0B0E] p-0.5 border border-[#232836]">
                  {(['7D', '30D', '90D', '12M'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2 py-1 rounded-md text-[11px] font-mono-tech cursor-pointer transition-colors ${
                        timeframe === tf
                          ? 'bg-[#232836] text-[#F3F4F6] font-bold'
                          : 'text-[#6B7280] hover:text-[#9CA3AF]'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Bar + Trend Telemetry Visualization */}
            <div className="mt-6 h-52 flex items-end gap-3 sm:gap-5 px-2 pt-6 pb-2 bg-[#0E1016] rounded-lg border border-[#1E2330]">
              {values.map((val, idx) => {
                const heightPct = Math.max(12, Math.round((val / maxVal) * 100));
                const label = activeSeries.labels[idx];
                const formatted =
                  metricMode === 'streams'
                    ? `${(val / 1000).toFixed(1)}k`
                    : `$${val.toLocaleString()}`;
                return (
                  <div
                    key={label}
                    className="flex-1 h-full flex flex-col items-center justify-end group relative"
                  >
                    <div className="mb-1.5 text-[10px] font-mono-tech text-[#9CA3AF] group-hover:text-[#D4FF00] transition-colors">
                      {formatted}
                    </div>
                    <div className="w-full max-w-[44px] bg-[#1A1F2C] rounded-t-md overflow-hidden flex items-end h-[130px]">
                      <div
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          metricMode === 'streams'
                            ? 'bg-gradient-to-t from-[#D4FF00]/30 via-[#D4FF00]/80 to-[#D4FF00] group-hover:brightness-110'
                            : 'bg-gradient-to-t from-[#10B981]/30 via-[#10B981]/80 to-[#10B981] group-hover:brightness-110'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <div className="mt-2 text-[11px] font-mono-tech text-[#6B7280]">
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Store Share Strip */}
          <div className="mt-5 pt-4 border-t border-[#232836] grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { name: 'Spotify', share: '44.2%', color: '#1DB954' },
              { name: 'Apple Music', share: '23.8%', color: '#FA243C' },
              { name: 'Audiomack / Afro', share: '12.4%', color: '#FFA200' },
              { name: 'Beatport Club', share: '10.6%', color: '#01FF95' },
              { name: 'TikTok / YT ID', share: '9.0%', color: '#00F2FE' },
            ].map((dsp) => (
              <div
                key={dsp.name}
                className="p-2.5 rounded-lg bg-[#0F1219] border border-[#1E2330]"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9CA3AF] truncate">{dsp.name}</span>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dsp.color }}
                  />
                </div>
                <div className="text-sm font-mono-tech font-bold text-[#F3F4F6] mt-1">
                  {dsp.share}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 35% (4 cols): DSP Store Delivery Pipeline & QC Log */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#232836]">
              <div>
                <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
                  DDEX Store Pipeline
                </h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Real-time ingestion & automated QC checks
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold bg-[#10B981]/15 text-[#10B981]">
                ERN 4.3 LIVE
              </span>
            </div>

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
                        {rel.storesDelivered}/{rel.storesSelected.length} DSPs
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
          </div>

          <div className="mt-5 pt-4 border-t border-[#232836]">
            <div className="p-3.5 rounded-lg bg-[#0E1117] border border-[#232836] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#D4FF00] shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-[#F3F4F6]">
                    Ready to ship a new master?
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

      {/* Recent Releases Quick-Table */}
      <div className="rounded-xl bg-[#141720] border border-[#232836] overflow-hidden">
        <div className="p-5 border-b border-[#232836] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
              Active Distribution Catalog & Master Registry
            </h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Click any release to inspect tracks, DDEX XML manifest, store links,
              or play studio audio
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#232836] bg-[#10131B] text-[11px] font-mono-tech uppercase text-[#6B7280]">
                <th className="py-3.5 px-5">Release / Artist</th>
                <th className="py-3.5 px-4">Format</th>
                <th className="py-3.5 px-4">UPC / First ISRC</th>
                <th className="py-3.5 px-4">DSP Status</th>
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
                              title="Play Master Track"
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
                          title="Copy UPC"
                        >
                          {copiedUpc === rel.upcCode ? (
                            <Check className="w-3.5 h-3.5 text-[#10B981]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] font-mono-tech text-[#6B7280]">
                        {firstTrack?.isrcCode || 'US-TNK-26-00001'}
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
      </div>
    </div>
  );
};
