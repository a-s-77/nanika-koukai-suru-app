import type {
  CardTheme,
  CompatibilityResult,
  Locale,
  MindprintReport,
  SharePayload,
} from '../types/mindprint';
import { AXIS_ORDER, TRANSLATIONS } from '../i18n/translations';
import { ARCHETYPES } from './archetypes';
import { payloadToAxes } from './shareCodec';
import {
  drawDualSyncSigil,
  drawMindprintSigil,
  payloadToSigilData,
  reportToSigilData,
} from './sigilCanvas';

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3,
): string[] {
  const chars = Array.from(text);
  const lines: string[] = [];
  let current = '';

  for (const ch of chars) {
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
      if (lines.length >= maxLines) break;
    } else {
      current = test;
    }
  }
  if (lines.length < maxLines && current) {
    lines.push(current);
  }
  return lines;
}

export function triggerPngDownload(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportSoloSpecCardPng(
  report: MindprintReport,
  theme: CardTheme,
  locale: Locale,
  autoDownload = true,
): Promise<string> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const t = TRANSLATIONS[locale];
  const isObsidian = theme === 'obsidian';
  const bg = isObsidian ? '#111110' : '#F4F2EC';
  const surface = isObsidian ? '#1A1A18' : '#FFFFFF';
  const ink = isObsidian ? '#F4F2EC' : '#141413';
  const muted = isObsidian ? '#A8A29E' : '#57534E';
  const border = isObsidian ? 'rgba(244,242,236,0.22)' : '#141413';
  const vermilion = '#FF3B1F';
  const accent = isObsidian ? '#C6F600' : report.archetype.accentColor;

  // Background + dot grid
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = isObsidian ? 'rgba(244,242,236,0.08)' : 'rgba(20,20,19,0.11)';
  for (let gx = 24; gx < W; gx += 28) {
    for (let gy = 24; gy < H; gy += 28) {
      ctx.fillRect(gx, gy, 1.5, 1.5);
    }
  }

  // Outer Lab Frame
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Header serial bar
  ctx.fillStyle = ink;
  ctx.fillRect(36, 36, W - 72, 62);
  ctx.fillStyle = bg;
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText(`MINDPRINT LAB // ${report.seedLabel}`, 64, 75);
  ctx.textAlign = 'right';
  ctx.fillText(report.fingerprintHash, W - 64, 75);
  ctx.textAlign = 'left';

  // Sigil Showcase Box
  const sigilSize = 420;
  const sigilX = 64;
  const sigilY = 126;
  ctx.fillStyle = surface;
  ctx.fillRect(sigilX, sigilY, sigilSize, sigilSize);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(sigilX, sigilY, sigilSize, sigilSize);

  ctx.save();
  ctx.translate(sigilX, sigilY);
  drawMindprintSigil(ctx, sigilSize, reportToSigilData(report), {
    theme,
    timeSec: 0,
    transparentBg: true,
  });
  ctx.restore();

  // Right-side Identity Column
  const colX = 516;
  const colW = W - 64 - colX;

  ctx.fillStyle = vermilion;
  ctx.fillRect(colX, sigilY, 180, 32);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 15px "JetBrains Mono", monospace';
  ctx.fillText(report.archetype.code, colX + 12, sigilY + 21);

  const displayNick = report.nickname.trim() || t.results.anonymous;
  ctx.fillStyle = muted;
  ctx.font = '700 20px "JetBrains Mono", "Noto Sans JP", sans-serif';
  ctx.fillText(`SUBJECT: ${displayNick}`, colX, sigilY + 64);

  ctx.fillStyle = ink;
  ctx.font = '900 42px "Noto Sans JP", "Space Grotesk", sans-serif';
  const titleLines = wrapLines(ctx, report.archetype.name[locale], colW, 2);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, colX, sigilY + 116 + i * 50);
  });

  const afterTitleY = sigilY + 116 + titleLines.length * 50 + 6;
  ctx.fillStyle = accent;
  ctx.font = '700 20px "Noto Sans JP", sans-serif';
  const tagLines = wrapLines(ctx, report.archetype.tagline[locale], colW, 2);
  tagLines.forEach((line, i) => {
    ctx.fillText(line, colX, afterTitleY + i * 28);
  });

  // Roast Box inside right column
  const roastY = sigilY + 278;
  ctx.fillStyle = surface;
  ctx.fillRect(colX, roastY, colW, 142);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(colX, roastY, colW, 142);
  ctx.fillStyle = ink;
  ctx.font = '500 18px "Noto Sans JP", sans-serif';
  const roastLines = wrapLines(ctx, report.archetype.roast[locale], colW - 32, 4);
  roastLines.forEach((line, i) => {
    ctx.fillText(line, colX + 16, roastY + 34 + i * 28);
  });

  // 6-Axis Spec Bars
  const barsY = 578;
  ctx.fillStyle = ink;
  ctx.font = '700 20px "JetBrains Mono", "Noto Sans JP", sans-serif';
  ctx.fillText('01 // 6-AXIS BEHAVIORAL TELEMETRY', 64, barsY);

  const barColW = 456;
  AXIS_ORDER.forEach((key, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 64 + col * (barColW + 40);
    const by = barsY + 28 + row * 68;
    const val = report.axes[key];

    ctx.fillStyle = ink;
    ctx.font = '700 18px "Noto Sans JP", "Space Grotesk", sans-serif';
    ctx.fillText(t.axes[key].label, bx, by + 18);

    ctx.textAlign = 'right';
    ctx.font = '700 20px "JetBrains Mono", monospace';
    ctx.fillStyle = val >= 75 ? vermilion : ink;
    ctx.fillText(String(val).padStart(2, '0'), bx + barColW, by + 18);
    ctx.textAlign = 'left';

    // Track
    ctx.fillStyle = isObsidian ? 'rgba(244,242,236,0.12)' : '#E5E0D5';
    ctx.fillRect(bx, by + 28, barColW, 16);
    ctx.fillStyle = val >= 75 ? vermilion : accent;
    ctx.fillRect(bx, by + 28, (barColW * val) / 100, 16);
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by + 28, barColW, 16);
  });

  // Evidence "Caught in 4K" Cards (top 3)
  const evY = 824;
  ctx.fillStyle = ink;
  ctx.font = '700 20px "JetBrains Mono", "Noto Sans JP", sans-serif';
  ctx.fillText('02 // CAUGHT IN 4K — RAW LOG EVIDENCE', 64, evY);

  report.evidence.slice(0, 3).forEach((ev, idx) => {
    const cy = evY + 22 + idx * 124;
    ctx.fillStyle = surface;
    ctx.fillRect(64, cy, W - 128, 108);
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.strokeRect(64, cy, W - 128, 108);

    ctx.fillStyle = vermilion;
    ctx.fillRect(64, cy, 8, 108);

    ctx.fillStyle = muted;
    ctx.font = '700 16px "JetBrains Mono", "Noto Sans JP", sans-serif';
    ctx.fillText(ev.label.toUpperCase(), 90, cy + 30);

    ctx.textAlign = 'right';
    ctx.fillStyle = ink;
    ctx.font = '700 20px "JetBrains Mono", "Noto Sans JP", sans-serif';
    ctx.fillText(ev.metric, W - 88, cy + 30);
    ctx.textAlign = 'left';

    ctx.fillStyle = ink;
    ctx.font = '500 18px "Noto Sans JP", sans-serif';
    const cLines = wrapLines(ctx, ev.commentary, W - 180, 2);
    cLines.forEach((line, li) => {
      ctx.fillText(line, 90, cy + 62 + li * 27);
    });
  });

  // Footer
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(64, H - 104);
  ctx.lineTo(W - 64, H - 104);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.font = '700 20px "Noto Sans JP", "Space Grotesk", sans-serif';
  ctx.fillText(t.taglineQuote, 64, H - 64);

  ctx.textAlign = 'right';
  ctx.fillStyle = muted;
  ctx.font = '700 16px "JetBrains Mono", monospace';
  ctx.fillText('ZERO-QUESTION BEHAVIOR LAB', W - 64, H - 64);
  ctx.textAlign = 'left';

  const dataUrl = canvas.toDataURL('image/png');
  if (autoDownload) {
    triggerPngDownload(dataUrl, `mindprint-${report.fingerprintHash}-${theme}.png`);
  }
  return dataUrl;
}

export async function exportDualSyncCardPng(
  report: MindprintReport,
  target: SharePayload,
  sync: CompatibilityResult,
  theme: CardTheme,
  locale: Locale,
  autoDownload = true,
): Promise<string> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const t = TRANSLATIONS[locale];
  const isObsidian = theme === 'obsidian';
  const bg = isObsidian ? '#111110' : '#F4F2EC';
  const surface = isObsidian ? '#1A1A18' : '#FFFFFF';
  const ink = isObsidian ? '#F4F2EC' : '#141413';
  const muted = isObsidian ? '#A8A29E' : '#57534E';
  const border = isObsidian ? 'rgba(244,242,236,0.22)' : '#141413';
  const vermilion = '#FF3B1F';
  const cobalt = '#1D4ED8';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  // Header
  ctx.fillStyle = ink;
  ctx.fillRect(36, 36, W - 72, 62);
  ctx.fillStyle = bg;
  ctx.font = '700 22px "JetBrains Mono", monospace';
  ctx.fillText('MINDPRINT LAB // BRAINWAVE SYNC REPORT', 64, 75);

  const myName = report.nickname.trim() || t.results.syncYou;
  const targetName = target.n.trim() || t.results.syncFriend;
  const targetArch = ARCHETYPES[target.a] ?? ARCHETYPES[15];
  const targetAxes = payloadToAxes(target);

  // Dual interlocking sigils box
  const sigilBoxY = 122;
  const sigilBoxH = 390;
  ctx.fillStyle = surface;
  ctx.fillRect(64, sigilBoxY, W - 128, sigilBoxH);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.strokeRect(64, sigilBoxY, W - 128, sigilBoxH);

  ctx.save();
  ctx.translate(64, sigilBoxY);
  drawDualSyncSigil(
    ctx,
    W - 128,
    sigilBoxH,
    reportToSigilData(report),
    payloadToSigilData(target, targetArch.accentColor),
    sync.syncScore,
    0,
    theme,
  );
  ctx.restore();

  // Sync Score Hero
  const scoreY = 550;
  ctx.fillStyle = vermilion;
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillText(t.results.syncHeadline, 64, scoreY);

  ctx.fillStyle = ink;
  ctx.font = '900 112px "Space Grotesk", "JetBrains Mono", sans-serif';
  ctx.fillText(`${sync.syncScore}%`, 64, scoreY + 104);

  ctx.fillStyle = ink;
  ctx.font = '900 34px "Noto Sans JP", "Space Grotesk", sans-serif';
  const pairTitleLines = wrapLines(ctx, sync.pairTitle, 610, 2);
  pairTitleLines.forEach((line, i) => {
    ctx.fillText(line, 360, scoreY + 46 + i * 42);
  });

  ctx.fillStyle = muted;
  ctx.font = '500 20px "Noto Sans JP", sans-serif';
  const subLines = wrapLines(ctx, sync.pairSubtitle, 610, 2);
  subLines.forEach((line, i) => {
    ctx.fillText(line, 360, scoreY + 126 + i * 28);
  });

  // Paired subjects strip
  const pairY = 720;
  ctx.fillStyle = surface;
  ctx.fillRect(64, pairY, (W - 148) / 2, 86);
  ctx.strokeStyle = vermilion;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(64, pairY, (W - 148) / 2, 86);

  ctx.fillStyle = vermilion;
  ctx.font = '700 15px "JetBrains Mono", sans-serif';
  ctx.fillText(`YOU // ${myName}`, 84, pairY + 32);
  ctx.fillStyle = ink;
  ctx.font = '700 24px "Noto Sans JP", sans-serif';
  ctx.fillText(report.archetype.name[locale], 84, pairY + 66);

  const rx = 64 + (W - 148) / 2 + 20;
  ctx.fillStyle = surface;
  ctx.fillRect(rx, pairY, (W - 148) / 2, 86);
  ctx.strokeStyle = cobalt;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(rx, pairY, (W - 148) / 2, 86);

  ctx.fillStyle = cobalt;
  ctx.font = '700 15px "JetBrains Mono", sans-serif';
  ctx.fillText(`TARGET // ${targetName}`, rx + 20, pairY + 32);
  ctx.fillStyle = ink;
  ctx.font = '700 24px "Noto Sans JP", sans-serif';
  ctx.fillText(targetArch.name[locale], rx + 20, pairY + 66);

  // Axis Diff Bars compact
  const compY = 838;
  AXIS_ORDER.forEach((key, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const bx = 64 + col * 496;
    const by = compY + row * 46;
    const bw = 456;

    ctx.fillStyle = ink;
    ctx.font = '700 16px "Noto Sans JP", sans-serif';
    ctx.fillText(t.axes[key].label, bx, by + 16);

    ctx.textAlign = 'right';
    ctx.font = '700 16px "JetBrains Mono", monospace';
    ctx.fillText(`${report.axes[key]} vs ${targetAxes[key]}`, bx + bw, by + 16);
    ctx.textAlign = 'left';

    ctx.fillStyle = isObsidian ? 'rgba(244,242,236,0.1)' : '#E5E0D5';
    ctx.fillRect(bx, by + 23, bw, 10);
    ctx.fillStyle = vermilion;
    ctx.fillRect(bx, by + 23, (bw * report.axes[key]) / 100, 5);
    ctx.fillStyle = cobalt;
    ctx.fillRect(bx, by + 28, (bw * targetAxes[key]) / 100, 5);
  });

  // 3 Dynamics
  const dynY = 1000;
  sync.dynamics.slice(0, 3).forEach((dyn, idx) => {
    const y = dynY + idx * 82;
    ctx.fillStyle = surface;
    ctx.fillRect(64, y, W - 128, 70);
    ctx.strokeStyle = border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(64, y, W - 128, 70);

    ctx.fillStyle = ink;
    ctx.font = '500 18px "Noto Sans JP", sans-serif';
    const dLines = wrapLines(ctx, dyn, W - 168, 2);
    dLines.forEach((line, li) => {
      ctx.fillText(line, 84, y + 29 + li * 25);
    });
  });

  // Footer
  ctx.fillStyle = ink;
  ctx.font = '700 20px "Noto Sans JP", "Space Grotesk", sans-serif';
  ctx.fillText(t.taglineQuote, 64, H - 64);

  ctx.textAlign = 'right';
  ctx.fillStyle = muted;
  ctx.font = '700 16px "JetBrains Mono", monospace';
  ctx.fillText(report.fingerprintHash, W - 64, H - 64);
  ctx.textAlign = 'left';

  const dataUrl = canvas.toDataURL('image/png');
  if (autoDownload) {
    triggerPngDownload(dataUrl, `mindprint-sync-${sync.syncScore}pct-${theme}.png`);
  }
  return dataUrl;
}
