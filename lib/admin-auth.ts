import bcrypt from "bcryptjs";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "../db";
import { adminSessions, securityEvents } from "../db/schema";
import { getRuntimeEnvValue, getRuntimeNumber, isSecureRequest } from "./env";
import {
  getClientIpHash,
  parseCookies,
  randomToken,
  safeJson,
  sameOriginRequest,
  sha256,
} from "./security";

export const ADMIN_SESSION_COOKIE = "da_admin_session";
export const ADMIN_CSRF_COOKIE = "da_admin_csrf";

export type AdminSession = {
  id: string;
  username: string;
  csrfTokenHash: string;
  expiresAt: string;
};

type LoginResult =
  | { ok: true; token: string; csrfToken: string; expiresAt: string; maxAge: number }
  | { ok: false; status: number; error: string; code: "invalid" | "locked" | "not_configured" };

export async function attemptAdminLogin(username: string, password: string, request: Request): Promise<LoginResult> {
  const configuredUsername = await getRuntimeEnvValue("ADMIN_USERNAME");
  const passwordHash = await getRuntimeEnvValue("ADMIN_PASSWORD_HASH");
  if (!configuredUsername || !/^\$2[aby]\$\d{2}\$/.test(passwordHash)) {
    return { ok: false, status: 503, code: "not_configured", error: "El acceso administrativo todavía no ha sido configurado" };
  }

  const db = await getDb();
  const ipHash = await getClientIpHash(request);
  const loginKey = await sha256(`${ipHash}:${username.toLowerCase()}`);
  const windowMinutes = await getRuntimeNumber("ADMIN_LOGIN_WINDOW_MINUTES", 15, 5, 60);
  const maxAttempts = await getRuntimeNumber("ADMIN_LOGIN_MAX_ATTEMPTS", 5, 3, 20);
  const cutoff = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const [[attempts], [ipAttempts]] = await Promise.all([
    db
      .select({ value: count() })
      .from(securityEvents)
      .where(and(eq(securityEvents.eventType, "login_failure"), eq(securityEvents.keyHash, loginKey), gte(securityEvents.createdAt, cutoff))),
    db
      .select({ value: count() })
      .from(securityEvents)
      .where(and(eq(securityEvents.eventType, "login_failure"), eq(securityEvents.ipHash, ipHash), gte(securityEvents.createdAt, cutoff))),
  ]);

  if (Number(attempts?.value ?? 0) >= maxAttempts || Number(ipAttempts?.value ?? 0) >= maxAttempts * 3) {
    await recordSecurityEvent(request, "login_blocked", loginKey, { username: username.slice(0, 80) });
    return { ok: false, status: 429, code: "locked", error: "Demasiados intentos. Espera unos minutos antes de volver a intentarlo" };
  }

  const usernameMatches = await equalText(username, configuredUsername);
  const passwordMatches = password.length <= 200 ? await bcrypt.compare(password, passwordHash) : false;
  if (!usernameMatches || !passwordMatches) {
    await recordSecurityEvent(request, "login_failure", loginKey, { username: username.slice(0, 80) });
    return { ok: false, status: 401, code: "invalid", error: "Usuario o contraseña incorrectos" };
  }

  const sessionHours = await getRuntimeNumber("ADMIN_SESSION_HOURS", 8, 1, 24);
  const maxAge = sessionHours * 60 * 60;
  const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();
  const token = randomToken(32);
  const csrfToken = randomToken(24);
  const sessionId = await sha256(token);
  const userAgentHash = await sha256(request.headers.get("user-agent") ?? "");
  const now = new Date().toISOString();

  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, now));
  await db.insert(adminSessions).values({
    id: sessionId,
    username: configuredUsername,
    csrfTokenHash: await sha256(csrfToken),
    ipHash,
    userAgentHash,
    createdAt: now,
    lastSeenAt: now,
    expiresAt,
  });
  await recordSecurityEvent(request, "login_success", loginKey, {});
  return { ok: true, token, csrfToken, expiresAt, maxAge };
}

export async function getAdminSessionFromRequest(request: Request): Promise<AdminSession | null> {
  const token = parseCookies(request.headers.get("cookie")).get(ADMIN_SESSION_COOKIE) ?? "";
  return resolveSession(token);
}

export async function getAdminSessionFromServerContext(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  return resolveSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "");
}

async function resolveSession(token: string): Promise<AdminSession | null> {
  if (!token || token.length > 200) return null;
  const db = await getDb();
  const sessionId = await sha256(token);
  const [session] = await db.select().from(adminSessions).where(eq(adminSessions.id, sessionId)).limit(1);
  if (!session) return null;

  const now = Date.now();
  const idleMinutes = await getRuntimeNumber("ADMIN_IDLE_TIMEOUT_MINUTES", 30, 5, 240);
  const expired = Date.parse(session.expiresAt) <= now;
  const idle = Date.parse(session.lastSeenAt) + idleMinutes * 60_000 <= now;
  if (expired || idle) {
    await db.delete(adminSessions).where(eq(adminSessions.id, sessionId));
    return null;
  }

  if (Date.parse(session.lastSeenAt) + 60_000 < now) {
    await db.update(adminSessions).set({ lastSeenAt: new Date(now).toISOString() }).where(eq(adminSessions.id, sessionId));
  }
  return { id: session.id, username: session.username, csrfTokenHash: session.csrfTokenHash, expiresAt: session.expiresAt };
}

export async function requireAdminPage() {
  const session = await getAdminSessionFromServerContext();
  if (!session) redirect("/admin/login");
  return session;
}

export async function requireAdminApi(request: Request) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) return { ok: false as const, response: Response.json({ error: "Sesión requerida" }, { status: 401 }) };
  return { ok: true as const, session };
}

export async function verifyLoginCsrf(request: Request) {
  if (!sameOriginRequest(request)) return false;
  const cookies = parseCookies(request.headers.get("cookie"));
  const cookieToken = cookies.get(ADMIN_CSRF_COOKIE) ?? "";
  const headerToken = request.headers.get("x-csrf-token") ?? "";
  return Boolean(cookieToken && headerToken && (await equalText(cookieToken, headerToken)));
}

export async function verifyAdminCsrf(request: Request, session: AdminSession) {
  if (!sameOriginRequest(request)) return false;
  const cookies = parseCookies(request.headers.get("cookie"));
  const cookieToken = cookies.get(ADMIN_CSRF_COOKIE) ?? "";
  const headerToken = request.headers.get("x-csrf-token") ?? "";
  if (!cookieToken || !headerToken || !(await equalText(cookieToken, headerToken))) return false;
  return equalText(await sha256(headerToken), session.csrfTokenHash);
}

export async function destroyAdminSession(request: Request) {
  const token = parseCookies(request.headers.get("cookie")).get(ADMIN_SESSION_COOKIE) ?? "";
  if (token) {
    const db = await getDb();
    await db.delete(adminSessions).where(eq(adminSessions.id, await sha256(token)));
  }
}

export function sessionCookies(request: Request, token: string, csrfToken: string, maxAge: number) {
  const secure = isSecureRequest(request);
  return [
    serializeCookie(ADMIN_SESSION_COOKIE, token, { maxAge, secure, httpOnly: true }),
    serializeCookie(ADMIN_CSRF_COOKIE, csrfToken, { maxAge, secure, httpOnly: false }),
  ];
}

export function clearedSessionCookies(request: Request) {
  const secure = isSecureRequest(request);
  return [
    serializeCookie(ADMIN_SESSION_COOKIE, "", { maxAge: 0, secure, httpOnly: true }),
    serializeCookie(ADMIN_CSRF_COOKIE, "", { maxAge: 0, secure, httpOnly: false }),
  ];
}

export function loginCsrfCookie(request: Request, token: string) {
  return serializeCookie(ADMIN_CSRF_COOKIE, token, { maxAge: 15 * 60, secure: isSecureRequest(request), httpOnly: false });
}

export async function recordSecurityEvent(
  request: Request,
  eventType: string,
  keyHash: string,
  detail: Record<string, unknown>,
) {
  const db = await getDb();
  await db.insert(securityEvents).values({
    eventType: eventType.slice(0, 60),
    keyHash: keyHash.slice(0, 64),
    ipHash: await getClientIpHash(request),
    path: new URL(request.url).pathname.slice(0, 200),
    detail: safeJson(detail),
    createdAt: new Date().toISOString(),
  });
}

function serializeCookie(name: string, value: string, options: { maxAge: number; secure: boolean; httpOnly: boolean }) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${Math.max(0, Math.round(options.maxAge))}`,
    "SameSite=Strict",
  ];
  if (options.secure) parts.push("Secure");
  if (options.httpOnly) parts.push("HttpOnly");
  return parts.join("; ");
}

async function equalText(left: string, right: string) {
  const [leftHash, rightHash] = await Promise.all([sha256(left), sha256(right)]);
  let mismatch = leftHash.length ^ rightHash.length;
  for (let index = 0; index < Math.max(leftHash.length, rightHash.length); index += 1) {
    mismatch |= (leftHash.charCodeAt(index) || 0) ^ (rightHash.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

export async function currentRequestFingerprint() {
  const requestHeaders = await headers();
  return {
    userAgent: requestHeaders.get("user-agent") ?? "",
  };
}
