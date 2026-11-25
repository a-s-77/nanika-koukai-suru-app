import { useEffect, useRef, useState } from 'react';
import type { Locale, SynesthesiaChoice, SynesthesiaResult } from '../../types/mindprint';
import { TRANSLATIONS } from '../../i18n/translations';
import { SoundEngine } from '../../engine/sound';

interface SynesthesiaModuleProps {
  locale: Locale;
  muted: boolean;
  onComplete: (result: SynesthesiaResult) => void;
}

export function SynesthesiaModule({ locale, muted, onComplete }: SynesthesiaModuleProps) {
  const t = TRANSLATIONS[locale];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [step, setStep] = useState<'A' | 'B'>('A');
  const [spikiness, setSpikiness] = useState<number>(0.5);
  const [warmth, setWarmth] = useState<number>(0.5);

  const stepRef = useRef<'A' | 'B'>('A');
  const spikinessRef = useRef<number>(0.5);
  const warmthRef = useRef<number>(0.5);
  const stageStartRef = useRef<number>(performance.now());
  const soundAChoiceRef = useRef<SynesthesiaChoice | null>(null);
  const draggingRef = useRef<boolean>(false);

  useEffect(() => {
    stageStartRef.current = performance.now();
    SoundEngine.startSynesthesiaSound('A');
    return () => {
      SoundEngine.stopSynesthesiaSound();
    };
  }, []);

  // Re-trigger sound if mute toggles off while in module
  useEffect(() => {
    if (!muted) {
      SoundEngine.startSynesthesiaSound(stepRef.current);
    }
  }, [muted]);

  // 60fps Fourier morphing chamber
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId = 0;

    const render = (nowMs: number) => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const targetW = Math.max(280, Math.round(rect.width * dpr));
      const targetH = Math.max(240, Math.round(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const w = rect.width;
        const h = rect.height;
        const tSec = nowMs / 1000;
        const spk = spikinessRef.current;
        const wrm = warmthRef.current;

        ctx.fillStyle = '#111110';
        ctx.fillRect(0, 0, w, h);

        // Subtle XY crosshair
        ctx.strokeStyle = 'rgba(244, 242, 236, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

        // Color interpolation: cool cobalt/cyan (wrm=0) -> hot vermilion/amber (wrm=1)
        const r = Math.round(29 + wrm * 226);
        const g = Math.round(130 - Math.abs(wrm - 0.45) * 90);
        const b = Math.round(235 - wrm * 204);

        const cx = w / 2;
        const cy = h / 2;
        const baseR = Math.min(w, h) * 0.27;
        const lobes = Math.round(3 + spk * 10);
        const amp = baseR * (0.06 + spk * 0.32);
        const steps = 160;

        ctx.beginPath();
        for (let i = 0; i <= steps; i += 1) {
          const theta = (i / steps) * Math.PI * 2;
          const wave = Math.sin(theta * lobes + tSec * 2.1);
          const shaped =
            spk > 0.5 ? Math.sign(wave) * Math.pow(Math.abs(wave), 0.55) : wave;
          const subWave = Math.cos(theta * (lobes + 3) - tSec * 1.4) * 0.32;
          const rad = baseR + amp * (shaped * 0.74 + subWave * 0.26);
          const x = cx + Math.cos(theta) * rad;
          const y = cy + Math.sin(theta) * rad;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.28)`;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.stroke();

        // Control crosshair indicator dot
        const px = spk * w;
        const py = (1 - wrm) * h;
        ctx.strokeStyle = 'rgba(244, 242, 236, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#C6F600';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const updateFromPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));
    spikinessRef.current = Number(nx.toFixed(2));
    warmthRef.current = Number(ny.toFixed(2));
    setSpikiness(spikinessRef.current);
    setWarmth(warmthRef.current);
  };

  const handleLock = () => {
    SoundEngine.playClick(stepRef.current === 'A' ? 740 : 980);
    const choice: SynesthesiaChoice = {
      spikiness: spikinessRef.current,
      warmth: warmthRef.current,
      lockTimeMs: Math.round(performance.now() - stageStartRef.current),
    };

    if (stepRef.current === 'A') {
      soundAChoiceRef.current = choice;
      stepRef.current = 'B';
      setStep('B');
      stageStartRef.current = performance.now();
      // Reset handle slightly toward center so user actively sculpts B
      spikinessRef.current = 0.5;
      warmthRef.current = 0.5;
      setSpikiness(0.5);
      setWarmth(0.5);
      SoundEngine.startSynesthesiaSound('B');
    } else {
      SoundEngine.stopSynesthesiaSound();
      const soundA = soundAChoiceRef.current ?? {
        spikiness: 0.3,
        warmth: 0.7,
        lockTimeMs: 3000,
      };
      const soundB = choice;
      const contrastDelta = Number(
        Math.hypot(
          soundA.spikiness - soundB.spikiness,
          soundA.warmth - soundB.warmth,
        ).toFixed(3),
      );
      // Canonical Bouba-Kiki: Sound A (warm round) -> low spikiness & high warmth; Sound B (sharp chime) -> high spikiness & cooler
      const boubaKikiAlignment = Number(
        (
          ((soundB.spikiness - soundA.spikiness) + (soundA.warmth - soundB.warmth)) /
          2
        ).toFixed(3),
      );

      onComplete({
        soundA,
        soundB,
        contrastDelta,
        boubaKikiAlignment,
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="swiss-card p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-[#141413]/20 pb-3 font-mono-num text-xs font-bold">
          <span className="text-[#FF3B1F]">06 / 06 // SYNESTHESIA TUNER</span>
          <span className="rounded border border-[#141413] bg-[#141413] px-2 py-0.5 text-[#C6F600]">
            {step === 'A' ? t.synesthesia.soundALabel : t.synesthesia.soundBLabel}
          </span>
        </div>

        <h2 className="font-display mt-5 text-2xl font-black tracking-tight sm:text-3xl">
          {t.synesthesia.instruction}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-[#57534E]">
          {step === 'A' ? t.synesthesia.soundADesc : t.synesthesia.soundBDesc}
        </p>

        {muted && (
          <div className="mt-3 rounded border border-[#1D4ED8] bg-[#1D4ED8]/10 px-3 py-2 text-xs font-bold text-[#1D4ED8]">
            {step === 'A' ? t.synesthesia.mutedCaptionA : t.synesthesia.mutedCaptionB}
          </div>
        )}

        {/* Interactive 2D XY Acoustic Chamber */}
        <div className="relative mt-5 overflow-hidden rounded-lg border-2 border-[#141413] bg-[#111110]">
          <canvas
            ref={canvasRef}
            onPointerDown={(e) => {
              SoundEngine.unlock();
              draggingRef.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              updateFromPointer(e);
            }}
            onPointerMove={(e) => {
              if (!draggingRef.current) return;
              updateFromPointer(e);
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
            onPointerCancel={() => {
              draggingRef.current = false;
            }}
            className="block h-72 w-full cursor-crosshair sm:h-80"
            style={{ touchAction: 'none' }}
          />

          {/* Edge axis labels */}
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded bg-black/60 px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-white/80">
            {t.synesthesia.axisXLeft}
          </span>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-black/60 px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-white/80">
            {t.synesthesia.axisXRight}
          </span>
          <span className="pointer-events-none absolute left-1/2 top-2.5 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 font-mono-num text-[10px] font-bold text-[#FF3B1F]">
            ▲ {t.synesthesia.axisYTop}
          </span>
          <span className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded bg-black/60 px-2 py-0.5 font-mono-num text-[10px] font-bold text-[#60A5FA]">
            ▼ {t.synesthesia.axisYBottom}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between font-mono-num text-xs text-[#57534E]">
          <span>{t.synesthesia.dragHint}</span>
          <span>
            SPIKE {Math.round(spikiness * 100)}% / WARM {Math.round(warmth * 100)}%
          </span>
        </div>

        <button
          type="button"
          onClick={handleLock}
          className="swiss-btn mt-4 w-full rounded-md bg-[#FF3B1F] px-6 py-4 font-display text-lg font-bold text-white"
        >
          {step === 'A' ? t.synesthesia.nextSoundBtn : t.synesthesia.lockBtn}
        </button>
      </div>
    </div>
  );
}
