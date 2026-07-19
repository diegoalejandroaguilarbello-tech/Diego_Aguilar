import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { leads } from "../../../../../db/schema";
import { recordSecurityEvent, requireAdminApi, verifyAdminCsrf } from "../../../../../lib/admin-auth";
import { isLeadStatus } from "../../../../../lib/lead-workflow";
import { readJsonBody } from "../../../../../lib/security";
import { cleanMultiline } from "../../../../../lib/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;
  if (!(await verifyAdminCsrf(request, auth.session))) {
    return Response.json({ error: "Verificación CSRF inválida" }, { status: 403 });
  }
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id < 1) return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  const body = await readJsonBody(request, 8_192);
  if (!body.ok) return Response.json({ error: body.error }, { status: body.status });
  const status = String(body.value.status ?? "");
  if (!isLeadStatus(status)) return Response.json({ error: "Estado inválido" }, { status: 422 });
  const notes = cleanMultiline(body.value.notes, 2_000);
  const archived = body.value.archived === true;
  const now = new Date().toISOString();
  const db = await getDb();
  const [updated] = await db.update(leads).set({ status, notes, archivedAt: archived ? now : null, updatedAt: now }).where(eq(leads.id, id)).returning();
  if (!updated) return Response.json({ error: "Solicitud no encontrada" }, { status: 404 });
  await recordSecurityEvent(request, "admin_lead_updated", String(id), { status, archived });
  return Response.json({ lead: updated });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;
  if (!(await verifyAdminCsrf(request, auth.session))) {
    return Response.json({ error: "Verificación CSRF inválida" }, { status: 403 });
  }
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id < 1) return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  const db = await getDb();
  const [deleted] = await db.delete(leads).where(eq(leads.id, id)).returning({ id: leads.id });
  if (!deleted) return Response.json({ error: "Solicitud no encontrada" }, { status: 404 });
  await recordSecurityEvent(request, "admin_lead_deleted", String(id), {});
  return Response.json({ ok: true });
}
