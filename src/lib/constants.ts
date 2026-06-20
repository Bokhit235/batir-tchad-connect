export const CHAD_PROVINCES = [
  "Batha", "Borkou", "Chari-Baguirmi", "Ennedi-Est", "Ennedi-Ouest",
  "Guéra", "Hadjer-Lamis", "Kanem", "Lac", "Logone Occidental",
  "Logone Oriental", "Mandoul", "Mayo-Kebbi Est", "Mayo-Kebbi Ouest",
  "Moyen-Chari", "N'Djamena", "Ouaddaï", "Salamat", "Sila", "Tandjilé",
  "Tibesti", "Wadi Fira",
] as const;

export type ReportCategory = "route" | "pont" | "ecole" | "sante" | "eau" | "marche" | "autre";
export type ReportStatus = "signale" | "verifie" | "en_cours" | "resolu" | "rejete";
export type ReportSeverity = "vert" | "jaune" | "orange" | "rouge";

export const CATEGORIES: { value: ReportCategory; label: string; icon: string }[] = [
  { value: "route", label: "Route", icon: "🛣️" },
  { value: "pont", label: "Pont", icon: "🌉" },
  { value: "ecole", label: "École", icon: "🏫" },
  { value: "sante", label: "Centre de santé", icon: "🏥" },
  { value: "eau", label: "Eau", icon: "💧" },
  { value: "marche", label: "Marché", icon: "🏪" },
  { value: "autre", label: "Autre", icon: "📍" },
];

export const STATUSES: { value: ReportStatus; label: string; color: string }[] = [
  { value: "signale", label: "Signalé", color: "bg-muted text-muted-foreground" },
  { value: "verifie", label: "Vérifié", color: "bg-primary/15 text-primary" },
  { value: "en_cours", label: "En cours", color: "bg-[color:var(--color-severity-orange)]/20 text-[color:var(--color-severity-orange)]" },
  { value: "resolu", label: "Résolu", color: "bg-[color:var(--color-severity-vert)]/20 text-[color:var(--color-severity-vert)]" },
  { value: "rejete", label: "Rejeté", color: "bg-destructive/15 text-destructive" },
];

export const SEVERITIES: { value: ReportSeverity; label: string; hex: string }[] = [
  { value: "vert", label: "Faible", hex: "#22a861" },
  { value: "jaune", label: "Modéré", hex: "#FECB00" },
  { value: "orange", label: "Élevé", hex: "#FF6B1A" },
  { value: "rouge", label: "Critique", hex: "#C60C30" },
];

export function getCategory(v: string) {
  return CATEGORIES.find((c) => c.value === v) ?? CATEGORIES[CATEGORIES.length - 1];
}
export function getStatus(v: string) {
  return STATUSES.find((s) => s.value === v) ?? STATUSES[0];
}
export function getSeverity(v: string) {
  return SEVERITIES.find((s) => s.value === v) ?? SEVERITIES[1];
}

/** Auto-classify severity from category + keywords in description */
export function classifySeverity(category: ReportCategory, description: string): ReportSeverity {
  const d = description.toLowerCase();
  const critical = ["mort", "décès", "effondré", "effondrement", "danger immédiat", "urgence", "blessé", "inondé", "coupé"];
  const high = ["impraticable", "grave", "dangereux", "fermé", "cassé", "détruit", "rupture"];
  const moderate = ["dégradé", "abîmé", "fissure", "trou", "fuite", "panne"];

  if (critical.some((k) => d.includes(k))) return "rouge";
  if (high.some((k) => d.includes(k))) return "orange";
  if (moderate.some((k) => d.includes(k))) return "jaune";

  // Catégories à risque élevé par défaut
  if (category === "pont" || category === "sante") return "orange";
  return "jaune";
}
