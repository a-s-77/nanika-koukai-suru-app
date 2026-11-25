import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  RefreshCw,
  Share2,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import type {
  CardTheme,
  Locale,
  MindprintReport,
  SharePayload,
} from '../types/mindprint';
import { AXIS_ORDER, TRANSLATIONS } from '../i18n/translations';
import { ARCHETYPES } from '../engine/archetypes';
import { computeCompatibility } from '../engine/compatibility';
import { buildShareUrl, payloadToAxes } from '../engine/shareCodec';
import {
  drawDualSyncSigil,
  drawMindprintSigil,
  payloadToSigilData,
  reportToSigilData,
} from '../engine/sigilCanvas';
import { exportDualSyncCardPng, exportSoloSpecCardPng } from '../engine/specCardExporter';
import { trackEvent } from '../engine/analytics';
import { RadarChart } from './RadarChart';
import { TelemetryReplay } from './TelemetryReplay';

interface ResultsViewProps {
  report: MindprintReport;
  syncTarget: SharePayload | null;
  locale: Locale;
  onRetake: () => void;
}

export function ResultsView({ report, syncTarget, locale, onRetake }: ResultsViewProps) {
  const t = TRANSLATIONS[locale];
  const [activeTab, setActiveTab] = useState<'sync' | 'spec'>(syncTarget ? 'sync' : 'spec');
  const [cardTheme, setCardTheme] = useState<CardTheme>('paper');
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const soloSigilRef = useRef<HTMLCanvasElement | null>(null);
  const dualSigilRef = useRef<HTMLCanvasElement | null>(null);

  const compatibility = useMemo(() => {
    if (!syncTarget) return null;
    return computeCompatibility(report, syncTarget, locale);
  }, [report, syncTarget, locale]);

  const targetAxes = useMemo(
    () => (syncTarget ? payloadToAxes(syncTarget) : undefined),
    [syncTarget],
  );
  const targetArch = syncTarget ? ARCHETYPES[syncTarget.a] ?? ARCHETYPES[15] : null;
  const shareUrl = useMemo(() => buildShareUrl(report), [report]);

  // Animate Solo Sigil
  useEffect(() => {
    const canvas = soloSigilRef.current;
    if (!canvas) return;
    let rafId = 0;
    const data = reportToSigilData(report);

    const render = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const size = 280;
      if (canvas.width !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawMindprintSigil(ctx, size, data, {
          theme: cardTheme,
          timeSec: now / 1000,
        });
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [report, cardTheme, activeTab]);

  // Animate Dual Sync Sigil
  useEffect(() => {
    const canvas = dualSigilRef.current;
    if (!canvas || !syncTarget || !compatibility || !targetArch) return;
    let rafId = 0;
    const mine = reportToSigilData(report);
    const theirs = payloadToSigilData(syncTarget, targetArch.accentColor);

    const render = (now: number) => {
      const dpr = window.devicePixelRatio || 1;
      const w = 520;
      const h = 230;
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawDualSyncSigil(
          ctx,
          w,
          h,
          mine,
          theirs,
          compatibility.syncScore,
          now / 1000,
          cardTheme,
        );
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [report, syncTarget, compatibility, targetArch, cardTheme, activeTab]);

  const handleDownloadSolo = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportSoloSpecCardPng(report, cardTheme, locale, true);
      trackEvent('spec_png_download', { kind: 'solo', theme: cardTheme });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadDual = async () => {
    if (exporting || !syncTarget || !compatibility) return;
    setExporting(true);
    try {
      await exportDualSyncCardPng(report, syncTarget, compatibility, cardTheme, locale, true);
      trackEvent('spec_png_download', { kind: 'dual', theme: cardTheme });
    } finally {
      setExporting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const area = document.createElement('textarea');
      area.value = shareUrl;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    trackEvent('share_action', { channel: 'copy_link', archetype_id: report.archetype.id });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const handleTweetSolo = () => {
    trackEvent('share_action', { channel: 'x_solo', archetype_id: report.archetype.id });
    const topEvidence = report.evidence[0]?.metric ?? '';
    const text =
      locale === 'ja'
        ? `質問ゼロの行動指紋スキャン「MINDPRINT」の結果は【${report.archetype.name.ja}】でした。\n実測ログ：${topEvidence}\nあなたの無意識OSとのシンクロ率を測ってみよう👇\n#MINDPRINT`
        : `Zero-question behavioral scan MINDPRINT classified me as "${report.archetype.name.en}" (${topEvidence}). Scan yourself & test our Brainwave Sync score 👇\n#MINDPRINT`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text,
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
  };

  const handleTweetSync = () => {
    if (!compatibility || !syncTarget || !targetArch) return;
    trackEvent('share_action', { channel: 'x_sync', sync_score: compatibility.syncScore });
    const friendName = syncTarget.n.trim() || t.results.anonymous;
    const text =
      locale === 'ja'
        ? `${friendName}さんとの無意識シンクロ率は【${compatibility.syncScore}%】「${compatibility.pairTitle}」でした！\n質問ゼロの行動指紋スキャン #MINDPRINT`
        : `Our subconscious MINDPRINT Sync Score with ${friendName} is ${compatibility.syncScore}% — "${compatibility.pairTitle}"! #MINDPRINT`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text,
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intent, '_blank', 'noopener,noreferrer');
  };

  const displayNick = report.nickname.trim() || t.results.anonymous;

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-10">
      {/* Dual-Tab switcher when Sync target exists */}
      {syncTarget && compatibility && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`swiss-btn inline-flex items-center gap-2 rounded px-4 py-2.5 font-display text-sm font-black ${
              activeTab === 'sync' ? 'bg-[#FF3B1F] text-white' : 'bg-white text-[#141413]'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            {t.results.tabSync} ({compatibility.syncScore}%)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('spec')}
            className={`swiss-btn inline-flex items-center gap-2 rounded px-4 py-2.5 font-display text-sm font-black ${
              activeTab === 'spec' ? 'bg-[#141413] text-[#C6F600]' : 'bg-white text-[#141413]'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            {t.results.tabMySpec}
          </button>
        </div>
      )}

      {/* SYNC COMPARISON TAB */}
      {activeTab === 'sync' && syncTarget && compatibility && targetArch && targetAxes && (
        <div className="space-y-6">
          <div className="swiss-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#141413]/20 pb-3 font-mono-num text-xs font-bold">
              <span className="text-[#FF3B1F]">{t.results.syncHeadline}</span>
              <span className="text-[#57534E]">
                {displayNick} × {syncTarget.n.trim() || t.results.anonymous}
              </span>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <div className="font-mono-num text-6xl font-black tracking-tight text-[#FF3B1F] sm:text-7xl">
                  {compatibility.syncScore}%
                </div>
                <h2 className="font-display mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                  {compatibility.pairTitle}
                </h2>
                <p className="mt-2 text-sm text-[#57534E]">{compatibility.pairSubtitle}</p>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded border-2 border-[#FF3B1F] bg-white p-3">
                    <div className="font-mono-num text-[10px] font-bold text-[#FF3B1F]">
                      {t.results.syncYou} // {displayNick}
                    </div>
                    <div className="mt-1 font-display text-base font-black">
                      {report.archetype.name[locale]}
                    </div>
                  </div>
                  <div className="rounded border-2 border-[#1D4ED8] bg-white p-3">
                    <div className="font-mono-num text-[10px] font-bold text-[#1D4ED8]">
                      {t.results.syncFriend} // {syncTarget.n.trim() || t.results.anonymous}
                    </div>
                    <div className="mt-1 font-display text-base font-black">
                      {targetArch.name[locale]}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border-2 border-[#141413] bg-white p-2">
                <canvas ref={dualSigilRef} className="h-[210px] w-full object-contain" />
              </div>
            </div>

            <div className="mt-8 grid gap-6 border-t border-[#141413]/15 pt-6 lg:grid-cols-2 lg:items-center">
              <RadarChart
                primary={report.axes}
                secondary={targetAxes}
                primaryLabel={displayNick}
                secondaryLabel={syncTarget.n.trim() || t.results.syncFriend}
                locale={locale}
              />

              <div className="space-y-3">
                <h3 className="font-mono-num text-xs font-bold uppercase tracking-wider text-[#57534E]">
                  {t.results.syncDynamicsTitle}
                </h3>
                {compatibility.dynamics.map((line, idx) => (
                  <div
                    key={idx}
                    className="rounded border-[1.5px] border-[#141413] bg-white p-3.5 text-sm font-medium leading-relaxed"
                  >
                    <span className="font-mono-num mr-2 text-xs font-bold text-[#FF3B1F]">
                      0{idx + 1}
                    </span>
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Dual Sync Share Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[#141413]/15 pt-5">
              <button
                type="button"
                disabled={exporting}
                onClick={handleDownloadDual}
                className="swiss-btn inline-flex items-center gap-2 rounded bg-[#141413] px-4 py-2.5 font-display text-sm font-bold text-[#F4F2EC] hover:bg-[#1D4ED8]"
              >
                <Download className="h-4 w-4" />
                {exporting ? t.results.downloadingPng : t.results.downloadDualPng}
              </button>

              <button
                type="button"
                onClick={handleTweetSync}
                className="swiss-btn inline-flex items-center gap-2 rounded bg-[#FF3B1F] px-4 py-2.5 font-display text-sm font-bold text-white"
              >
                <Share2 className="h-4 w-4" />
                {t.results.shareSyncX}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOLO SPEC SHEET TAB */}
      {activeTab === 'spec' && (
        <div className="space-y-6">
          {/* Hero Specimen Card */}
          <div className="swiss-card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#141413]/20 pb-3 font-mono-num text-xs font-bold">
              <span>
                {t.results.specimenHeader} // {report.seedLabel}
              </span>
              <span className="text-[#FF3B1F]">
                {t.results.fingerprintLabel}: {report.fingerprintHash}
              </span>
            </div>

            <div className="mt-6 grid gap-7 lg:grid-cols-[290px_1fr] lg:items-center">
              {/* Live Sigil Showcase */}
              <div className="flex flex-col items-center">
                <div
                  className={`overflow-hidden rounded-lg border-2 border-[#141413] p-2 transition-colors ${
                    cardTheme === 'obsidian' ? 'bg-[#111110]' : 'bg-white'
                  }`}
                >
                  <canvas ref={soloSigilRef} className="h-[260px] w-[260px] sm:h-[280px] sm:w-[280px]" />
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCardTheme('paper')}
                    className={`rounded border border-[#141413] px-2.5 py-0.5 font-mono-num text-[11px] font-bold ${
                      cardTheme === 'paper'
                        ? 'bg-[#141413] text-[#F4F2EC]'
                        : 'bg-white text-[#141413]'
                    }`}
                  >
                    {t.results.themePaper}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardTheme('obsidian')}
                    className={`rounded border border-[#141413] px-2.5 py-0.5 font-mono-num text-[11px] font-bold ${
                      cardTheme === 'obsidian'
                        ? 'bg-[#141413] text-[#C6F600]'
                        : 'bg-white text-[#141413]'
                    }`}
                  >
                    {t.results.themeObsidian}
                  </button>
                </div>
              </div>

              {/* Archetype Verdict */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-[#FF3B1F] px-2.5 py-1 font-mono-num text-xs font-bold text-white">
                    {report.archetype.code}
                  </span>
                  <span className="rounded border border-[#141413] bg-white px-2.5 py-1 font-mono-num text-xs font-bold">
                    {displayNick}
                  </span>
                </div>

                <h1 className="font-display mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  {report.archetype.name[locale]}
                </h1>
                <div className="font-mono-num mt-1 text-xs font-bold text-[#1D4ED8]">
                  {locale === 'ja' ? report.archetype.name.en : report.archetype.name.ja}
                </div>

                <p className="mt-3 text-base font-bold text-[#141413]">
                  {report.archetype.tagline[locale]}
                </p>

                <div className="mt-4 rounded border-[1.5px] border-[#141413] bg-white p-4 text-sm leading-relaxed text-[#141413]">
                  {report.archetype.roast[locale]}
                </div>
              </div>
            </div>
          </div>

          {/* CAUGHT IN 4K: Raw Telemetry Evidence */}
          <div className="swiss-card p-6 sm:p-8">
            <div className="border-b border-[#141413]/15 pb-3">
              <h2 className="font-display text-xl font-black text-[#FF3B1F] sm:text-2xl">
                {t.results.evidenceTitle}
              </h2>
              <p className="mt-1 text-xs text-[#57534E] sm:text-sm">{t.results.evidenceSubtitle}</p>
            </div>

            <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
              {report.evidence.map((ev) => (
                <div
                  key={ev.moduleIndex}
                  className="relative overflow-hidden rounded border-[1.5px] border-[#141413] bg-white p-4 pl-5"
                >
                  <div className="absolute inset-y-0 left-0 w-1.5 bg-[#FF3B1F]" />
                  <div className="flex items-center justify-between gap-2 font-mono-num text-xs font-bold">
                    <span className="text-[#57534E]">{ev.label}</span>
                    <span className="rounded bg-[#141413] px-2 py-0.5 text-[#C6F600]">
                      {ev.metric}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm font-medium leading-relaxed text-[#141413]">
                    {ev.commentary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 6-Axis Radar + Behavioral Operating Manual */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="swiss-card p-6">
              <h3 className="font-mono-num border-b border-[#141413]/15 pb-3 text-xs font-bold uppercase tracking-wider">
                {t.results.radarTitle}
              </h3>

              <div className="mt-4">
                <RadarChart primary={report.axes} locale={locale} />
              </div>

              <div className="mt-4 space-y-2.5">
                {AXIS_ORDER.map((key) => {
                  const val = report.axes[key];
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>{t.axes[key].label}</span>
                        <span className="font-mono-num">
                          {val} / 100
                        </span>
                      </div>
                      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full border border-[#141413] bg-[#EBE7DC]">
                        <div
                          className={`h-full ${val >= 75 ? 'bg-[#FF3B1F]' : 'bg-[#1D4ED8]'}`}
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="swiss-card flex-1 p-6">
                <h3 className="font-mono-num border-b border-[#141413]/15 pb-3 text-xs font-bold uppercase tracking-wider">
                  {t.results.manualTitle}
                </h3>

                <div className="mt-4 space-y-4">
                  <div className="rounded border border-[#141413] bg-white p-3.5">
                    <div className="font-mono-num text-[11px] font-bold text-[#1D4ED8]">
                      ▲ {t.results.manualStrength}
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {report.archetype.manual.strength[locale]}
                    </p>
                  </div>

                  <div className="rounded border border-[#141413] bg-white p-3.5">
                    <div className="font-mono-num text-[11px] font-bold text-[#FF3B1F]">
                      ▼ {t.results.manualWeakness}
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {report.archetype.manual.weakness[locale]}
                    </p>
                  </div>

                  <div className="rounded border border-[#141413] bg-[#141413] p-3.5 text-[#F4F2EC]">
                    <div className="font-mono-num text-[11px] font-bold text-[#C6F600]">
                      ★ {t.results.manualEnvironment}
                    </div>
                    <p className="mt-1 text-sm font-medium">
                      {report.archetype.manual.environment[locale]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Micro-Behavior Replay */}
          <TelemetryReplay raw={report.raw} locale={locale} />
        </div>
      )}

      {/* Persistent Viral Share & Export Console */}
      <div className="swiss-card mt-6 bg-[#111110] p-6 text-[#F4F2EC] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
          <h3 className="font-display text-lg font-black text-[#C6F600]">
            {t.results.sharePanelTitle}
          </h3>
          <span className="font-mono-num text-xs text-white/60">ZERO-BACKEND URL SYNC</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            disabled={exporting}
            onClick={handleDownloadSolo}
            className="swiss-btn inline-flex items-center justify-center gap-2 rounded bg-[#C6F600] px-4 py-3 font-display text-sm font-black text-[#141413]"
          >
            <Download className="h-4 w-4 shrink-0" />
            <span>{exporting ? t.results.downloadingPng : t.results.downloadPng}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="swiss-btn inline-flex items-center justify-center gap-2 rounded bg-[#FF3B1F] px-4 py-3 font-display text-sm font-black text-white"
          >
            {copied ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
            <span>{copied ? t.results.copiedLink : t.results.copyLink}</span>
          </button>

          <button
            type="button"
            onClick={handleTweetSolo}
            className="swiss-btn inline-flex items-center justify-center gap-2 rounded bg-white px-4 py-3 font-display text-sm font-black text-[#141413]"
          >
            <Share2 className="h-4 w-4 shrink-0" />
            <span>{t.results.shareX}</span>
          </button>

          <button
            type="button"
            onClick={onRetake}
            className="swiss-btn inline-flex items-center justify-center gap-2 rounded border-white/40 bg-[#1A1A18] px-4 py-3 font-display text-sm font-bold text-[#F4F2EC] hover:bg-[#1D4ED8]"
          >
            <RefreshCw className="h-4 w-4 shrink-0" />
            <span>{t.results.retakeScan}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
