import { loginCsrfCookie } from "../../../../lib/admin-auth";
import { randomToken } from "../../../../lib/security";

export async function GET(request: Request) {
  const token = randomToken(24);
  const response = Response.json({ token });
  response.headers.set("cache-control", "no-store");
  response.headers.append("set-cookie", loginCsrfCookie(request, token));
  return response;
}
