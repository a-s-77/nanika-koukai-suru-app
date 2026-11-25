import { useEffect, useRef, useState } from 'react';
import type { ChronoResult, Locale, RunConfig } from '../../types/mindprint';
import { TRANSLATIONS } from '../../i18n/translations';
import { SoundEngine } from '../../engine/sound';

interface ChronoModuleProps {
  locale: Locale;
  config: RunConfig;
  onComplete: (result: ChronoResult) => void;
}

type Stage = 'idle' | 'running' | 'revealed';

export function ChronoModule({ locale, config, onComplete }: ChronoModuleProps) {
  const t = TRANSLATIONS[locale];
  const [stage, setStage] = useState<Stage>('idle');
  const [displayMs, setDisplayMs] = useState(0);
  const [isMasked, setIsMasked] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [beatFlash, setBeatFlash] = useState(false);
  const [result, setResult] = useState<ChronoResult | null>(null);

  const stageRef = useRef<Stage>('idle');
  const mountedAtRef = useRef<number>(performance.now());
  const startAtRef = useRef<number>(0);
  const startDelayRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const beatIntervalRef = useRef<number | null>(null);
  const beatTimeoutRef = useRef<number | null>(null);
  const finishTimeoutRef = useRef<number | null>(null);

  const stopTimers = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    if (beatIntervalRef.current !== null) window.clearInterval(beatIntervalRef.current);
    if (beatTimeoutRef.current !== null) window.clearTimeout(beatTimeoutRef.current);
    rafRef.current = null;
    beatIntervalRef.current = null;
    beatTimeoutRef.current = null;
  };

  useEffect(() => {
    mountedAtRef.current = performance.now();
    return () => {
      stopTimers();
      if (finishTimeoutRef.current !== null) window.clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  const handleStart = () => {
    if (stageRef.current !== 'idle') return;
    SoundEngine.unlock();
    SoundEngine.playClick(920);

    const now = performance.now();
    startAtRef.current = now;
    startDelayRef.current = Math.round(now - mountedAtRef.current);
    stageRef.current = 'running';
    setStage('running');

    const beatIntervalMs = Math.round(60000 / config.chronoBpm);

    beatTimeoutRef.current = window.setTimeout(() => {
      if (stageRef.current !== 'running') return;
      setPulseActive(true);
      const fireBeat = () => {
        if (stageRef.current !== 'running') return;
        setBeatFlash(true);
        SoundEngine.playHeartbeat(0.75);
        window.setTimeout(() => setBeatFlash(false), 160);
      };
      fireBeat();
      beatIntervalRef.current = window.setInterval(fireBeat, beatIntervalMs);
    }, 1700);

    const tick = () => {
      if (stageRef.current !== 'running') return;
      const elapsed = performance.now() - startAtRef.current;
      setDisplayMs(elapsed);
      if (elapsed >= 1500) {
        setIsMasked(true);
      }
      if (elapsed >= 12000) {
        handleStop(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleStop = (forced = false) => {
    if (stageRef.current !== 'running') return;
    const elapsed = performance.now() - startAtRef.current;
    if (!forced && elapsed < 280) return;

    stopTimers();
    SoundEngine.playClick(540);
    stageRef.current = 'revealed';
    setStage('revealed');
    setIsMasked(false);
    setPulseActive(false);

    const actualMs = Math.round(elapsed);
    const errorMs = actualMs - 5000;
    const pulledByInterference =
      (config.chronoInterference === 'fast' && errorMs < -250) ||
      (config.chronoInterference === 'slow' && errorMs > 250);

    const chronoRes: ChronoResult = {
      actualMs,
      errorMs,
      interferenceDirection: config.chronoInterference,
      interferenceBpm: config.chronoBpm,
      pulledByInterference,
      startDelayMs: startDelayRef.current,
    };
    setResult(chronoRes);

    finishTimeoutRef.current = window.setTimeout(() => {
      onComplete(chronoRes);
    }, 1250);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      e.preventDefault();
      if (stageRef.current === 'idle') handleStart();
      else if (stageRef.current === 'running') handleStop(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const shownSeconds = (displayMs / 1000).toFixed(2);
  const revealedSec = result ? (result.actualMs / 1000).toFixed(2) : '0.00';
  const revealedDelta = result
    ? `${result.errorMs >= 0 ? '+' : ''}${(result.errorMs / 1000).toFixed(2)}s`
    : '';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="swiss-card p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-[#141413]/20 pb-3 font-mono-num text-xs font-bold">
          <span className="text-[#FF3B1F]">01 / 06 // BLIND CHRONO</span>
          <span className="text-[#57534E]">{t.chrono.targetLine}</span>
        </div>

        <h2 className="font-display mt-5 text-2xl font-black tracking-tight sm:text-3xl">
          {t.chrono.instruction}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-[#57534E]">{t.chrono.sub}</p>

        {/* Dark OLED Chronometer Display */}
        <div className="relative mt-6 flex flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-[#141413] bg-[#111110] px-4 py-12 text-[#F4F2EC]">
          {/* Deceptive heartbeat ring */}
          <div
            className={`pointer-events-none absolute inset-4 rounded-lg border transition-all duration-150 ${
              beatFlash
                ? 'scale-[1.01] border-[#FF3B1F]/70 bg-[#FF3B1F]/10'
                : 'border-white/10'
            }`}
          />

          <div className="relative z-10 text-center">
            <div className="font-mono-num text-[11px] font-bold tracking-widest text-[#A8A29E]">
              {stage === 'running' && isMasked
                ? t.chrono.maskedNote
                : stage === 'revealed'
                  ? 'ACTUAL ELAPSED'
                  : 'INTERNAL CLOCK SENSOR'}
            </div>

            <div className="font-mono-num mt-3 text-6xl font-bold tracking-tight sm:text-7xl">
              {stage === 'idle' && <span className="text-[#F4F2EC]">0.00s</span>}
              {stage === 'running' && !isMasked && (
                <span className="text-[#C6F600]">{shownSeconds}s</span>
              )}
              {stage === 'running' && isMasked && (
                <span className="animate-pulse text-[#FF3B1F]">?.??s</span>
              )}
              {stage === 'revealed' && result && (
                <span
                  className={
                    Math.abs(result.errorMs) <= 250 ? 'text-[#C6F600]' : 'text-[#F4F2EC]'
                  }
                >
                  {revealedSec}s
                </span>
              )}
            </div>

            {stage === 'revealed' && result && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded border border-white/25 bg-white/10 px-2.5 py-1 font-mono-num text-xs font-bold">
                  Δ {revealedDelta}
                </span>
                <span
                  className={`rounded px-2.5 py-1 font-mono-num text-xs font-bold ${
                    result.pulledByInterference
                      ? 'bg-[#FF3B1F] text-white'
                      : 'bg-[#C6F600] text-[#141413]'
                  }`}
                >
                  {result.pulledByInterference ? t.chrono.pulledBadge : t.chrono.immuneBadge} (
                  {result.interferenceBpm} BPM)
                </span>
              </div>
            )}

            {stage === 'running' && pulseActive && (
              <div className="mt-4 flex items-center justify-center gap-1.5 font-mono-num text-[11px] text-white/45">
                <span
                  className={`h-2 w-2 rounded-full transition-colors ${
                    beatFlash ? 'bg-[#FF3B1F]' : 'bg-white/20'
                  }`}
                />
                <span>PULSE</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Trigger */}
        <div className="mt-6 flex flex-col items-center">
          {stage === 'idle' && (
            <button
              type="button"
              onClick={handleStart}
              className="swiss-btn w-full rounded-md bg-[#141413] px-6 py-4 font-display text-lg font-bold text-[#F4F2EC] hover:bg-[#1D4ED8]"
            >
              {t.chrono.startBtn}
            </button>
          )}

          {stage === 'running' && (
            <button
              type="button"
              onClick={() => handleStop(false)}
              className="swiss-btn w-full rounded-md bg-[#FF3B1F] px-6 py-4 font-display text-lg font-bold text-white"
            >
              {t.chrono.stopBtn}
            </button>
          )}

          {stage !== 'revealed' && (
            <p className="mt-3 font-mono-num text-xs text-[#57534E]">{t.chrono.spaceHint}</p>
          )}
        </div>
      </div>
    </div>
  );
}
