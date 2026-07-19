import { asc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { projects } from "../db/schema";
import type { ProjectPayload, ProjectRecord } from "./project-types";
import {
  cleanMultiline,
  cleanText,
  parseBoolean,
  parseTechnologyList,
  safeExternalUrl,
  safeImageUrl,
  slugify,
} from "./validation";

export function parseProjectPayload(data: Record<string, unknown>) {
  const title = cleanText(data.title, 100);
  const slug = slugify(data.slug || title);
  const description = cleanMultiline(data.description, 1_000);
  const technologies = parseTechnologyList(data.technologies);
  const liveUrl = safeExternalUrl(data.liveUrl);
  const repoUrl = safeExternalUrl(data.repoUrl);
  const imageUrl = safeImageUrl(data.imageUrl);
  const imageKey = cleanText(data.imageKey, 250).replace(/[^a-zA-Z0-9/_\-.]/g, "");
  const imageAlt = cleanText(data.imageAlt, 160);
  const sortOrder = Math.max(0, Math.min(9999, Math.round(Number(data.sortOrder) || 0)));

  if (title.length < 2) return { ok: false as const, error: "El título debe tener al menos 2 caracteres" };
  if (!slug) return { ok: false as const, error: "La URL interna del proyecto no es válida" };
  if (description.length < 10) return { ok: false as const, error: "La descripción debe tener al menos 10 caracteres" };
  if (!technologies.length) return { ok: false as const, error: "Agrega al menos una tecnología" };
  if (liveUrl === null || repoUrl === null || imageUrl === null) {
    return { ok: false as const, error: "Uno de los enlaces no es válido" };
  }

  const value: ProjectPayload = {
    slug,
    title,
    description,
    technologies,
    liveUrl,
    repoUrl,
    imageUrl,
    imageKey,
    imageAlt: imageAlt || `Vista previa de ${title}`,
    isFeatured: parseBoolean(data.isFeatured),
    isPublished: parseBoolean(data.isPublished),
    sortOrder,
  };
  return { ok: true as const, value };
}

export function projectValues(payload: ProjectPayload) {
  return {
    ...payload,
    technologies: JSON.stringify(payload.technologies),
    updatedAt: new Date().toISOString(),
  };
}

export function serializeProject(project: typeof projects.$inferSelect): ProjectRecord {
  return {
    ...project,
    technologies: parseStoredTechnologies(project.technologies),
    isFeatured: Boolean(project.isFeatured),
    isPublished: Boolean(project.isPublished),
    isActive: Boolean(project.isActive),
  };
}

export async function listPublicProjects() {
  const db = await getDb();
  const rows = await db
    .select()
    .from(projects)
    .where(eq(projects.isPublished, true))
    .orderBy(asc(projects.sortOrder), asc(projects.id));
  return rows.filter((project) => project.isActive).map(serializeProject);
}

function parseStoredTechnologies(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => cleanText(item, 40)).filter(Boolean).slice(0, 12) : [];
  } catch {
    return [];
  }
}
