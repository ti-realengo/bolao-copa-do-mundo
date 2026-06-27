export const KNOCKOUT_STAGES: string[] = ["r32", "r16", "qf", "sf", "3rd", "final"];

export const KNOCKOUT_STAGES_SET = new Set<string>(KNOCKOUT_STAGES);

export const STAGE_LABELS: Record<string, string> = {
  group: "Fase de Grupos",
  r32: "16 Avos-de-final",
  r16: "Oitavas de final",
  qf: "Quartas de final",
  sf: "Semifinais",
  "3rd": "3º Lugar",
  final: "Final",
};

export function stageLabel(match: { stage: string; groupCode: string | null; round: number | null }): string {
  if (match.stage === "group") {
    return `Grupo ${match.groupCode ?? ""} • Rodada ${match.round ?? ""}`.trim();
  }
  return STAGE_LABELS[match.stage] ?? match.stage.toUpperCase();
}

export function isKnockoutStage(stage: string): boolean {
  return KNOCKOUT_STAGES_SET.has(stage);
}
