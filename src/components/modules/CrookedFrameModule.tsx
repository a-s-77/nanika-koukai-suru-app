import { useEffect, useRef, useState } from 'react';
import type { CrookedResult, Locale, RunConfig } from '../../types/mindprint';
import { TRANSLATIONS } from '../../i18n/translations';
import { SoundEngine } from '../../engine/sound';

interface CrookedFrameModuleProps {
  locale: Locale;
  config: RunConfig;
  onComplete: (result: CrookedResult) => void;
}

const MAX_TIME_MS = 14000;

export function CrookedFrameModule({ locale, config, onComplete }: CrookedFrameModuleProps) {
  const t = TRANSLATIONS[locale];
  const [angle, setAngle] = useState<number>(config.crookedInitialAngle);
  const [remainingMs, setRemainingMs] = useState<number>(MAX_TIME_MS);
  const [locked, setLocked] = useState<boolean>(false);
  const [timedOut, setTimedOut] = useState<boolean>(false);

  const angleRef = useRef<number>(config.crookedInitialAngle);
  const startAtRef = useRef<number>(performance.now());
  const lockedRef = useRef<boolean>(false);
  const lastDirRef = useRef<number>(0);
  const reversalsRef = useRef<number>(0);
  const nudgeCountRef = useRef<number>(0);
  const lastTickStepRef = useRef<number>(Math.round(config.crookedInitialAngle * 2));
  const dragStartXRef = useRef<number | null>(null);
  const dragStartAngleRef = useRef<number>(config.crookedInitialAngle);
  const finishTimeoutRef = useRef<number | null>(null);

  const updateAngle = (nextRaw: number, isNudge = false) => {
    if (lockedRef.current) return;
    const clamped = Math.max(-12, Math.min(12, Number(nextRaw.toFixed(2))));
    const delta = clamped - angleRef.current;

    if (Math.abs(delta) > 0.02) {
      const dir = delta > 0 ? 1 : -1;
      if (lastDirRef.current !== 0 && dir !== lastDirRef.current) {
        reversalsRef.current += 1;
      }
      lastDirRef.current = dir;
    }

    if (isNudge) {
      nudgeCountRef.current += 1;
    }

    const step = Math.round(clamped * 2);
    if (step !== lastTickStepRef.current) {
      lastTickStepRef.current = step;
      SoundEngine.playTick(Math.abs(step));
    }

    angleRef.current = clamped;
    setAngle(clamped);
  };

  const handleLock = (wasTimeout = false) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    setTimedOut(wasTimeout);

    SoundEngine.playClick(760);

    const totalTimeMs = Math.min(MAX_TIME_MS, Math.round(performance.now() - startAtRef.current));
    const finalAngleDeg = Number(angleRef.current.toFixed(2));
    const absErrorDeg = Number(Math.abs(finalAngleDeg).toFixed(2));

    const result: CrookedResult = {
      initialAngleDeg: config.crookedInitialAngle,
      finalAngleDeg,
      absErrorDeg,
      directionReversals: reversalsRef.current,
      microNudgeCount: nudgeCountRef.current,
      totalTimeMs,
      timedOut: wasTimeout,
    };

    finishTimeoutRef.current = window.setTimeout(() => {
      onComplete(result);
    }, 1250);
  };

  useEffect(() => {
    startAtRef.current = performance.now();
    const timer = window.setInterval(() => {
      if (lockedRef.current) return;
      const elapsed = performance.now() - startAtRef.current;
      const rem = Math.max(0, MAX_TIME_MS - elapsed);
      setRemainingMs(rem);
      if (rem <= 0) {
        handleLock(true);
      }
    }, 60);

    return () => {
      window.clearInterval(timer);
      if (finishTimeoutRef.current !== null) window.clearTimeout(finishTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const absErr = Math.abs(angle).toFixed(2);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="swiss-card p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-[#141413]/20 pb-3 font-mono-num text-xs font-bold">
          <span className="text-[#FF3B1F]">03 / 06 // CROOKED FRAME</span>
          <span className="text-[#57534E]">{(remainingMs / 1000).toFixed(1)}s</span>
        </div>

        <h2 className="font-display mt-5 text-2xl font-black tracking-tight sm:text-3xl">
          {t.crooked.instruction}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-[#57534E]">{t.crooked.sub}</p>

        {/* Minimalist Gallery Wall (NO angle numbers shown while editing!) */}
        <div
          onPointerDown={(e) => {
            if (lockedRef.current) return;
            dragStartXRef.current = e.clientX;
            dragStartAngleRef.current = angleRef.current;
            (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (dragStartXRef.current === null || lockedRef.current) return;
            const dx = e.clientX - dragStartXRef.current;
            updateAngle(dragStartAngleRef.current + dx * 0.08, false);
          }}
          onPointerUp={() => {
            dragStartXRef.current = null;
          }}
          onPointerCancel={() => {
            dragStartXRef.current = null;
          }}
          className="relative mt-6 flex h-72 cursor-ew-resize select-none items-center justify-center overflow-hidden rounded-lg border-2 border-[#141413] bg-[#EBE7DC]"
          style={{ touchAction: 'none' }}
        >
          {/* Subtle mounting nail */}
          <div className="absolute top-5 h-2.5 w-2.5 rounded-full border border-[#141413] bg-[#57534E]" />

          {/* Post-lock 0.0 deg laser horizon reveal */}
          {locked && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 -translate-y-1/2 border-t-2 border-dashed border-[#FF3B1F]" />
          )}

          {/* Tilted Swiss Poster Frame */}
          <div
            className="relative w-56 border-[4px] border-[#141413] bg-white p-4 shadow-[6px_8px_0px_rgba(20,20,19,0.25)] transition-transform duration-75 sm:w-64"
            style={{ transform: `rotate(${angle}deg)` }}
          >
            <div className="flex items-center justify-between border-b border-[#141413] pb-1.5 font-mono-num text-[10px] font-bold">
              <span>{t.crooked.posterHeader}</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF3B1F]" />
            </div>

            <div className="my-4 grid grid-cols-3 gap-2">
              <div className="col-span-2 h-14 border border-[#141413] bg-[#141413]" />
              <div className="h-14 border border-[#141413] bg-[#1D4ED8]" />
              <div className="h-8 border border-[#141413] bg-[#C6F600]" />
              <div className="col-span-2 h-8 border border-[#141413] bg-[#F4F2EC]" />
            </div>

            <div className="font-mono-num text-[10px] font-bold tracking-wider text-[#57534E]">
              {t.crooked.posterBody}
            </div>
          </div>

          {locked && (
            <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded border-2 border-[#141413] bg-[#141413] px-3.5 py-1.5 font-mono-num text-xs font-bold text-[#F4F2EC]">
              {timedOut && <span className="text-[#FF3B1F]">{t.crooked.autoLocked} //</span>}
              <span>
                {t.crooked.residualPrefix} {absErr}°
              </span>
              {Math.abs(angle) <= 0.3 && (
                <span className="rounded bg-[#C6F600] px-1.5 py-0.5 text-[10px] text-[#141413]">
                  {t.crooked.perfectTag}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tactile Controls */}
        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={locked}
              onClick={() => updateAngle(angleRef.current - 0.2, true)}
              className="swiss-btn rounded bg-white px-3 py-2 font-mono-num text-xs font-bold disabled:opacity-50"
            >
              −0.2°
            </button>

            <input
              type="range"
              min={-12}
              max={12}
              step={0.05}
              value={angle}
              disabled={locked}
              onChange={(e) => updateAngle(parseFloat(e.target.value), false)}
              className="swiss-slider w-full"
              aria-label="Frame tilt slider"
            />

            <button
              type="button"
              disabled={locked}
              onClick={() => updateAngle(angleRef.current + 0.2, true)}
              className="swiss-btn rounded bg-white px-3 py-2 font-mono-num text-xs font-bold disabled:opacity-50"
            >
              +0.2°
            </button>
          </div>

          <p className="text-center font-mono-num text-[11px] text-[#57534E]">
            {t.crooked.dragHint}
          </p>

          <button
            type="button"
            disabled={locked}
            onClick={() => handleLock(false)}
            className="swiss-btn w-full rounded-md bg-[#141413] px-6 py-3.5 font-display text-base font-bold text-[#F4F2EC] hover:bg-[#1D4ED8] disabled:opacity-60"
          >
            {t.crooked.lockBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
