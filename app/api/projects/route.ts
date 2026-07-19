import { listPublicProjects } from "../../../lib/projects";

export async function GET() {
  try {
    const projects = await listPublicProjects();
    const response = Response.json({ projects });
    response.headers.set("cache-control", "public, max-age=30, stale-while-revalidate=120");
    return response;
  } catch {
    return Response.json({ error: "No se pudieron cargar los proyectos" }, { status: 500 });
  }
}
