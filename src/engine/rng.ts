import type { RunConfig, ScanMode } from '../types/mindprint';

export function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailySeedId(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateRunConfig(mode: ScanMode, customSeed?: string): RunConfig {
  const seedId =
    mode === 'daily'
      ? customSeed ?? getDailySeedId()
      : customSeed ??
        `${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 0xffff)
          .toString(16)
          .toUpperCase()
          .padStart(4, '0')}`;

  const rng = createRng(hashString(`${mode}:${seedId}`));

  const chronoInterference: 'fast' | 'slow' = rng() >= 0.5 ? 'fast' : 'slow';
  const chronoBpm =
    chronoInterference === 'fast'
      ? Math.round(78 + rng() * 6) // 78..84 BPM
      : Math.round(44 + rng() * 6); // 44..50 BPM

  const sign = rng() >= 0.5 ? 1 : -1;
  const crookedMag = 5.5 + rng() * 4.3; // 5.5..9.8 deg
  const crookedInitialAngle = Number((sign * crookedMag).toFixed(1));

  // Skewed distribution peaking between ~4.5 and ~7.6 within 3.7..9.1
  const u1 = rng();
  const u2 = rng();
  const skewed = (u1 + u2) / 2; // triangular around 0.5
  const greedBurstMultiplier = Number((3.7 + skewed * (9.1 - 3.7)).toFixed(2));

  const seedLabel =
    mode === 'daily'
      ? `DAILY // ${seedId.replace(/-/g, '.')}`
      : `FREE // #${seedId.slice(-4)}`;

  return {
    mode,
    seedId,
    seedLabel,
    chronoInterference,
    chronoBpm,
    crookedInitialAngle,
    greedBurstMultiplier,
  };
}
