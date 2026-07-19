import { desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { leads } from "../../../../db/schema";
import LeadsManager from "../../components/LeadsManager";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const db = await getDb();
  const rows = await db.select().from(leads).orderBy(desc(leads.updatedAt)).limit(500);
  return <>
    <header className="adminPageHeader"><div><p className="adminKicker">Seguimiento comercial</p><h1>Solicitudes</h1><p>Contacta clientes, registra avances y controla cada proyecto desde su cotización.</p></div></header>
    <LeadsManager initialLeads={rows} />
  </>;
}
