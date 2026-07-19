import { asc, desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { projects } from "../../../../db/schema";
import { requireAdminApi, verifyAdminCsrf } from "../../../../lib/admin-auth";
import { parseProjectPayload, projectValues, serializeProject } from "../../../../lib/projects";
import { readJsonBody } from "../../../../lib/security";

export async function GET(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;
  const db = await getDb();
  const rows = await db.select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.id));
  return Response.json({ projects: rows.map(serializeProject) });
}

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;
  if (!(await verifyAdminCsrf(request, auth.session))) return Response.json({ error: "Verificación CSRF inválida" }, { status: 403 });
  const body = await readJsonBody(request, 16_384);
  if (!body.ok) return Response.json({ error: body.error }, { status: body.status });
  const parsed = parseProjectPayload(body.value);
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 422 });

  try {
    const db = await getDb();
    const now = new Date().toISOString();
    const [created] = await db.insert(projects).values({
      ...projectValues(parsed.value),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return Response.json({ project: serializeProject(created) }, { status: 201 });
  } catch (error) {
    const duplicate = String(error).toLowerCase().includes("unique");
    return Response.json({ error: duplicate ? "Ya existe un proyecto con esa URL interna" : "No se pudo crear el proyecto" }, { status: duplicate ? 409 : 500 });
  }
}
