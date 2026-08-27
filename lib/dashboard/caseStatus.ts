export type CaseSemaphore = "green" | "amber" | "red";

export type CaseRowLike = {
  progress: number;
  reviewStatus?: string | null;
  hasRejectedDocuments?: boolean;
};

export function caseSemaphore(row: CaseRowLike): CaseSemaphore {
  const rs = (row.reviewStatus ?? "").toLowerCase();
  if (rs === "approved") return "green";
  if (rs === "rejected") return "red";
  if (row.hasRejectedDocuments) return "red";
  return "amber";
}

export function caseStatusLabel(sem: CaseSemaphore, progress = 0): string {
  if (sem === "green") return "Aprobado";
  if (sem === "red") return "Rechazado";
  if (progress >= 100) return "Pendiente revisión";
  if (progress > 0) return "En curso";
  return "Sin documentos";
}
