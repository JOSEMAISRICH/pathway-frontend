import { apiUrl } from "@/lib/api/apiUrl";
import type { PlanFeatures } from "@/lib/api/plans";

export type AgencyMember = {
  id: string;
  userId: string;
  role: string;
  email: string;
  nombre: string;
};

export type AgencyProfile = {
  id: string;
  name: string;
  email: string;
  logoUrl: string;
  members: AgencyMember[];
  features?: PlanFeatures;
};

export type AgencyAlert = {
  id: string;
  type: string;
  caseId: string;
  clientName: string;
  message: string;
};

async function readJson(r: Response) {
  return (await r.json().catch(() => ({}))) as Record<string, unknown>;
}

export async function fetchAgencyProfile(): Promise<AgencyProfile | null> {
  const r = await fetch(apiUrl("/api/agency"), { credentials: "include" });
  if (!r.ok) return null;
  const j = await readJson(r);
  const agency = j.agency as AgencyProfile | undefined;
  if (!agency) return null;
  return {
    ...agency,
    features: (j.features as PlanFeatures | undefined) ?? agency.features,
  };
}

export async function updateAgencyName(name: string): Promise<AgencyProfile | { error: string }> {
  const r = await fetch(apiUrl("/api/agency"), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const j = await readJson(r);
  if (!r.ok) return { error: String(j.error || "No se pudo guardar") };
  return j.agency as AgencyProfile;
}

export async function uploadAgencyLogo(file: File): Promise<AgencyProfile | { error: string }> {
  const body = new FormData();
  body.append("file", file);
  const r = await fetch(apiUrl("/api/agency/logo"), {
    method: "POST",
    credentials: "include",
    body,
  });
  const j = await readJson(r);
  if (!r.ok) return { error: String(j.error || "No se pudo subir el logo") };
  return j.agency as AgencyProfile;
}

export async function fetchAgencyAlerts(): Promise<AgencyAlert[]> {
  const r = await fetch(apiUrl("/api/agency/alerts"), { credentials: "include" });
  if (!r.ok) return [];
  const j = await readJson(r);
  return Array.isArray(j.alerts) ? (j.alerts as AgencyAlert[]) : [];
}

export async function addAgencyMember(input: {
  email: string;
  password: string;
  nombre: string;
}): Promise<AgencyMember[] | { error: string }> {
  const r = await fetch(apiUrl("/api/agency/members"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const j = await readJson(r);
  if (!r.ok) return { error: String(j.error || "No se pudo añadir") };
  return Array.isArray(j.members) ? (j.members as AgencyMember[]) : [];
}

export async function removeAgencyMember(memberId: string): Promise<AgencyMember[] | { error: string }> {
  const r = await fetch(apiUrl(`/api/agency/members/${encodeURIComponent(memberId)}`), {
    method: "DELETE",
    credentials: "include",
  });
  const j = await readJson(r);
  if (!r.ok) return { error: String(j.error || "No se pudo quitar") };
  return Array.isArray(j.members) ? (j.members as AgencyMember[]) : [];
}
