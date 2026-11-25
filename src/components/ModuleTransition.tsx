import type { Locale } from '../types/mindprint';
import { TRANSLATIONS } from '../i18n/translations';

interface ModuleTransitionProps {
  locale: Locale;
  moduleIndex: number;
}

export function ModuleTransition({ locale, moduleIndex }: ModuleTransitionProps) {
  const t = TRANSLATIONS[locale];
  const meta = t.moduleMeta[moduleIndex] ?? t.moduleMeta[0];

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-12">
      <div className="swiss-card w-full p-8 text-center">
        <div className="mb-4 flex items-center justify-between border-b border-[#141413]/20 pb-3 font-mono-num text-xs font-bold text-[#57534E]">
          <span>{t.transition.calibrating}</span>
          <span className="text-[#FF3B1F]">
            {t.transition.modulePrefix} {String(moduleIndex + 1).padStart(2, '0')}/06
          </span>
        </div>

        <div className="animate-shutter my-6">
          <div className="font-mono-num text-xs font-bold tracking-widest text-[#1D4ED8]">
            {meta.code}
          </div>
          <h2 className="font-display mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {meta.title}
          </h2>
          <p className="mt-2 text-sm font-medium text-[#57534E]">{meta.teaser}</p>
        </div>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full border border-[#141413] bg-[#EBE7DC]">
          <div
            className="h-full bg-[#FF3B1F] transition-all duration-300"
            style={{ width: `${((moduleIndex + 1) / 6) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
