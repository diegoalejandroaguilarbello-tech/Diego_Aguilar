export type Attribution = {
  source: string;
  medium: string;
  campaign: string;
  landingPath: string;
  referrer: string;
  sessionId: string;
  visitorId: string;
};

const ATTRIBUTION_KEY = "da:first-attribution:v1";
const VISITOR_KEY = "da:visitor:v1";
const SESSION_KEY = "da:session:v1";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const hasCampaign = Boolean(params.get("utm_source") || params.get("utm_campaign") || params.get("utm_medium"));
  const stored = readStoredAttribution();
  const visitorId = getOrCreateId(localStorage, VISITOR_KEY);
  const sessionId = getOrCreateId(sessionStorage, SESSION_KEY);

  let base = stored;
  if (!base || hasCampaign) {
    const inferred = inferSource(document.referrer);
    base = {
      source: params.get("utm_source") || inferred,
      medium: params.get("utm_medium") || (hasCampaign ? "campaign" : inferred === "directo" ? "" : "referral"),
      campaign: params.get("utm_campaign") || "",
      landingPath: `${window.location.pathname}${window.location.hash || ""}`,
      referrer: document.referrer || "",
      capturedAt: Date.now(),
    };
    try {
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(base));
    } catch {
      // Attribution remains available for the current request when storage is blocked.
    }
  }

  return { ...base, sessionId, visitorId };
}

export function getAttribution() {
  return captureAttribution();
}

function readStoredAttribution() {
  try {
    const value = JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || "null") as {
      source: string;
      medium: string;
      campaign: string;
      landingPath: string;
      referrer: string;
      capturedAt: number;
    } | null;
    if (!value || Date.now() - value.capturedAt > MAX_AGE) return null;
    return value;
  } catch {
    return null;
  }
}

function getOrCreateId(storage: Storage, key: string) {
  const value = createClientId();

  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    storage.setItem(key, value);
  } catch {
    // Algunos navegadores pueden bloquear el almacenamiento.
  }

  return value;
}

function createClientId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const values = new Uint32Array(4);
    globalThis.crypto.getRandomValues(values);

    return Array.from(values, (value) =>
      value.toString(16).padStart(8, "0"),
    ).join("-");
  }

  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 14)}`;
}

function inferSource(referrer: string) {
  if (!referrer) return "directo";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("instagram.")) return "instagram";
    if (host.includes("tiktok.")) return "tiktok";
    if (host.includes("linkedin.")) return "linkedin";
    if (host.includes("google.")) return "google";
    if (host.includes("facebook.") || host === "fb.com") return "facebook";
    return host.replace(/^www\./, "");
  } catch {
    return "referencia";
  }
}
