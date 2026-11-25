import type { MindprintReport, SharePayload, StrokePoint } from '../types/mindprint';
import { AXIS_ORDER } from '../i18n/translations';
import { clamp } from './scoring';

export function resampleStroke(points: StrokePoint[], targetCount = 12): Array<[number, number]> {
  if (!points || points.length === 0) {
    // Fallback neutral circle signature
    const out: Array<[number, number]> = [];
    for (let i = 0; i < targetCount; i += 1) {
      const a = (i / targetCount) * Math.PI * 2;
      out.push([
        Math.round(32 + Math.cos(a) * 18),
        Math.round(32 + Math.sin(a) * 18),
      ]);
    }
    return out;
  }

  if (points.length === 1) {
    const x = Math.round(clamp(points[0].x, 0, 1) * 63);
    const y = Math.round(clamp(points[0].y, 0, 1) * 63);
    return Array.from({ length: targetCount }, () => [x, y]);
  }

  const cumDist: number[] = [0];
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    cumDist.push(cumDist[i - 1] + Math.hypot(dx, dy));
  }
  const totalLen = cumDist[cumDist.length - 1];

  const sampled: Array<[number, number]> = [];
  if (totalLen < 1e-6) {
    const x = Math.round(clamp(points[0].x, 0, 1) * 63);
    const y = Math.round(clamp(points[0].y, 0, 1) * 63);
    return Array.from({ length: targetCount }, () => [x, y]);
  }

  for (let k = 0; k < targetCount; k += 1) {
    const targetDist = (k / (targetCount - 1)) * totalLen;
    let idx = 0;
    while (idx < cumDist.length - 2 && cumDist[idx + 1] < targetDist) {
      idx += 1;
    }
    const segStart = cumDist[idx];
    const segEnd = cumDist[idx + 1];
    const ratio = segEnd > segStart ? (targetDist - segStart) / (segEnd - segStart) : 0;
    const x = points[idx].x + (points[idx + 1].x - points[idx].x) * ratio;
    const y = points[idx].y + (points[idx + 1].y - points[idx].y) * ratio;
    sampled.push([
      Math.round(clamp(x, 0, 1) * 63),
      Math.round(clamp(y, 0, 1) * 63),
    ]);
  }

  return sampled;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64: string): Uint8Array {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeSharePayload(report: MindprintReport): string {
  const payload: SharePayload = {
    v: 1,
    n: (report.nickname || '').trim().slice(0, 16),
    a: report.archetype.index,
    s: [
      report.axes.impulse,
      report.axes.precision,
      report.axes.tempo,
      report.axes.risk,
      report.axes.order,
      report.axes.resonance,
    ],
    m: {
      ce: Math.round(clamp(report.raw.chrono.errorMs, -4999, 12000)),
      fp: report.raw.forbidden.pressed ? 1 : 0,
      fd: Math.round(clamp(report.raw.forbidden.minDistancePx, 0, 999)),
      ca: Math.round(clamp(report.raw.crooked.absErrorDeg * 100, 0, 1500)),
      gr: Math.round(clamp(report.raw.greed.brinkRatio * 100, 0, 120)),
      ge: report.raw.greed.exploded ? 1 : 0,
      sa: [
        Math.round(clamp(report.raw.synesthesia.soundA.spikiness * 100, 0, 100)),
        Math.round(clamp(report.raw.synesthesia.soundA.warmth * 100, 0, 100)),
      ],
      sb: [
        Math.round(clamp(report.raw.synesthesia.soundB.spikiness * 100, 0, 100)),
        Math.round(clamp(report.raw.synesthesia.soundB.warmth * 100, 0, 100)),
      ],
    },
    p: resampleStroke(report.raw.freehand.points, 12),
  };

  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  return bytesToBase64Url(bytes);
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  if (!encoded || typeof encoded !== 'string' || encoded.length > 1500) {
    return null;
  }
  try {
    const bytes = base64UrlToBytes(encoded.trim());
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Partial<SharePayload>;
    if (!parsed || parsed.v !== 1) return null;
    if (typeof parsed.a !== 'number' || !Number.isInteger(parsed.a) || parsed.a < 0 || parsed.a > 15) {
      return null;
    }
    if (!Array.isArray(parsed.s) || parsed.s.length !== AXIS_ORDER.length) return null;
    const scores = parsed.s.map((v) =>
      typeof v === 'number' && Number.isFinite(v) ? Math.round(clamp(v, 0, 100)) : null,
    );
    if (scores.some((v) => v === null)) return null;

    if (!parsed.m || typeof parsed.m !== 'object') return null;
    const m = parsed.m;
    if (
      typeof m.ce !== 'number' ||
      (m.fp !== 0 && m.fp !== 1) ||
      typeof m.fd !== 'number' ||
      typeof m.ca !== 'number' ||
      typeof m.gr !== 'number' ||
      (m.ge !== 0 && m.ge !== 1) ||
      !Array.isArray(m.sa) ||
      m.sa.length !== 2 ||
      !Array.isArray(m.sb) ||
      m.sb.length !== 2
    ) {
      return null;
    }

    if (!Array.isArray(parsed.p) || parsed.p.length < 2 || parsed.p.length > 24) return null;
    const safePoints: Array<[number, number]> = [];
    for (const pt of parsed.p) {
      if (!Array.isArray(pt) || pt.length !== 2) return null;
      if (typeof pt[0] !== 'number' || typeof pt[1] !== 'number') return null;
      safePoints.push([
        Math.round(clamp(pt[0], 0, 63)),
        Math.round(clamp(pt[1], 0, 63)),
      ]);
    }

    return {
      v: 1,
      n: typeof parsed.n === 'string' ? parsed.n.slice(0, 16) : '',
      a: parsed.a,
      s: scores as [number, number, number, number, number, number],
      m: {
        ce: Math.round(clamp(m.ce, -4999, 12000)),
        fp: m.fp,
        fd: Math.round(clamp(m.fd, 0, 999)),
        ca: Math.round(clamp(m.ca, 0, 1500)),
        gr: Math.round(clamp(m.gr, 0, 120)),
        ge: m.ge,
        sa: [
          Math.round(clamp(m.sa[0], 0, 100)),
          Math.round(clamp(m.sa[1], 0, 100)),
        ],
        sb: [
          Math.round(clamp(m.sb[0], 0, 100)),
          Math.round(clamp(m.sb[1], 0, 100)),
        ],
      },
      p: safePoints,
    };
  } catch {
    return null;
  }
}

export function payloadToAxes(payload: SharePayload): Record<(typeof AXIS_ORDER)[number], number> {
  return {
    impulse: payload.s[0],
    precision: payload.s[1],
    tempo: payload.s[2],
    risk: payload.s[3],
    order: payload.s[4],
    resonance: payload.s[5],
  };
}

export function buildShareUrl(report: MindprintReport): string {
  const code = encodeSharePayload(report);
  if (typeof window === 'undefined') {
    return `?c=${code}`;
  }
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('c', code);
  return url.toString();
}
