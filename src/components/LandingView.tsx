import { useEffect, useRef } from 'react';
import {
  Activity,
  Clock,
  Flame,
  History,
  PenTool,
  Radio,
  Ruler,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { Locale, MindprintReport, ScanMode, SharePayload } from '../types/mindprint';
import { TRANSLATIONS } from '../i18n/translations';
import { ARCHETYPES } from '../engine/archetypes';
import {
  SAMPLE_SIGIL_DATA,
  drawMindprintSigil,
  payloadToSigilData,
} from '../engine/sigilCanvas';

interface LandingViewProps {
  locale: Locale;
  mode: ScanMode;
  onChangeMode: (mode: ScanMode) => void;
  nickname: string;
  onChangeNickname: (val: string) => void;
  onStartScan: () => void;
  incomingTarget: SharePayload | null;
  history: MindprintReport[];
  onOpenHistoryReport: (report: MindprintReport) => void;
  onClearHistory: () => void;
}

const MODULE_ICONS = [Clock, ShieldAlert, Ruler, PenTool, Flame, Radio];

export function LandingView({
  locale,
  mode,
  onChangeMode,
  nickname,
  onChangeNickname,
  onStartScan,
  incomingTarget,
  history,
  onOpenHistoryReport,
  onClearHistory,
}: LandingViewProps) {
  const t = TRANSLATIONS[locale];
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const friendCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Live morphing Hero Sigil preview
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    let rafId = 0;

    const render = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const size = 260;
      if (canvas.width !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawMindprintSigil(ctx, size, SAMPLE_SIGIL_DATA, {
          theme: 'paper',
          timeSec: now / 1000,
        });
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Optional friend sigil preview when ?c= invite is active
  useEffect(() => {
    const canvas = friendCanvasRef.current;
    if (!canvas || !incomingTarget) return;
    let rafId = 0;
    const arch = ARCHETYPES[incomingTarget.a] ?? ARCHETYPES[15];
    const sigilData = payloadToSigilData(incomingTarget, arch.accentColor);

    const render = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const size = 104;
      if (canvas.width !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawMindprintSigil(ctx, size, sigilData, {
          theme: 'obsidian',
          timeSec: now / 1000,
        });
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [incomingTarget]);

  const targetArch = incomingTarget ? ARCHETYPES[incomingTarget.a] ?? ARCHETYPES[15] : null;
  const targetDisplayName = incomingTarget
    ? incomingTarget.n.trim() || t.results.anonymous
    : '';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Incoming Friend Sync Invite Banner */}
      {incomingTarget && targetArch && (
        <div className="swiss-card mb-8 border-[#FF3B1F] bg-[#111110] p-5 text-[#F4F2EC] shadow-[5px_5px_0px_#FF3B1F] sm:p-6">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <canvas
                ref={friendCanvasRef}
                className="h-[104px] w-[104px] shrink-0 rounded border border-white/25"
              />
              <div>
                <div className="inline-flex items-center gap-1.5 rounded bg-[#FF3B1F] px-2 py-0.5 font-mono-num text-[11px] font-bold text-white">
                  <Sparkles className="h-3 w-3" />
                  {t.syncInviteBadge}
                </div>
                <h2 className="font-display mt-2 text-xl font-black sm:text-2xl">
                  <span className="text-[#C6F600]">{targetDisplayName}</span>{' '}
                  {t.syncInviteTitle}
                </h2>
                <p className="mt-1 text-xs text-[#A8A29E] sm:text-sm">
                  {targetArch.code} — {targetArch.name[locale]}
                </p>
                <p className="mt-1.5 text-xs text-white/80 sm:text-sm">{t.syncInviteDesc}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Split */}
      <div className="swiss-card grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded border border-[#141413] bg-[#C6F600] px-2.5 py-1 font-mono-num text-[11px] font-bold">
            <Activity className="h-3.5 w-3.5" />
            <span>{t.heroBadge}</span>
          </div>

          <h1 className="font-display mt-4 text-3xl font-black leading-[1.12] tracking-tight sm:text-5xl">
            <span className="text-[#FF3B1F]">{t.heroTitleA}</span>
            <br />
            {t.heroTitleB}
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-[#57534E] sm:text-base">
            {t.heroLead}
          </p>

          <div className="mt-4 inline-block border-l-4 border-[#FF3B1F] pl-3 text-sm font-bold text-[#141413]">
            {t.taglineQuote}
          </div>

          {/* Setup Controls */}
          <div className="mt-6 space-y-4 border-t border-[#141413]/15 pt-5">
            <div>
              <label
                htmlFor="specimen-nick"
                className="font-mono-num block text-[11px] font-bold tracking-wider text-[#57534E]"
              >
                {t.nicknameLabel}
              </label>
              <input
                id="specimen-nick"
                type="text"
                maxLength={16}
                value={nickname}
                onChange={(e) => onChangeNickname(e.target.value)}
                placeholder={t.nicknamePlaceholder}
                className="mt-1.5 w-full rounded border-[1.5px] border-[#141413] bg-white px-3.5 py-2.5 text-sm font-bold outline-none focus:border-[#FF3B1F]"
              />
            </div>

            {/* Mode Toggle */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onChangeMode('daily')}
                className={`rounded border-[1.5px] border-[#141413] p-3 text-left transition-all ${
                  mode === 'daily'
                    ? 'bg-[#141413] text-[#F4F2EC] shadow-[3px_3px_0px_#FF3B1F]'
                    : 'bg-white text-[#141413] hover:bg-[#EBE7DC]'
                }`}
              >
                <div className="font-mono-num text-xs font-bold">{t.modeDaily}</div>
                <div
                  className={`mt-1 text-[11px] ${
                    mode === 'daily' ? 'text-white/75' : 'text-[#57534E]'
                  }`}
                >
                  {t.modeDailyDesc}
                </div>
              </button>

              <button
                type="button"
                onClick={() => onChangeMode('free')}
                className={`rounded border-[1.5px] border-[#141413] p-3 text-left transition-all ${
                  mode === 'free'
                    ? 'bg-[#141413] text-[#F4F2EC] shadow-[3px_3px_0px_#1D4ED8]'
                    : 'bg-white text-[#141413] hover:bg-[#EBE7DC]'
                }`}
              >
                <div className="font-mono-num text-xs font-bold">{t.modeFree}</div>
                <div
                  className={`mt-1 text-[11px] ${
                    mode === 'free' ? 'text-white/75' : 'text-[#57534E]'
                  }`}
                >
                  {t.modeFreeDesc}
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={onStartScan}
              className="swiss-btn w-full rounded-md bg-[#FF3B1F] px-6 py-4 font-display text-lg font-black text-white sm:text-xl"
            >
              {incomingTarget ? t.startSyncScan : t.startScan} →
            </button>

            <div className="font-mono-num text-center text-[11px] font-bold text-[#57534E]">
              {t.heroSubLead}
            </div>
          </div>
        </div>

        {/* Live Generative Sigil Specimen Preview */}
        <div className="flex flex-col items-center justify-center rounded-lg border-[1.5px] border-[#141413] bg-white p-5">
          <div className="mb-2 flex w-full items-center justify-between font-mono-num text-[10px] font-bold text-[#57534E]">
            <span>LIVE SIGIL GENERATOR</span>
            <span className="text-[#FF3B1F]">● REALTIME</span>
          </div>
          <canvas
            ref={heroCanvasRef}
            className="h-[260px] w-[260px] rounded border border-[#141413]/20"
          />
          <div className="mt-3 w-full border-t border-[#141413]/15 pt-2.5 text-center font-mono-num text-[11px] font-bold text-[#141413]">
            16 ARCHETYPES // 1080×1350 SPEC CARD
          </div>
        </div>
      </div>

      {/* 6 Protocols Preview Strip */}
      <div className="mt-8">
        <h3 className="font-mono-num mb-3 text-xs font-bold uppercase tracking-wider text-[#57534E]">
          {t.modulesStripTitle}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {t.moduleMeta.map((m, idx) => {
            const Icon = MODULE_ICONS[idx] ?? Activity;
            return (
              <div key={m.code} className="swiss-card-sm p-3.5">
                <div className="flex items-center justify-between font-mono-num text-[10px] font-bold text-[#57534E]">
                  <span>{m.code}</span>
                  <Icon className="h-3.5 w-3.5 text-[#FF3B1F]" />
                </div>
                <div className="mt-2 text-sm font-black leading-snug">{m.title}</div>
                <div className="mt-1 text-[11px] text-[#57534E]">{m.teaser}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Local Specimen Archive */}
      {history.length > 0 && (
        <div className="mt-8 swiss-card p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-[#141413]/15 pb-3">
            <div className="flex items-center gap-2 font-mono-num text-xs font-bold">
              <History className="h-4 w-4 text-[#1D4ED8]" />
              <span>{t.historyTitle}</span>
            </div>
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1 rounded border border-[#141413]/30 px-2 py-1 font-mono-num text-[11px] font-bold text-[#57534E] hover:border-[#FF3B1F] hover:text-[#FF3B1F]"
            >
              <Trash2 className="h-3 w-3" />
              {t.historyClear}
            </button>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {history.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenHistoryReport(item)}
                className="flex flex-col justify-between rounded border-[1.5px] border-[#141413] bg-white p-3 text-left transition-transform hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#141413]"
              >
                <div className="flex w-full items-center justify-between font-mono-num text-[10px] font-bold text-[#57534E]">
                  <span>{item.fingerprintHash}</span>
                  <span>{item.seedLabel}</span>
                </div>
                <div className="mt-1.5 text-sm font-black">{item.archetype.name[locale]}</div>
                <div className="mt-1 text-[11px] text-[#57534E]">
                  {item.nickname.trim() || t.results.anonymous}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
