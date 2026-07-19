import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const leads = sqliteTable(
  "leads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    business: text("business").notNull().default(""),
    whatsapp: text("whatsapp").notNull(),
    email: text("email").notNull().default(""),
    projectType: text("project_type").notNull(),
    extras: text("extras").notNull().default("[]"),
    estimatedPrice: real("estimated_price").notNull(),
    details: text("details").notNull().default(""),
    source: text("source").notNull().default("directo"),
    medium: text("medium").notNull().default(""),
    campaign: text("campaign").notNull().default(""),
    landingPath: text("landing_path").notNull().default("/"),
    referrer: text("referrer").notNull().default(""),
    sessionId: text("session_id").notNull().default(""),
    visitorHash: text("visitor_hash").notNull().default(""),
    submissionHash: text("submission_hash").notNull().default(""),
    status: text("status").notNull().default("nuevo"),
    notes: text("notes").notNull().default(""),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("leads_source_created_idx").on(table.source, table.createdAt),
    index("leads_submission_created_idx").on(table.submissionHash, table.createdAt),
    index("leads_status_updated_idx").on(table.status, table.updatedAt),
  ],
);

export const visits = sqliteTable(
  "visits",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    source: text("source").notNull().default("directo"),
    medium: text("medium").notNull().default(""),
    campaign: text("campaign").notNull().default(""),
    path: text("path").notNull().default("/"),
    landingPath: text("landing_path").notNull().default("/"),
    referrer: text("referrer").notNull().default(""),
    sessionId: text("session_id").notNull().default(""),
    visitorHash: text("visitor_hash").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("visits_source_created_idx").on(table.source, table.createdAt),
    index("visits_session_path_idx").on(table.sessionId, table.path),
  ],
);

export const projects = sqliteTable(
  "projects",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    technologies: text("technologies").notNull().default("[]"),
    liveUrl: text("live_url").notNull().default(""),
    repoUrl: text("repo_url").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    imageKey: text("image_key").notNull().default(""),
    imageAlt: text("image_alt").notNull().default(""),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("projects_slug_unique").on(table.slug),
    index("projects_public_order_idx").on(table.isPublished, table.isActive, table.sortOrder),
  ],
);

export const adminSessions = sqliteTable(
  "admin_sessions",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    csrfTokenHash: text("csrf_token_hash").notNull(),
    ipHash: text("ip_hash").notNull().default(""),
    userAgentHash: text("user_agent_hash").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [index("admin_sessions_expires_idx").on(table.expiresAt)],
);

export const securityEvents = sqliteTable(
  "security_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    eventType: text("event_type").notNull(),
    keyHash: text("key_hash").notNull().default(""),
    ipHash: text("ip_hash").notNull().default(""),
    path: text("path").notNull().default(""),
    detail: text("detail").notNull().default("{}"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("security_event_key_created_idx").on(table.eventType, table.keyHash, table.createdAt),
    index("security_event_created_idx").on(table.createdAt),
  ],
);
