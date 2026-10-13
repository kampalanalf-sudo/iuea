import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Disc,
  Download,
  Globe2,
  Play,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { DeliveryStatus, ReleaseItem, TrackItem } from '../types/distribution';
import { generateDdexXmlManifest } from '../utils/artworkGenerator';

interface ReleaseInspectorModalProps {
  release: ReleaseItem | null;
  isAdmin: boolean;
  onClose: () => void;
  onPlayTrack: (track: TrackItem, release: ReleaseItem) => void;
  onUpdateStatus: (releaseId: string, status: DeliveryStatus) => void;
  onDeleteRelease: (releaseId: string) => void;
}

export const ReleaseInspectorModal: React.FC<ReleaseInspectorModalProps> = ({
  release,
  isAdmin,
  onClose,
  onPlayTrack,
  onUpdateStatus,
  onDeleteRelease,
}) => {
  const [activeTab, setActiveTab] = useState<'tracks' | 'stores' | 'splits' | 'ddex'>('tracks');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!release) return null;

  const ddexXml = generateDdexXmlManifest(release);

  const handleCopy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleDownloadDdex = () => {
    const blob = new Blob([ddexXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${release.catalogNumber}_DDEX_ERN43.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const splitSum = release.splits.reduce((acc, s) => acc + s.sharePercentage, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12141A] border border-[#2A3042] rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="p-6 bg-[#161922] border-b border-[#232836] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={release.coverArtUrl}
              alt={release.title}
              className="w-20 h-20 rounded-lg object-cover border border-[#2E364F] shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 text-[11px] font-mono-tech font-bold uppercase rounded bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30">
                  {release.releaseType}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-mono-tech font-semibold rounded-full flex items-center gap-1.5 ${
                    release.status === 'Delivered'
                      ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30'
                      : release.status === 'In Review'
                      ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      : 'bg-[#6B7280]/20 text-[#9CA3AF] border border-[#6B7280]/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {release.status}
                </span>
                <span className="text-xs font-mono-tech text-[#9CA3AF]">
                  {release.catalogNumber}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#F3F4F6] mt-1">
                {release.title}
              </h2>
              <p className="text-sm text-[#9CA3AF]">
                {release.primaryArtist}
                {release.featuredArtists ? ` feat. ${release.featuredArtists}` : ''} •{' '}
                <span className="text-[#6B7280]">{release.primaryGenre}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <button
                  onClick={() => handleCopy(release.upcCode, 'upc')}
                  className="inline-flex items-center gap-1.5 text-xs font-mono-tech text-[#D4FF00] bg-[#0A0B0E] px-2.5 py-1 rounded border border-[#232836] hover:border-[#D4FF00]/50 cursor-pointer"
                >
                  UPC: {release.upcCode}
                  {copiedCode === 'upc' ? (
                    <Check className="w-3 h-3 text-[#10B981]" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-70" />
                  )}
                </button>
                <span className="text-xs font-mono-tech text-[#9CA3AF]">
                  Release Date: {release.releaseDate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {release.tracks[0] && (
              <button
                onClick={() => onPlayTrack(release.tracks[0], release)}
                className="px-3.5 py-2 rounded-lg bg-[#D4FF00] hover:bg-[#e0ff33] text-[#0A0B0E] font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Play Master
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#1C202B] text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Sub-tabs */}
        <div className="px-6 bg-[#141720] border-b border-[#232836] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            {[
              { id: 'tracks', label: `Master Tracks (${release.tracks.length})`, icon: Disc },
              {
                id: 'stores',
                label: `Store Delivery (${release.storesSelected.length})`,
                icon: Globe2,
              },
              {
                id: 'splits',
                label: `Royalty Splits (${splitSum.toFixed(0)}%)`,
                icon: Users,
              },
              ...(isAdmin
                ? [{ id: 'ddex', label: 'DDEX ERN 4.3 XML (Admin)', icon: Code2 }]
                : []),
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id as 'tracks' | 'stores' | 'splits' | 'ddex')
                  }
                  className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-[#D4FF00] text-[#D4FF00]'
                      : 'border-transparent text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Pipeline State Changer (Admin Only) */}
          {isAdmin && (
            <div className="flex items-center gap-2 py-2">
              <span className="text-[11px] font-mono-tech text-[#6B7280]">
                ADMIN PIPELINE STATE:
              </span>
              {(['Delivered', 'In Review', 'Draft'] as DeliveryStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onUpdateStatus(release.id, st)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono-tech cursor-pointer transition-colors ${
                    release.status === st
                      ? 'bg-[#D4FF00] text-[#0A0B0E] font-bold'
                      : 'bg-[#1C202B] text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'tracks' && (
            <div className="space-y-3">
              {release.tracks.map((track) => (
                <div
                  key={track.id}
                  className="p-4 rounded-lg bg-[#181B24] border border-[#232836] hover:border-[#343C52] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => onPlayTrack(track, release)}
                      className="w-9 h-9 rounded-lg bg-[#D4FF00]/15 hover:bg-[#D4FF00] text-[#D4FF00] hover:text-[#0A0B0E] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono-tech text-[#6B7280]">
                          #{String(track.trackNumber).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-semibold text-[#F3F4F6]">
                          {track.title}
                        </span>
                        <span className="text-xs text-[#9CA3AF]">
                          ({track.version})
                        </span>
                        {track.explicitLyrics && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono-tech bg-[#EF4444]/20 text-[#EF4444] rounded font-bold">
                            EXPLICIT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#9CA3AF] mt-0.5">
                        Songwriter(s): {track.songwriterLegalName} • Language:{' '}
                        {track.language}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-2.5 py-1 rounded bg-[#101218] border border-[#232836] text-xs font-mono-tech text-[#D4FF00]">
                      {track.isrcCode}
                    </div>
                    <div className="px-2.5 py-1 rounded bg-[#101218] border border-[#232836] text-xs font-mono-tech text-[#10B981]">
                      {track.integratedLufs.toFixed(1)} LUFS • {track.sampleRate}
                    </div>
                    <div className="text-right min-w-[90px]">
                      <div className="text-xs font-mono-tech font-semibold text-[#F3F4F6]">
                        {track.streams.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#6B7280]">Total Streams</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stores' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {release.storesSelected.map((storeName, idx) => {
                  const existingDel = release.deliveries.find(
                    (d) => d.storeName === storeName
                  );
                  const status =
                    existingDel?.deliveryStatus ||
                    (release.status === 'Delivered' ? 'Delivered' : 'In Review');
                  return (
                    <div
                      key={`${storeName}-${idx}`}
                      className="p-3.5 rounded-lg bg-[#181B24] border border-[#232836] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#F3F4F6]">
                          {storeName}
                        </div>
                        <div className="text-[11px] font-mono-tech text-[#6B7280] mt-0.5">
                          Batch:{' '}
                          {existingDel?.ddexBatchId ||
                            `DDEX-${release.catalogNumber}-${idx + 1}`}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[11px] font-mono-tech rounded-full flex items-center gap-1 ${
                          status === 'Delivered'
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        }`}
                      >
                        {status === 'Delivered' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'splits' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#181B24] border border-[#232836] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                  <div>
                    <div className="text-sm font-semibold text-[#F3F4F6]">
                      Automated Split Contract Active
                    </div>
                    <div className="text-xs text-[#9CA3AF]">
                      100% of net DSP royalties are automatically routed to collaborators
                      upon settlement.
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded bg-[#10B981]/15 text-[#10B981] font-mono-tech text-xs font-bold">
                  {splitSum.toFixed(2)}% LOCKED
                </span>
              </div>

              <div className="space-y-2.5">
                {release.splits.map((split) => (
                  <div
                    key={split.id}
                    className="p-3.5 rounded-lg bg-[#181B24] border border-[#232836] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#F3F4F6]">
                        {split.collaboratorName}{' '}
                        <span className="text-xs font-normal text-[#9CA3AF]">
                          ({split.role})
                        </span>
                      </div>
                      <div className="text-xs font-mono-tech text-[#6B7280]">
                        {split.collaboratorEmail} • Payout via {split.payoutMethod}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono-tech rounded ${
                          split.status === 'Verified'
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        }`}
                      >
                        {split.status}
                      </span>
                      <span className="text-base font-mono-tech font-bold text-[#D4FF00]">
                        {split.sharePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ddex' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono-tech text-[#9CA3AF]">
                  DDEX ERN 4.3 XML Message • {release.catalogNumber}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(ddexXml, 'ddex')}
                    className="px-3 py-1.5 rounded bg-[#1C202B] hover:bg-[#252A3A] text-xs font-mono-tech text-[#F3F4F6] flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedCode === 'ddex' ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedCode === 'ddex' ? 'Copied XML' : 'Copy XML'}
                  </button>
                  <button
                    onClick={handleDownloadDdex}
                    className="px-3 py-1.5 rounded bg-[#D4FF00] text-[#0A0B0E] text-xs font-mono-tech font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .XML
                  </button>
                </div>
              </div>
              <pre className="p-4 rounded-lg bg-[#0A0B0E] border border-[#232836] text-[11px] font-mono-tech text-[#10B981] overflow-x-auto max-h-[340px]">
                {ddexXml}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#141720] border-t border-[#232836] flex items-center justify-between">
          <div className="text-xs font-mono-tech text-[#6B7280]">
            ℗ {release.pLine} • © {release.cLine}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onDeleteRelease(release.id);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Release
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#232836] hover:bg-[#2E3548] text-xs font-semibold text-[#F3F4F6] cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
