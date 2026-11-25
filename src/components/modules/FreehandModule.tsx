import { useEffect, useRef, useState } from 'react';
import type { FreehandResult, Locale, StrokePoint } from '../../types/mindprint';
import { TRANSLATIONS } from '../../i18n/translations';
import { SoundEngine } from '../../engine/sound';

interface FreehandModuleProps {
  locale: Locale;
  onComplete: (result: FreehandResult) => void;
}

interface RawPoint {
  x: number;
  y: number;
  t: number;
}

const MAX_DRAW_MS = 6000;

export function FreehandModule({ locale, onComplete }: FreehandModuleProps) {
  const t = TRANSLATIONS[locale];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = useState<'ready' | 'drawing' | 'done'>('ready');
  const [remainingMs, setRemainingMs] = useState<number>(MAX_DRAW_MS);
  const [hintMsg, setHintMsg] = useState<string | null>(null);
  const [metricsPreview, setMetricsPreview] = useState<{
    smoothness: number;
    closedness: number;
  } | null>(null);

  const statusRef = useRef<'ready' | 'drawing' | 'done'>('ready');
  const rawPtsRef = useRef<RawPoint[]>([]);
  const drawStartRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const finishTimeoutRef = useRef<number | null>(null);

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Dot grid
    ctx.fillStyle = 'rgba(20, 20, 19, 0.14)';
    for (let x = 24; x < w; x += 24) {
      for (let y = 24; y < h; y += 24) {
        ctx.fillRect(x, y, 1.4, 1.4);
      }
    }

    // Center crosshair
    ctx.strokeStyle = 'rgba(20, 20, 19, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 16);
    ctx.lineTo(w / 2, h - 16);
    ctx.moveTo(16, h / 2);
    ctx.lineTo(w - 16, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(300, Math.round(rect.width * dpr));
    canvas.height = Math.max(240, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawGrid(ctx, rect.width, rect.height);
    }

    return () => {
      SoundEngine.stopBrushLoop();
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (finishTimeoutRef.current !== null) window.clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  const analyzeAndFinish = () => {
    if (statusRef.current === 'done') return;
    SoundEngine.stopBrushLoop();
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const w = rect?.width || 400;
    const h = rect?.height || 300;
    const pts = rawPtsRef.current;

    let totalPxLen = 0;
    const speeds: number[] = [];
    for (let i = 1; i < pts.length; i += 1) {
      const dist = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      const dt = Math.max(4, pts[i].t - pts[i - 1].t);
      totalPxLen += dist;
      speeds.push(dist / dt);
    }

    if (pts.length < 6 || totalPxLen < 24) {
      // Accidental short tap — gently reset
      rawPtsRef.current = [];
      statusRef.current = 'ready';
      setStatus('ready');
      setRemainingMs(MAX_DRAW_MS);
      setHintMsg(t.freehand.tooShort);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawGrid(ctx, w, h);
      }
      return;
    }

    statusRef.current = 'done';
    setStatus('done');
    SoundEngine.playClick(680);

    // Normalized points (max 48)
    const step = Math.max(1, Math.floor(pts.length / 48));
    const normPts: StrokePoint[] = [];
    for (let i = 0; i < pts.length; i += step) {
      normPts.push({
        x: Math.min(1, Math.max(0, pts[i].x / w)),
        y: Math.min(1, Math.max(0, pts[i].y / h)),
      });
    }
    const lastPt = pts[pts.length - 1];
    normPts.push({
      x: Math.min(1, Math.max(0, lastPt.x / w)),
      y: Math.min(1, Math.max(0, lastPt.y / h)),
    });

    // Smoothness from mean turning angle delta
    let turnSum = 0;
    let turnCount = 0;
    for (let i = 2; i < pts.length; i += 1) {
      const a1 = Math.atan2(pts[i - 1].y - pts[i - 2].y, pts[i - 1].x - pts[i - 2].x);
      const a2 = Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x);
      let d = Math.abs(a2 - a1);
      if (d > Math.PI) d = Math.PI * 2 - d;
      turnSum += d;
      turnCount += 1;
    }
    const avgTurn = turnCount > 0 ? turnSum / turnCount : 0;
    const smoothness = Number(Math.max(0.05, Math.min(0.99, 1 - avgTurn / 1.15)).toFixed(2));

    // Closedness
    const endGap = Math.hypot(lastPt.x - pts[0].x, lastPt.y - pts[0].y);
    const diag = Math.hypot(w, h);
    const closedness = Number(Math.max(0, Math.min(1, 1 - endGap / (diag * 0.45))).toFixed(2));

    // Bounding box coverage & center bias
    let minX = w,
      maxX = 0,
      minY = h,
      maxY = 0,
      sumX = 0,
      sumY = 0;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      sumX += p.x;
      sumY += p.y;
    }
    const boxArea = (maxX - minX) * (maxY - minY);
    const canvasCoverage = Number(Math.max(0.02, Math.min(1, boxArea / (w * h * 0.72))).toFixed(2));

    const cx = sumX / pts.length;
    const cy = sumY / pts.length;
    const distCenter = Math.hypot(cx - w / 2, cy - h / 2);
    const centerBias = Number(Math.max(0, Math.min(1, 1 - distCenter / (diag * 0.38))).toFixed(2));

    // Velocity variance
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / Math.max(1, speeds.length);
    const variance =
      speeds.reduce((acc, s) => acc + Math.pow(s - avgSpeed, 2), 0) / Math.max(1, speeds.length);
    const cv = avgSpeed > 0 ? Math.sqrt(variance) / avgSpeed : 0;
    const velocityVariance = Number(Math.max(0, Math.min(1, cv / 1.4)).toFixed(2));

    const drawDurationMs = Math.min(MAX_DRAW_MS, Math.round(lastPt.t - pts[0].t));

    const result: FreehandResult = {
      points: normPts,
      smoothness,
      closedness,
      canvasCoverage,
      centerBias,
      velocityVariance,
      totalLength: Math.round(totalPxLen),
      drawDurationMs,
    };

    setMetricsPreview({ smoothness, closedness });

    finishTimeoutRef.current = window.setTimeout(() => {
      onComplete(result);
    }, 950);
  };

  const getLocalPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(rect.width, Math.max(0, e.clientX - rect.left)),
      y: Math.min(rect.height, Math.max(0, e.clientY - rect.top)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (statusRef.current === 'done') return;
    SoundEngine.unlock();
    SoundEngine.startBrushLoop();
    e.currentTarget.setPointerCapture(e.pointerId);

    const pos = getLocalPos(e);
    const now = performance.now();
    drawStartRef.current = now;
    rawPtsRef.current = [{ x: pos.x, y: pos.y, t: now }];
    statusRef.current = 'drawing';
    setStatus('drawing');
    setHintMsg(null);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const rect = canvas?.getBoundingClientRect();
    if (ctx && rect) {
      drawGrid(ctx, rect.width, rect.height);
      ctx.fillStyle = '#FF3B1F';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      if (statusRef.current !== 'drawing') return;
      const rem = Math.max(0, MAX_DRAW_MS - (performance.now() - drawStartRef.current));
      setRemainingMs(rem);
      if (rem <= 0) {
        analyzeAndFinish();
      }
    }, 50);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (statusRef.current !== 'drawing') return;
    const pos = getLocalPos(e);
    const now = performance.now();
    const pts = rawPtsRef.current;
    const prev = pts[pts.length - 1];
    const dist = Math.hypot(pos.x - prev.x, pos.y - prev.y);
    if (dist < 2.2) return;

    pts.push({ x: pos.x, y: pos.y, t: now });
    const speed = dist / Math.max(4, now - prev.t);
    SoundEngine.updateBrush(speed * 18);

    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#141413';
      ctx.lineWidth = Math.max(2.6, Math.min(7.5, 6.2 - speed * 2.1));
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      <div className="swiss-card p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-[#141413]/20 pb-3 font-mono-num text-xs font-bold">
          <span className="text-[#FF3B1F]">04 / 06 // 1-STROKE SANCTUARY</span>
          <span className="text-[#141413]">{(remainingMs / 1000).toFixed(1)}s</span>
        </div>

        <h2 className="font-display mt-5 text-2xl font-black tracking-tight sm:text-3xl">
          {t.freehand.instruction}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-[#57534E]">{t.freehand.sub}</p>

        <div className="relative mt-6 overflow-hidden rounded-lg border-2 border-[#141413] bg-white">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={analyzeAndFinish}
            onPointerCancel={analyzeAndFinish}
            className="block h-72 w-full cursor-crosshair sm:h-80"
            style={{ touchAction: 'none' }}
          />

          {status === 'ready' && (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center">
              <span className="rounded border border-[#141413] bg-[#F4F2EC]/95 px-3 py-1 font-mono-num text-xs font-bold text-[#141413]">
                {hintMsg ?? t.freehand.drawHint}
              </span>
            </div>
          )}

          {status === 'done' && metricsPreview && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <div className="flex items-center gap-3 rounded border-2 border-[#141413] bg-[#C6F600] px-4 py-1.5 font-mono-num text-xs font-bold text-[#141413] shadow-[3px_3px_0px_#141413]">
                <span>{t.freehand.doneLabel}</span>
                <span>
                  {t.freehand.smoothness} {Math.round(metricsPreview.smoothness * 100)}%
                </span>
                <span>
                  {t.freehand.closedness} {Math.round(metricsPreview.closedness * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
