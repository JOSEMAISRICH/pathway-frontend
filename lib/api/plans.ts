export type PlanId = "basico" | "profesional";

export type PlanFeatures = {
  aiFilter: boolean;
  whiteLabel: boolean;
  deadlines: boolean;
};

export type PublicPlan = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number | null;
  checkout: boolean;
  highlighted: boolean;
  maxActiveCases: number | null;
  features: PlanFeatures;
  includes: string[];
};

export const PATHWAY_PLANS: PublicPlan[] = [
  {
    id: "basico",
    name: "Básico",
    tagline: "Ideal para abogados independientes.",
    priceMonthly: 39,
    checkout: true,
    highlighted: false,
    maxActiveCases: 50,
    features: { aiFilter: false, whiteLabel: false, deadlines: false },
    includes: [
      "Hasta 50 expedientes activos",
      "Equipo ilimitado",
      "Portal del cliente con magic link",
      "Todos los trámites y checklist",
      "Validación básica al subir (formato y calidad)",
      "PDF EX-10",
    ],
  },
  {
    id: "profesional",
    name: "Profesional",
    tagline: "Para despachos en crecimiento.",
    priceMonthly: 139,
    checkout: true,
    highlighted: true,
    maxActiveCases: null,
    features: { aiFilter: true, whiteLabel: true, deadlines: true },
    includes: [
      "Expedientes ilimitados",
      "Filtro IA (pasaporte, padrón y tasa 790)",
      "Marca blanca en portal y emails",
      "Avisos de plazos y caducidad",
      "Todo lo del plan Básico",
    ],
  },
];

export function formatPlanPrice(priceMonthly: number | null | undefined): string {
  if (priceMonthly == null || !Number.isFinite(priceMonthly)) return "—";
  return `${priceMonthly} €`;
}

export function planDisplayName(planId: string | undefined | null): string {
  const id = String(planId || "").toLowerCase();
  if (id === "standard" || id === "pro" || id === "enterprise") return "Profesional";
  const found = PATHWAY_PLANS.find((p) => p.id === id);
  return found?.name ?? "Básico";
}
