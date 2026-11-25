class SoundEngineImpl {
  private ctx: AudioContext | null = null;
  private muted = false;

  // Brush loop state
  private brushGain: GainNode | null = null;
  private brushFilter: BiquadFilterNode | null = null;
  private brushSource: AudioBufferSourceNode | null = null;

  // Reactor loop state
  private reactorOsc: OscillatorNode | null = null;
  private reactorSubOsc: OscillatorNode | null = null;
  private reactorGain: GainNode | null = null;

  // Synesthesia loop state
  private synNodes: Array<{ stop: () => void }> = [];
  private synPulseTimer: number | null = null;
  private synGain: GainNode | null = null;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.stopAllLoops();
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    if (!this.ctx) {
      try {
        this.ctx = new Ctor();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => undefined);
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public stopAllLoops(): void {
    this.stopBrushLoop();
    this.stopReactorLoop();
    this.stopSynesthesiaSound();
  }

  public playClick(pitch = 880): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(120, pitch * 0.42), now + 0.032);

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  public playShutter(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.08);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playHeartbeat(intensity = 0.7): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const level = Math.min(1, Math.max(0.15, intensity));

    const triggerThump = (offset: number, peak: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(92, now + offset);
      osc.frequency.exponentialRampToValueAtTime(42, now + offset + 0.09);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(peak, now + offset + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.13);
    };

    triggerThump(0, 0.22 * level);
    triggerThump(0.14, 0.12 * level);
  }

  public playNotifyPop(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [880, 1318.5].forEach((freq, idx) => {
      const start = now + idx * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.09, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.1);
    });
  }

  public playButtonSmash(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(190, now);
    osc1.frequency.linearRampToValueAtTime(95, now + 0.36);
    osc2.frequency.setValueAtTime(285, now);
    osc2.frequency.linearRampToValueAtTime(138, now + 0.36);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.44);
    osc2.stop(now + 0.44);
  }

  public playTick(step = 0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const base = 1050 + (step % 3) * 40;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.015);
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  public startBrushLoop(): void {
    this.stopBrushLoop();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.value = 0.001;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    this.brushSource = source;
    this.brushFilter = filter;
    this.brushGain = gain;
  }

  public updateBrush(speed: number): void {
    if (!this.ctx || !this.brushGain || !this.brushFilter || this.muted) return;
    const norm = Math.min(1, Math.max(0, speed / 22));
    const now = this.ctx.currentTime;
    this.brushGain.gain.setTargetAtTime(0.004 + norm * 0.045, now, 0.03);
    this.brushFilter.frequency.setTargetAtTime(800 + norm * 1900, now, 0.04);
  }

  public stopBrushLoop(): void {
    if (this.brushSource) {
      try {
        this.brushSource.stop();
        this.brushSource.disconnect();
      } catch {
        // ignore
      }
      this.brushSource = null;
    }
    this.brushFilter = null;
    this.brushGain = null;
  }

  public startReactorLoop(): void {
    this.stopReactorLoop();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    subOsc.type = 'triangle';
    osc.frequency.setValueAtTime(95, now);
    subOsc.frequency.setValueAtTime(47.5, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.15);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    subOsc.start(now);

    this.reactorOsc = osc;
    this.reactorSubOsc = subOsc;
    this.reactorGain = gain;
  }

  public updateReactor(progress01: number): void {
    if (!this.ctx || !this.reactorOsc || !this.reactorSubOsc || !this.reactorGain || this.muted) {
      return;
    }
    const p = Math.min(1.2, Math.max(0, progress01));
    const now = this.ctx.currentTime;
    const baseFreq = 95 + p * 310;
    this.reactorOsc.frequency.setTargetAtTime(baseFreq, now, 0.03);
    this.reactorSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.03);
    this.reactorGain.gain.setTargetAtTime(0.07 + p * 0.08, now, 0.04);
  }

  public stopReactorLoop(): void {
    if (this.reactorOsc) {
      try {
        this.reactorOsc.stop();
        this.reactorOsc.disconnect();
      } catch {
        // ignore
      }
      this.reactorOsc = null;
    }
    if (this.reactorSubOsc) {
      try {
        this.reactorSubOsc.stop();
        this.reactorSubOsc.disconnect();
      } catch {
        // ignore
      }
      this.reactorSubOsc = null;
    }
    if (this.reactorGain) {
      try {
        this.reactorGain.disconnect();
      } catch {
        // ignore
      }
      this.reactorGain = null;
    }
  }

  public playReactorSuccess(): void {
    this.stopReactorLoop();
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const start = now + i * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.09, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.34);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.36);
    });
  }

  public playReactorExplode(): void {
    this.stopReactorLoop();
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Noise burst
    const len = Math.floor(ctx.sampleRate * 0.65);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.16));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + 0.6);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // Sub boom
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(125, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.55);
    subGain.gain.setValueAtTime(0.32, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.6);
  }

  public startSynesthesiaSound(variant: 'A' | 'B'): void {
    this.stopSynesthesiaSound();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.001, now);
    master.gain.linearRampToValueAtTime(0.09, now + 0.35);
    master.connect(ctx.destination);
    this.synGain = master;

    if (variant === 'A') {
      // Warm detuned analog pad chord (C3, G3, B3, D4)
      const freqs = [130.81, 196.0, 246.94, 293.66];
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 540;
      filter.connect(master);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.45;
      lfoGain.gain.value = 180;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(now);
      this.synNodes.push({
        stop: () => {
          lfo.stop();
          lfo.disconnect();
        },
      });

      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f * (1 + (idx - 1.5) * 0.002), now);
        osc.connect(filter);
        osc.start(now);
        this.synNodes.push({
          stop: () => {
            osc.stop();
            osc.disconnect();
          },
        });
      });
    } else {
      // Crystalline high-harmonic sparkle pings (E5, B5, F#6, A#6)
      const notes = [659.25, 987.77, 1479.98, 1864.66];
      let step = 0;

      const ping = () => {
        if (!this.ctx || !this.synGain || this.muted) return;
        const t = this.ctx.currentTime;
        const freq = notes[step % notes.length];
        step += 1;

        const osc = this.ctx.createOscillator();
        const mod = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const env = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        mod.type = 'sine';
        mod.frequency.setValueAtTime(freq * 2.5, t);
        modGain.gain.setValueAtTime(freq * 0.35, t);
        modGain.gain.exponentialRampToValueAtTime(1, t + 0.25);

        env.gain.setValueAtTime(0.001, t);
        env.gain.linearRampToValueAtTime(0.42, t + 0.012);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

        mod.connect(modGain);
        modGain.connect(osc.frequency);
        osc.connect(env);
        env.connect(this.synGain);

        mod.start(t);
        osc.start(t);
        mod.stop(t + 0.38);
        osc.stop(t + 0.38);
      };

      ping();
      this.synPulseTimer = window.setInterval(ping, 260);
    }
  }

  public stopSynesthesiaSound(): void {
    if (this.synPulseTimer !== null) {
      window.clearInterval(this.synPulseTimer);
      this.synPulseTimer = null;
    }
    this.synNodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        // ignore
      }
    });
    this.synNodes = [];
    if (this.synGain) {
      try {
        this.synGain.disconnect();
      } catch {
        // ignore
      }
      this.synGain = null;
    }
  }

  public playRevealChord(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Lush Cmaj9 voicing
    const freqs = [261.63, 329.63, 392.0, 493.88, 587.33];
    freqs.forEach((f, idx) => {
      const start = now + idx * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.065, start + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.1);
    });
  }
}

export const SoundEngine = new SoundEngineImpl();
