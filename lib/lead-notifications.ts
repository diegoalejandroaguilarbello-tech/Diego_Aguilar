import { getRuntimeEnvValue } from "./env";

type LeadNotification = {
  id: number;
  name: string;
  business: string;
  whatsapp: string;
  email: string;
  projectType: string;
  extras: string[];
  estimatedPrice: number;
  details: string;
  source: string;
  campaign: string;
};

export async function sendLeadNotification(lead: LeadNotification) {
  const [apiKey, configuredTo, configuredFrom] = await Promise.all([
    getRuntimeEnvValue("RESEND_API_KEY"),
    getRuntimeEnvValue("LEAD_NOTIFICATION_EMAIL"),
    getRuntimeEnvValue("LEAD_FROM_EMAIL"),
  ]);

  if (!apiKey || !configuredTo || !configuredFrom) {
    return { sent: false, reason: "not_configured" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: configuredFrom,
      to: [configuredTo],
      reply_to: lead.email,
      subject: `Nueva cotización #${lead.id}: ${lead.name}`,
      html: leadEmailHtml(lead),
      text: leadEmailText(lead),
    }),
  });

  return response.ok
    ? { sent: true as const }
    : { sent: false as const, reason: "provider_error" as const, status: response.status };
}

function leadEmailHtml(lead: LeadNotification) {
  const rows = [
    ["Cliente", lead.name],
    ["Negocio", lead.business],
    ["WhatsApp", lead.whatsapp],
    ["Correo", lead.email],
    ["Proyecto", lead.projectType],
    ["Extras", lead.extras.join(", ") || "Ninguno"],
    ["Estimación", `USD ${lead.estimatedPrice}`],
    ["Origen", lead.campaign ? `${lead.source} · ${lead.campaign}` : lead.source],
    ["Detalles", lead.details || "Sin detalles"],
  ];
  return `<div style="font-family:Arial,sans-serif;color:#10213a;line-height:1.55;max-width:640px"><h1 style="color:#071b38">Nueva solicitud de cotización</h1><p>Se guardó una nueva solicitud en el panel administrativo.</p><table style="width:100%;border-collapse:collapse">${rows.map(([label, value]) => `<tr><th style="text-align:left;padding:9px;border-bottom:1px solid #dce6f3;width:130px">${escapeHtml(label)}</th><td style="padding:9px;border-bottom:1px solid #dce6f3">${escapeHtml(value)}</td></tr>`).join("")}</table></div>`;
}

function leadEmailText(lead: LeadNotification) {
  return [
    `Nueva cotización #${lead.id}`,
    `Cliente: ${lead.name}`,
    `Negocio: ${lead.business}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Correo: ${lead.email}`,
    `Proyecto: ${lead.projectType}`,
    `Extras: ${lead.extras.join(", ") || "Ninguno"}`,
    `Estimación: USD ${lead.estimatedPrice}`,
    `Origen: ${lead.source}${lead.campaign ? ` · ${lead.campaign}` : ""}`,
    `Detalles: ${lead.details || "Sin detalles"}`,
  ].join("\n");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}
