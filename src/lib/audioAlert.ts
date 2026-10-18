// Web Audio API based sound synthesizer for zero-latency instant alerts
export type SoundPreset = 'bell' | 'siren' | 'chime' | 'gentle';

class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private isUnlocked = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (this.isUnlocked) return;
        try {
          const ctx = this.getAudioContext();
          if (ctx && ctx.state === 'suspended') {
            ctx.resume();
          }
          this.isUnlocked = true;
          window.removeEventListener('pointerdown', unlockAudio);
          window.removeEventListener('keydown', unlockAudio);
          window.removeEventListener('touchstart', unlockAudio);
        } catch {
          // ignore
        }
      };

      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Trigger haptic vibration if supported
  private triggerVibration(pattern: number[] = [200, 100, 200]) {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore
    }
  }

  // Play new order sound with configurable preset, volume, and repeat count
  playNewOrderSound(preset: SoundPreset = 'bell', volume = 0.5, repeats = 1, vibrate = true) {
    if (vibrate) {
      this.triggerVibration([300, 150, 300, 150, 400]);
    }

    const safeVolume = Math.max(0.05, Math.min(1, volume));
    const count = Math.max(1, Math.min(5, repeats));

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.playSingleSound(preset, safeVolume);
      }, i * 900);
    }
  }

  private playSingleSound(preset: SoundPreset, volume: number) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (preset === 'bell') {
        // Modern crisp triple-tone chime (Getir / Trendyol style)
        // Note 1: E5 (659.25 Hz)
        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        g1.gain.setValueAtTime(0.6, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc1.connect(g1);
        g1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.25);

        // Note 2: G#5 (830.61 Hz)
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(830.61, now + 0.12);
        g2.gain.setValueAtTime(0.7, now + 0.12);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(g2);
        g2.connect(masterGain);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.4);

        // Note 3: B5 (987.77 Hz)
        const osc3 = ctx.createOscillator();
        const g3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(987.77, now + 0.24);
        g3.gain.setValueAtTime(0.8, now + 0.24);
        g3.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        osc3.connect(g3);
        g3.connect(masterGain);
        osc3.start(now + 0.24);
        osc3.stop(now + 0.7);

      } else if (preset === 'siren') {
        // Urgent kitchen attention alarm (alternating buzzer)
        const frequencies = [880, 700, 880, 700];
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const noteTime = now + idx * 0.14;
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, noteTime);
          g.gain.setValueAtTime(0.7, noteTime);
          g.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.13);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(noteTime);
          osc.stop(noteTime + 0.13);
        });

      } else if (preset === 'chime') {
        // Smooth crystal elevator two-tone
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const noteTime = now + idx * 0.18;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);
          g.gain.setValueAtTime(0.65, noteTime);
          g.gain.exponentialRampToValueAtTime(0.0005, noteTime + 0.5);
          osc.connect(g);
          g.connect(masterGain);
          osc.start(noteTime);
          osc.stop(noteTime + 0.5);
        });

      } else if (preset === 'gentle') {
        // Soft ping
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        g.gain.setValueAtTime(0.5, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.5);
      }
    } catch {
      // Audio autoplay policy catch
    }
  }

  // Quick soft click sound for optimistic cart increment
  playCartClickSound() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  // Status changed chime (Courier on the way / Delivered)
  playStatusUpdateSound() {
    try {
      this.triggerVibration([150, 80, 150]);
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // ignore
    }
  }
}

export const audioAlert = new AudioAlertService();
