let warmed = false;

/** Precalienta el bundle de la ficha de expediente (evita 404 en la primera visita con Turbopack). */
export function prefetchCaseDetailPage() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  void import("@/app/(pw)/dashboard/cases/[caseId]/page");
}
