import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "../../../db";
import { leads, securityEvents } from "../../../db/schema";
import { recordSecurityEvent } from "../../../lib/admin-auth";
import { calculateQuote } from "../../../lib/pricing";
import { sendLeadNotification } from "../../../lib/lead-notifications";
import { getVisitorHash, readJsonBody, sha256 } from "../../../lib/security";
import { verifyTurnstile } from "../../../lib/turnstile";
import {
  cleanAttribution,
  cleanMultiline,
  cleanText,
  normalizePhone,
  safePath,
  validEmail,
  validName,
} from "../../../lib/validation";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request, 16_384);
    if (!body.ok) return Response.json({ error: body.error }, { status: body.status });
    const data = body.value;
    const visitorId = cleanText(data.visitorId, 100).replace(/[^a-zA-Z0-9_-]/g, "");
    const sessionId = cleanText(data.sessionId, 100).replace(/[^a-zA-Z0-9_-]/g, "");
    const visitorHash = await getVisitorHash(request, visitorId);
    const rateKey = await sha256(visitorHash);
    const db = await getDb();
    const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    const [attempts] = await db.select({ value: count() }).from(securityEvents).where(and(eq(securityEvents.eventType, "lead_attempt"), eq(securityEvents.keyHash, rateKey), gte(securityEvents.createdAt, oneHourAgo)));
    if (Number(attempts?.value ?? 0) >= 5) {
      await recordSecurityEvent(request, "lead_rate_limit", rateKey, {});
      return Response.json({ error: "Alcanzaste el límite temporal de solicitudes. Intenta más tarde" }, { status: 429 });
    }
    await recordSecurityEvent(request, "lead_attempt", rateKey, {});

    if (cleanText(data.website, 200)) {
      await recordSecurityEvent(request, "lead_honeypot", rateKey, {});
      return Response.json({ ok: true }, { status: 201 });
    }

    const name = cleanText(data.name, 80);
    const business = cleanText(data.business, 120);
    const phone = normalizePhone(data.whatsapp);
    const email = cleanText(data.email, 160).toLowerCase();
    const details = cleanMultiline(data.details, 1_500);
    const projectType = cleanText(data.projectType, 40);
    const requestedExtras = Array.isArray(data.extras) ? data.extras.map((item) => cleanText(item, 40)) : [];
    const quote = calculateQuote(projectType, requestedExtras);

    if (!validName(name)) return Response.json({ error: "Escribe un nombre válido" }, { status: 422 });
    if (business.length < 2) return Response.json({ error: "Describe brevemente tu negocio" }, { status: 422 });
    if (!phone) return Response.json({ error: "Escribe un WhatsApp válido con código de país" }, { status: 422 });
    if (!validEmail(email)) return Response.json({ error: "El correo no es válido" }, { status: 422 });
    if (!quote) return Response.json({ error: "El tipo de proyecto no es válido" }, { status: 422 });
    if (sessionId.length < 8 || visitorId.length < 8) return Response.json({ error: "La sesión del formulario expiró. Recarga la página" }, { status: 422 });

    const turnstileToken = cleanText(data.turnstileToken, 2_048);
    if (!(await verifyTurnstile(request, turnstileToken))) {
      await recordSecurityEvent(request, "turnstile_failure", rateKey, {});
      return Response.json({ error: "No se pudo completar la verificación de seguridad" }, { status: 403 });
    }

    const submissionHash = await sha256(`${visitorHash}:${name.toLowerCase()}:${phone.digits}:${projectType}:${details}`);
    const duplicateCutoff = new Date(Date.now() - 10 * 60_000).toISOString().replace("T", " ").slice(0, 19);
    const [duplicates] = await db.select({ value: count() }).from(leads).where(and(eq(leads.submissionHash, submissionHash), gte(leads.createdAt, duplicateCutoff)));
    if (Number(duplicates?.value ?? 0) > 0) {
      await recordSecurityEvent(request, "lead_duplicate", rateKey, {});
      return Response.json({ error: "Esta solicitud ya fue recibida. No necesitas enviarla otra vez" }, { status: 409 });
    }

    const source = cleanAttribution(data.source, "directo").toLowerCase();
    const medium = cleanAttribution(data.medium);
    const campaign = cleanAttribution(data.campaign);
    const landingPath = safePath(data.landingPath);
    const [lead] = await db.insert(leads).values({
      name,
      business,
      whatsapp: phone.display,
      email,
      projectType: quote.type.label,
      extras: JSON.stringify(quote.extras.map((item) => item.label)),
      estimatedPrice: quote.total,
      details,
      source,
      medium,
      campaign,
      landingPath,
      referrer: cleanReferrer(data.referrer),
      sessionId,
      visitorHash,
      submissionHash,
      status: "nuevo",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }).returning();
    let emailNotification = false;
    try {
      const notification = await sendLeadNotification({
        id: lead.id,
        name,
        business,
        whatsapp: phone.display,
        email,
        projectType: quote.type.label,
        extras: quote.extras.map((item) => item.label),
        estimatedPrice: quote.total,
        details,
        source,
        campaign,
      });
      emailNotification = notification.sent;
      if (!notification.sent && notification.reason === "provider_error") {
        await recordSecurityEvent(request, "lead_email_failure", String(lead.id), { status: notification.status });
      }
    } catch {
      await recordSecurityEvent(request, "lead_email_failure", String(lead.id), {});
    }
    return Response.json({ id: lead.id, estimatedPrice: quote.total, emailNotification }, { status: 201 });
  } catch {
    return Response.json({ error: "No se pudo guardar la solicitud" }, { status: 500 });
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
