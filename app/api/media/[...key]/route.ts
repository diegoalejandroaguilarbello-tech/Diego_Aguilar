export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const segments = (await params).key;
  if (!segments?.length || segments[0] !== "projects" || segments.some((segment) => !/^[a-zA-Z0-9._-]+$/.test(segment))) {
    return new Response("Not found", { status: 404 });
  }
  const key = segments.join("/");
  const { env } = await import("cloudflare:workers");
  if (!env.BUCKET) return new Response("Storage unavailable", { status: 503 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
