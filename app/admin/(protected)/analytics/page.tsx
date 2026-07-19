import { getAnalytics, prettySource } from "../../../../lib/analytics";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const analytics = await getAnalytics(30);
  const maxDailyVisits = Math.max(1, ...analytics.daily.map((day) => day.visits));

  return (
    <>
      <header className="adminPageHeader">
        <div>
          <p className="adminKicker">Atribución · últimos 30 días</p>
          <h1>Estadísticas de procedencia</h1>
          <p>Seguimiento de canales, campañas, páginas de entrada y cotizaciones.</p>
        </div>
      </header>

      <section className="adminStats">
        <article><span>Visitas</span><strong>{analytics.totalVisits}</strong></article>
        <article><span>Cotizaciones</span><strong>{analytics.totalLeads}</strong></article>
        <article><span>Tasa de conversión</span><strong>{analytics.conversion.toFixed(1)}%</strong></article>
      </section>

      <section className="adminCard analyticsChartCard">
        <div className="adminCardHeading"><div><p className="adminKicker">Evolución diaria</p><h2>Visitas y cotizaciones</h2></div></div>
        <div className="dailyChart" aria-label="Gráfico de visitas y cotizaciones diarias">
          {analytics.daily.map((day) => (
            <div className="dailyColumn" key={day.date} title={`${day.date}: ${day.visits} visitas, ${day.leads} cotizaciones`}>
              <div className="dailyBars">
                <span className="visitBar" style={{ height: `${Math.max(3, (day.visits / maxDailyVisits) * 100)}%` }} />
                <span className="leadBar" style={{ height: `${Math.max(day.leads ? 5 : 0, (day.leads / maxDailyVisits) * 100)}%` }} />
              </div>
              <small>{day.date.slice(8)}</small>
            </div>
          ))}
        </div>
        <div className="chartLegend"><span><i className="visitLegend" /> Visitas</span><span><i className="leadLegend" /> Cotizaciones</span></div>
      </section>

      <section className="analyticsGrid">
        <article className="adminCard">
          <div className="adminCardHeading"><div><p className="adminKicker">Canales</p><h2>Conversión por fuente</h2></div></div>
          <div className="analyticsTable">
            <div className="analyticsRow analyticsHead"><span>Fuente</span><span>Visitas</span><span>Cotizaciones</span><span>Conversión</span></div>
            {analytics.sources.map((row) => <div className="analyticsRow" key={row.source}><strong>{prettySource(row.source)}</strong><span>{row.visits}</span><span>{row.leads}</span><b>{row.conversion.toFixed(1)}%</b></div>)}
          </div>
        </article>
        <article className="adminCard">
          <div className="adminCardHeading"><div><p className="adminKicker">Entrada</p><h2>Páginas de llegada</h2></div></div>
          <div className="rankedList">{analytics.landingPages.map((row) => <div key={row.path}><span>{row.path}</span><strong>{row.value}</strong></div>)}</div>
        </article>
      </section>

      <section className="adminCard">
        <div className="adminCardHeading"><div><p className="adminKicker">Campañas UTM</p><h2>Rendimiento de campañas</h2></div></div>
        <div className="campaignTable">
          <div className="campaignRow campaignHead"><span>Campaña</span><span>Fuente</span><span>Medio</span><span>Visitas</span><span>Cotizaciones</span><span>Conversión</span></div>
          {analytics.campaigns.map((row) => <div className="campaignRow" key={`${row.source}:${row.medium}:${row.campaign}`}><strong>{row.campaign}</strong><span>{prettySource(row.source)}</span><span>{row.medium || "—"}</span><span>{row.visits}</span><span>{row.leads}</span><b>{row.conversion.toFixed(1)}%</b></div>)}
          {!analytics.campaigns.length && <p>Aún no hay campañas UTM registradas.</p>}
        </div>
      </section>
    </>
  );
}
