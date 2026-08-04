const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const isLocalhost = () =>
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

export const analyticsEnabled = () => Boolean(MEASUREMENT_ID) && !isLocalhost();

let loaded = false;

/**
 * Loads gtag.js and configures the property. Safe to call more than once.
 *
 * The bootstrap below lives in the bundle rather than an inline <script> so it
 * satisfies the CSP in server/src/index.ts without needing a nonce; only the
 * external gtag.js needs googletagmanager.com allowed in script-src.
 */
export const initAnalytics = () => {
  if (loaded || !analyticsEnabled()) return;
  loaded = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js requires the raw `arguments` object, not an array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };

  window.gtag("js", new Date());
  // page_view is sent manually by trackPageView so SPA navigations are counted
  // exactly once each, including the first render.
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
};

export const trackPageView = (path: string) => {
  if (!analyticsEnabled()) return;
  window.gtag?.("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
};

export const trackEvent = (name: string, params: Record<string, unknown> = {}) => {
  if (!analyticsEnabled()) return;
  window.gtag?.("event", name, params);
};
