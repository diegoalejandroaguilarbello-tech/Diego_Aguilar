"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import type { ProjectPayload, ProjectRecord } from "../../../lib/project-types";

const emptyProject: ProjectPayload = {
  slug: "",
  title: "",
  description: "",
  technologies: [],
  liveUrl: "",
  repoUrl: "",
  imageUrl: "",
  imageKey: "",
  imageAlt: "",
  isFeatured: false,
  isPublished: false,
  sortOrder: 0,
};

export default function ProjectManager({ initialProjects }: { initialProjects: ProjectRecord[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [editing, setEditing] = useState<ProjectRecord | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const activeProjects = useMemo(() => projects.filter((project) => project.isActive), [projects]);
  const inactiveProjects = useMemo(() => projects.filter((project) => !project.isActive), [projects]);

  function updateProject(project: ProjectRecord) {
    setProjects((current) => {
      const exists = current.some((item) => item.id === project.id);
      const next = exists ? current.map((item) => item.id === project.id ? project : item) : [...current, project];
      return next.sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id);
    });
    setNotice("Proyecto guardado correctamente.");
    setError("");
    setEditing(null);
  }

  async function deactivate(project: ProjectRecord) {
    if (!window.confirm(`¿Desactivar “${project.title}”? Dejará de aparecer en la página pública.`)) return;
    setError("");
    const response = await adminFetch(`/api/admin/projects/${project.id}`, { method: "DELETE" });
    const data = (await response.json()) as { project?: ProjectRecord; error?: string };
    if (!response.ok || !data.project) return setError(data.error || "No se pudo desactivar el proyecto");
    setProjects((current) => current.map((item) => item.id === data.project?.id ? data.project : item));
    setNotice("Proyecto desactivado.");
  }

  async function restore(project: ProjectRecord) {
    if (!window.confirm(`¿Restaurar “${project.title}”? Permanecerá oculto hasta que lo publiques desde Editar.`)) return;
    setError("");
    const response = await adminFetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({ restore: true }),
    });
    const data = (await response.json()) as { project?: ProjectRecord; error?: string };
    if (!response.ok || !data.project) return setError(data.error || "No se pudo restaurar el proyecto");
    setProjects((current) => current.map((item) => item.id === data.project?.id ? data.project : item));
    setNotice("Proyecto restaurado. Edítalo y marca Publicado cuando quieras mostrarlo.");
  }

  async function move(project: ProjectRecord, direction: -1 | 1) {
    const currentIndex = activeProjects.findIndex((item) => item.id === project.id);
    const target = activeProjects[currentIndex + direction];
    if (!target) return;
    setError("");
    const firstPayload = toPayload({ ...project, sortOrder: target.sortOrder });
    const secondPayload = toPayload({ ...target, sortOrder: project.sortOrder });
    const [firstResponse, secondResponse] = await Promise.all([
      adminFetch(`/api/admin/projects/${project.id}`, { method: "PATCH", body: JSON.stringify(firstPayload) }),
      adminFetch(`/api/admin/projects/${target.id}`, { method: "PATCH", body: JSON.stringify(secondPayload) }),
    ]);
    if (!firstResponse.ok || !secondResponse.ok) return setError("No se pudo cambiar el orden. Recarga el panel e inténtalo nuevamente.");
    const [first, second] = await Promise.all([firstResponse.json(), secondResponse.json()]) as [{ project: ProjectRecord }, { project: ProjectRecord }];
    setProjects((current) => current
      .map((item) => item.id === first.project.id ? first.project : item.id === second.project.id ? second.project : item)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id));
    setNotice("Orden actualizado.");
  }

  return (
    <section className="projectManager">
      <div className="managerToolbar">
        <div><strong>{activeProjects.length}</strong><span>proyectos activos</span></div>
        <button className="button" type="button" onClick={() => { setEditing("new"); setNotice(""); setError(""); }}>Agregar proyecto</button>
      </div>
      {notice && <p className="adminNotice" role="status">{notice}</p>}
      {error && <p className="adminError" role="alert">{error}</p>}
      {editing && (
        <ProjectEditor
          project={editing === "new" ? null : editing}
          nextSortOrder={activeProjects.length ? Math.max(...activeProjects.map((project) => project.sortOrder)) + 10 : 10}
          onCancel={() => setEditing(null)}
          onSaved={updateProject}
        />
      )}
      <div className="adminProjectList">
        {activeProjects.map((project, index) => (
          <article className="adminProjectCard" key={project.id}>
            <ProjectImage project={project} />
            <div className="adminProjectMain">
              <div className="adminProjectStatus">
                <span className={project.isPublished ? "statusPublished" : "statusHidden"}>{project.isPublished ? "Publicado" : "Oculto"}</span>
                {project.isFeatured && <span className="statusFeatured">Destacado</span>}
              </div>
              <h2>{project.title}</h2>
              <p>{project.description}</p>
              <div className="technologyTags">{project.technologies.map((technology) => <span key={technology}>{technology}</span>)}</div>
            </div>
            <div className="projectAdminActions">
              <div className="orderButtons" aria-label={`Orden de ${project.title}`}>
                <button type="button" disabled={index === 0} onClick={() => move(project, -1)} aria-label="Mover hacia arriba">↑</button>
                <button type="button" disabled={index === activeProjects.length - 1} onClick={() => move(project, 1)} aria-label="Mover hacia abajo">↓</button>
              </div>
              <button type="button" onClick={() => setEditing(project)}>Editar</button>
              <button className="dangerButton" type="button" onClick={() => deactivate(project)}>Desactivar</button>
            </div>
          </article>
        ))}
        {!activeProjects.length && <div className="adminEmpty"><h2>Aún no hay proyectos activos</h2><p>Agrega el primero para mostrarlo en tu portafolio.</p></div>}
      </div>
      {inactiveProjects.length > 0 && (
        <section className="inactiveProjects" aria-labelledby="inactive-projects-title">
          <div className="inactiveProjectsHeading">
            <div><p className="adminKicker">Archivo</p><h2 id="inactive-projects-title">Proyectos desactivados</h2></div>
            <span>{inactiveProjects.length}</span>
          </div>
          <div className="inactiveProjectList">
            {inactiveProjects.map((project) => (
              <article className="inactiveProjectCard" key={project.id}>
                <div><strong>{project.title}</strong><span>/{project.slug}</span></div>
                <button type="button" onClick={() => restore(project)}>Restaurar</button>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

function ProjectEditor({
  project,
  nextSortOrder,
  onCancel,
  onSaved,
}: {
  project: ProjectRecord | null;
  nextSortOrder: number;
  onCancel: () => void;
  onSaved: (project: ProjectRecord) => void;
}) {
  const [draft, setDraft] = useState<ProjectPayload>(project ? toPayload(project) : { ...emptyProject, sortOrder: nextSortOrder });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update<Key extends keyof ProjectPayload>(key: Key, value: ProjectPayload[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      let payload = { ...draft };
      if (file) {
        const form = new FormData();
        form.set("image", file);
        const upload = await adminFetch("/api/admin/uploads", { method: "POST", body: form });
        const uploadData = (await upload.json()) as { imageUrl?: string; key?: string; error?: string };
        if (!upload.ok || !uploadData.imageUrl || !uploadData.key) throw new Error(uploadData.error || "No se pudo subir la imagen");
        payload = { ...payload, imageUrl: uploadData.imageUrl, imageKey: uploadData.key };
      }
      const response = await adminFetch(project ? `/api/admin/projects/${project.id}` : "/api/admin/projects", {
        method: project ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { project?: ProjectRecord; error?: string };
      if (!response.ok || !data.project) throw new Error(data.error || "No se pudo guardar el proyecto");
      onSaved(data.project);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar el proyecto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="projectEditor" onSubmit={submit}>
      <div className="editorHeading"><div><p className="adminKicker">{project ? "Edición" : "Nuevo proyecto"}</p><h2>{project ? project.title : "Agregar al portafolio"}</h2></div><button type="button" onClick={onCancel} aria-label="Cerrar editor">×</button></div>
      <div className="editorGrid">
        <label>Título<input value={draft.title} onChange={(event) => update("title", event.target.value)} maxLength={100} required /></label>
        <label>URL interna<input value={draft.slug} onChange={(event) => update("slug", event.target.value)} maxLength={80} placeholder="se genera desde el título" /></label>
        <label className="full">Descripción<textarea value={draft.description} onChange={(event) => update("description", event.target.value)} maxLength={1000} rows={4} required /></label>
        <label className="full">Tecnologías<input value={draft.technologies.join(", ")} onChange={(event) => update("technologies", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="React, Node.js, MySQL" required /></label>
        <label>Enlace del proyecto<input type="url" value={draft.liveUrl} onChange={(event) => update("liveUrl", event.target.value)} placeholder="https://" /></label>
        <label>Repositorio<input type="url" value={draft.repoUrl} onChange={(event) => update("repoUrl", event.target.value)} placeholder="https://github.com/" /></label>
        <label>URL de imagen<input value={draft.imageUrl} onChange={(event) => update("imageUrl", event.target.value)} placeholder="https:// o imagen subida" /></label>
        <label>Subir imagen<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
        <label className="full">Texto alternativo<input value={draft.imageAlt} onChange={(event) => update("imageAlt", event.target.value)} maxLength={160} /></label>
        <label>Orden<input type="number" min={0} max={9999} value={draft.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} /></label>
        <div className="editorChecks">
          <label><input type="checkbox" checked={draft.isPublished} onChange={(event) => update("isPublished", event.target.checked)} /> Publicado</label>
          <label><input type="checkbox" checked={draft.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} /> Destacado</label>
        </div>
      </div>
      {error && <p className="adminError" role="alert">{error}</p>}
      <div className="editorActions"><button type="button" onClick={onCancel}>Cancelar</button><button className="button" disabled={loading}>{loading ? "Guardando…" : "Guardar proyecto"}</button></div>
    </form>
  );
}

function ProjectImage({ project }: { project: ProjectRecord }) {
  if (project.imageUrl) return <div className="adminProjectImage"><Image src={project.imageUrl} alt={project.imageAlt} fill sizes="160px" unoptimized /></div>;
  return <div className={`adminProjectPlaceholder projectTone-${project.slug}`}><span>{project.title.slice(0, 1)}</span></div>;
}

function toPayload(project: ProjectRecord): ProjectPayload {
  return {
    slug: project.slug,
    title: project.title,
    description: project.description,
    technologies: project.technologies,
    liveUrl: project.liveUrl,
    repoUrl: project.repoUrl,
    imageUrl: project.imageUrl,
    imageKey: project.imageKey,
    imageAlt: project.imageAlt,
    isFeatured: project.isFeatured,
    isPublished: project.isPublished,
    sortOrder: project.sortOrder,
  };
}

async function adminFetch(input: string, init: RequestInit) {
  const headers = new Headers(init.headers);
  headers.set("x-csrf-token", readCookie("da_admin_csrf"));
  if (typeof init.body === "string") headers.set("content-type", "application/json");
  return fetch(input, { ...init, headers, credentials: "same-origin", cache: "no-store" });
}

function readCookie(name: string) {
  const raw = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return raw ? decodeURIComponent(raw.slice(name.length + 1)) : "";
}
