"use client";

import { useMemo, useState } from "react";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "../../../lib/lead-workflow";

export type ManagedLead = {
  id: number;
  name: string;
  business: string;
  whatsapp: string;
  email: string;
  projectType: string;
  extras: string;
  estimatedPrice: number;
  details: string;
  source: string;
  campaign: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export default function LeadsManager({ initialLeads }: { initialLeads: ManagedLead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [filter, setFilter] = useState<"activos" | "archivados" | "todos" | LeadStatus>("activos");
  const [saving, setSaving] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visible = useMemo(() => leads.filter((lead) => {
    if (filter === "activos") return !lead.archivedAt;
    if (filter === "archivados") return Boolean(lead.archivedAt);
    if (filter === "todos") return true;
    return !lead.archivedAt && lead.status === filter;
  }), [filter, leads]);

  async function save(lead: ManagedLead, updates: Partial<Pick<ManagedLead, "status" | "notes">> & { archived?: boolean }) {
    setSaving(lead.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json", "x-csrf-token": readCookie("da_admin_csrf") },
        body: JSON.stringify({ status: updates.status ?? lead.status, notes: updates.notes ?? lead.notes, archived: updates.archived ?? Boolean(lead.archivedAt) }),
      });
      const data = await response.json() as { lead?: ManagedLead; error?: string };
      if (!response.ok || !data.lead) throw new Error(data.error || "No se pudo guardar la solicitud");
      setLeads((current) => current.map((item) => item.id === lead.id ? data.lead! : item));
      setMessage("Solicitud actualizada.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar la solicitud");
    } finally {
      setSaving(null);
    }
  }

  async function remove(lead: ManagedLead) {
    if (!window.confirm(`¿Eliminar definitivamente la solicitud de ${lead.name}? Esta acción no se puede deshacer.`)) return;
    setSaving(lead.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE", credentials: "include", headers: { "x-csrf-token": readCookie("da_admin_csrf") } });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo eliminar la solicitud");
      setLeads((current) => current.filter((item) => item.id !== lead.id));
      setMessage("Solicitud eliminada.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo eliminar la solicitud");
    } finally {
      setSaving(null);
    }
  }

  return <>
    <div className="leadToolbar">
      <label>Mostrar<select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="activos">Activas</option>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{LEAD_STATUS_LABELS[status]}</option>)}<option value="archivados">Archivadas</option><option value="todos">Todas</option></select></label>
      <strong>{visible.length} solicitud{visible.length === 1 ? "" : "es"}</strong>
    </div>
    {message && <p className="adminNotice" role="status">{message}</p>}
    {error && <p className="adminError" role="alert">{error}</p>}
    <div className="leadManagerList">
      {visible.map((lead) => <article className="leadManagerCard" key={lead.id}>
        <header><div><span className={`leadStatus status-${lead.status}`}>{LEAD_STATUS_LABELS[lead.status as LeadStatus] ?? lead.status}</span>{lead.archivedAt && <span className="leadArchived">Archivada</span>}<h2>{lead.name}</h2><p>{lead.business}</p></div><strong>USD {lead.estimatedPrice}</strong></header>
        <div className="leadDetailsGrid">
          <div><small>Contacto</small><a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{lead.whatsapp}</a><a href={`mailto:${lead.email}`}>{lead.email}</a></div>
          <div><small>Proyecto</small><strong>{lead.projectType}</strong><span>{parseExtras(lead.extras)}</span></div>
          <div><small>Procedencia</small><strong>{lead.source}</strong><span>{lead.campaign || "Sin campaña"}</span></div>
          <div><small>Recibida</small><strong>{formatDate(lead.createdAt)}</strong><span>Actualizada {formatDate(lead.updatedAt)}</span></div>
        </div>
        {lead.details && <p className="leadDescription">{lead.details}</p>}
        <div className="leadWorkflow">
          <label>Estado<select value={lead.status} disabled={saving === lead.id} onChange={(event) => save(lead, { status: event.target.value })}>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{LEAD_STATUS_LABELS[status]}</option>)}</select></label>
          <label>Notas internas<textarea defaultValue={lead.notes} maxLength={2000} rows={3} disabled={saving === lead.id} onBlur={(event) => { if (event.target.value !== lead.notes) save(lead, { notes: event.target.value }); }} placeholder="Acuerdos, seguimiento, próximo contacto…" /></label>
        </div>
        <footer><button type="button" disabled={saving === lead.id} onClick={() => save(lead, { archived: !lead.archivedAt })}>{lead.archivedAt ? "Restaurar" : "Archivar"}</button><button className="dangerButton" type="button" disabled={saving === lead.id} onClick={() => remove(lead)}>Eliminar definitivamente</button>{saving === lead.id && <span>Guardando…</span>}</footer>
      </article>)}
      {!visible.length && <div className="adminEmpty"><p>No hay solicitudes en esta vista.</p></div>}
    </div>
  </>;
}

function readCookie(name: string) {
  return document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";
}

function parseExtras(value: string) {
  try { const extras = JSON.parse(value) as string[]; return extras.length ? extras.join(", ") : "Sin extras"; } catch { return "Sin extras"; }
}

function formatDate(value: string) {
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const caracas = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(caracas.getUTCDate())}/${pad(caracas.getUTCMonth() + 1)}/${caracas.getUTCFullYear()}, ${pad(caracas.getUTCHours())}:${pad(caracas.getUTCMinutes())}`;
}
