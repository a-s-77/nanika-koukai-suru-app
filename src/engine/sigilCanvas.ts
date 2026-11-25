import type {
  AxisScores,
  CardTheme,
  MindprintReport,
  SharePayload,
  StrokePoint,
} from '../types/mindprint';
import { clamp } from './scoring';
import { payloadToAxes } from './shareCodec';

export interface SigilData {
  axes: AxisScores;
  chronoErrorMs: number;
  forbiddenPressed: boolean;
  greedBrinkRatio: number;
  greedExploded: boolean;
  crookedAbsErrorDeg: number;
  soundA: { spikiness: number; warmth: number };
  soundB: { spikiness: number; warmth: number };
  stroke: StrokePoint[];
  accentColor: string;
}

export function reportToSigilData(report: MindprintReport): SigilData {
  return {
    axes: report.axes,
    chronoErrorMs: report.raw.chrono.errorMs,
    forbiddenPressed: report.raw.forbidden.pressed,
    greedBrinkRatio: report.raw.greed.brinkRatio,
    greedExploded: report.raw.greed.exploded,
    crookedAbsErrorDeg: report.raw.crooked.absErrorDeg,
    soundA: {
      spikiness: report.raw.synesthesia.soundA.spikiness,
      warmth: report.raw.synesthesia.soundA.warmth,
    },
    soundB: {
      spikiness: report.raw.synesthesia.soundB.spikiness,
      warmth: report.raw.synesthesia.soundB.warmth,
    },
    stroke: report.raw.freehand.points,
    accentColor: report.archetype.accentColor,
  };
}

export function payloadToSigilData(payload: SharePayload, accentColor = '#1D4ED8'): SigilData {
  return {
    axes: payloadToAxes(payload),
    chronoErrorMs: payload.m.ce,
    forbiddenPressed: payload.m.fp === 1,
    greedBrinkRatio: payload.m.gr / 100,
    greedExploded: payload.m.ge === 1,
    crookedAbsErrorDeg: payload.m.ca / 100,
    soundA: {
      spikiness: payload.m.sa[0] / 100,
      warmth: payload.m.sa[1] / 100,
    },
    soundB: {
      spikiness: payload.m.sb[0] / 100,
      warmth: payload.m.sb[1] / 100,
    },
    stroke: payload.p.map(([qx, qy]) => ({ x: qx / 63, y: qy / 63 })),
    accentColor,
  };
}

export const SAMPLE_SIGIL_DATA: SigilData = {
  axes: {
    impulse: 74,
    precision: 82,
    tempo: 68,
    risk: 86,
    order: 62,
    resonance: 79,
  },
  chronoErrorMs: -420,
  forbiddenPressed: false,
  greedBrinkRatio: 0.89,
  greedExploded: false,
  crookedAbsErrorDeg: 0.25,
  soundA: { spikiness: 0.22, warmth: 0.78 },
  soundB: { spikiness: 0.84, warmth: 0.34 },
  stroke: [
    { x: 0.28, y: 0.52 },
    { x: 0.31, y: 0.33 },
    { x: 0.49, y: 0.24 },
    { x: 0.69, y: 0.31 },
    { x: 0.74, y: 0.51 },
    { x: 0.64, y: 0.69 },
    { x: 0.44, y: 0.74 },
    { x: 0.29, y: 0.62 },
    { x: 0.34, y: 0.42 },
    { x: 0.54, y: 0.44 },
  ],
  accentColor: '#FF3B1F',
};

function warmthColor(warmth: number, alpha: number): string {
  const w = clamp(warmth, 0, 1);
  // 0 = deep cobalt/cyan (215..195 deg), 1 = vermilion/amber (12..34 deg)
  const r = Math.round(29 + w * (255 - 29));
  const g = Math.round(78 + (1 - Math.abs(w - 0.5) * 1.4) * 70 + w * 18);
  const b = Math.round(216 - w * 185);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawFourierBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseR: number,
  spikiness: number,
  warmth: number,
  phaseOffset: number,
  timeSec: number,
  lineWidth: number,
  fillAlpha: number,
  strokeAlpha: number,
): void {
  const steps = 140;
  const lobes = Math.round(4 + spikiness * 9);
  const amp = baseR * (0.08 + spikiness * 0.23);

  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * Math.PI * 2;
    const harmonic1 = Math.sin(theta * lobes + timeSec * 1.2 + phaseOffset);
    const harmonic2 = Math.cos(theta * (lobes + 2) - timeSec * 0.8 + phaseOffset) * 0.45;
    const sharpFactor = spikiness > 0.5 ? Math.sign(harmonic1) * Math.pow(Math.abs(harmonic1), 0.7) : harmonic1;
    const r = baseR + amp * (sharpFactor * 0.72 + harmonic2 * 0.28);
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  ctx.fillStyle = warmthColor(warmth, fillAlpha);
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = warmthColor(warmth, strokeAlpha);
  ctx.stroke();
}

export function drawMindprintSigil(
  ctx: CanvasRenderingContext2D,
  size: number,
  data: SigilData,
  options: {
    theme?: CardTheme;
    timeSec?: number;
    transparentBg?: boolean;
  } = {},
): void {
  const theme = options.theme ?? 'paper';
  const timeSec = options.timeSec ?? 0;
  const isObsidian = theme === 'obsidian';
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.42;

  ctx.save();
  if (!options.transparentBg) {
    ctx.fillStyle = isObsidian ? '#111110' : '#F4F2EC';
    ctx.fillRect(0, 0, size, size);
  }

  const inkMuted = isObsidian ? 'rgba(244, 242, 236, 0.16)' : 'rgba(20, 20, 19, 0.14)';
  const inkFaint = isObsidian ? 'rgba(244, 242, 236, 0.08)' : 'rgba(20, 20, 19, 0.07)';
  const inkSolid = isObsidian ? '#F4F2EC' : '#141413';

  // 1. Calibration crosshair & subtle concentric rings
  ctx.strokeStyle = inkFaint;
  ctx.lineWidth = Math.max(1, size * 0.0025);
  for (const frac of [0.35, 0.62, 0.88, 1.0]) {
    ctx.beginPath();
    ctx.arc(cx, cy, R * frac, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Polar ticks around outer perimeter
  for (let i = 0; i < 36; i += 1) {
    const a = (i / 36) * Math.PI * 2;
    const inner = i % 3 === 0 ? R * 0.94 : R * 0.97;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * R * 1.02, cy + Math.sin(a) * R * 1.02);
    ctx.strokeStyle = i % 9 === 0 ? inkMuted : inkFaint;
    ctx.stroke();
  }

  // Crosshair tilted by residual Crooked Frame error
  const tiltRad = clamp(data.crookedAbsErrorDeg, 0, 12) * (Math.PI / 180);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tiltRad);
  ctx.strokeStyle = inkMuted;
  ctx.setLineDash([size * 0.012, size * 0.012]);
  ctx.beginPath();
  ctx.moveTo(-R * 1.06, 0);
  ctx.lineTo(R * 1.06, 0);
  ctx.moveTo(0, -R * 1.06);
  ctx.lineTo(0, R * 1.06);
  ctx.stroke();
  ctx.restore();

  // 2. Chrono Drift Arc (outer broken dial)
  const driftBias = clamp(-data.chronoErrorMs / 2500, -1, 1);
  const driftStart = -Math.PI / 2 + driftBias * 0.8 + timeSec * 0.14;
  const driftSpan = Math.PI * (0.45 + (data.axes.tempo / 100) * 0.75);
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.96, driftStart, driftStart + driftSpan);
  ctx.lineWidth = Math.max(2, size * 0.008);
  ctx.strokeStyle = driftBias >= 0 ? '#FF3B1F' : '#1D4ED8';
  ctx.lineCap = 'round';
  ctx.stroke();

  // 3. Dual Synesthesia Fourier Blobs
  drawFourierBlob(
    ctx,
    cx,
    cy,
    R * 0.64,
    data.soundA.spikiness,
    data.soundA.warmth,
    0.4,
    timeSec,
    Math.max(1.5, size * 0.0055),
    isObsidian ? 0.16 : 0.11,
    0.72,
  );
  drawFourierBlob(
    ctx,
    cx,
    cy,
    R * 0.52,
    data.soundB.spikiness,
    data.soundB.warmth,
    2.1,
    -timeSec * 0.9,
    Math.max(1.5, size * 0.005),
    isObsidian ? 0.14 : 0.09,
    0.85,
  );

  // 4. Greed Risk Orbit (scales with brinkRatio, fractures if exploded)
  const riskR = R * (0.44 + clamp(data.greedBrinkRatio, 0.1, 1.05) * 0.36);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, riskR, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.4, size * 0.0045);
  ctx.strokeStyle = data.greedExploded
    ? '#FF3B1F'
    : isObsidian
      ? 'rgba(198, 246, 0, 0.78)'
      : 'rgba(20, 20, 19, 0.55)';
  if (!data.greedExploded) {
    ctx.setLineDash([size * 0.018, size * 0.012]);
  }
  ctx.stroke();
  ctx.restore();

  if (data.greedExploded) {
    // Radial overload fracture ticks
    ctx.strokeStyle = '#FF3B1F';
    ctx.lineWidth = Math.max(1.5, size * 0.0045);
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2 + 0.22;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (riskR * 0.93), cy + Math.sin(a) * (riskR * 0.93));
      ctx.lineTo(cx + Math.cos(a) * (riskR * 1.1), cy + Math.sin(a) * (riskR * 1.1));
      ctx.stroke();
    }
  }

  // 5. Forbidden Breach Mark vs Resistance Seal
  if (data.forbiddenPressed) {
    ctx.save();
    ctx.strokeStyle = '#FF3B1F';
    ctx.lineWidth = Math.max(2, size * 0.007);
    ctx.beginPath();
    ctx.moveTo(cx - R * 0.72, cy + R * 0.72);
    ctx.lineTo(cx + R * 0.72, cy - R * 0.72);
    ctx.stroke();

    // Breach node pip
    ctx.fillStyle = '#FF3B1F';
    ctx.beginPath();
    ctx.arc(cx + R * 0.68, cy - R * 0.68, size * 0.018, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Precision lock seal at top-right quadrant
    const sx = cx + R * 0.68;
    const sy = cy - R * 0.68;
    ctx.save();
    ctx.fillStyle = isObsidian ? '#C6F600' : '#1D4ED8';
    ctx.beginPath();
    ctx.arc(sx, sy, size * 0.016, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = inkSolid;
    ctx.lineWidth = Math.max(1, size * 0.003);
    ctx.beginPath();
    ctx.arc(sx, sy, size * 0.028, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 6. User's Actual Freehand Stroke dead-center
  const pts = data.stroke && data.stroke.length >= 2 ? data.stroke : SAMPLE_SIGIL_DATA.stroke;
  const boxScale = R * 1.12;
  const mapped = pts.map((p) => ({
    x: cx + (p.x - 0.5) * boxScale,
    y: cy + (p.y - 0.5) * boxScale,
  }));

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.014);
  ctx.strokeStyle = isObsidian ? '#F4F2EC' : '#141413';

  if (isObsidian) {
    ctx.shadowColor = 'rgba(198, 246, 0, 0.32)';
    ctx.shadowBlur = size * 0.03;
  }

  ctx.beginPath();
  ctx.moveTo(mapped[0].x, mapped[0].y);
  for (let i = 1; i < mapped.length - 1; i += 1) {
    const midX = (mapped[i].x + mapped[i + 1].x) / 2;
    const midY = (mapped[i].y + mapped[i + 1].y) / 2;
    ctx.quadraticCurveTo(mapped[i].x, mapped[i].y, midX, midY);
  }
  const last = mapped[mapped.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();

  // Start & end markers
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#FF3B1F';
  ctx.beginPath();
  ctx.arc(mapped[0].x, mapped[0].y, size * 0.015, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isObsidian ? '#C6F600' : '#1D4ED8';
  ctx.beginPath();
  ctx.arc(last.x, last.y, size * 0.015, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export function drawDualSyncSigil(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mine: SigilData,
  target: SigilData,
  syncScore: number,
  timeSec: number,
  theme: CardTheme = 'paper',
): void {
  const isObsidian = theme === 'obsidian';
  ctx.save();
  ctx.fillStyle = isObsidian ? '#111110' : '#F4F2EC';
  ctx.fillRect(0, 0, width, height);

  const sigilSize = Math.min(height * 0.84, width * 0.44);
  const leftX = width * 0.29 - sigilSize / 2;
  const rightX = width * 0.71 - sigilSize / 2;
  const topY = (height - sigilSize) / 2;

  // Interference resonance waves between centers
  const c1x = width * 0.29;
  const c2x = width * 0.71;
  const cy = height / 2;
  const waveAmp = 8 + (syncScore / 100) * 20;

  for (let w = 0; w < 3; w += 1) {
    ctx.beginPath();
    for (let step = 0; step <= 60; step += 1) {
      const t = step / 60;
      const x = c1x + (c2x - c1x) * t;
      const envelope = Math.sin(t * Math.PI);
      const y =
        cy +
        Math.sin(t * Math.PI * (3 + w * 2) + timeSec * (1.8 + w * 0.4)) *
          waveAmp *
          envelope;
      if (step === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineWidth = 1.6;
    ctx.strokeStyle =
      w === 0
        ? 'rgba(255, 59, 31, 0.55)'
        : w === 1
          ? 'rgba(29, 78, 216, 0.5)'
          : isObsidian
            ? 'rgba(198, 246, 0, 0.45)'
            : 'rgba(20, 20, 19, 0.3)';
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(leftX, topY);
  drawMindprintSigil(ctx, sigilSize, mine, { theme, timeSec, transparentBg: true });
  ctx.restore();

  ctx.save();
  ctx.translate(rightX, topY);
  drawMindprintSigil(ctx, sigilSize, target, {
    theme,
    timeSec: -timeSec * 0.85,
    transparentBg: true,
  });
  ctx.restore();

  ctx.restore();
}
