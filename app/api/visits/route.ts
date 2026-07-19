import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "../../../db";
import { visits } from "../../../db/schema";
import { recordSecurityEvent } from "../../../lib/admin-auth";
import { getVisitorHash, readJsonBody, sha256 } from "../../../lib/security";
import { cleanAttribution, cleanText, safePath } from "../../../lib/validation";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request, 6_144);
    if (!body.ok) return Response.json({ error: body.error }, { status: body.status });
    const data = body.value;
    const sessionId = cleanText(data.sessionId, 100).replace(/[^a-zA-Z0-9_-]/g, "");
    const visitorId = cleanText(data.visitorId, 100).replace(/[^a-zA-Z0-9_-]/g, "");
    const path = safePath(data.path);
    const landingPath = safePath(data.landingPath);
    if (sessionId.length < 8 || visitorId.length < 8) return Response.json({ error: "Identificador de visita inválido" }, { status: 422 });

    const visitorHash = await getVisitorHash(request, visitorId);
    const db = await getDb();
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString().replace("T", " ").slice(0, 19);
    const [recent] = await db.select({ value: count() }).from(visits).where(and(eq(visits.visitorHash, visitorHash), gte(visits.createdAt, oneMinuteAgo)));
    if (Number(recent?.value ?? 0) >= 20) {
      await recordSecurityEvent(request, "visit_rate_limit", await sha256(visitorHash), {});
      return Response.json({ error: "Límite de visitas alcanzado" }, { status: 429 });
    }

    const [duplicate] = await db.select({ value: count() }).from(visits).where(and(eq(visits.sessionId, sessionId), eq(visits.path, path)));
    if (Number(duplicate?.value ?? 0) > 0) return Response.json({ ok: true, duplicate: true });

    await db.insert(visits).values({
      source: cleanAttribution(data.source, "directo").toLowerCase(),
      medium: cleanAttribution(data.medium),
      campaign: cleanAttribution(data.campaign),
      path,
      landingPath,
      referrer: cleanReferrer(data.referrer),
      sessionId,
      visitorHash,
      createdAt: new Date().toISOString(),
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch {
    return Response.json({ error: "No se pudo registrar la visita" }, { status: 500 });
  }
}

function cleanReferrer(value: unknown) {
  const raw = cleanText(value, 500);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`.slice(0, 300);
  } catch {
    return "";
  }
}
