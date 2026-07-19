const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,79}$/u;
const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(CONTROL_CHARACTERS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function cleanMultiline(value: unknown, maxLength: number) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(CONTROL_CHARACTERS, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function validName(value: string) {
  return NAME_PATTERN.test(value);
}

export function normalizePhone(value: unknown) {
  const display = cleanText(value, 40);
  const digits = display.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return { display, digits };
}

export function validEmail(value: string) {
  return !value || (value.length <= 160 && EMAIL_PATTERN.test(value));
}

export function cleanAttribution(value: unknown, fallback = "") {
  return cleanText(value, 100).replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ._\-/ ]/g, "").slice(0, 100) || fallback;
}

export function safePath(value: unknown) {
  const path = cleanText(value, 220);
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

export function safeExternalUrl(value: unknown, optional = true) {
  const raw = cleanText(value, 500);
  if (!raw && optional) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function safeImageUrl(value: unknown) {
  const raw = cleanText(value, 500);
  if (!raw) return "";
  if (raw.startsWith("/api/media/projects/") && !raw.includes("..")) return raw;
  return safeExternalUrl(raw);
}

export function slugify(value: unknown) {
  return cleanText(value, 100)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseTechnologyList(value: unknown) {
  const list = Array.isArray(value) ? value : String(value ?? "").split(",");
  return [...new Set(list.map((item) => cleanText(item, 40)).filter(Boolean))].slice(0, 12);
}

export function parseBoolean(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true" || value === "on";
}
