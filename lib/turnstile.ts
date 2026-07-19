import { getRuntimeEnvValue } from "./env";
import { getClientIp } from "./security";

const LOCAL_TOKEN = "local-preview-token";

export async function getTurnstilePublicConfig(request: Request) {
  const siteKey = await getRuntimeEnvValue("NEXT_PUBLIC_TURNSTILE_SITE_KEY");
  if (siteKey) return { mode: "turnstile" as const, siteKey };
  if (isLocalRequest(request)) return { mode: "local" as const, siteKey: "" };
  return { mode: "unconfigured" as const, siteKey: "" };
}

export async function verifyTurnstile(request: Request, token: string) {
  const secret = await getRuntimeEnvValue("TURNSTILE_SECRET_KEY");
  if (!secret && isLocalRequest(request)) return token === LOCAL_TOKEN;
  if (!secret || token.length < 10 || token.length > 2_048) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_000);
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: getClientIp(request) });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean };
    return result.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "terminal.local" || hostname === "localhost" || hostname === "127.0.0.1";
}

export { LOCAL_TOKEN };
