import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Disc3,
  ExternalLink,
  LayoutGrid,
  List,
  Play,
  Plus,
  Search,
} from 'lucide-react';
import {
  DeliveryStatus,
  ReleaseFormat,
  ReleaseItem,
  TrackItem,
} from '../types/distribution';

interface CatalogManagerViewProps {
  releases: ReleaseItem[];
  onPlayTrack: (track: TrackItem, release: ReleaseItem) => void;
  onSelectRelease: (release: ReleaseItem) => void;
  onNavigateNewRelease: () => void;
}

export const CatalogManagerView: React.FC<CatalogManagerViewProps> = ({
  releases,
  onPlayTrack,
  onSelectRelease,
  onNavigateNewRelease,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'All' | ReleaseFormat>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | DeliveryStatus>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filtered = releases.filter((rel) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      rel.title.toLowerCase().includes(q) ||
      rel.primaryArtist.toLowerCase().includes(q) ||
      rel.upcCode.toLowerCase().includes(q) ||
      rel.catalogNumber.toLowerCase().includes(q) ||
      rel.tracks.some(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.isrcCode.toLowerCase().includes(q)
      );

    const matchesFormat =
      formatFilter === 'All' || rel.releaseType === formatFilter;
    const matchesStatus =
      statusFilter === 'All' || rel.status === statusFilter;

    return matchesSearch && matchesFormat && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="p-6 rounded-xl bg-[#141720] border border-[#232836] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#F3F4F6]">
              CATALOG & ISRC / UPC REGISTRY
            </h1>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Manage master recordings, DDEX ERN 4.3 packages, UPC barcodes, and
              per-store ingestion logs
            </p>
          </div>
          <button
            onClick={onNavigateNewRelease}
            className="px-4 py-2.5 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-bold text-xs flex items-center gap-2 self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            NEW RELEASE
          </button>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-[#232836]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Title, Artist, UPC (8597...), or ISRC (US-TNK...)"
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#0A0B0E] border border-[#232836] focus:border-[#D4FF00] text-xs text-[#F3F4F6] outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format Filter */}
            <div className="flex items-center bg-[#0A0B0E] p-1 rounded-lg border border-[#232836]">
              {(['All', 'Single', 'EP', 'Album'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormatFilter(fmt)}
                  className={`px-2.5 py-1 rounded text-xs font-mono-tech cursor-pointer ${
                    formatFilter === fmt
                      ? 'bg-[#232836] text-[#D4FF00] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-[#0A0B0E] p-1 rounded-lg border border-[#232836]">
              {(['All', 'Delivered', 'In Review', 'Draft'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-xs font-mono-tech cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-[#0A0B0E] p-1 rounded-lg border border-[#232836]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#232836] text-[#D4FF00]'
                    : 'text-[#6B7280]'
                }`}
                title="Studio Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#232836] text-[#D4FF00]'
                    : 'text-[#6B7280]'
                }`}
                title="Technical Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Releases Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((rel) => (
            <div
              key={rel.id}
              onClick={() => onSelectRelease(rel)}
              className="rounded-xl bg-[#141720] border border-[#232836] hover:border-[#D4FF00]/60 overflow-hidden transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Top Card Header with 1:1 Cover + Info */}
                <div className="p-5 flex items-start gap-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#2E3548] shrink-0 bg-[#0A0B0E]">
                    <img
                      src={rel.coverArtUrl}
                      alt={rel.title}
                      className="w-full h-full object-cover"
                    />
                    {rel.tracks[0] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayTrack(rel.tracks[0], rel);
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#D4FF00] transition-opacity cursor-pointer"
                      >
                        <Play className="w-7 h-7 fill-current" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono-tech font-bold rounded bg-[#D4FF00]/15 text-[#D4FF00]">
                        {rel.releaseType}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono-tech rounded-full flex items-center gap-1 ${
                          rel.status === 'Delivered'
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        }`}
                      >
                        {rel.status === 'Delivered' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {rel.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#F3F4F6] group-hover:text-[#D4FF00] transition-colors truncate mt-1.5">
                      {rel.title}
                    </h3>
                    <p className="text-xs text-[#9CA3AF] truncate">
                      {rel.primaryArtist}
                    </p>
                    <div className="text-[11px] font-mono-tech text-[#6B7280] mt-2">
                      UPC: <span className="text-[#D4FF00]">{rel.upcCode}</span>
                    </div>
                  </div>
                </div>

                {/* Tracklist Preview */}
                <div className="px-5 pb-4 space-y-1.5">
                  {rel.tracks.slice(0, 3).map((trk) => (
                    <div
                      key={trk.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(trk, rel);
                      }}
                      className="px-3 py-2 rounded-lg bg-[#0E1117] hover:bg-[#1B202E] border border-[#1E2330] flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Play className="w-3 h-3 text-[#D4FF00] shrink-0 fill-current" />
                        <span className="text-[#F3F4F6] truncate font-medium">
                          {trk.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-[#9CA3AF] shrink-0 ml-2">
                        {trk.isrcCode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Metrics */}
              <div className="px-5 py-3.5 bg-[#10121A] border-t border-[#232836] flex items-center justify-between text-xs font-mono-tech">
                <div>
                  <span className="text-[#6B7280]">STREAMS: </span>
                  <span className="text-[#F3F4F6] font-bold">
                    {rel.totalStreams.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280]">NET USD: </span>
                  <span className="text-[#10B981] font-bold">
                    ${rel.totalRoyalties.toFixed(2)}
                  </span>
                </div>
                <span className="text-[#D4FF00] flex items-center gap-1">
                  Inspect <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-[#141720] border border-[#232836] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#232836] bg-[#10131B] text-[11px] font-mono-tech uppercase text-[#6B7280]">
                <th className="py-3.5 px-5">Catalog #</th>
                <th className="py-3.5 px-4">Release / Artist</th>
                <th className="py-3.5 px-4">UPC Barcode</th>
                <th className="py-3.5 px-4">Tracks & ISRCs</th>
                <th className="py-3.5 px-4">Release Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Royalties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2330] text-sm">
              {filtered.map((rel) => (
                <tr
                  key={rel.id}
                  onClick={() => onSelectRelease(rel)}
                  className="hover:bg-[#191D28] cursor-pointer"
                >
                  <td className="py-3.5 px-5 font-mono-tech text-xs text-[#9CA3AF]">
                    {rel.catalogNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-[#F3F4F6]">{rel.title}</div>
                    <div className="text-xs text-[#9CA3AF]">
                      {rel.primaryArtist}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono-tech text-xs text-[#D4FF00]">
                    {rel.upcCode}
                  </td>
                  <td className="py-3.5 px-4 font-mono-tech text-xs text-[#9CA3AF]">
                    {rel.tracks.length} Track(s) • {rel.tracks[0]?.isrcCode}
                  </td>
                  <td className="py-3.5 px-4 font-mono-tech text-xs text-[#9CA3AF]">
                    {rel.releaseDate}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-mono-tech bg-[#10B981]/15 text-[#10B981]">
                      {rel.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono-tech font-bold text-[#10B981]">
                    ${rel.totalRoyalties.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
