export interface BadgeDef {
  code: string;
  emoji: string;
  name: string;
  description: string;
}

export const BADGES: Record<string, BadgeDef> = {
  tarologo: {
    code: "tarologo",
    emoji: "🔮",
    name: "Tarólogo",
    description: "5 placares exatos",
  },
  madrugador: {
    code: "madrugador",
    emoji: "🐓",
    name: "Madrugador",
    description: "Primeiro a palpitar em uma rodada",
  },
  cravou: {
    code: "cravou",
    emoji: "🎯",
    name: "Cravou",
    description: "Placar exato em jogo do Brasil",
  },
  zica: {
    code: "zica",
    emoji: "💀",
    name: "Zica",
    description: "Errou todos os palpites de uma rodada",
  },
  sequencia_quente: {
    code: "sequencia_quente",
    emoji: "🔥",
    name: "Sequência Quente",
    description: "5 acertos seguidos de vencedor",
  },
  profeta: {
    code: "profeta",
    emoji: "⭐",
    name: "Profeta",
    description: "Acertou o campeão do torneio",
  },
  lider: {
    code: "lider",
    emoji: "👑",
    name: "Líder",
    description: "Alcançou o 1º lugar no ranking",
  },
  conector: {
    code: "conector",
    emoji: "🤝",
    name: "Conector",
    description: "Criou um grupo com 10+ membros",
  },
};

export type BadgeCode = keyof typeof BADGES;
