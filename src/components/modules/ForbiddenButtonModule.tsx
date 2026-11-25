import { useEffect, useRef, useState } from 'react';
import type { ForbiddenResult, Locale, TrailPoint } from '../../types/mindprint';
import { TRANSLATIONS } from '../../i18n/translations';
import { SoundEngine } from '../../engine/sound';

interface ForbiddenButtonModuleProps {
  locale: Locale;
  onComplete: (result: ForbiddenResult) => void;
}

const DURATION_MS = 7000;

export function ForbiddenButtonModule({ locale, onComplete }: ForbiddenButtonModuleProps) {
  const t = TRANSLATIONS[locale];
  const [elapsedMs, setElapsedMs] = useState(0);
  const [badgeText, setBadgeText] = useState<string | null>(null);
  const [baitText, setBaitText] = useState<string>('');
  const [breathing, setBreathing] = useState(false);
  const [leanOffset, setLeanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [outcome, setOutcome] = useState<'active' | 'pressed' | 'resisted'>('active');
  const [finalResult, setFinalResult] = useState<ForbiddenResult | null>(null);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const doneRef = useRef(false);
  const startAtRef = useRef<number>(performance.now());
  const minDistRef = useRef<number>(280);
  const hoverMsRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(performance.now());
  const isNearRef = useRef<boolean>(false);
  const wasOutsideApproachRef = useRef<boolean>(true);
  const approachCountRef = useRef<number>(0);
  const inputModeRef = useRef<'mouse' | 'touch'>('mouse');
  const trailRef = useRef<TrailPoint[]>([]);
  const lastTrailSampleRef = useRef<number>(0);
  const badgeStageRef = useRef<number>(0);
  const finishTimeoutRef = useRef<number | null>(null);

  const finalize = (pressed: boolean, pressTimeMs: number | null) => {
    if (doneRef.current) return;
    doneRef.current = true;

    const result: ForbiddenResult = {
      pressed,
      pressTimeMs,
      pressCount: pressed ? 1 : 0,
      minDistancePx: Math.round(minDistRef.current),
      hoverDurationMs: Math.round(hoverMsRef.current),
      approachCount: approachCountRef.current,
      inputMode: inputModeRef.current,
      trail: trailRef.current,
    };

    setOutcome(pressed ? 'pressed' : 'resisted');
    setFinalResult(result);

    if (pressed) {
      SoundEngine.playButtonSmash();
    } else {
      SoundEngine.playReactorSuccess();
    }

    finishTimeoutRef.current = window.setTimeout(() => {
      onComplete(result);
    }, 1300);
  };

  useEffect(() => {
    startAtRef.current = performance.now();
    lastFrameRef.current = performance.now();
    let rafId = 0;

    const loop = (now: number) => {
      if (doneRef.current) return;
      const dt = Math.min(100, now - lastFrameRef.current);
      lastFrameRef.current = now;
      const elapsed = now - startAtRef.current;

      setElapsedMs(Math.min(DURATION_MS, elapsed));

      if (isNearRef.current) {
        hoverMsRef.current += dt;
      }

      if (elapsed >= 1600 && badgeStageRef.current < 1) {
        badgeStageRef.current = 1;
        setBadgeText('1');
        SoundEngine.playNotifyPop();
      }
      if (elapsed >= 3000 && badgeStageRef.current < 2) {
        badgeStageRef.current = 2;
        setBaitText(t.forbidden.bait1);
      }
      if (elapsed >= 4300 && badgeStageRef.current < 3) {
        badgeStageRef.current = 3;
        setBreathing(true);
        setBaitText(t.forbidden.bait2);
        SoundEngine.playHeartbeat(0.65);
      }
      if (elapsed >= 5500 && badgeStageRef.current < 4) {
        badgeStageRef.current = 4;
        setBadgeText('99+');
        setBaitText(t.forbidden.bait3);
        SoundEngine.playNotifyPop();
      }

      if (elapsed >= DURATION_MS) {
        finalize(false, null);
        return;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      if (finishTimeoutRef.current !== null) window.clearTimeout(finishTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trackPointer = (clientX: number, clientY: number, pointerType: string) => {
    if (doneRef.current || !arenaRef.current || !buttonRef.current) return;
    if (pointerType === 'touch') {
      inputModeRef.current = 'touch';
    } else if (pointerType === 'mouse') {
      inputModeRef.current = 'mouse';
    }

    const arenaRect = arenaRef.current.getBoundingClientRect();
    const btnRect = buttonRef.current.getBoundingClientRect();

    const btnCx = btnRect.left + btnRect.width / 2;
    const btnCy = btnRect.top + btnRect.height / 2;
    const btnRadius = btnRect.width / 2;
    const rawDist = Math.hypot(clientX - btnCx, clientY - btnCy);
    const edgeDist = Math.max(0, rawDist - btnRadius);

    if (edgeDist < minDistRef.current) {
      minDistRef.current = edgeDist;
    }
    isNearRef.current = edgeDist <= 18;

    if (rawDist > btnRadius + 95) {
      wasOutsideApproachRef.current = true;
    } else if (rawDist < btnRadius + 48 && wasOutsideApproachRef.current) {
      wasOutsideApproachRef.current = false;
      approachCountRef.current += 1;
    }

    // Subtle magnetic lean after 4.3s
    if (breathing) {
      const dx = clientX - btnCx;
      const dy = clientY - btnCy;
      const len = Math.max(1, Math.hypot(dx, dy));
      setLeanOffset({
        x: Math.round((dx / len) * 6),
        y: Math.round((dy / len) * 6),
      });
    }

    const now = performance.now();
    if (now - lastTrailSampleRef.current >= 120 && trailRef.current.length < 40) {
      lastTrailSampleRef.current = now;
      const nx = Math.min(1, Math.max(0, (clientX - arenaRect.left) / arenaRect.width));
      const ny = Math.min(1, Math.max(0, (clientY - arenaRect.top) / arenaRect.height));
      trailRef.current.push({
        x: Number(nx.toFixed(3)),
        y: Number(ny.toFixed(3)),
        t: Math.round(now - startAtRef.current),
      });
    }
  };

  const remainingSec = Math.max(0, (DURATION_MS - elapsedMs) / 1000).toFixed(1);
  const progressPct = Math.min(100, (elapsedMs / DURATION_MS) * 100);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div
        className={`swiss-card p-6 sm:p-8 ${
          outcome === 'pressed' ? 'animate-shockwave border-[#FF3B1F]' : ''
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#141413]/20 pb-3 font-mono-num text-xs font-bold">
          <span className="text-[#FF3B1F]">02 / 06 // FORBIDDEN BUTTON</span>
          <span className="text-[#141413]">{remainingSec}s</span>
        </div>

        {/* Top 7s countdown bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full border border-[#141413] bg-[#EBE7DC]">
          <div
            className="h-full bg-[#141413] transition-none"
            style={{ width: `${100 - progressPct}%` }}
          />
        </div>

        <h2 className="font-display mt-5 text-2xl font-black tracking-tight sm:text-3xl">
          {t.forbidden.instruction}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-[#57534E]">{t.forbidden.sub}</p>

        {/* Interactive Tracking Arena */}
        <div
          ref={arenaRef}
          onPointerMove={(e) => trackPointer(e.clientX, e.clientY, e.pointerType)}
          onPointerDown={(e) => trackPointer(e.clientX, e.clientY, e.pointerType)}
          className={`relative mt-6 flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-[#141413] p-6 transition-colors ${
            outcome === 'pressed'
              ? 'bg-[#FF3B1F]/15'
              : outcome === 'resisted'
                ? 'bg-[#C6F600]/20'
                : 'bg-[#EBE7DC]/70'
          }`}
          style={{ touchAction: 'none' }}
        >
          {/* Machined metal bezel */}
          <div
            className="relative flex items-center justify-center rounded-full border-4 border-[#141413] bg-[#D6D1C4] p-4 shadow-[0_10px_0_#141413]"
            style={{
              transform: `translate(${leanOffset.x}px, ${leanOffset.y}px)`,
              transition: 'transform 160ms ease-out',
            }}
          >
            <button
              ref={buttonRef}
              type="button"
              disabled={outcome !== 'active'}
              onClick={() => {
                if (doneRef.current) return;
                const pressMs = Math.round(performance.now() - startAtRef.current);
                finalize(true, pressMs);
              }}
              className={`relative flex h-40 w-40 cursor-pointer select-none flex-col items-center justify-center rounded-full border-[3px] border-[#141413] bg-gradient-to-b from-[#FF5D44] via-[#FF3B1F] to-[#C81E05] text-white shadow-[0_8px_0_#7F1202] transition-transform active:translate-y-1.5 active:shadow-[0_2px_0_#7F1202] ${
                breathing && outcome === 'active' ? 'animate-button-breathe' : ''
              }`}
            >
              {/* Gloss highlight */}
              <span className="pointer-events-none absolute top-3 h-8 w-24 rounded-full bg-white/25 blur-[1px]" />
              <span className="font-display relative z-10 px-3 text-center text-lg font-black leading-tight tracking-tight">
                {t.forbidden.buttonText}
              </span>

              {/* Psychological Unread Notification Badge */}
              {badgeText && outcome === 'active' && (
                <span className="font-mono-num absolute -right-1 -top-1 flex h-9 min-w-[36px] items-center justify-center rounded-full border-2 border-[#141413] bg-[#C6F600] px-2 text-xs font-black text-[#141413] shadow-[2px_2px_0px_#141413]">
                  {badgeText}
                </span>
              )}
            </button>
          </div>

          {/* Tempting whisper or Result Stamp */}
          <div className="mt-7 min-h-[44px] text-center">
            {outcome === 'active' && baitText && (
              <p className="inline-block rounded border border-[#141413]/30 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#141413]">
                {baitText}
              </p>
            )}

            {outcome === 'pressed' && finalResult && (
              <div className="inline-flex flex-col items-center rounded border-2 border-[#141413] bg-[#FF3B1F] px-4 py-2 text-white shadow-[3px_3px_0px_#141413]">
                <span className="font-mono-num text-xs font-black tracking-wider">
                  {t.forbidden.caughtTitle}
                </span>
                <span className="font-mono-num text-sm font-bold">
                  {t.forbidden.caughtPrefix}{' '}
                  {((finalResult.pressTimeMs ?? 0) / 1000).toFixed(2)}
                  {t.forbidden.secondsSuffix}
                </span>
              </div>
            )}

            {outcome === 'resisted' && finalResult && (
              <div className="inline-flex flex-col items-center rounded border-2 border-[#141413] bg-[#C6F600] px-4 py-2 text-[#141413] shadow-[3px_3px_0px_#141413]">
                <span className="font-mono-num text-xs font-black tracking-wider">
                  {t.forbidden.resistedTitle}
                </span>
                <span className="font-mono-num text-sm font-bold">
                  {finalResult.inputMode === 'touch'
                    ? `${t.forbidden.resistedTouchPrefix} ${finalResult.approachCount}`
                    : `${t.forbidden.resistedMousePrefix} ${finalResult.minDistancePx}px`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
