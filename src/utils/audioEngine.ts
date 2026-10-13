import { TrackItem } from '../types/distribution';

type Listener = () => void;

class TankStudioAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentTrack: TrackItem | null = null;
  private currentReleaseTitle: string = '';
  private currentCoverUrl: string = '';
  private currentTime: number = 0;
  private duration: number = 210;
  private volume: number = 0.82;
  private stepTimer: number | null = null;
  private progressTimer: number | null = null;
  private stepIndex: number = 0;
  private htmlAudio: HTMLAudioElement | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private listeners: Set<Listener> = new Set();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.78;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getState() {
    return {
      isPlaying: this.isPlaying,
      currentTrack: this.currentTrack,
      currentReleaseTitle: this.currentReleaseTitle,
      currentCoverUrl: this.currentCoverUrl,
      currentTime: this.currentTime,
      duration: this.duration,
      volume: this.volume,
    };
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser || !this.isPlaying) {
      return new Uint8Array(32);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
    if (this.htmlAudio) {
      this.htmlAudio.volume = this.volume;
    }
    this.notify();
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(this.duration, seconds));
    if (this.htmlAudio) {
      this.htmlAudio.currentTime = this.currentTime;
    }
    this.notify();
  }

  public playTrack(track: TrackItem, releaseTitle: string, coverUrl: string) {
    this.ensureContext();
    const isSameTrack = this.currentTrack?.id === track.id;

    if (isSameTrack && this.isPlaying) {
      this.pause();
      return;
    }

    this.stopInternalTimers();
    this.currentTrack = track;
    this.currentReleaseTitle = releaseTitle;
    this.currentCoverUrl = coverUrl;
    this.duration = track.durationSeconds || 210;
    if (!isSameTrack) {
      this.currentTime = 0;
      this.stepIndex = 0;
    }
    this.isPlaying = true;

    if (track.audioUrl) {
      this.startUploadedAudio(track.audioUrl);
    } else {
      this.startStudioSynthLoop(track.synthPreset || 'cyber-bass');
    }

    this.notify();
  }

  public togglePlayPause() {
    if (!this.currentTrack) return;
    if (this.isPlaying) {
      this.pause();
    } else {
      this.playTrack(this.currentTrack, this.currentReleaseTitle, this.currentCoverUrl);
    }
  }

  public pause() {
    this.isPlaying = false;
    this.stopInternalTimers();
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
    this.notify();
  }

  private stopInternalTimers() {
    if (this.stepTimer !== null) {
      window.clearInterval(this.stepTimer);
      this.stepTimer = null;
    }
    if (this.progressTimer !== null) {
      window.clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private startUploadedAudio(url: string) {
    if (!this.ctx || !this.masterGain) return;
    if (!this.htmlAudio) {
      this.htmlAudio = new Audio();
      this.htmlAudio.crossOrigin = 'anonymous';
    }
    if (this.htmlAudio.src !== url) {
      this.htmlAudio.src = url;
    }
    this.htmlAudio.currentTime = this.currentTime;
    this.htmlAudio.volume = this.volume;

    if (!this.mediaSource) {
      try {
        this.mediaSource = this.ctx.createMediaElementSource(this.htmlAudio);
        this.mediaSource.connect(this.masterGain);
      } catch {
        // Fallback if already connected
      }
    }

    this.htmlAudio.play().catch(() => {
      // Fallback to synth loop if browser blocks or blob expired
      this.startStudioSynthLoop('cyber-bass');
    });

    this.progressTimer = window.setInterval(() => {
      if (this.htmlAudio && this.isPlaying) {
        this.currentTime = Math.floor(this.htmlAudio.currentTime);
        if (this.htmlAudio.duration && !Number.isNaN(this.htmlAudio.duration)) {
          this.duration = Math.floor(this.htmlAudio.duration);
        }
        if (this.currentTime >= this.duration) {
          this.currentTime = 0;
          this.htmlAudio.currentTime = 0;
        }
        this.notify();
      }
    }, 250);
  }

  private startStudioSynthLoop(preset: TrackItem['synthPreset']) {
    if (!this.ctx || !this.masterGain) return;

    const bpmMap: Record<TrackItem['synthPreset'], number> = {
      'cyber-bass': 126,
      'afro-pulse': 114,
      'berlin-techno': 134,
      'neon-drift': 118,
      'sub-heavy': 140,
      'analog-horizon': 122,
    };

    const scales: Record<TrackItem['synthPreset'], number[]> = {
      'cyber-bass': [55, 55, 65.41, 55, 73.42, 65.41, 82.41, 73.42],
      'afro-pulse': [65.41, 73.42, 82.41, 98.0, 82.41, 73.42, 65.41, 98.0],
      'berlin-techno': [49.0, 49.0, 58.27, 49.0, 49.0, 65.41, 58.27, 49.0],
      'neon-drift': [61.74, 73.42, 82.41, 110.0, 92.5, 82.41, 73.42, 61.74],
      'sub-heavy': [41.2, 41.2, 49.0, 55.0, 41.2, 61.74, 55.0, 49.0],
      'analog-horizon': [55.0, 65.41, 82.41, 98.0, 110.0, 98.0, 82.41, 65.41],
    };

    const bpm = bpmMap[preset] || 124;
    const stepMs = (60 / bpm / 4) * 1000; // 16th note steps
    const bassNotes = scales[preset] || scales['cyber-bass'];

    const triggerStep = () => {
      if (!this.ctx || !this.masterGain || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      const step = this.stepIndex % 16;

      // 1. Punchy Studio Kick on 0, 4, 8, 12 (or syncopated for afro-pulse)
      const isKick =
        preset === 'afro-pulse'
          ? step === 0 || step === 3 || step === 6 || step === 8 || step === 11 || step === 14
          : step % 4 === 0;

      if (isKick) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(135, now);
        osc.frequency.exponentialRampToValueAtTime(36, now + 0.14);
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.23);
      }

      // 2. Crisp Metallic Hi-hat on off-beats
      if (step % 2 === 1 || step === 14) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(6400 + (step % 3) * 800, now);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(5200, now);
        gain.gain.setValueAtTime(step % 4 === 2 ? 0.12 : 0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
      }

      // 3. Analog Sub / Saw Bassline
      if (step % 2 === 0) {
        const noteFreq = bassNotes[(step / 2) % bassNotes.length];
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = preset === 'berlin-techno' ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(noteFreq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(680 + (step % 8) * 140, now);
        filter.frequency.exponentialRampToValueAtTime(160, now + 0.18);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.21);
      }

      // 4. Atmospheric Lead Pluck / Chord Stab
      if (step === 0 || step === 6 || step === 10 || step === 12) {
        const leadFreq = bassNotes[(step / 2) % bassNotes.length] * 4;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(leadFreq, now);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.29);
      }

      this.stepIndex++;
    };

    triggerStep();
    this.stepTimer = window.setInterval(triggerStep, stepMs);

    this.progressTimer = window.setInterval(() => {
      if (this.isPlaying) {
        this.currentTime += 1;
        if (this.currentTime >= this.duration) {
          this.currentTime = 0;
        }
        this.notify();
      }
    }, 1000);
  }
}

export const audioEngine = new TankStudioAudioEngine();
