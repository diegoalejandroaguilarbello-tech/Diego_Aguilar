import { requireAdminApi, verifyAdminCsrf } from "../../../../lib/admin-auth";
import { cleanText } from "../../../../lib/validation";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  const auth = await requireAdminApi(request);
  if (!auth.ok) return auth.response;
  if (!(await verifyAdminCsrf(request, auth.session))) return Response.json({ error: "Verificación CSRF inválida" }, { status: 403 });
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_IMAGE_BYTES + 100_000) return Response.json({ error: "La imagen supera el límite de 5 MB" }, { status: 413 });

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return Response.json({ error: "Selecciona una imagen" }, { status: 400 });
  const extension = allowedTypes.get(file.type);
  if (!extension || file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "Usa una imagen JPG, PNG o WebP de hasta 5 MB" }, { status: 422 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesSignature(bytes, file.type)) return Response.json({ error: "El contenido del archivo no coincide con su formato" }, { status: 422 });
  const { env } = await import("cloudflare:workers");
  if (!env.BUCKET) return Response.json({ error: "El almacenamiento de imágenes no está disponible" }, { status: 503 });

  const key = `projects/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, bytes, {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { originalName: cleanText(file.name, 120) },
  });
  return Response.json({ key, imageUrl: `/api/media/${key}` }, { status: 201 });
}

function matchesSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  if (type === "image/webp") {
    return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}
