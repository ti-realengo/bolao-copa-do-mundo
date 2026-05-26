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
};

export type BadgeCode = keyof typeof BADGES;
