import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { Locale, RawTelemetry } from '../types/mindprint';
import { TRANSLATIONS } from '../i18n/translations';

interface TelemetryReplayProps {
  raw: RawTelemetry;
  locale: Locale;
}

export function TelemetryReplay({ raw, locale }: TelemetryReplayProps) {
  const t = TRANSLATIONS[locale];
  const forbiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [replaySeed, setReplaySeed] = useState(0);

  useEffect(() => {
    const fCanvas = forbiddenCanvasRef.current;
    const sCanvas = strokeCanvasRef.current;
    if (!fCanvas || !sCanvas) return;

    let rafId = 0;
    const startMs = performance.now();
    const cycleMs = 3600;

    const render = (now: number) => {
      const progress = Math.min(1, ((now - startMs) % cycleMs) / 2800);

      // 1. Forbidden Button Orbit Replay
      {
        const dpr = window.devicePixelRatio || 1;
        const w = 260;
        const h = 190;
        if (fCanvas.width !== w * dpr) {
          fCanvas.width = w * dpr;
          fCanvas.height = h * dpr;
        }
        const ctx = fCanvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.fillStyle = '#F4F2EC';
          ctx.fillRect(0, 0, w, h);

          // Target forbidden button circle
          const bx = w / 2;
          const by = h / 2;
          ctx.fillStyle = raw.forbidden.pressed ? 'rgba(255, 59, 31, 0.25)' : 'rgba(255, 59, 31, 0.14)';
          ctx.beginPath();
          ctx.arc(bx, by, 38, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FF3B1F';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#141413';
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(raw.forbidden.pressed ? 'BREACHED' : 'FORBIDDEN', bx, by + 3);
          ctx.textAlign = 'left';

          const trail = raw.forbidden.trail;
          if (trail.length >= 2) {
            const maxIdx = Math.max(1, Math.floor(progress * (trail.length - 1)));
            ctx.beginPath();
            for (let i = 0; i <= maxIdx; i += 1) {
              const px = trail[i].x * w;
              const py = trail[i].y * h;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = '#1D4ED8';
            ctx.lineWidth = 2.2;
            ctx.lineCap = 'round';
            ctx.stroke();

            const head = trail[maxIdx];
            ctx.fillStyle = '#141413';
            ctx.beginPath();
            ctx.arc(head.x * w, head.y * h, 4.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = '#57534E';
            ctx.font = '700 10px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
              raw.forbidden.pressed ? 'DIRECT TAP HIT' : 'ZERO POINTER INTRUSION',
              bx,
              h - 14,
            );
            ctx.textAlign = 'left';
          }
        }
      }

      // 2. Freehand Sanctuary Stroke Replay
      {
        const dpr = window.devicePixelRatio || 1;
        const w = 260;
        const h = 190;
        if (sCanvas.width !== w * dpr) {
          sCanvas.width = w * dpr;
          sCanvas.height = h * dpr;
        }
        const ctx = sCanvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);

          ctx.strokeStyle = 'rgba(20, 20, 19, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(w / 2, 10);
          ctx.lineTo(w / 2, h - 10);
          ctx.moveTo(10, h / 2);
          ctx.lineTo(w - 10, h / 2);
          ctx.stroke();

          const pts = raw.freehand.points;
          if (pts.length >= 2) {
            const maxIdx = Math.max(1, Math.floor(progress * (pts.length - 1)));
            ctx.beginPath();
            for (let i = 0; i <= maxIdx; i += 1) {
              const px = pts[i].x * w;
              const py = pts[i].y * h;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = '#141413';
            ctx.lineWidth = 3.2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();

            ctx.fillStyle = '#FF3B1F';
            ctx.beginPath();
            ctx.arc(pts[0].x * w, pts[0].y * h, 4, 0, Math.PI * 2);
            ctx.fill();

            const tip = pts[maxIdx];
            ctx.fillStyle = '#1D4ED8';
            ctx.beginPath();
            ctx.arc(tip.x * w, tip.y * h, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [raw, replaySeed]);

  return (
    <div className="swiss-card p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-[#141413]/15 pb-3">
        <h3 className="font-mono-num text-xs font-bold uppercase tracking-wider text-[#141413]">
          {t.results.replayTitle}
        </h3>
        <button
          type="button"
          onClick={() => setReplaySeed((s) => s + 1)}
          className="inline-flex items-center gap-1 rounded border border-[#141413] bg-white px-2.5 py-1 font-mono-num text-[11px] font-bold hover:bg-[#EBE7DC]"
        >
          <RotateCcw className="h-3 w-3" />
          {t.results.replayBtn}
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center">
          <canvas
            ref={forbiddenCanvasRef}
            className="h-[190px] w-full max-w-[260px] rounded border border-[#141413]"
          />
          <div className="mt-2 font-mono-num text-[11px] font-bold text-[#57534E]">
            {t.results.replayForbiddenLabel}
          </div>
        </div>

        <div className="flex flex-col items-center">
          <canvas
            ref={strokeCanvasRef}
            className="h-[190px] w-full max-w-[260px] rounded border border-[#141413]"
          />
          <div className="mt-2 font-mono-num text-[11px] font-bold text-[#57534E]">
            {t.results.replayStrokeLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
