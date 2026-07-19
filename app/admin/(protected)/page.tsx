import { count, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { leads, projects } from "../../../db/schema";
import { getAnalytics, getRecentSecurityEvents, prettySource } from "../../../lib/analytics";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const db = await getDb();
  const [analytics, recentLeads, projectCounts, security] = await Promise.all([
    getAnalytics(30),
    db.select().from(leads).where(isNull(leads.archivedAt)).orderBy(desc(leads.createdAt)).limit(10),
    db.select({ value: count() }).from(projects).where(eq(projects.isActive, true)),
    getRecentSecurityEvents(8),
  ]);

  return (
    <>
      <header className="adminPageHeader">
        <div>
          <p className="adminKicker">Vista general · últimos 30 días</p>
          <h1>Resumen del portafolio</h1>
          <p>Prospectos, procedencia y actividad reciente.</p>
        </div>
        <div className="adminHeaderActions"><a className="button" href="/admin/leads">Ver solicitudes</a><a className="textLink" href="/admin/projects">Administrar proyectos</a></div>
      </header>

      <section className="adminStats adminStatsFour" aria-label="Indicadores principales">
        <article><span>Visitas</span><strong>{analytics.totalVisits}</strong><small>sesiones registradas</small></article>
        <article><span>Cotizaciones</span><strong>{analytics.totalLeads}</strong><small>solicitudes recibidas</small></article>
        <article><span>Conversión</span><strong>{analytics.conversion.toFixed(1)}%</strong><small>cotizaciones por visita</small></article>
        <article><span>Proyectos</span><strong>{Number(projectCounts[0]?.value ?? 0)}</strong><small>activos en el panel</small></article>
      </section>

      <section className="adminDashboardGrid">
        <article className="adminCard">
          <div className="adminCardHeading"><div><p className="adminKicker">Adquisición</p><h2>Rendimiento por fuente</h2></div><a href="/admin/analytics">Ver informe completo</a></div>
          <div className="sourcePerformance">
            {analytics.sources.slice(0, 6).map((row) => (
              <div key={row.source}>
                <strong>{prettySource(row.source)}</strong>
                <span>{row.visits} visitas</span>
                <span>{row.leads} cotizaciones</span>
                <b>{row.conversion.toFixed(1)}%</b>
              </div>
            ))}
            {!analytics.sources.length && <p>Aún no hay visitas registradas.</p>}
          </div>
        </article>
        <article className="adminCard">
          <div className="adminCardHeading"><div><p className="adminKicker">Seguridad</p><h2>Actividad sospechosa</h2></div></div>
          <div className="securityList">
            {security.map((event) => <div key={event.id}><span>{eventLabel(event.eventType)}</span><small>{formatDate(event.createdAt)}</small></div>)}
            {!security.length && <p>No se han registrado incidentes.</p>}
          </div>
        </article>
      </section>

      <section className="adminCard recentLeadsCard">
        <div className="adminCardHeading"><div><p className="adminKicker">Prospectos</p><h2>Solicitudes recientes</h2></div><a href="/admin/leads">Gestionar todas</a></div>
        {recentLeads.length ? (
          <div className="leadTable">
            <div className="leadRow leadHead"><span>Cliente</span><span>Proyecto</span><span>Estimación</span><span>Origen</span><span>Fecha</span></div>
            {recentLeads.map((lead) => (
              <div className="leadRow" key={lead.id}>
                <span><strong>{lead.name}</strong><small>{lead.business}</small><a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{lead.whatsapp}</a></span>
                <span>{lead.projectType}<small>{lead.details || "Sin detalles"}</small></span>
                <span>USD {lead.estimatedPrice}</span>
                <span className="sourceBadge">{prettySource(lead.source)}</span>
                <span>{formatDate(lead.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : <div className="adminEmpty"><p>Las solicitudes enviadas desde el cotizador aparecerán aquí.</p></div>}
      </section>
    </>
  );
}

function eventLabel(event: string) {
  const labels: Record<string, string> = {
    login_failure: "Intento de acceso fallido",
    login_blocked: "Acceso bloqueado por límite",
    lead_honeypot: "Bot detectado en cotizador",
    lead_rate_limit: "Cotizador limitado por abuso",
    lead_duplicate: "Envío repetido bloqueado",
    visit_rate_limit: "Visitas automatizadas limitadas",
    turnstile_failure: "Turnstile rechazó un envío",
    lead_email_failure: "No se pudo enviar un aviso por correo",
  };
  return labels[event] ?? event;
}

function formatDate(value: string) {
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const caracas = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(caracas.getUTCDate())}/${pad(caracas.getUTCMonth() + 1)}/${caracas.getUTCFullYear()}, ${pad(caracas.getUTCHours())}:${pad(caracas.getUTCMinutes())}`;
}
