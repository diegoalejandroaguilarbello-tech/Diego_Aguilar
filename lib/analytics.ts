import { and, asc, count, desc, gte, sql } from "drizzle-orm";
import { getDb } from "../db";
import { leads, securityEvents, visits } from "../db/schema";

export async function getAnalytics(days = 30) {
  const safeDays = Math.max(7, Math.min(365, Math.round(days)));
  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - safeDays + 1);
  cutoffDate.setUTCHours(0, 0, 0, 0);
  const cutoff = cutoffDate.toISOString().replace("T", " ").slice(0, 19);
  const db = await getDb();

  const [visitTotalRows, leadTotalRows, sourceVisits, sourceLeads, campaignVisits, campaignLeads, landingPages, dailyVisits, dailyLeads] = await Promise.all([
    db.select({ value: count() }).from(visits).where(gte(visits.createdAt, cutoff)),
    db.select({ value: count() }).from(leads).where(gte(leads.createdAt, cutoff)),
    db.select({ source: visits.source, value: count() }).from(visits).where(gte(visits.createdAt, cutoff)).groupBy(visits.source).orderBy(desc(count())),
    db.select({ source: leads.source, value: count() }).from(leads).where(gte(leads.createdAt, cutoff)).groupBy(leads.source).orderBy(desc(count())),
    db.select({ source: visits.source, medium: visits.medium, campaign: visits.campaign, value: count() }).from(visits).where(and(gte(visits.createdAt, cutoff), sql`${visits.campaign} <> ''`)).groupBy(visits.source, visits.medium, visits.campaign).orderBy(desc(count())).limit(50),
    db.select({ source: leads.source, medium: leads.medium, campaign: leads.campaign, value: count() }).from(leads).where(and(gte(leads.createdAt, cutoff), sql`${leads.campaign} <> ''`)).groupBy(leads.source, leads.medium, leads.campaign).orderBy(desc(count())).limit(50),
    db.select({ path: visits.landingPath, value: count() }).from(visits).where(gte(visits.createdAt, cutoff)).groupBy(visits.landingPath).orderBy(desc(count())).limit(20),
    db.select({ date: sql<string>`date(${visits.createdAt})`, value: count() }).from(visits).where(gte(visits.createdAt, cutoff)).groupBy(sql`date(${visits.createdAt})`).orderBy(asc(sql`date(${visits.createdAt})`)),
    db.select({ date: sql<string>`date(${leads.createdAt})`, value: count() }).from(leads).where(gte(leads.createdAt, cutoff)).groupBy(sql`date(${leads.createdAt})`).orderBy(asc(sql`date(${leads.createdAt})`)),
  ]);

  const totalVisits = Number(visitTotalRows[0]?.value ?? 0);
  const totalLeads = Number(leadTotalRows[0]?.value ?? 0);
  const sourceRows = new Map<string, { source: string; visits: number; leads: number; conversion: number }>();
  for (const row of sourceVisits) sourceRows.set(row.source, { source: row.source, visits: Number(row.value), leads: 0, conversion: 0 });
  for (const row of sourceLeads) {
    const current = sourceRows.get(row.source) ?? { source: row.source, visits: 0, leads: 0, conversion: 0 };
    current.leads = Number(row.value);
    sourceRows.set(row.source, current);
  }
  for (const row of sourceRows.values()) row.conversion = row.visits ? (row.leads / row.visits) * 100 : 0;

  const campaignRows = new Map<string, { source: string; medium: string; campaign: string; visits: number; leads: number; conversion: number }>();
  for (const row of campaignVisits) {
    const key = `${row.source}\u0000${row.medium}\u0000${row.campaign}`;
    campaignRows.set(key, { source: row.source, medium: row.medium, campaign: row.campaign, visits: Number(row.value), leads: 0, conversion: 0 });
  }
  for (const row of campaignLeads) {
    const key = `${row.source}\u0000${row.medium}\u0000${row.campaign}`;
    const current = campaignRows.get(key) ?? { source: row.source, medium: row.medium, campaign: row.campaign, visits: 0, leads: 0, conversion: 0 };
    current.leads = Number(row.value);
    campaignRows.set(key, current);
  }
  for (const row of campaignRows.values()) row.conversion = row.visits ? (row.leads / row.visits) * 100 : 0;

  const visitByDate = new Map(dailyVisits.map((row) => [row.date, Number(row.value)]));
  const leadByDate = new Map(dailyLeads.map((row) => [row.date, Number(row.value)]));
  const daily = Array.from({ length: safeDays }, (_, index) => {
    const date = new Date(cutoffDate);
    date.setUTCDate(cutoffDate.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    return { date: key, visits: visitByDate.get(key) ?? 0, leads: leadByDate.get(key) ?? 0 };
  });

  return {
    days: safeDays,
    totalVisits,
    totalLeads,
    conversion: totalVisits ? (totalLeads / totalVisits) * 100 : 0,
    sources: [...sourceRows.values()].sort((left, right) => right.visits - left.visits),
    campaigns: [...campaignRows.values()].sort((left, right) => right.visits - left.visits),
    landingPages: landingPages.map((row) => ({ path: row.path || "/", value: Number(row.value) })),
    daily,
  };
}

export async function getRecentSecurityEvents(limit = 10) {
  const db = await getDb();
  return db.select().from(securityEvents).where(sql`${securityEvents.eventType} NOT IN ('login_success', 'lead_attempt', 'admin_lead_updated', 'admin_lead_deleted')`).orderBy(desc(securityEvents.createdAt)).limit(limit);
}

export function prettySource(source: string) {
  const labels: Record<string, string> = {
    directo: "Directo",
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
    google: "Google",
    facebook: "Facebook",
  };
  return labels[source.toLowerCase()] ?? source.charAt(0).toUpperCase() + source.slice(1);
}
