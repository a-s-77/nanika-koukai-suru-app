declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID_REGEX = /^G-[A-Z0-9]{6,20}$/i;
const PLACEHOLDER_REGEX = /^G-X+$/i;

export function getGaMeasurementId(envId?: string): string | null {
  const raw = envId !== undefined ? envId : import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().toUpperCase();
  if (!GA_ID_REGEX.test(trimmed) || PLACEHOLDER_REGEX.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function initAnalytics(measurementId?: string | null): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const resolvedId =
    measurementId === undefined ? getGaMeasurementId() : getGaMeasurementId(measurementId ?? '');
  if (!resolvedId) {
    return false;
  }

  const scriptId = 'mp-ga4-gtag';
  if (document.getElementById(scriptId)) {
    return true;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', resolvedId, {
    send_page_view: true,
    anonymize_ip: true,
  });

  const script = document.createElement('script');
  script.id = scriptId;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(resolvedId)}`;
  document.head.appendChild(script);

  return true;
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }
  try {
    window.gtag('event', eventName, params ?? {});
  } catch {
    // Ignore analytics errors so user experience is never disrupted
  }
}
