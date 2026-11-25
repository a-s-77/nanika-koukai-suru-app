import { describe, expect, it } from 'vitest';
import type { MindprintReport, RawTelemetry } from '../../types/mindprint';
import { AXIS_ORDER } from '../../i18n/translations';
import { createRng, generateRunConfig } from '../rng';
import { computeFingerprintHash, scoreTelemetry } from '../scoring';
import { ARCHETYPES, classifyArchetype, generateEvidence } from '../archetypes';
import {
  decodeSharePayload,
  encodeSharePayload,
  resampleStroke,
} from '../shareCodec';
import { computeCompatibility } from '../compatibility';
import { getGaMeasurementId, initAnalytics, trackEvent } from '../analytics';

function makeBaseTelemetry(overrides: Partial<RawTelemetry> = {}): RawTelemetry {
  return {
    chrono: {
      actualMs: 5020,
      errorMs: 20,
      interferenceDirection: 'fast',
      interferenceBpm: 82,
      pulledByInterference: false,
      startDelayMs: 900,
    },
    forbidden: {
      pressed: false,
      pressTimeMs: null,
      pressCount: 0,
      minDistancePx: 145,
      hoverDurationMs: 0,
      approachCount: 0,
      inputMode: 'mouse',
      trail: [
        { x: 0.1, y: 0.2, t: 200 },
        { x: 0.2, y: 0.3, t: 1000 },
      ],
    },
    crooked: {
      initialAngleDeg: 7.4,
      finalAngleDeg: 0.2,
      absErrorDeg: 0.2,
      directionReversals: 3,
      microNudgeCount: 4,
      totalTimeMs: 6500,
      timedOut: false,
    },
    freehand: {
      points: [
        { x: 0.3, y: 0.5 },
        { x: 0.5, y: 0.3 },
        { x: 0.7, y: 0.5 },
        { x: 0.5, y: 0.7 },
        { x: 0.31, y: 0.52 },
      ],
      smoothness: 0.85,
      closedness: 0.92,
      canvasCoverage: 0.35,
      centerBias: 0.9,
      velocityVariance: 0.15,
      totalLength: 420,
      drawDurationMs: 2400,
    },
    greed: {
      exploded: false,
      peakMultiplier: 4.5,
      burstMultiplier: 6.2,
      brinkRatio: 0.67,
      preReleaseJitter: 0.18,
      holdDurationMs: 2600,
    },
    synesthesia: {
      soundA: { spikiness: 0.15, warmth: 0.85, lockTimeMs: 2800 },
      soundB: { spikiness: 0.88, warmth: 0.22, lockTimeMs: 2600 },
      contrastDelta: 0.96,
      boubaKikiAlignment: 0.68,
    },
    mode: 'daily',
    seedId: '2026-11-25',
    completedAt: 1700000000000,
    ...overrides,
  };
}

function buildReport(nickname: string, raw: RawTelemetry): MindprintReport {
  const axes = scoreTelemetry(raw);
  const archetype = classifyArchetype(axes, raw);
  return {
    id: 'test-id',
    nickname,
    mode: raw.mode,
    seedLabel: 'DAILY // 2026.11.25',
    fingerprintHash: computeFingerprintHash(axes, raw),
    axes,
    archetype,
    evidence: generateEvidence(raw, 'ja'),
    raw,
    createdAt: raw.completedAt,
  };
}

describe('rng & runConfig', () => {
  it('produces identical sequence for same seed and deterministic daily config', () => {
    const r1 = createRng(123456);
    const r2 = createRng(123456);
    expect([r1(), r1(), r1()]).toEqual([r2(), r2(), r2()]);

    const cfgA = generateRunConfig('daily', '2026-11-25');
    const cfgB = generateRunConfig('daily', '2026-11-25');
    expect(cfgA).toEqual(cfgB);
    expect(Math.abs(cfgA.crookedInitialAngle)).toBeGreaterThanOrEqual(5.5);
    expect(cfgA.greedBurstMultiplier).toBeGreaterThanOrEqual(3.7);
    expect(cfgA.greedBurstMultiplier).toBeLessThanOrEqual(9.1);
  });
});

describe('scoring & archetype classification', () => {
  it('always returns finite integers between 0 and 100 even on degenerate inputs', () => {
    const degenerate: RawTelemetry = makeBaseTelemetry({
      chrono: {
        actualMs: 0,
        errorMs: Number.NaN,
        interferenceDirection: 'slow',
        interferenceBpm: 46,
        pulledByInterference: false,
        startDelayMs: -10,
      },
      freehand: {
        points: [],
        smoothness: Number.POSITIVE_INFINITY,
        closedness: -2,
        canvasCoverage: Number.NaN,
        centerBias: 0,
        velocityVariance: 99,
        totalLength: 0,
        drawDurationMs: 0,
      },
      greed: {
        exploded: false,
        peakMultiplier: 1,
        burstMultiplier: 5,
        brinkRatio: Number.NaN,
        preReleaseJitter: 0,
        holdDurationMs: 0,
      },
    });

    const scores = scoreTelemetry(degenerate);
    for (const key of AXIS_ORDER) {
      expect(Number.isFinite(scores[key])).toBe(true);
      expect(Number.isInteger(scores[key])).toBe(true);
      expect(scores[key]).toBeGreaterThanOrEqual(0);
      expect(scores[key]).toBeLessThanOrEqual(100);
    }
  });

  it('has 16 complete bilingual archetypes and differentiates contrasting behavioral profiles', () => {
    expect(ARCHETYPES).toHaveLength(16);
    for (const arch of ARCHETYPES) {
      expect(arch.name.ja.length).toBeGreaterThan(2);
      expect(arch.name.en.length).toBeGreaterThan(2);
      expect(arch.roast.ja.length).toBeGreaterThan(10);
      expect(arch.roast.en.length).toBeGreaterThan(10);
      expect(arch.manual.strength.ja.length).toBeGreaterThan(5);
      expect(arch.manual.weakness.en.length).toBeGreaterThan(5);
    }

    const impulsive = makeBaseTelemetry({
      chrono: {
        actualMs: 4850,
        errorMs: -150,
        interferenceDirection: 'fast',
        interferenceBpm: 82,
        pulledByInterference: false,
        startDelayMs: 250,
      },
      forbidden: {
        pressed: true,
        pressTimeMs: 1100,
        pressCount: 1,
        minDistancePx: 0,
        hoverDurationMs: 120,
        approachCount: 1,
        inputMode: 'mouse',
        trail: [],
      },
      greed: {
        exploded: false,
        peakMultiplier: 4.0,
        burstMultiplier: 6.4,
        brinkRatio: 0.55,
        preReleaseJitter: 0.2,
        holdDurationMs: 2100,
      },
      crooked: {
        initialAngleDeg: -8.2,
        finalAngleDeg: 3.1,
        absErrorDeg: 3.1,
        directionReversals: 0,
        microNudgeCount: 0,
        totalTimeMs: 1800,
        timedOut: false,
      },
    });

    const brinkExploder = makeBaseTelemetry({
      chrono: {
        actualMs: 4550,
        errorMs: -450,
        interferenceDirection: 'fast',
        interferenceBpm: 82,
        pulledByInterference: false,
        startDelayMs: 400,
      },
      forbidden: {
        pressed: false,
        pressTimeMs: null,
        pressCount: 0,
        minDistancePx: 45,
        hoverDurationMs: 800,
        approachCount: 2,
        inputMode: 'mouse',
        trail: [],
      },
      crooked: {
        initialAngleDeg: 7.4,
        finalAngleDeg: 2.2,
        absErrorDeg: 2.2,
        directionReversals: 1,
        microNudgeCount: 0,
        totalTimeMs: 3200,
        timedOut: false,
      },
      freehand: {
        points: [],
        smoothness: 0.6,
        closedness: 0.35,
        canvasCoverage: 0.65,
        centerBias: 0.5,
        velocityVariance: 0.45,
        totalLength: 620,
        drawDurationMs: 1800,
      },
      greed: {
        exploded: true,
        peakMultiplier: 7.1,
        burstMultiplier: 7.1,
        brinkRatio: 1.0,
        preReleaseJitter: 0.45,
        holdDurationMs: 3800,
      },
    });

    const calm = makeBaseTelemetry({
      chrono: {
        actualMs: 5820,
        errorMs: 820,
        interferenceDirection: 'fast',
        interferenceBpm: 84,
        pulledByInterference: false,
        startDelayMs: 2100,
      },
      forbidden: {
        pressed: false,
        pressTimeMs: null,
        pressCount: 0,
        minDistancePx: 220,
        hoverDurationMs: 0,
        approachCount: 0,
        inputMode: 'mouse',
        trail: [],
      },
      crooked: {
        initialAngleDeg: 8.5,
        finalAngleDeg: 0.1,
        absErrorDeg: 0.1,
        directionReversals: 5,
        microNudgeCount: 7,
        totalTimeMs: 10200,
        timedOut: false,
      },
      greed: {
        exploded: false,
        peakMultiplier: 2.1,
        burstMultiplier: 6.5,
        brinkRatio: 0.2,
        preReleaseJitter: 0.08,
        holdDurationMs: 1400,
      },
    });

    const archImpulsive = classifyArchetype(scoreTelemetry(impulsive), impulsive);
    const archBrink = classifyArchetype(scoreTelemetry(brinkExploder), brinkExploder);
    const archCalm = classifyArchetype(scoreTelemetry(calm), calm);
    expect(archImpulsive.id).not.toBe(archCalm.id);
    expect(archImpulsive.id).toBe('forbidden_magnet');
    expect(archBrink.id).toBe('brink_surfer');
  });

  it('generates 4 localized evidence items handling touch vs mouse cleanly', () => {
    const touchRaw = makeBaseTelemetry({
      forbidden: {
        pressed: false,
        pressTimeMs: null,
        pressCount: 0,
        minDistancePx: 80,
        hoverDurationMs: 0,
        approachCount: 3,
        inputMode: 'touch',
        trail: [],
      },
    });

    const jaItems = generateEvidence(touchRaw, 'ja');
    const enItems = generateEvidence(touchRaw, 'en');
    expect(jaItems).toHaveLength(4);
    expect(enItems).toHaveLength(4);
    expect(jaItems[0].metric).toContain('3回');
    expect(enItems[0].metric).toContain('3 feints');
  });
});

describe('shareCodec & compatibility', () => {
  it('round-trips payload cleanly including Japanese nickname and resampled stroke', () => {
    const raw = makeBaseTelemetry();
    const report = buildReport('ハルカ⚡', raw);
    const encoded = encodeSharePayload(report);
    expect(encoded.length).toBeGreaterThan(20);
    expect(encoded).not.toMatch(/[+/=]/);

    const decoded = decodeSharePayload(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.n).toBe('ハルカ⚡');
    expect(decoded?.a).toBe(report.archetype.index);
    expect(decoded?.p).toHaveLength(12);
    expect(decoded?.s).toEqual([
      report.axes.impulse,
      report.axes.precision,
      report.axes.tempo,
      report.axes.risk,
      report.axes.order,
      report.axes.resonance,
    ]);
  });

  it('safely returns null on corrupted, empty, or oversized strings and resamples empty strokes', () => {
    expect(decodeSharePayload('')).toBeNull();
    expect(decodeSharePayload('not-valid-base64!!!')).toBeNull();
    expect(decodeSharePayload('e30')).toBeNull(); // "{}"
    expect(decodeSharePayload('a'.repeat(2000))).toBeNull();
    expect(resampleStroke([], 12)).toHaveLength(12);
  });

  it('computes compatibility scores and 3 specific pair dynamics', () => {
    const reportA = buildReport('Alice', makeBaseTelemetry());
    const rawB = makeBaseTelemetry({
      forbidden: {
        pressed: true,
        pressTimeMs: 1800,
        pressCount: 1,
        minDistancePx: 0,
        hoverDurationMs: 100,
        approachCount: 1,
        inputMode: 'mouse',
        trail: [],
      },
      greed: {
        exploded: true,
        peakMultiplier: 5.9,
        burstMultiplier: 5.9,
        brinkRatio: 1.0,
        preReleaseJitter: 0.4,
        holdDurationMs: 3100,
      },
    });
    const reportB = buildReport('Bob', rawB);
    const payloadB = decodeSharePayload(encodeSharePayload(reportB))!;

    const selfSync = computeCompatibility(reportA, decodeSharePayload(encodeSharePayload(reportA))!, 'ja');
    const diffSync = computeCompatibility(reportA, payloadB, 'en');

    expect(selfSync.syncScore).toBeGreaterThanOrEqual(88);
    expect(selfSync.syncScore).toBeLessThanOrEqual(99);
    expect(diffSync.syncScore).toBeGreaterThanOrEqual(18);
    expect(diffSync.syncScore).toBeLessThanOrEqual(99);
    expect(diffSync.pairTitle.length).toBeGreaterThan(3);
    expect(diffSync.dynamics).toHaveLength(3);
  });

  it('reaches all 16 archetypes across 3000 diverse seeded behavioral profiles', () => {
    const rng = createRng(42);
    const seen = new Set<string>();

    for (let i = 0; i < 3000; i += 1) {
      const pressed = rng() < 0.35;
      const exploded = rng() < 0.25;
      const burst = 3.7 + rng() * 5.4;
      const brink = exploded ? 1.0 : rng();
      const errMs = (rng() - 0.5) * 3200;
      const dir: 'fast' | 'slow' = rng() < 0.5 ? 'fast' : 'slow';
      const sASpk = rng();
      const sAWrm = rng();
      const sBSpk = rng();
      const sBWrm = rng();

      const raw = makeBaseTelemetry({
        chrono: {
          actualMs: 5000 + errMs,
          errorMs: errMs,
          interferenceDirection: dir,
          interferenceBpm: dir === 'fast' ? 81 : 47,
          pulledByInterference: (dir === 'fast' && errMs < -250) || (dir === 'slow' && errMs > 250),
          startDelayMs: 200 + rng() * 3500,
        },
        forbidden: {
          pressed,
          pressTimeMs: pressed ? rng() * 6800 : null,
          pressCount: pressed ? 1 : 0,
          minDistancePx: pressed ? 0 : rng() * 260,
          hoverDurationMs: pressed ? rng() * 800 : rng() * 3000,
          approachCount: Math.floor(rng() * 6),
          inputMode: 'mouse',
          trail: [],
        },
        crooked: {
          initialAngleDeg: 7.5,
          finalAngleDeg: (rng() - 0.5) * 9,
          absErrorDeg: rng() * 5.5,
          directionReversals: Math.floor(rng() * 12),
          microNudgeCount: Math.floor(rng() * 14),
          totalTimeMs: 1200 + rng() * 12800,
          timedOut: rng() < 0.08,
        },
        freehand: {
          points: [],
          smoothness: rng(),
          closedness: rng(),
          canvasCoverage: rng(),
          centerBias: rng(),
          velocityVariance: rng(),
          totalLength: 100 + rng() * 900,
          drawDurationMs: 500 + rng() * 5500,
        },
        greed: {
          exploded,
          peakMultiplier: 1 + brink * (burst - 1),
          burstMultiplier: burst,
          brinkRatio: brink,
          preReleaseJitter: rng(),
          holdDurationMs: 600 + rng() * 4500,
        },
        synesthesia: {
          soundA: { spikiness: sASpk, warmth: sAWrm, lockTimeMs: 700 + rng() * 6000 },
          soundB: { spikiness: sBSpk, warmth: sBWrm, lockTimeMs: 700 + rng() * 6000 },
          contrastDelta: Math.hypot(sASpk - sBSpk, sAWrm - sBWrm),
          boubaKikiAlignment: (sBSpk - sASpk + (sAWrm - sBWrm)) / 2,
        },
      });

      const arch = classifyArchetype(scoreTelemetry(raw), raw);
      seen.add(arch.id);
    }

    expect(seen.size).toBe(16);
  });
});

describe('analytics', () => {
  it('validates GA4 measurement IDs cleanly and degrades safely when unconfigured', () => {
    expect(getGaMeasurementId(' g-abc1234567 ')).toBe('G-ABC1234567');
    expect(getGaMeasurementId('G-XXXXXXXXXX')).toBeNull();
    expect(getGaMeasurementId('')).toBeNull();
    expect(getGaMeasurementId('UA-12345-1')).toBeNull();

    expect(initAnalytics(null)).toBe(false);
    expect(() => trackEvent('scan_start', { mode: 'daily' })).not.toThrow();
  });
});
