import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Disc3,
  FileAudio,
  Globe2,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { DSP_STORES } from '../data/seedCatalog';
import {
  ReleaseFormat,
  ReleaseItem,
  RoyaltySplitItem,
  TrackItem,
} from '../types/distribution';
import {
  ARTWORK_THEMES,
  generateCoverArtDataUri,
  generateIsrcCode,
  generateUpcCode,
} from '../utils/artworkGenerator';
import { audioEngine } from '../utils/audioEngine';

interface ReleaseBuilderViewProps {
  existingCount: number;
  onCreateRelease: (release: ReleaseItem) => Promise<void>;
  onCancel: () => void;
}

export const ReleaseBuilderView: React.FC<ReleaseBuilderViewProps> = ({
  existingCount,
  onCreateRelease,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 State
  const [title, setTitle] = useState('KAMPALA OVERDRIVE 2026');
  const [primaryArtist, setPrimaryArtist] = useState('KAMPALA NIGHTS');
  const [featuredArtists, setFeaturedArtists] = useState('ZURI K');
  const [releaseType, setReleaseType] = useState<ReleaseFormat>('Single');
  const [primaryGenre, setPrimaryGenre] = useState('Electronic / Afro-Tech');
  const [subgenre, setSubgenre] = useState('Peak-Time Club & Bass');
  const [labelName, setLabelName] = useState('Tank Recordings');
  const [releaseDate, setReleaseDate] = useState('2026-10-30');
  const [upcCode, setUpcCode] = useState(() => generateUpcCode());
  const [explicit, setExplicit] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState('volt-matrix');
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(null);

  const catalogNumber = `TNK-2026-${String(existingCount + 1).padStart(3, '0')}`;

  const activeCoverUrl =
    customCoverUrl ||
    generateCoverArtDataUri({
      title,
      artist: primaryArtist,
      catalogNumber,
      themeId: selectedThemeId,
      explicit,
    });

  // Step 2 State: Tracks
  const [tracks, setTracks] = useState<TrackItem[]>([
    {
      id: `trk-new-1`,
      releaseId: 'pending',
      trackNumber: 1,
      title: 'Kampala Overdrive (Club Mix)',
      version: 'Original Mix',
      primaryArtist: 'KAMPALA NIGHTS',
      featuredArtists: 'ZURI K',
      isrcCode: generateIsrcCode(existingCount * 10 + 1),
      songwriterLegalName: 'A. Mukasa, Z. Kemigisha',
      explicitLyrics: false,
      language: 'English',
      durationSeconds: 218,
      sampleRate: '24-bit / 48.0 kHz WAV',
      integratedLufs: -13.9,
      truePeakDbtp: -0.2,
      synthPreset: 'cyber-bass',
      streams: 0,
    },
  ]);

  // Step 3 State: Splits
  const [splits, setSplits] = useState<RoyaltySplitItem[]>([
    {
      id: 'spl-new-1',
      releaseId: 'pending',
      collaboratorName: 'Kampala Nights (Primary)',
      collaboratorEmail: 'ops@tankdistribution.io',
      role: 'Primary Artist',
      sharePercentage: 70,
      status: 'Verified',
      payoutMethod: 'Stripe Connect',
    },
    {
      id: 'spl-new-2',
      releaseId: 'pending',
      collaboratorName: 'Zuri K',
      collaboratorEmail: 'zurik@afrosound.ug',
      role: 'Featured Artist',
      sharePercentage: 30,
      status: 'Verified',
      payoutMethod: 'Wise Multi-Currency',
    },
  ]);

  // Step 4 State: Stores
  const [selectedStores, setSelectedStores] = useState<string[]>(
    DSP_STORES.map((s) => s.name)
  );
  const [enableContentId, setEnableContentId] = useState(true);
  const [deliverySpeed, setDeliverySpeed] = useState<'instant' | 'scheduled'>(
    'instant'
  );

  // Handlers for Cover Art Upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomCoverUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handler for Real Audio File Upload
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const tempAudio = new Audio(objectUrl);

      tempAudio.addEventListener('loadedmetadata', () => {
        const dur =
          tempAudio.duration && !Number.isNaN(tempAudio.duration)
            ? Math.round(tempAudio.duration)
            : 210;

        setTracks((prev) => [
          ...prev,
          {
            id: `trk-upload-${Date.now()}-${index}`,
            releaseId: 'pending',
            trackNumber: prev.length + 1,
            title: cleanName || `Uploaded Master ${prev.length + 1}`,
            version: 'Uploaded Studio Master',
            primaryArtist: primaryArtist || 'TANK ARTIST',
            featuredArtists,
            isrcCode: generateIsrcCode(),
            songwriterLegalName: 'A. Mukasa',
            explicitLyrics: explicit,
            language: 'English',
            durationSeconds: dur,
            sampleRate: file.name.toLowerCase().endsWith('.wav')
              ? '24-bit / 48.0 kHz WAV'
              : 'Lossless Transcode Ready',
            integratedLufs: -14.0,
            truePeakDbtp: -0.2,
            audioUrl: objectUrl,
            synthPreset: 'afro-pulse',
            streams: 0,
          },
        ]);
      });
    });
  };

  const handleAddSynthTrack = () => {
    const presets: TrackItem['synthPreset'][] = [
      'cyber-bass',
      'afro-pulse',
      'berlin-techno',
      'neon-drift',
      'sub-heavy',
      'analog-horizon',
    ];
    const nextNum = tracks.length + 1;
    setTracks([
      ...tracks,
      {
        id: `trk-new-${Date.now()}`,
        releaseId: 'pending',
        trackNumber: nextNum,
        title: `${title} (Track ${nextNum})`,
        version: 'Original Mix',
        primaryArtist,
        featuredArtists,
        isrcCode: generateIsrcCode(),
        songwriterLegalName: 'A. Mukasa',
        explicitLyrics: explicit,
        language: 'English',
        durationSeconds: 196 + nextNum * 12,
        sampleRate: '24-bit / 48.0 kHz WAV',
        integratedLufs: -14.0,
        truePeakDbtp: -0.3,
        synthPreset: presets[nextNum % presets.length],
        streams: 0,
      },
    ]);
  };

  const splitTotal = splits.reduce((acc, s) => acc + Number(s.sharePercentage || 0), 0);
  const isSplitValid = Math.abs(splitTotal - 100) < 0.01;

  const handleBalanceSplits = () => {
    if (splits.length === 0) return;
    const base = Math.floor((100 / splits.length) * 100) / 100;
    const remainder = Number((100 - base * splits.length).toFixed(2));
    setSplits(
      splits.map((s, idx) => ({
        ...s,
        sharePercentage: idx === 0 ? Number((base + remainder).toFixed(2)) : base,
      }))
    );
  };

  const handleDeployRelease = async () => {
    if (!title.trim() || !primaryArtist.trim() || !isSplitValid) return;
    setIsSubmitting(true);

    const newRelId = `rel-${Date.now()}`;
    const finalStatus = deliverySpeed === 'instant' ? 'Delivered' : 'In Review';

    const newRelease: ReleaseItem = {
      id: newRelId,
      title: title.trim().toUpperCase(),
      primaryArtist: primaryArtist.trim().toUpperCase(),
      featuredArtists: featuredArtists.trim(),
      releaseType,
      primaryGenre,
      subgenre,
      labelName,
      upcCode,
      catalogNumber,
      releaseDate,
      originalReleaseDate: releaseDate,
      pLine: `${releaseDate.slice(0, 4)} ${labelName}`,
      cLine: `${releaseDate.slice(0, 4)} ${labelName}`,
      coverArtUrl: activeCoverUrl,
      status: finalStatus,
      explicit,
      storesSelected: selectedStores,
      storesDelivered:
        finalStatus === 'Delivered'
          ? selectedStores.length
          : Math.max(1, Math.floor(selectedStores.length / 2)),
      totalStreams: finalStatus === 'Delivered' ? 12400 : 0,
      totalRoyalties: finalStatus === 'Delivered' ? 74.40 : 0,
      ddexVersion: 'ERN-4.3',
      createdAt: new Date().toISOString(),
      tracks: tracks.map((t, i) => ({
        ...t,
        releaseId: newRelId,
        trackNumber: i + 1,
        primaryArtist: primaryArtist.trim().toUpperCase(),
      })),
      splits: splits.map((s) => ({
        ...s,
        releaseId: newRelId,
      })),
      deliveries: selectedStores.map((st, idx) => ({
        id: `del-${Date.now()}-${idx}`,
        releaseId: newRelId,
        storeId: st.toLowerCase().replace(/\s+/g, '-'),
        storeName: st,
        deliveryStatus: finalStatus === 'Delivered' ? 'Delivered' : 'In Review',
        ddexBatchId: `DDEX-${catalogNumber}-${idx + 1}`,
        streams: finalStatus === 'Delivered' ? Math.floor(12400 / selectedStores.length) : 0,
        revenueUsd:
          finalStatus === 'Delivered'
            ? Number((74.4 / selectedStores.length).toFixed(2))
            : 0,
        deliveredAt: new Date().toISOString(),
      })),
    };

    await onCreateRelease(newRelease);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Wizard Header & Stepper */}
      <div className="p-6 rounded-xl bg-[#141720] border border-[#232836]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#232836]">
          <div>
            <div className="text-xs font-mono-tech text-[#D4FF00] uppercase">
              DDEX ERN 4.3 MASTER INGESTION WIZARD • {catalogNumber}
            </div>
            <h1 className="text-2xl font-extrabold text-[#F3F4F6] mt-0.5">
              DISTRIBUTE NEW RELEASE
            </h1>
          </div>
          <button
            onClick={onCancel}
            className="self-start md:self-center px-3.5 py-1.5 rounded-lg bg-[#1C202B] hover:bg-[#252B3B] text-xs font-semibold text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
          >
            Cancel & Return
          </button>
        </div>

        {/* 4-Step Progress Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          {[
            { num: 1, title: 'Metadata & Cover Art', sub: 'UPC & 3000px Spec', icon: ImageIcon },
            { num: 2, title: 'Masters & ISRC Codes', sub: `${tracks.length} Audio Track(s)`, icon: Disc3 },
            {
              num: 3,
              title: '100% Royalty Splits',
              sub: `${splitTotal.toFixed(0)}% Allocated`,
              icon: Users,
            },
            {
              num: 4,
              title: 'DSP Stores & Launch',
              sub: `${selectedStores.length} Stores Ready`,
              icon: Globe2,
            },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = step === item.num;
            const isDone = step > item.num;
            return (
              <button
                key={item.num}
                onClick={() => setStep(item.num as 1 | 2 | 3 | 4)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  isActive
                    ? 'bg-[#1A1F2E] border-[#D4FF00] shadow-[0_0_20px_rgba(212,255,0,0.12)]'
                    : isDone
                    ? 'bg-[#141923] border-[#10B981]/40'
                    : 'bg-[#101218] border-[#232836] opacity-75 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono-tech font-bold text-xs shrink-0 ${
                    isActive
                      ? 'bg-[#D4FF00] text-[#0A0B0E]'
                      : isDone
                      ? 'bg-[#10B981] text-[#0A0B0E]'
                      : 'bg-[#1C202B] text-[#9CA3AF]'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#F3F4F6] truncate">
                    {item.num}. {item.title}
                  </div>
                  <div className="text-[11px] font-mono-tech text-[#9CA3AF] truncate">
                    {item.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: METADATA & ARTWORK STUDIO */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-xl bg-[#141720] border border-[#232836] space-y-5">
            <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide border-b border-[#232836] pb-3">
              1. Release Metadata & Identification
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                  Release Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. SUBWOOFER SOVEREIGNTY"
                  className="w-full h-11 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] text-sm text-[#F3F4F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                  Primary Artist *
                </label>
                <input
                  type="text"
                  value={primaryArtist}
                  onChange={(e) => setPrimaryArtist(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] text-sm text-[#F3F4F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                  Featured Artist(s)
                </label>
                <input
                  type="text"
                  value={featuredArtists}
                  onChange={(e) => setFeaturedArtists(e.target.value)}
                  placeholder="Optional (comma separated)"
                  className="w-full h-11 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] text-sm text-[#F3F4F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                  Release Format
                </label>
                <select
                  value={releaseType}
                  onChange={(e) => setReleaseType(e.target.value as ReleaseFormat)}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] text-sm text-[#F3F4F6] outline-none"
                >
                  <option value="Single">Single (1–3 Tracks)</option>
                  <option value="EP">EP (4–6 Tracks)</option>
                  <option value="Album">Album (7+ Tracks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                  Primary Genre
                </label>
                <select
                  value={primaryGenre}
                  onChange={(e) => setPrimaryGenre(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] text-sm text-[#F3F4F6] outline-none"
                >
                  <option value="Electronic / Afro-Tech">Electronic / Afro-Tech</option>
                  <option value="Afrobeats / Amapiano">Afrobeats / Amapiano</option>
                  <option value="Hip-Hop / Alternative Trap">Hip-Hop / Alternative Trap</option>
                  <option value="Techno / House">Techno / House</option>
                  <option value="R&B / Alt-Soul">R&B / Alt-Soul</option>
                  <option value="Synthwave / Bass">Synthwave / Bass</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                  Record Label Name
                </label>
                <input
                  type="text"
                  value={labelName}
                  onChange={(e) => setLabelName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] text-sm text-[#F3F4F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                  Global Release Date
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] focus:border-[#D4FF00] text-sm font-mono-tech text-[#F3F4F6] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-mono-tech uppercase text-[#9CA3AF] mb-1.5">
                  Universal Product Code (UPC-A Barcode)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={upcCode}
                    onChange={(e) => setUpcCode(e.target.value)}
                    className="flex-1 h-11 px-3.5 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-sm text-[#D4FF00] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setUpcCode(generateUpcCode())}
                    className="h-11 px-4 rounded-lg bg-[#1C202B] hover:bg-[#252B3B] border border-[#2E3548] text-xs font-mono-tech text-[#F3F4F6] flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#D4FF00]" />
                    Generate UPC
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 pt-2">
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={explicit}
                    onChange={(e) => setExplicit(e.target.checked)}
                    className="w-4 h-4 accent-[#D4FF00] rounded"
                  />
                  <span className="text-sm text-[#F3F4F6]">
                    Release contains Explicit Lyrics (adds Parental Advisory badge &
                    DDEX Explicit flag)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right 5 cols: Cover Art Studio */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-[#232836] pb-3">
                <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
                  3000×3000px Cover Art Studio
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono-tech bg-[#10B981]/15 text-[#10B981] rounded">
                  DSP SPEC VERIFIED
                </span>
              </div>

              <div className="mt-4 flex flex-col items-center">
                <div className="w-60 h-60 rounded-xl overflow-hidden border-2 border-[#2E3548] shadow-2xl bg-[#0A0B0E]">
                  <img
                    src={activeCoverUrl}
                    alt="Release Cover Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Preset Theme Selector */}
                <div className="w-full mt-4">
                  <div className="text-xs font-mono-tech text-[#9CA3AF] mb-2 flex items-center justify-between">
                    <span>STUDIO PROCEDURAL COVER PRESETS:</span>
                    {customCoverUrl && (
                      <button
                        onClick={() => setCustomCoverUrl(null)}
                        className="text-[#D4FF00] underline cursor-pointer"
                      >
                        Reset to Studio Synth Art
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {ARTWORK_THEMES.map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          setCustomCoverUrl(null);
                          setSelectedThemeId(th.id);
                        }}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          !customCoverUrl && selectedThemeId === th.id
                            ? 'bg-[#1D2230] border-[#D4FF00]'
                            : 'bg-[#0E1117] border-[#232836] hover:border-[#343C52]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: th.accentPrimary }}
                          />
                          <span className="text-[10px] font-mono-tech font-bold text-[#F3F4F6] truncate">
                            {th.name.split(' ')[0]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Image File Upload */}
                <label className="w-full mt-4 py-2.5 px-4 rounded-lg bg-[#1A1F2C] hover:bg-[#23293A] border border-dashed border-[#38415A] text-xs font-semibold text-[#F3F4F6] flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-[#D4FF00]" />
                  Upload Custom Artwork (.PNG / .JPG)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#232836] flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                Continue to Audio Masters
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: AUDIO MASTERS & ISRC ASSIGNMENT */}
      {step === 2 && (
        <div className="p-6 rounded-xl bg-[#141720] border border-[#232836] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232836] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
                2. Lossless Audio Masters & ISRC Assignment
              </h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Upload real WAV/MP3/FLAC masters from your device or add studio synth
                stems. Every track receives a unique US-TNK-26 ISRC code.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="px-4 py-2 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-bold text-xs flex items-center gap-2 cursor-pointer">
                <FileAudio className="w-4 h-4" />
                Upload Audio File (.WAV / .MP3)
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleAddSynthTrack}
                className="px-3.5 py-2 rounded-lg bg-[#1C202B] hover:bg-[#252B3B] border border-[#2E3548] text-xs font-semibold text-[#F3F4F6] flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#D4FF00]" />
                Add Studio Track
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                className="p-4 rounded-xl bg-[#181B24] border border-[#232836] space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded bg-[#D4FF00]/15 text-[#D4FF00] font-mono-tech font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono-tech text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded border border-[#10B981]/25">
                      QC PASS • {track.sampleRate} • {track.integratedLufs.toFixed(1)}{' '}
                      LUFS
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        audioEngine.playTrack(track, title, activeCoverUrl)
                      }
                      className="px-2.5 py-1 rounded bg-[#232836] hover:bg-[#D4FF00] text-[#F3F4F6] hover:text-[#0A0B0E] text-xs font-mono-tech font-semibold transition-colors cursor-pointer"
                    >
                      ▶ Preview Audio
                    </button>
                  </div>

                  {tracks.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setTracks(tracks.filter((t) => t.id !== track.id))
                      }
                      className="text-xs text-[#EF4444] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Track
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono-tech text-[#9CA3AF] mb-1">
                      Track Title
                    </label>
                    <input
                      type="text"
                      value={track.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTracks(
                          tracks.map((t) =>
                            t.id === track.id ? { ...t, title: val } : t
                          )
                        );
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-tech text-[#9CA3AF] mb-1">
                      Mix / Version
                    </label>
                    <input
                      type="text"
                      value={track.version}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTracks(
                          tracks.map((t) =>
                            t.id === track.id ? { ...t, version: val } : t
                          )
                        );
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-tech text-[#9CA3AF] mb-1">
                      ISRC Code (Auto-Assigned)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={track.isrcCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTracks(
                            tracks.map((t) =>
                              t.id === track.id ? { ...t, isrcCode: val } : t
                            )
                          );
                        }}
                        className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-xs text-[#D4FF00] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setTracks(
                            tracks.map((t) =>
                              t.id === track.id
                                ? { ...t, isrcCode: generateIsrcCode() }
                                : t
                            )
                          )
                        }
                        className="h-10 px-2.5 rounded-lg bg-[#1C202B] text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
                        title="Regenerate ISRC"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-tech text-[#9CA3AF] mb-1">
                      Songwriter Legal Name(s)
                    </label>
                    <input
                      type="text"
                      value={track.songwriterLegalName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTracks(
                          tracks.map((t) =>
                            t.id === track.id
                              ? { ...t, songwriterLegalName: val }
                              : t
                          )
                        );
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#232836] flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg bg-[#1C202B] text-xs font-semibold text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
            >
              ← Back to Metadata
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-lg bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              Continue to Royalty Splits
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AUTOMATED ROYALTY SPLITS ENGINE */}
      {step === 3 && (
        <div className="p-6 rounded-xl bg-[#141720] border border-[#232836] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232836] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
                3. Automated Collaborator Royalty Splits
              </h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Tank Distribution automatically routes net streaming payouts to every
                collaborator. Total allocation must equal exactly 100%.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleBalanceSplits}
                className="px-3.5 py-2 rounded-lg bg-[#1C202B] hover:bg-[#252B3B] border border-[#2E3548] text-xs font-mono-tech text-[#D4FF00] cursor-pointer"
              >
                Auto-Balance 100%
              </button>
              <button
                type="button"
                onClick={() =>
                  setSplits([
                    ...splits,
                    {
                      id: `spl-${Date.now()}`,
                      releaseId: 'pending',
                      collaboratorName: 'New Collaborator',
                      collaboratorEmail: 'collab@studio.io',
                      role: 'Producer',
                      sharePercentage: 0,
                      status: 'Pending',
                      payoutMethod: 'Stripe Connect',
                    },
                  ])
                }
                className="px-3.5 py-2 rounded-lg bg-[#D4FF00] text-[#0A0B0E] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Collaborator
              </button>
            </div>
          </div>

          {/* 100% Allocation Meter */}
          <div className="p-4 rounded-xl bg-[#0E1117] border border-[#232836]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono-tech uppercase text-[#9CA3AF]">
                TOTAL ROYALTY SHARE ALLOCATION
              </span>
              <span
                className={`text-sm font-mono-tech font-bold flex items-center gap-1.5 ${
                  isSplitValid ? 'text-[#10B981]' : 'text-[#F59E0B]'
                }`}
              >
                {isSplitValid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    100.00% LOCKED & VERIFIED
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    {splitTotal.toFixed(2)}% (Must equal 100%)
                  </>
                )}
              </span>
            </div>
            <div className="w-full h-3 bg-[#1A1F2C] rounded-full overflow-hidden flex">
              {splits.map((s, i) => {
                const colors = ['#D4FF00', '#10B981', '#38BDF8', '#FF6B2C', '#A855F7'];
                return (
                  <div
                    key={s.id}
                    style={{
                      width: `${Math.min(100, Math.max(0, s.sharePercentage))}%`,
                      backgroundColor: colors[i % colors.length],
                    }}
                    className="h-full transition-all duration-200"
                    title={`${s.collaboratorName}: ${s.sharePercentage}%`}
                  />
                );
              })}
            </div>
          </div>

          {/* Collaborator Rows */}
          <div className="space-y-3">
            {splits.map((split) => (
              <div
                key={split.id}
                className="p-4 rounded-xl bg-[#181B24] border border-[#232836] grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
              >
                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-mono-tech text-[#6B7280] mb-1">
                    Collaborator Name
                  </label>
                  <input
                    type="text"
                    value={split.collaboratorName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSplits(
                        splits.map((s) =>
                          s.id === split.id ? { ...s, collaboratorName: val } : s
                        )
                      );
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[10px] font-mono-tech text-[#6B7280] mb-1">
                    Payout Email
                  </label>
                  <input
                    type="email"
                    value={split.collaboratorEmail}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSplits(
                        splits.map((s) =>
                          s.id === split.id ? { ...s, collaboratorEmail: val } : s
                        )
                      );
                    }}
                    className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-xs text-[#F3F4F6] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono-tech text-[#6B7280] mb-1">
                    Role
                  </label>
                  <select
                    value={split.role}
                    onChange={(e) => {
                      const val = e.target.value as RoyaltySplitItem['role'];
                      setSplits(
                        splits.map((s) =>
                          s.id === split.id ? { ...s, role: val } : s
                        )
                      );
                    }}
                    className="w-full h-10 px-2.5 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                  >
                    <option value="Primary Artist">Primary Artist</option>
                    <option value="Producer">Producer</option>
                    <option value="Featured Artist">Featured Artist</option>
                    <option value="Mixing / Mastering">Mixing / Mastering</option>
                    <option value="Songwriter">Songwriter</option>
                    <option value="Label Share">Label Share</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-mono-tech text-[#6B7280] mb-1">
                    Payout Rail
                  </label>
                  <select
                    value={split.payoutMethod}
                    onChange={(e) => {
                      const val = e.target.value as RoyaltySplitItem['payoutMethod'];
                      setSplits(
                        splits.map((s) =>
                          s.id === split.id ? { ...s, payoutMethod: val } : s
                        )
                      );
                    }}
                    className="w-full h-10 px-2.5 rounded-lg bg-[#0E1117] border border-[#2A3042] text-xs text-[#F3F4F6] outline-none"
                  >
                    <option value="Stripe Connect">Stripe Connect</option>
                    <option value="Wise Multi-Currency">Wise Multi-Currency</option>
                    <option value="Bank Wire (SWIFT)">Bank Wire (SWIFT)</option>
                    <option value="USDC Vault">USDC Vault</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-mono-tech text-[#6B7280] mb-1">
                      Share %
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={split.sharePercentage}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSplits(
                          splits.map((s) =>
                            s.id === split.id ? { ...s, sharePercentage: val } : s
                          )
                        );
                      }}
                      className="w-full h-10 px-3 rounded-lg bg-[#0E1117] border border-[#2A3042] font-mono-tech text-xs font-bold text-[#D4FF00] outline-none"
                    />
                  </div>
                  {splits.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setSplits(splits.filter((s) => s.id !== split.id))
                      }
                      className="h-10 px-2.5 rounded-lg bg-[#EF4444]/15 text-[#EF4444] hover:bg-[#EF4444]/25 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#232836] flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg bg-[#1C202B] text-xs font-semibold text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
            >
              ← Back to Tracks
            </button>
            <button
              disabled={!isSplitValid}
              onClick={() => setStep(4)}
              className={`px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer ${
                isSplitValid
                  ? 'bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E]'
                  : 'bg-[#232836] text-[#6B7280] cursor-not-allowed'
              }`}
            >
              Continue to DSP Store Selection
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: DSP STORES & DDEX DEPLOYMENT */}
      {step === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 p-6 rounded-xl bg-[#141720] border border-[#232836] space-y-5">
            <div className="flex items-center justify-between border-b border-[#232836] pb-4">
              <div>
                <h2 className="text-base font-bold text-[#F3F4F6] uppercase tracking-wide">
                  4. Global DSP Store Selection & Content ID
                </h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  Select target streaming platforms for DDEX ERN 4.3 ingestion
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStores(DSP_STORES.map((s) => s.name))}
                  className="text-xs font-mono-tech text-[#D4FF00] hover:underline cursor-pointer"
                >
                  Select All ({DSP_STORES.length})
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DSP_STORES.map((store) => {
                const isSelected = selectedStores.includes(store.name);
                return (
                  <div
                    key={store.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedStores(
                          selectedStores.filter((s) => s !== store.name)
                        );
                      } else {
                        setSelectedStores([...selectedStores, store.name]);
                      }
                    }}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1A1F2E] border-[#D4FF00]/70'
                        : 'bg-[#0E1117] border-[#232836] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-mono-tech font-bold text-xs text-[#0A0B0E]"
                        style={{ backgroundColor: store.color }}
                      >
                        {store.badge}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#F3F4F6]">
                          {store.name}
                        </div>
                        <div className="text-[11px] font-mono-tech text-[#9CA3AF]">
                          {store.deliverySla}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#D4FF00] text-[#0A0B0E]'
                          : 'border border-[#38415A]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Content ID & Delivery Mode */}
            <div className="p-4 rounded-xl bg-[#0E1117] border border-[#232836] space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-[#F3F4F6]">
                    YouTube Content ID & TikTok / Meta Audio Fingerprinting
                  </div>
                  <div className="text-[11px] text-[#9CA3AF]">
                    Automatically claim & monetize user-generated videos using your
                    master audio
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableContentId}
                  onChange={(e) => setEnableContentId(e.target.checked)}
                  className="w-4 h-4 accent-[#D4FF00]"
                />
              </label>

              <div className="pt-3 border-t border-[#1E2330] flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono-tech text-[#9CA3AF]">
                  INGESTION PIPELINE MODE:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliverySpeed('instant')}
                    className={`px-3 py-1 rounded text-xs font-mono-tech cursor-pointer ${
                      deliverySpeed === 'instant'
                        ? 'bg-[#10B981] text-[#0A0B0E] font-bold'
                        : 'bg-[#1C202B] text-[#9CA3AF]'
                    }`}
                  >
                    Instant Direct-to-Live (Delivered)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliverySpeed('scheduled')}
                    className={`px-3 py-1 rounded text-xs font-mono-tech cursor-pointer ${
                      deliverySpeed === 'scheduled'
                        ? 'bg-[#F59E0B] text-[#0A0B0E] font-bold'
                        : 'bg-[#1C202B] text-[#9CA3AF]'
                    }`}
                  >
                    Queue in QC Review
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 cols: Pre-Flight Summary & Launch Button */}
          <div className="lg:col-span-4 p-6 rounded-xl bg-[#141720] border border-[#232836] flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={activeCoverUrl}
                  alt={title}
                  className="w-16 h-16 rounded-lg object-cover border border-[#2E3548]"
                />
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-mono-tech bg-[#D4FF00]/15 text-[#D4FF00] rounded font-bold">
                    {releaseType} • {catalogNumber}
                  </span>
                  <h3 className="text-base font-bold text-[#F3F4F6] mt-1">
                    {title}
                  </h3>
                  <p className="text-xs text-[#9CA3AF]">{primaryArtist}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0E1117] border border-[#232836] space-y-2.5 text-xs">
                <div className="font-mono-tech text-[#9CA3AF] uppercase text-[11px]">
                  DDEX ERN 4.3 Pre-Flight Validation
                </div>
                {[
                  `3000×3000px RGB Artwork Spec Verified`,
                  `UPC Barcode Assigned (${upcCode})`,
                  `${tracks.length} Lossless Track(s) with US-TNK ISRCs`,
                  `100.00% Royalty Splits Locked (${splits.length} Collaborators)`,
                  `${selectedStores.length} Global DSP Endpoints Selected`,
                ].map((check) => (
                  <div
                    key={check}
                    className="flex items-center gap-2 text-[#10B981] font-mono-tech text-[11px]"
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#232836]">
              <button
                disabled={isSubmitting || selectedStores.length === 0}
                onClick={handleDeployRelease}
                className="w-full py-3.5 px-5 rounded-xl bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_28px_rgba(212,255,0,0.3)] transition-all cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                {isSubmitting
                  ? 'DEPLOYING DDEX PACKAGE...'
                  : 'DEPLOY RELEASE TO DSPs'}
              </button>
              <button
                onClick={() => setStep(3)}
                className="w-full py-2 rounded-lg bg-[#1C202B] text-xs font-semibold text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
              >
                ← Back to Royalty Splits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
