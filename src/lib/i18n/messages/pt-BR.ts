export interface Messages {
  nav: { matches: string; specials: string; ranking: string; leagues: string; profile: string; logout: string };
  landing: {
    badge: string; titleLine1: string; titleLine2: string; titleLine3: string; description: string;
    enter: string; howItWorks: string;
    features: { predictionsTitle: string; predictionsDesc: string; rankingTitle: string; rankingDesc: string; specialsTitle: string; specialsDesc: string; remindersTitle: string; remindersDesc: string };
  };
  login: { title: string; description: string; emailPlaceholder: string; submit: string; submitting: string; genericMessage: string };
  home: {
    greeting: string; subtitle: string; nextMatch: string; yourPosition: string; achievements: string; topFive: string;
    yourLeagues: string; activity: string; predictions: string; points: string; exact: string; yourPrediction: string;
    notPredictedYet: string; seeRanking: string; badgesUnlocked: string; noLeagues: string; noNextMatch: string; rankingEmpty: string;
  };
  profile: { languagePref: string; save: string };
}

export const ptBR: Messages = {
  nav: {
    matches: "Jogos",
    specials: "Especiais",
    ranking: "Ranking",
    leagues: "Grupos",
    profile: "Perfil",
    logout: "Sair",
  },
  landing: {
    badge: "⚽ Copa 2026 · 48 seleções · 104 jogos",
    titleLine1: "O bolão da",
    titleLine2: "sua empresa,",
    titleLine3: "sem planilha.",
    description: "Login com email corporativo. Palpites com auto-save. Ranking ao vivo. Grupos privados. Tudo gratuito, open-source e self-hosted no Cloudflare.",
    enter: "Entrar",
    howItWorks: "Como funciona",
    features: {
      predictionsTitle: "🔮 Palpites",
      predictionsDesc: "Placares + classificação no mata-mata",
      rankingTitle: "🏆 Ranking",
      rankingDesc: "Top geral + grupos privados",
      specialsTitle: "🎯 Especiais",
      specialsDesc: "Campeão, artilheiro, surpresa",
      remindersTitle: "💌 Lembretes",
      remindersDesc: "Email antes dos jogos",
    },
  },
  login: {
    title: "Acessar com email da empresa",
    description: "Enviaremos um link mágico válido por 15 minutos.",
    emailPlaceholder: "seu.email@empresa.com.br",
    submit: "Receber link de acesso",
    submitting: "Enviando…",
    genericMessage: "Se este email puder acessar, enviamos um link. Confira sua caixa de entrada.",
  },
  home: {
    greeting: "Olá",
    subtitle: "Sua central do bolão.",
    nextMatch: "Próximo jogo",
    yourPosition: "Sua posição",
    achievements: "Conquistas",
    topFive: "Top 5 geral",
    yourLeagues: "Seus grupos",
    activity: "Atividade",
    predictions: "Palpites",
    points: "Pontos",
    exact: "Cravadas",
    yourPrediction: "Seu palpite",
    notPredictedYet: "Você ainda não palpitou →",
    seeRanking: "Ver ranking →",
    badgesUnlocked: "{owned} de {total} desbloqueadas",
    noLeagues: "Crie ou entre num grupo pra disputar com colegas próximos.",
    noNextMatch: "Nenhum jogo programado.",
    rankingEmpty: "Aparece quando o primeiro jogo terminar.",
  },
  profile: {
    languagePref: "Idioma",
    save: "Salvar",
  },
};
