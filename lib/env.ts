export async function getRuntimeEnvValue(name: string): Promise<string> {
  try {
    const { env } = await import("cloudflare:workers");
    const value = (env as unknown as Record<string, unknown>)[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  } catch {
    // The Cloudflare runtime is not present during some local build steps.
  }

  return process.env[name]?.trim() ?? "";
}

export async function getRuntimeNumber(name: string, fallback: number, min: number, max: number) {
  const value = Number(await getRuntimeEnvValue(name));
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function isSecureRequest(request: Request) {
  return new URL(request.url).protocol === "https:";
}
