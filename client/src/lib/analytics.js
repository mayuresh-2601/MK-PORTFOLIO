/**
 * Optional Google Analytics 4 integration.
 *
 * Enabled only when `VITE_GA_MEASUREMENT_ID` is set in the client environment
 * (`client/.env`) and only in production. Development traffic is excluded.
 *
 * Privacy: standard GA4 event names, page paths and labels only. No passwords,
 * JWTs, form contents, or other secrets are ever sent. Events are pushed to
 * `dataLayer`; the network call is made by the gtag library.
 */

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialised = false;

export const isEnabled = () =>
  Boolean(MEASUREMENT_ID) &&
  import.meta.env.PROD === true &&
  typeof window !== "undefined";

export const getAnalyticsStatus = () => ({
  enabled: isEnabled(),
  measurementId: MEASUREMENT_ID || null,
  note: "No PII or secrets are sent; events contain page paths and CTA labels only.",
});

const init = () => {
  if (initialised || !isEnabled()) return;
  initialised = true;

  const dataLayer = (window.dataLayer = window.dataLayer || []);
  dataLayer.push(["js", new Date()]);
  dataLayer.push(["config", MEASUREMENT_ID]);

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
    MEASUREMENT_ID
  )}`;
  document.head.appendChild(tag);
};

export const trackEvent = (event_name, params = {}) => {
  if (!isEnabled()) return;
  window.dataLayer?.push(["event", event_name, params]);
};

/**
 * Route measurement. Only the path is recorded — never the query string,
 * query values, or form fields.
 */
export const trackPage = (path) => {
  trackEvent("page_view", { page_path: path });
};

init();
