import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, test } from "node:test";
import { Miniflare } from "miniflare";
import { sessionCookies } from "../lib/admin-auth";
import { calculateQuote } from "../lib/pricing";
import { isLeadStatus, LEAD_STATUS_LABELS } from "../lib/lead-workflow";
import { parseProjectPayload } from "../lib/projects";
import { normalizePhone, validEmail, validName } from "../lib/validation";

const mf = new Miniflare({
  modules: true,
  script: "export default { fetch() { return new Response('ok') } }",
  d1Databases: { DB: "portfolio-test" },
  r2Buckets: ["BUCKET"],
});
const DB = await mf.getD1Database("DB");
await applyMigration("drizzle/0000_sudden_big_bertha.sql");
await applyMigration("drizzle/0001_minor_bedlam.sql");
await applyMigration("drizzle/0002_plain_rocket_raccoon.sql");

after(async () => mf.dispose());

test("migration creates security, analytics and project storage", async () => {
  const tables = await DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all<{ name: string }>();
  const names = tables.results.map((row) => row.name);
  assert.ok(names.includes("admin_sessions"));
  assert.ok(names.includes("projects"));
  assert.ok(names.includes("security_events"));

  const columns = await DB.prepare("PRAGMA table_info(leads)").all<{ name: string }>();
  const columnNames = columns.results.map((row) => row.name);
  for (const expected of ["medium", "landing_path", "session_id", "visitor_hash", "submission_hash", "updated_at", "archived_at"]) {
    assert.ok(columnNames.includes(expected), `missing leads.${expected}`);
  }
});

test("supports the complete lead workflow", () => {
  for (const status of ["nuevo", "contactado", "propuesta_enviada", "en_progreso", "finalizado", "no_concretado"]) {
    assert.equal(isLeadStatus(status), true);
    assert.ok(LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS]);
  }
  assert.equal(isLeadStatus("eliminado"), false);
});

test("migration seeds Automundo Premium and ResearchOS", async () => {
  const rows = await DB.prepare("SELECT slug, title, is_published, sort_order FROM projects ORDER BY sort_order").all<{
    slug: string;
    title: string;
    is_published: number;
    sort_order: number;
  }>();
  assert.deepEqual(rows.results.map((row) => row.slug), ["automundo-premium", "researchos"]);
  assert.ok(rows.results.every((row) => row.is_published === 1));
});

test("quote price is derived from the trusted server catalogue", () => {
  const quote = calculateQuote("informativa", ["panel", "panel", "not-valid"]);
  assert.ok(quote);
  assert.equal(quote.total, 240);
  assert.deepEqual(quote.extras.map((item) => item.value), ["panel"]);
  assert.equal(calculateQuote("invented", []), null);
});

test("validates public lead identity fields strictly", () => {
  assert.equal(validName("María Pérez"), true);
  assert.equal(validName("<script>"), false);
  assert.deepEqual(normalizePhone("+58 424-123-4567")?.digits, "584241234567");
  assert.equal(normalizePhone("123"), null);
  assert.equal(validEmail("maria@example.com"), true);
  assert.equal(validEmail("maria@invalid"), false);
});

test("rejects unsafe project links and normalizes project content", () => {
  const unsafe = parseProjectPayload({
    title: "Proyecto seguro",
    description: "Descripción suficientemente extensa.",
    technologies: ["React"],
    liveUrl: "javascript:alert(1)",
  });
  assert.equal(unsafe.ok, false);

  const valid = parseProjectPayload({
    title: "Mi Proyecto",
    description: "Descripción suficientemente extensa.",
    technologies: "React, Node.js, React",
    liveUrl: "https://example.com",
    isPublished: true,
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.value.slug, "mi-proyecto");
    assert.deepEqual(valid.value.technologies, ["React", "Node.js"]);
  }
});

test("production session cookie is HttpOnly, Secure and SameSite Strict", () => {
  const [session, csrf] = sessionCookies(new Request("https://portfolio.example/admin"), "session-token", "csrf-token", 3600);
  assert.match(session, /HttpOnly/);
  assert.match(session, /Secure/);
  assert.match(session, /SameSite=Strict/);
  assert.match(csrf, /Secure/);
  assert.match(csrf, /SameSite=Strict/);
  assert.doesNotMatch(csrf, /HttpOnly/);
});

async function applyMigration(relativePath: string) {
  const file = new URL(`../${relativePath}`, import.meta.url);
  const sql = await readFile(file, "utf8");
  for (const statement of sql.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) {
    await DB.prepare(statement.replace(/;\s*$/, "")).run();
  }
}
