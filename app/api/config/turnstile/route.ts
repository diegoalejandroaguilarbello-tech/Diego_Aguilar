import { getTurnstilePublicConfig } from "../../../../lib/turnstile";

export async function GET(request: Request) {
  const config = await getTurnstilePublicConfig(request);
  const response = Response.json(config);
  response.headers.set("cache-control", "no-store");
  return response;
}
