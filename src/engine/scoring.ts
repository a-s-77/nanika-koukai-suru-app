import type { AxisScores, RawTelemetry } from '../types/mindprint';
import { hashString } from './rng';

export function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

function safeNum(val: number, fallback: number): number {
  return Number.isFinite(val) ? val : fallback;
}

export function scoreTelemetry(raw: RawTelemetry): AxisScores {
  const chronoErr = safeNum(raw.chrono.errorMs, 0);
  const chronoAbsErr = Math.abs(chronoErr);
  const startDelay = clamp(safeNum(raw.chrono.startDelayMs, 1000), 100, 5000);

  const fPressed = raw.forbidden.pressed;
  const fPressMs = clamp(safeNum(raw.forbidden.pressTimeMs ?? 7000, 7000), 0, 7000);
  const fMinDist = clamp(safeNum(raw.forbidden.minDistancePx, 200), 0, 400);
  const fHoverMs = clamp(safeNum(raw.forbidden.hoverDurationMs, 0), 0, 7000);
  const fApproaches = clamp(safeNum(raw.forbidden.approachCount, 0), 0, 20);

  const cAbsErr = clamp(safeNum(raw.crooked.absErrorDeg, 2), 0, 15);
  const cReversals = clamp(safeNum(raw.crooked.directionReversals, 0), 0, 25);
  const cNudges = clamp(safeNum(raw.crooked.microNudgeCount, 0), 0, 40);
  const cTime = clamp(safeNum(raw.crooked.totalTimeMs, 5000), 400, 15000);

  const fhSmooth = clamp(safeNum(raw.freehand.smoothness, 0.5), 0, 1);
  const fhClosed = clamp(safeNum(raw.freehand.closedness, 0.5), 0, 1);
  const fhCov = clamp(safeNum(raw.freehand.canvasCoverage, 0.3), 0, 1);
  const fhCenter = clamp(safeNum(raw.freehand.centerBias, 0.5), 0, 1);
  const fhVelVar = clamp(safeNum(raw.freehand.velocityVariance, 0.3), 0, 1);
  const fhDuration = clamp(safeNum(raw.freehand.drawDurationMs, 2500), 200, 6000);

  const gBrink = clamp(safeNum(raw.greed.brinkRatio, 0.4), 0, 1.2);
  const gJitter = clamp(safeNum(raw.greed.preReleaseJitter, 0.2), 0, 1);

  const sContrast = clamp(safeNum(raw.synesthesia.contrastDelta, 0.5), 0, 1.42);
  const sAlign = clamp(safeNum(raw.synesthesia.boubaKikiAlignment, 0.3), -1, 1);
  const sAvgLock = clamp(
    (safeNum(raw.synesthesia.soundA.lockTimeMs, 3500) +
      safeNum(raw.synesthesia.soundB.lockTimeMs, 3500)) /
      2,
    400,
    12000,
  );

  // 1. IMPULSE: Pressing forbidden button, rushing chrono, low start delay, fast lock
  let impulse = 22;
  if (fPressed) {
    const earlyBonus = (1 - fPressMs / 7000) * 34;
    impulse += 34 + earlyBonus;
  } else {
    const flirtScore =
      Math.max(0, 1 - fMinDist / 160) * 18 +
      Math.min(1, fHoverMs / 2500) * 14 +
      Math.min(1, fApproaches / 4) * 8;
    impulse += flirtScore;
  }
  impulse += chronoErr < 0 ? Math.min(16, Math.abs(chronoErr) / 90) : -Math.min(10, chronoErr / 180);
  impulse += (1 - clamp(startDelay / 3500, 0, 1)) * 10;
  impulse += gBrink * 10 + (raw.greed.exploded ? 6 : 0);

  // 2. PRECISION: Straightening crooked frame, fine adjustments, accurate chrono
  let precision = 18;
  precision += Math.max(0, 1 - cAbsErr / 4.2) * 44;
  precision += Math.min(14, cNudges * 2.2 + cReversals * 1.4);
  precision += Math.max(0, 1 - chronoAbsErr / 1400) * 18;
  precision += fhCenter * 6;
  if (raw.crooked.timedOut) {
    precision -= 10;
  }

  // 3. TEMPO: Fast internal clock (stopping early feels like 5s passed fast -> high tempo) + snappy decisiveness
  let tempo = 50;
  tempo += clamp(-chronoErr / 36, -34, 34);
  tempo += (1 - clamp(cTime / 12000, 0, 1)) * 11 - 5;
  tempo += (1 - clamp(fhDuration / 5500, 0, 1)) * 9 - 4;
  tempo += (1 - clamp(sAvgLock / 8000, 0, 1)) * 10 - 5;

  // 4. RISK: Pushing greed horizon, exploding, bold large drawing, tempting forbidden button
  let risk = 14;
  risk += clamp(gBrink, 0, 1) * 52;
  risk += raw.greed.exploded ? 14 : 0;
  risk += fhCov * 14;
  risk += fPressed ? 10 : Math.max(0, 1 - fMinDist / 110) * 6;
  risk -= gJitter * 6;

  // 5. ORDER: Closed centered calm stroke, accurate alignment, canonical Bouba-Kiki structure
  let order = 18;
  order += fhClosed * 28;
  order += fhCenter * 16;
  order += (1 - fhVelVar) * 14;
  order += Math.max(0, 1 - cAbsErr / 3.5) * 14;
  order += Math.max(0, sAlign) * 12;
  order += !fPressed ? 8 : -8;

  // 6. RESONANCE: Strong acoustic-shape contrast, smooth stroke, responding to chrono pulse
  let resonance = 20;
  resonance += clamp(sContrast / 1.1, 0, 1) * 38;
  resonance += Math.abs(sAlign) * 14;
  resonance += fhSmooth * 18;
  resonance += raw.chrono.pulledByInterference ? 10 : 4;
  resonance += (1 - Math.abs(raw.synesthesia.soundA.warmth - 0.72)) * 6;

  return {
    impulse: Math.round(clamp(impulse, 4, 99)),
    precision: Math.round(clamp(precision, 4, 99)),
    tempo: Math.round(clamp(tempo, 4, 99)),
    risk: Math.round(clamp(risk, 4, 99)),
    order: Math.round(clamp(order, 4, 99)),
    resonance: Math.round(clamp(resonance, 4, 99)),
  };
}

export function computeFingerprintHash(axes: AxisScores, raw: RawTelemetry): string {
  const sig = [
    axes.impulse,
    axes.precision,
    axes.tempo,
    axes.risk,
    axes.order,
    axes.resonance,
    Math.round(raw.chrono.actualMs),
    raw.forbidden.pressed ? 1 : 0,
    Math.round(raw.crooked.absErrorDeg * 100),
    Math.round(raw.greed.peakMultiplier * 100),
    raw.seedId,
  ].join('|');

  const h1 = hashString(sig).toString(16).toUpperCase().padStart(8, '0');
  return `MP-${h1.slice(0, 4)}-${h1.slice(4, 8)}`;
}
