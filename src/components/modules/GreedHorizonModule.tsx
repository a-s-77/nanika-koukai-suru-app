import { useEffect, useRef, useState } from 'react';
import type { GreedResult, Locale, RunConfig } from '../../types/mindprint';
import { TRANSLATIONS } from '../../i18n/translations';
import { SoundEngine } from '../../engine/sound';

interface GreedHorizonModuleProps {
  locale: Locale;
  config: RunConfig;
  onComplete: (result: GreedResult) => void;
}

export function GreedHorizonModule({ locale, config, onComplete }: GreedHorizonModuleProps) {
  const t = TRANSLATIONS[locale];
  const [phase, setPhase] = useState<'ready' | 'charging' | 'banked' | 'exploded'>('ready');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [hint, setHint] = useState<string | null>(null);
  const [result, setResult] = useState<GreedResult | null>(null);

  const phaseRef = useRef<'ready' | 'charging' | 'banked' | 'exploded'>('ready');
  const holdStartRef = useRef<number>(0);
  const multRef = useRef<number>(1.0);
  const rafRef = useRef<number | null>(null);
  const finishTimeoutRef = useRef<number | null>(null);

  // Jitter telemetry
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const jitterSamplesRef = useRef<Array<{ d: number; t: number }>>([]);

  const stopChargeLoop = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    SoundEngine.stopReactorLoop();
  };

  useEffect(() => {
    return () => {
      stopChargeLoop();
      if (finishTimeoutRef.current !== null) window.clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  const computePreReleaseJitter = (totalMs: number): number => {
    const samples = jitterSamplesRef.current;
    if (samples.length < 4) return 0.12;
    const lateStart = Math.max(0, totalMs - 650);
    const earlySum = samples
      .filter((s) => s.t < Math.min(650, totalMs * 0.5))
      .reduce((acc, s) => acc + s.d, 0);
    const lateSum = samples.filter((s) => s.t >= lateStart).reduce((acc, s) => acc + s.d, 0);
    const ratio = lateSum / Math.max(8, earlySum + 12);
    return Number(Math.min(1, Math.max(0.05, ratio * 0.35)).toFixed(2));
  };

  const finishCharge = (exploded: boolean) => {
    if (phaseRef.current !== 'charging') return;
    stopChargeLoop();

    const durationMs = Math.round(performance.now() - holdStartRef.current);
    const peak = exploded ? config.greedBurstMultiplier : Number(multRef.current.toFixed(2));
    const brinkRatio = exploded
      ? 1.0
      : Number(
          Math.min(
            0.99,
            Math.max(0, (peak - 1) / Math.max(0.1, config.greedBurstMultiplier - 1)),
          ).toFixed(3),
        );

    const greedRes: GreedResult = {
      exploded,
      peakMultiplier: peak,
      burstMultiplier: config.greedBurstMultiplier,
      brinkRatio,
      preReleaseJitter: computePreReleaseJitter(durationMs),
      holdDurationMs: durationMs,
    };

    phaseRef.current = exploded ? 'exploded' : 'banked';
    setPhase(exploded ? 'exploded' : 'banked');
    setMultiplier(peak);
    setResult(greedRes);

    if (exploded) {
      SoundEngine.playReactorExplode();
    } else {
      SoundEngine.playReactorSuccess();
    }

    finishTimeoutRef.current = window.setTimeout(() => {
      onComplete(greedRes);
    }, 1350);
  };

  const startHold = () => {
    if (phaseRef.current !== 'ready') return;
    SoundEngine.unlock();
    SoundEngine.startReactorLoop();

    phaseRef.current = 'charging';
    setPhase('charging');
    setHint(null);
    holdStartRef.current = performance.now();
    multRef.current = 1.0;
    jitterSamplesRef.current = [];

    const tick = () => {
      if (phaseRef.current !== 'charging') return;
      const tSec = (performance.now() - holdStartRef.current) / 1000;
      const nextM = 1 + 0.55 * tSec + 0.34 * tSec * tSec;
      multRef.current = nextM;
      setMultiplier(nextM);

      const p01 = Math.min(1, (nextM - 1) / Math.max(0.5, config.greedBurstMultiplier - 1));
      SoundEngine.updateReactor(p01);

      if (nextM >= config.greedBurstMultiplier) {
        finishCharge(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const releaseHold = () => {
    if (phaseRef.current !== 'charging') return;
    const heldMs = performance.now() - holdStartRef.current;
    if (heldMs < 300) {
      // Accidental short tap — reset cleanly
      stopChargeLoop();
      phaseRef.current = 'ready';
      setPhase('ready');
      setMultiplier(1.0);
      setHint(t.greed.tapTooShort);
      return;
    }
    finishCharge(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      e.preventDefault();
      if (phaseRef.current === 'ready') startHold();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (phaseRef.current === 'charging') releaseHold();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });

  const tension = Math.min(1, Math.max(0, (multiplier - 1) / 7));
  const jitterPx = phase === 'charging' ? tension * 5.5 : 0;
  const jitterTransform =
    phase === 'charging'
      ? `translate(${((Math.sin(multiplier * 29) * jitterPx)).toFixed(1)}px, ${(
          Math.cos(multiplier * 37) * jitterPx
        ).toFixed(1)}px)`
      : 'none';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div
        className={`swiss-card p-6 sm:p-8 ${
          phase === 'exploded' ? 'animate-shockwave border-[#FF3B1F]' : ''
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#141413]/20 pb-3 font-mono-num text-xs font-bold">
          <span className="text-[#FF3B1F]">05 / 06 // GREED HORIZON</span>
          <span className="text-[#57534E]">CONTAINMENT CHAMBER</span>
        </div>

        <h2 className="font-display mt-5 text-2xl font-black tracking-tight sm:text-3xl">
          {t.greed.instruction}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-[#57534E]">{t.greed.sub}</p>

        {/* High-voltage Reactor Chamber */}
        <div
          onPointerDown={(e) => {
            lastPosRef.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
            startHold();
          }}
          onPointerMove={(e) => {
            if (phaseRef.current !== 'charging' || !lastPosRef.current) return;
            const d = Math.hypot(e.clientX - lastPosRef.current.x, e.clientY - lastPosRef.current.y);
            lastPosRef.current = { x: e.clientX, y: e.clientY };
            jitterSamplesRef.current.push({
              d,
              t: performance.now() - holdStartRef.current,
            });
          }}
          onPointerUp={releaseHold}
          onPointerCancel={releaseHold}
          style={{ touchAction: 'none', transform: jitterTransform }}
          className={`relative mt-6 flex min-h-[300px] cursor-pointer select-none flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-[#141413] p-6 transition-colors ${
            phase === 'exploded'
              ? 'bg-[#FF3B1F] text-white'
              : phase === 'banked'
                ? 'bg-[#141413] text-[#C6F600]'
                : 'bg-[#111110] text-[#F4F2EC]'
          }`}
        >
          {/* Expanding plasma aura */}
          {phase !== 'exploded' && (
            <div
              className="pointer-events-none absolute rounded-full transition-transform duration-75"
              style={{
                width: `${110 + tension * 210}px`,
                height: `${110 + tension * 210}px`,
                background:
                  phase === 'banked'
                    ? 'radial-gradient(circle, rgba(198,246,0,0.34) 0%, rgba(198,246,0,0) 72%)'
                    : `radial-gradient(circle, rgba(255,59,31,${0.18 + tension * 0.55}) 0%, rgba(29,78,216,0.08) 55%, transparent 75%)`,
              }}
            />
          )}

          <div className="relative z-10 text-center">
            <div className="font-mono-num text-xs font-bold tracking-widest opacity-70">
              {phase === 'charging'
                ? t.greed.releaseHint
                : phase === 'exploded'
                  ? t.greed.explodedTitle
                  : phase === 'banked'
                    ? t.greed.bankedTitle
                    : 'REACTOR MULTIPLIER'}
            </div>

            <div className="font-mono-num mt-2 text-6xl font-bold tracking-tight sm:text-7xl">
              {phase === 'exploded' ? '×0.00' : `×${multiplier.toFixed(2)}`}
            </div>

            <div className="mt-5">
              {phase === 'ready' && (
                <span className="inline-block rounded border border-white/30 bg-white/10 px-4 py-2 font-mono-num text-xs font-bold">
                  {hint ?? t.greed.holdPrompt}
                </span>
              )}

              {phase === 'exploded' && result && (
                <div className="font-mono-num text-xs font-bold text-white/95">
                  {t.greed.explodedSub} (LIMIT ×{result.burstMultiplier.toFixed(2)})
                </div>
              )}

              {phase === 'banked' && result && (
                <div className="inline-flex flex-wrap items-center justify-center gap-2 font-mono-num text-xs font-bold">
                  <span className="rounded bg-[#C6F600] px-2.5 py-1 text-[#141413]">
                    {t.greed.marginPrefix} ×
                    {Math.max(0, result.burstMultiplier - result.peakMultiplier).toFixed(2)}
                  </span>
                  <span className="text-white/80">
                    (LIMIT ×{result.burstMultiplier.toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
