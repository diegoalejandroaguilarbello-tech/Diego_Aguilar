export const LEAD_STATUSES = [
  "nuevo",
  "contactado",
  "propuesta_enviada",
  "en_progreso",
  "finalizado",
  "no_concretado",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: "Nueva",
  contactado: "Contactado",
  propuesta_enviada: "Propuesta enviada",
  en_progreso: "En progreso",
  finalizado: "Finalizado",
  no_concretado: "No concretado",
};

export function isLeadStatus(value: string): value is LeadStatus {
  return LEAD_STATUSES.includes(value as LeadStatus);
}
