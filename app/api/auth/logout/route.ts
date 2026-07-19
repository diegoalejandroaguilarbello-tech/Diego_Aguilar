import {
  clearedSessionCookies,
  destroyAdminSession,
  requireAdminApi,
  verifyAdminCsrf,
} from "../../../../lib/admin-auth";

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;
  if (!(await verifyAdminCsrf(request, auth.session))) {
    return Response.json({ error: "Verificación CSRF inválida" }, { status: 403 });
  }

  await destroyAdminSession(request);
  const response = Response.json({ ok: true });
  response.headers.set("cache-control", "no-store");
  for (const cookie of clearedSessionCookies(request)) response.headers.append("set-cookie", cookie);
  return response;
}
