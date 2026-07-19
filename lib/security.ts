import { getRuntimeEnvValue } from "./env";

const encoder = new TextEncoder();

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 32) {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  let binary = "";
  for (const byte of buffer) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function getClientIpHash(request: Request) {
  const salt = (await getRuntimeEnvValue("SECURITY_HASH_SALT")) || "local-development-salt";
  return sha256(`${salt}:${getClientIp(request)}`);
}

export async function getVisitorHash(request: Request, suppliedVisitorId = "") {
  const userAgent = request.headers.get("user-agent") ?? "";
  const ipHash = await getClientIpHash(request);
  return sha256(`${ipHash}:${userAgent.slice(0, 300)}:${suppliedVisitorId.slice(0, 100)}`);
}

export function parseCookies(header: string | null) {
  const values = new Map<string, string>();
  for (const part of (header ?? "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try {
      values.set(name, decodeURIComponent(value));
    } catch {
      values.set(name, value);
    }
  }
  return values;
}

export function safeJson(value: unknown, maxLength = 1000) {
  try {
    return JSON.stringify(value).slice(0, maxLength);
  } catch {
    return "{}";
  }
}

export function sameOriginRequest(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readJsonBody(request: Request, maxBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) return { ok: false as const, status: 413, error: "La solicitud es demasiado grande" };
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false as const, status: 415, error: "Formato de solicitud no admitido" };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false as const, status: 413, error: "La solicitud es demasiado grande" };
  }
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid body");
    return { ok: true as const, value: value as Record<string, unknown> };
  } catch {
    return { ok: false as const, status: 400, error: "JSON inválido" };
  }
}
