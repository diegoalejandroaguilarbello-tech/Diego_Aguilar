import { asc, desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { projects } from "../../../../db/schema";
import { serializeProject } from "../../../../lib/projects";
import ProjectManager from "../../components/ProjectManager";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const db = await getDb();
  const rows = await db.select().from(projects).orderBy(asc(projects.sortOrder), desc(projects.id));
  const initialProjects = rows.map(serializeProject);

  return (
    <>
      <header className="adminPageHeader">
        <div>
          <p className="adminKicker">Contenido público</p>
          <h1>Administración de proyectos</h1>
          <p>Publica, ordena y actualiza el portafolio sin editar el código.</p>
        </div>
      </header>
      <ProjectManager initialProjects={initialProjects} />
    </>
  );
}
