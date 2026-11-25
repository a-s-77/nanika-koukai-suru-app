import { useEffect, useRef, useState } from 'react';
import type {
  ChronoResult,
  CrookedResult,
  ForbiddenResult,
  FreehandResult,
  GreedResult,
  Locale,
  MindprintReport,
  RawTelemetry,
  RunConfig,
  ScanMode,
  SharePayload,
  SynesthesiaResult,
} from './types/mindprint';
import { TRANSLATIONS } from './i18n/translations';
import { generateRunConfig } from './engine/rng';
import { computeFingerprintHash, scoreTelemetry } from './engine/scoring';
import { classifyArchetype, generateEvidence } from './engine/archetypes';
import { decodeSharePayload } from './engine/shareCodec';
import { SoundEngine } from './engine/sound';
import { trackEvent } from './engine/analytics';
import { HeaderBar } from './components/HeaderBar';
import { LandingView } from './components/LandingView';
import { ModuleTransition } from './components/ModuleTransition';
import { ChronoModule } from './components/modules/ChronoModule';
import { ForbiddenButtonModule } from './components/modules/ForbiddenButtonModule';
import { CrookedFrameModule } from './components/modules/CrookedFrameModule';
import { FreehandModule } from './components/modules/FreehandModule';
import { GreedHorizonModule } from './components/modules/GreedHorizonModule';
import { SynesthesiaModule } from './components/modules/SynesthesiaModule';
import { ResultsView } from './components/ResultsView';

type AppPhase = 'landing' | 'transition' | 'module' | 'compiling' | 'results';

const HISTORY_STORAGE_KEY = 'mindprint_history_v1';
const NICKNAME_STORAGE_KEY = 'mindprint_nickname_v1';

interface PartialTelemetry {
  chrono?: ChronoResult;
  forbidden?: ForbiddenResult;
  crooked?: CrookedResult;
  freehand?: FreehandResult;
  greed?: GreedResult;
  synesthesia?: SynesthesiaResult;
}

function loadHistory(): MindprintReport[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function App() {
  const [locale, setLocale] = useState<Locale>('ja');
  const [muted, setMuted] = useState<boolean>(false);
  const [mode, setMode] = useState<ScanMode>('daily');
  const [nickname, setNickname] = useState<string>(() => {
    try {
      return window.localStorage.getItem(NICKNAME_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });

  const [incomingTarget, setIncomingTarget] = useState<SharePayload | null>(null);
  const [phase, setPhase] = useState<AppPhase>('landing');
  const [moduleIndex, setModuleIndex] = useState<number>(0);
  const [runConfig, setRunConfig] = useState<RunConfig>(() => generateRunConfig('daily'));
  const [compileStep, setCompileStep] = useState<number>(0);
  const [report, setReport] = useState<MindprintReport | null>(null);
  const [history, setHistory] = useState<MindprintReport[]>(() => loadHistory());

  const telemetryRef = useRef<PartialTelemetry>({});
  const transitionTimerRef = useRef<number | null>(null);
  const compileTimersRef = useRef<number[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('c');
    if (code) {
      const decoded = decodeSharePayload(code);
      if (decoded) {
        setIncomingTarget(decoded);
        trackEvent('sync_invite_landed', { target_archetype_index: decoded.a });
      }
    }
    return () => {
      SoundEngine.stopAllLoops();
      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
      compileTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const handleChangeNickname = (val: string) => {
    setNickname(val);
    try {
      window.localStorage.setItem(NICKNAME_STORAGE_KEY, val);
    } catch {
      // ignore storage quota errors
    }
  };

  const handleToggleMute = () => {
    const next = SoundEngine.toggleMuted();
    setMuted(next);
  };

  const startTransitionToModule = (idx: number) => {
    SoundEngine.stopAllLoops();
    SoundEngine.playShutter();
    setModuleIndex(idx);
    setPhase('transition');
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = window.setTimeout(() => {
      setPhase('module');
    }, 440);
  };

  const handleStartScan = () => {
    SoundEngine.unlock();
    const cfg = generateRunConfig(mode);
    setRunConfig(cfg);
    telemetryRef.current = {};
    setReport(null);
    trackEvent('scan_start', {
      mode,
      has_sync_target: Boolean(incomingTarget),
    });
    startTransitionToModule(0);
  };

  const finalizeScan = (finalSynesthesia: SynesthesiaResult) => {
    SoundEngine.stopAllLoops();
    setPhase('compiling');
    setCompileStep(0);

    const partial = telemetryRef.current;
    const raw: RawTelemetry = {
      chrono: partial.chrono!,
      forbidden: partial.forbidden!,
      crooked: partial.crooked!,
      freehand: partial.freehand!,
      greed: partial.greed!,
      synesthesia: finalSynesthesia,
      mode: runConfig.mode,
      seedId: runConfig.seedId,
      completedAt: Date.now(),
    };

    const axes = scoreTelemetry(raw);
    const archetype = classifyArchetype(axes, raw);
    const evidence = generateEvidence(raw, locale);
    const fingerprintHash = computeFingerprintHash(axes, raw);

    trackEvent('scan_complete', {
      archetype_id: archetype.id,
      mode: runConfig.mode,
      forbidden_pressed: raw.forbidden.pressed,
      greed_exploded: raw.greed.exploded,
      has_sync_target: Boolean(incomingTarget),
    });

    const builtReport: MindprintReport = {
      id: `${Date.now()}-${fingerprintHash}`,
      nickname: nickname.trim(),
      mode: runConfig.mode,
      seedLabel: runConfig.seedLabel,
      fingerprintHash,
      axes,
      archetype,
      evidence,
      raw,
      createdAt: Date.now(),
    };

    compileTimersRef.current.forEach((id) => window.clearTimeout(id));
    compileTimersRef.current = [
      window.setTimeout(() => setCompileStep(1), 320),
      window.setTimeout(() => setCompileStep(2), 680),
      window.setTimeout(() => {
        SoundEngine.playRevealChord();
        setReport(builtReport);
        setHistory((prev) => {
          const next = [builtReport, ...prev].slice(0, 12);
          try {
            window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
        setPhase('results');
      }, 1060),
    ];
  };

  const handleRequestHome = () => {
    const t = TRANSLATIONS[locale];
    if (phase === 'module' || phase === 'transition' || phase === 'compiling') {
      if (!window.confirm(t.header.exitConfirm)) return;
    }
    SoundEngine.stopAllLoops();
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current);
    compileTimersRef.current.forEach((id) => window.clearTimeout(id));
    setPhase('landing');
  };

  const handleOpenHistoryReport = (saved: MindprintReport) => {
    SoundEngine.unlock();
    // Re-localize evidence cleanly for current UI locale
    const relocalized: MindprintReport = {
      ...saved,
      evidence: generateEvidence(saved.raw, locale),
    };
    setReport(relocalized);
    setPhase('results');
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleToggleLocale = () => {
    const nextLocale: Locale = locale === 'ja' ? 'en' : 'ja';
    setLocale(nextLocale);
    if (report) {
      setReport({
        ...report,
        evidence: generateEvidence(report.raw, nextLocale),
      });
    }
  };

  const t = TRANSLATIONS[locale];

  return (
    <div className="bg-lab-grid min-h-screen text-[#141413]">
      <HeaderBar
        locale={locale}
        onToggleLocale={handleToggleLocale}
        muted={muted}
        onToggleMute={handleToggleMute}
        phase={phase}
        moduleIndex={moduleIndex}
        mode={mode}
        syncTargetName={incomingTarget ? incomingTarget.n : null}
        onRequestHome={handleRequestHome}
      />

      <main className="pb-12">
        {phase === 'landing' && (
          <LandingView
            locale={locale}
            mode={mode}
            onChangeMode={setMode}
            nickname={nickname}
            onChangeNickname={handleChangeNickname}
            onStartScan={handleStartScan}
            incomingTarget={incomingTarget}
            history={history}
            onOpenHistoryReport={handleOpenHistoryReport}
            onClearHistory={handleClearHistory}
          />
        )}

        {phase === 'transition' && (
          <ModuleTransition locale={locale} moduleIndex={moduleIndex} />
        )}

        {phase === 'module' && moduleIndex === 0 && (
          <ChronoModule
            locale={locale}
            config={runConfig}
            onComplete={(res) => {
              telemetryRef.current.chrono = res;
              trackEvent('module_complete', { module_index: 1, module_name: 'chrono' });
              startTransitionToModule(1);
            }}
          />
        )}

        {phase === 'module' && moduleIndex === 1 && (
          <ForbiddenButtonModule
            locale={locale}
            onComplete={(res) => {
              telemetryRef.current.forbidden = res;
              trackEvent('module_complete', { module_index: 2, module_name: 'forbidden' });
              startTransitionToModule(2);
            }}
          />
        )}

        {phase === 'module' && moduleIndex === 2 && (
          <CrookedFrameModule
            locale={locale}
            config={runConfig}
            onComplete={(res) => {
              telemetryRef.current.crooked = res;
              trackEvent('module_complete', { module_index: 3, module_name: 'crooked' });
              startTransitionToModule(3);
            }}
          />
        )}

        {phase === 'module' && moduleIndex === 3 && (
          <FreehandModule
            locale={locale}
            onComplete={(res) => {
              telemetryRef.current.freehand = res;
              trackEvent('module_complete', { module_index: 4, module_name: 'freehand' });
              startTransitionToModule(4);
            }}
          />
        )}

        {phase === 'module' && moduleIndex === 4 && (
          <GreedHorizonModule
            locale={locale}
            config={runConfig}
            onComplete={(res) => {
              telemetryRef.current.greed = res;
              trackEvent('module_complete', { module_index: 5, module_name: 'greed' });
              startTransitionToModule(5);
            }}
          />
        )}

        {phase === 'module' && moduleIndex === 5 && (
          <SynesthesiaModule
            locale={locale}
            muted={muted}
            onComplete={(res) => {
              telemetryRef.current.synesthesia = res;
              trackEvent('module_complete', { module_index: 6, module_name: 'synesthesia' });
              finalizeScan(res);
            }}
          />
        )}

        {phase === 'compiling' && (
          <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-12">
            <div className="swiss-card relative w-full overflow-hidden bg-[#111110] p-8 text-[#F4F2EC]">
              <div className="animate-scanline pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-transparent via-[#C6F600]/15 to-transparent" />
              <div className="font-mono-num text-xs font-bold text-[#FF3B1F]">
                SYNTHESIS // TELEMETRY COMPILER
              </div>
              <h2 className="font-display mt-3 text-2xl font-black sm:text-3xl">
                {t.compiling.title}
              </h2>
              <div className="mt-6 space-y-2.5 font-mono-num text-xs">
                {t.compiling.steps.map((step, i) => (
                  <div
                    key={step}
                    className={`flex items-center gap-2 transition-opacity ${
                      i <= compileStep ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        i < compileStep
                          ? 'bg-[#C6F600]'
                          : i === compileStep
                            ? 'animate-ping bg-[#FF3B1F]'
                            : 'bg-white/30'
                      }`}
                    />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {phase === 'results' && report && (
          <ResultsView
            report={report}
            syncTarget={incomingTarget}
            locale={locale}
            onRetake={handleStartScan}
          />
        )}
      </main>
    </div>
  );
}

export default App;
