import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { projects } from "../../../../../db/schema";
import { requireAdminApi, verifyAdminCsrf } from "../../../../../lib/admin-auth";
import { parseProjectPayload, projectValues, serializeProject } from "../../../../../lib/projects";
import { readJsonBody } from "../../../../../lib/security";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;
  if (!(await verifyAdminCsrf(request, auth.session))) return Response.json({ error: "Verificación CSRF inválida" }, { status: 403 });
  const id = positiveId((await params).id);
  if (!id) return Response.json({ error: "Proyecto inválido" }, { status: 400 });
  const body = await readJsonBody(request, 16_384);
  if (!body.ok) return Response.json({ error: body.error }, { status: body.status });

  if (isRestoreRequest(body.value)) {
    const db = await getDb();
    const [updated] = await db.update(projects).set({ isActive: true, isPublished: false, updatedAt: new Date().toISOString() }).where(eq(projects.id, id)).returning();
    if (!updated) return Response.json({ error: "El proyecto no existe" }, { status: 404 });
    return Response.json({ project: serializeProject(updated) });
  }

  const parsed = parseProjectPayload(body.value);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 422 });

  try {
    const db = await getDb();
    const [updated] = await db.update(projects).set(projectValues(parsed.value)).where(eq(projects.id, id)).returning();
    if (!updated) return Response.json({ error: "El proyecto no existe" }, { status: 404 });
    return Response.json({ project: serializeProject(updated) });
  } catch (error) {
    const duplicate = String(error).toLowerCase().includes("unique");
    return Response.json({ error: duplicate ? "Ya existe un proyecto con esa URL interna" : "No se pudo actualizar el proyecto" }, { status: duplicate ? 409 : 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;
  if (!(await verifyAdminCsrf(request, auth.session))) return Response.json({ error: "Verificación CSRF inválida" }, { status: 403 });
  const id = positiveId((await params).id);
  if (!id) return Response.json({ error: "Proyecto inválido" }, { status: 400 });
  const db = await getDb();
  const [updated] = await db.update(projects).set({ isActive: false, isPublished: false, updatedAt: new Date().toISOString() }).where(eq(projects.id, id)).returning();
  if (!updated) return Response.json({ error: "El proyecto no existe" }, { status: 404 });
  return Response.json({ project: serializeProject(updated) });
}

function positiveId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isRestoreRequest(value: unknown): value is { restore: true } {
  return typeof value === "object" && value !== null && (value as { restore?: unknown }).restore === true;
}
