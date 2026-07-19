import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);
const env = {
  ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
};
const context = { waitUntil() {}, passThroughOnException() {} };

test("renders the dedicated administration login", async () => {
  const response = await worker.fetch(
    new Request("http://localhost/admin/login", { headers: { accept: "text/html" } }),
    env,
    context,
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /Panel administrativo/i);
});

test("rejects anonymous access to administrative APIs", async () => {
  const response = await worker.fetch(
    new Request("http://localhost/api/admin/projects", { headers: { accept: "application/json" } }),
    env,
    context,
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Sesión requerida" });
});

test("rejects anonymous lead management", async () => {
  const response = await worker.fetch(
    new Request("http://localhost/api/admin/leads/1", { method: "DELETE", headers: { accept: "application/json" } }),
    env,
    context,
  );
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Sesión requerida" });
});

test("issues a short-lived same-site CSRF cookie", async () => {
  const response = await worker.fetch(
    new Request("http://localhost/api/auth/csrf", { headers: { accept: "application/json" } }),
    env,
    context,
  );
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /da_admin_csrf=/);
  assert.match(cookie, /SameSite=Strict/i);
  assert.doesNotMatch(cookie, /HttpOnly/i);
  const body = await response.json();
  assert.equal(typeof body.token, "string");
  assert.ok(body.token.length >= 20);
});
