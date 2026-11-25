export type Locale = 'ja' | 'en';
export type ScanMode = 'daily' | 'free';
export type CardTheme = 'paper' | 'obsidian';

export interface ChronoResult {
  actualMs: number;
  errorMs: number;
  interferenceDirection: 'fast' | 'slow';
  interferenceBpm: number;
  pulledByInterference: boolean;
  startDelayMs: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

export interface ForbiddenResult {
  pressed: boolean;
  pressTimeMs: number | null;
  pressCount: number;
  minDistancePx: number;
  hoverDurationMs: number;
  approachCount: number;
  inputMode: 'mouse' | 'touch';
  trail: TrailPoint[];
}

export interface CrookedResult {
  initialAngleDeg: number;
  finalAngleDeg: number;
  absErrorDeg: number;
  directionReversals: number;
  microNudgeCount: number;
  totalTimeMs: number;
  timedOut: boolean;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface FreehandResult {
  points: StrokePoint[];
  smoothness: number;
  closedness: number;
  canvasCoverage: number;
  centerBias: number;
  velocityVariance: number;
  totalLength: number;
  drawDurationMs: number;
}

export interface GreedResult {
  exploded: boolean;
  peakMultiplier: number;
  burstMultiplier: number;
  brinkRatio: number;
  preReleaseJitter: number;
  holdDurationMs: number;
}

export interface SynesthesiaChoice {
  spikiness: number;
  warmth: number;
  lockTimeMs: number;
}

export interface SynesthesiaResult {
  soundA: SynesthesiaChoice;
  soundB: SynesthesiaChoice;
  contrastDelta: number;
  boubaKikiAlignment: number;
}

export interface RawTelemetry {
  chrono: ChronoResult;
  forbidden: ForbiddenResult;
  crooked: CrookedResult;
  freehand: FreehandResult;
  greed: GreedResult;
  synesthesia: SynesthesiaResult;
  mode: ScanMode;
  seedId: string;
  completedAt: number;
}

export type AxisKey =
  | 'impulse'
  | 'precision'
  | 'tempo'
  | 'risk'
  | 'order'
  | 'resonance';

export type AxisScores = Record<AxisKey, number>;

export interface EvidenceItem {
  moduleIndex: number;
  label: string;
  metric: string;
  commentary: string;
}

export interface BilingualText {
  ja: string;
  en: string;
}

export interface ArchetypeDefinition {
  id: string;
  code: string;
  index: number;
  name: BilingualText;
  tagline: BilingualText;
  roast: BilingualText;
  manual: {
    strength: BilingualText;
    weakness: BilingualText;
    environment: BilingualText;
  };
  accentColor: string;
  prototype: AxisScores;
}

export interface MindprintReport {
  id: string;
  nickname: string;
  mode: ScanMode;
  seedLabel: string;
  fingerprintHash: string;
  axes: AxisScores;
  archetype: ArchetypeDefinition;
  evidence: EvidenceItem[];
  raw: RawTelemetry;
  createdAt: number;
}

export interface SharePayload {
  v: 1;
  n: string;
  a: number;
  s: [number, number, number, number, number, number];
  m: {
    ce: number; // chrono errorMs
    fp: 0 | 1; // forbidden pressed
    fd: number; // forbidden minDistancePx
    ca: number; // crooked absErrorDeg * 100
    gr: number; // greed brinkRatio * 100
    ge: 0 | 1; // greed exploded
    sa: [number, number]; // soundA [spikiness*100, warmth*100]
    sb: [number, number]; // soundB [spikiness*100, warmth*100]
  };
  p: Array<[number, number]>; // 12 quantized stroke points (0..63)
}

export interface CompatibilityResult {
  syncScore: number;
  pairTitle: string;
  pairSubtitle: string;
  dynamics: string[];
  axisDiffs: Record<AxisKey, number>;
}

export interface RunConfig {
  mode: ScanMode;
  seedId: string;
  seedLabel: string;
  chronoInterference: 'fast' | 'slow';
  chronoBpm: number;
  crookedInitialAngle: number;
  greedBurstMultiplier: number;
}
