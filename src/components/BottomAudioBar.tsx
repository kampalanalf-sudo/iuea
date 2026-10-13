import React, { useEffect, useRef, useState } from 'react';
import {
  Disc3,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { audioEngine } from '../utils/audioEngine';
import { ReleaseItem, TrackItem } from '../types/distribution';

interface BottomAudioBarProps {
  releases: ReleaseItem[];
}

function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
}

export const BottomAudioBar: React.FC<BottomAudioBarProps> = ({ releases }) => {
  const [engineState, setEngineState] = useState(audioEngine.getState());
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return audioEngine.subscribe(() => {
      setEngineState({ ...audioEngine.getState() });
    });
  }, []);

  // Real-time studio spectrum & waveform visualizer
  useEffect(() => {
    let animId: number;
    const renderVisualizer = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          const freq = audioEngine.getFrequencyData();
          const barCount = 28;
          const gap = 3;
          const barWidth = (width - gap * (barCount - 1)) / barCount;

          for (let i = 0; i < barCount; i++) {
            const val = engineState.isPlaying
              ? freq[i % freq.length] || 18
              : 14 + Math.sin(i * 0.6) * 6;
            const normalized = Math.max(0.12, val / 255);
            const barHeight = Math.max(4, normalized * (height - 4));
            const x = i * (barWidth + gap);
            const y = (height - barHeight) / 2;

            if (engineState.isPlaying) {
              ctx.fillStyle = normalized > 0.65 ? '#FF6B2C' : '#D4FF00';
            } else {
              ctx.fillStyle = '#2A3042';
            }
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, 1.5);
            ctx.fill();
          }
        }
      }
      animId = requestAnimationFrame(renderVisualizer);
    };

    animId = requestAnimationFrame(renderVisualizer);
    return () => cancelAnimationFrame(animId);
  }, [engineState.isPlaying]);

  const allTracks: { track: TrackItem; release: ReleaseItem }[] = [];
  releases.forEach((rel) => {
    rel.tracks.forEach((trk) => {
      allTracks.push({ track: trk, release: rel });
    });
  });

  const activeEntry =
    allTracks.find((item) => item.track.id === engineState.currentTrack?.id) ||
    allTracks[0];

  const handlePlayToggle = () => {
    if (!engineState.currentTrack && activeEntry) {
      audioEngine.playTrack(
        activeEntry.track,
        activeEntry.release.title,
        activeEntry.release.coverArtUrl
      );
    } else {
      audioEngine.togglePlayPause();
    }
  };

  const handleSkip = (dir: -1 | 1) => {
    if (allTracks.length === 0) return;
    const currentIdx = allTracks.findIndex(
      (item) => item.track.id === engineState.currentTrack?.id
    );
    const nextIdx =
      currentIdx === -1
        ? 0
        : (currentIdx + dir + allTracks.length) % allTracks.length;
    const next = allTracks[nextIdx];
    audioEngine.playTrack(
      next.track,
      next.release.title,
      next.release.coverArtUrl
    );
  };

  const displayTrack = engineState.currentTrack || activeEntry?.track;
  const displayCover =
    engineState.currentCoverUrl || activeEntry?.release.coverArtUrl || '';
  const displayReleaseTitle =
    engineState.currentReleaseTitle || activeEntry?.release.title || '';

  if (!displayTrack) return null;

  const progressPercent =
    engineState.duration > 0
      ? Math.min(100, (engineState.currentTime / engineState.duration) * 100)
      : 0;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-[74px] bg-[#0D0F14]/95 backdrop-blur-xl border-t border-[#232836] px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Left: Active Master Track Info */}
      <div className="flex items-center gap-3.5 min-w-[220px] max-w-[300px]">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#2A3042] shrink-0 bg-[#181B24]">
          {displayCover ? (
            <img
              src={displayCover}
              alt={displayTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Disc3 className="w-6 h-6 text-[#D4FF00]" />
            </div>
          )}
          {engineState.isPlaying && (
            <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#D4FF00] animate-ping" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#F3F4F6] truncate">
              {displayTrack.title}
            </p>
            {displayTrack.explicitLyrics && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono-tech font-bold bg-[#232836] text-[#D4FF00] rounded">
                E
              </span>
            )}
          </div>
          <p className="text-xs text-[#9CA3AF] truncate">
            {displayTrack.primaryArtist} •{' '}
            <span className="text-[#6B7280]">{displayReleaseTitle}</span>
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono-tech text-[#D4FF00]/90">
              {displayTrack.isrcCode}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Studio Transport & Waveform Scrubber */}
      <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleSkip(-1)}
            className="p-1.5 text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors cursor-pointer"
            title="Previous Master Track"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlayToggle}
            className="w-9 h-9 rounded-full bg-[#D4FF00] hover:bg-[#e1ff33] text-[#0A0B0E] flex items-center justify-center shadow-[0_0_20px_rgba(212,255,0,0.3)] transition-all cursor-pointer"
            title={engineState.isPlaying ? 'Pause Master Preview' : 'Play Master Preview'}
          >
            {engineState.isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          <button
            onClick={() => handleSkip(1)}
            className="p-1.5 text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors cursor-pointer"
            title="Next Master Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Live Frequency Visualizer Canvas */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#232836]">
            <canvas
              ref={canvasRef}
              width={150}
              height={28}
              className="opacity-95"
            />
          </div>
        </div>

        {/* Scrubber Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono-tech text-[#9CA3AF] w-9 text-right">
            {formatDuration(engineState.currentTime)}
          </span>
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              audioEngine.seek(ratio * engineState.duration);
            }}
            className="flex-1 h-1.5 bg-[#1C202B] rounded-full overflow-hidden cursor-pointer relative group"
          >
            <div
              className="h-full bg-gradient-to-r from-[#D4FF00] to-[#10B981] rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-mono-tech text-[#6B7280] w-9">
            {formatDuration(engineState.duration)}
          </span>
        </div>
      </div>

      {/* Right: Studio LUFS Metering & Gain */}
      <div className="hidden md:flex items-center gap-4 min-w-[240px] justify-end">
        <div className="px-2.5 py-1 rounded bg-[#141720] border border-[#232836] flex items-center gap-2">
          <Radio
            className={`w-3.5 h-3.5 ${
              engineState.isPlaying
                ? 'text-[#10B981] animate-pulse'
                : 'text-[#6B7280]'
            }`}
          />
          <div className="text-[10px] font-mono-tech leading-tight">
            <div className="text-[#F3F4F6] font-semibold">
              {displayTrack.integratedLufs.toFixed(1)} LUFS •{' '}
              {displayTrack.truePeakDbtp.toFixed(1)} dBTP
            </div>
            <div className="text-[#6B7280]">{displayTrack.sampleRate}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              audioEngine.setVolume(engineState.volume > 0 ? 0 : 0.82)
            }
            className="text-[#9CA3AF] hover:text-[#F3F4F6] cursor-pointer"
          >
            {engineState.volume === 0 ? (
              <VolumeX className="w-4 h-4 text-[#EF4444]" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.02}
            value={engineState.volume}
            onChange={(e) => audioEngine.setVolume(parseFloat(e.target.value))}
            className="w-20 accent-[#D4FF00] cursor-pointer h-1 bg-[#232836] rounded-lg"
          />
        </div>
      </div>
    </footer>
  );
};
