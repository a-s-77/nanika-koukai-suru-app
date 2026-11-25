import { Volume2, VolumeX } from 'lucide-react';
import type { Locale, ScanMode } from '../types/mindprint';
import { TRANSLATIONS } from '../i18n/translations';

interface HeaderBarProps {
  locale: Locale;
  onToggleLocale: () => void;
  muted: boolean;
  onToggleMute: () => void;
  phase: 'landing' | 'transition' | 'module' | 'compiling' | 'results';
  moduleIndex: number;
  mode: ScanMode;
  syncTargetName: string | null;
  onRequestHome: () => void;
}

export function HeaderBar({
  locale,
  onToggleLocale,
  muted,
  onToggleMute,
  phase,
  moduleIndex,
  mode,
  syncTargetName,
  onRequestHome,
}: HeaderBarProps) {
  const t = TRANSLATIONS[locale];
  const isScanning = phase === 'transition' || phase === 'module' || phase === 'compiling';

  return (
    <header className="sticky top-0 z-40 border-b-[1.5px] border-[#141413] bg-[#F4F2EC]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        <button
          type="button"
          onClick={onRequestHome}
          className="group flex items-center gap-2.5 text-left"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded border-[1.5px] border-[#141413] bg-[#141413] text-xs font-bold text-[#F4F2EC] transition-colors group-hover:bg-[#FF3B1F]">
            MP
          </span>
          <div>
            <div className="font-display text-sm font-bold leading-none tracking-tight">
              {t.appName}
            </div>
            <div className="font-mono-num hidden text-[10px] tracking-wider text-[#57534E] sm:block">
              {t.appSubtitle}
            </div>
          </div>
        </button>

        {/* Center module progress pips during scan */}
        {isScanning ? (
          <div className="flex items-center gap-1.5" aria-label="Progress">
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const done = phase === 'compiling' || idx < moduleIndex;
              const active = phase !== 'compiling' && idx === moduleIndex;
              return (
                <div
                  key={idx}
                  className={`flex h-6 items-center justify-center rounded border border-[#141413] px-1.5 font-mono-num text-[11px] font-bold transition-all ${
                    active
                      ? 'bg-[#FF3B1F] text-white shadow-[2px_2px_0px_#141413]'
                      : done
                        ? 'bg-[#141413] text-[#C6F600]'
                        : 'bg-white/70 text-[#57534E]'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded border border-[#141413] bg-white px-2 py-0.5 font-mono-num text-[11px] font-bold">
              {mode === 'daily' ? t.header.daily : t.header.free}
            </span>
            {syncTargetName !== null && (
              <span className="rounded border border-[#FF3B1F] bg-[#FF3B1F]/10 px-2 py-0.5 font-mono-num text-[11px] font-bold text-[#FF3B1F]">
                {t.header.syncingWith} {syncTargetName || t.results.anonymous}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            className="inline-flex items-center gap-1.5 rounded border-[1.5px] border-[#141413] bg-white px-2.5 py-1 font-mono-num text-xs font-bold transition-colors hover:bg-[#EBE7DC]"
            title={muted ? t.header.soundOff : t.header.soundOn}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5 text-[#FF3B1F]" /> : <Volume2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{muted ? t.header.soundOff : t.header.soundOn}</span>
          </button>

          <button
            type="button"
            onClick={onToggleLocale}
            className="rounded border-[1.5px] border-[#141413] bg-[#141413] px-2.5 py-1 font-mono-num text-xs font-bold text-[#F4F2EC] transition-colors hover:bg-[#1D4ED8]"
          >
            {locale === 'ja' ? 'EN' : 'JP'}
          </button>
        </div>
      </div>
    </header>
  );
}
