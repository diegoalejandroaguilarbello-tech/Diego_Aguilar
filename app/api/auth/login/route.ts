import {
  attemptAdminLogin,
  sessionCookies,
  verifyLoginCsrf,
} from "../../../../lib/admin-auth";
import { readJsonBody } from "../../../../lib/security";
import { cleanText } from "../../../../lib/validation";

export async function POST(request: Request) {
  if (!(await verifyLoginCsrf(request))) {
    return Response.json({ error: "La verificación de seguridad expiró. Recarga la página" }, { status: 403 });
  }
  const body = await readJsonBody(request, 2_048);
  if (!body.ok) return Response.json({ error: body.error }, { status: body.status });

  const username = cleanText(body.value.username, 80);
  const password = String(body.value.password ?? "");
  if (!username || !password) {
    return Response.json({ error: "Escribe el usuario y la contraseña" }, { status: 400 });
  }

  const result = await attemptAdminLogin(username, password, request);
  if (!result.ok) return Response.json({ error: result.error, code: result.code }, { status: result.status });

  const response = Response.json({ ok: true, expiresAt: result.expiresAt });
  response.headers.set("cache-control", "no-store");
  for (const cookie of sessionCookies(request, result.token, result.csrfToken, result.maxAge)) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}
