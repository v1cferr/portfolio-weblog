/**
 * Small talk (ADR 0011): a greeting, a thanks, a goodbye or "what can you
 * do?" needs no search and no model. It gets a fixed reply in the owner's
 * voice, from this list only, and the panel shows the suggested questions
 * under it. Anything longer or with a real question in it goes the usual way.
 */

export type SmallTalk = "greeting" | "thanks" | "goodbye" | "capabilities";

/** Accent-folded, lower case, without punctuation and emoji. */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NAME = "(?: victor| v1c| v1cferr)?";

const PATTERNS: [SmallTalk, RegExp][] = [
  [
    "greeting",
    new RegExp(
      `^(?:oi+|ola|opa|e ai|eai|salve|hey+|hi+|hello|yo|bom dia|boa tarde|boa noite|good (?:morning|afternoon|evening)|tudo bem|tudo bom|how are you|whats up|sup)${NAME}(?: tudo bem| tudo bom| how are you)?$`
    ),
  ],
  [
    "thanks",
    new RegExp(
      `^(?:(?:muito )?obrigad[oa](?: mesmo)?|valeu|vlw|brigad[oa]|thanks?(?: a lot| so much)?|thank you(?: so much| very much)?|thx|ty)${NAME}$`
    ),
  ],
  ["goodbye", new RegExp(`^(?:tchau|ate mais|ate logo|falou|flw|bye|goodbye|see you|see ya|cya)${NAME}$`)],
  [
    "capabilities",
    /^(?:o que (?:voce|vc) (?:pode fazer|sabe fazer|consegue fazer|responde)|como (?:voce|vc) funciona|como funciona(?: isso| esse chat)?|quem (?:e|eh) (?:voce|vc)|what can you do|what do you know|how does this (?:work|chat work)|how do you work|who are you|help|ajuda)$/,
  ],
];

/** The small-talk intent of a message, or null when it is a real question. */
export function smallTalk(question: string): SmallTalk | null {
  const text = fold(question);
  if (text.split(" ").length > 6) return null;
  return PATTERNS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

const REPLIES: Record<"pt-br" | "en-us", Record<SmallTalk, string>> = {
  "pt-br": {
    greeting: "Oi! Aqui eu respondo sobre o meu trabalho, com base nas páginas deste site. O que você quer saber?",
    thanks: "De nada! Se quiser saber mais alguma coisa sobre o meu trabalho, é só perguntar.",
    goodbye: "Até mais! Obrigado pela visita.",
    capabilities:
      "Respondo perguntas sobre o meu trabalho: cargos, projetos, estudos e o que escrevo no weblog. Tudo vem das páginas deste site, com links para elas, e quando o site não diz, eu digo que não sei.",
  },
  "en-us": {
    greeting: "Hi! I answer questions about my work here, from this site's pages. What would you like to know?",
    thanks: "You're welcome! If there's anything else about my work, just ask.",
    goodbye: "Bye! Thanks for stopping by.",
    capabilities:
      "I answer questions about my work: roles, projects, studies and what I write in the weblog. Everything comes from this site's pages, with links to them, and when the site doesn't say, I say I don't know.",
  },
};

/** The fixed reply for an intent; zh-cn pages fall back to English. */
export function smallTalkReply(locale: string, intent: SmallTalk): string {
  return (locale === "pt-br" ? REPLIES["pt-br"] : REPLIES["en-us"])[intent];
}

/** "Tell me more about X": a one-tap follow-up for each related page under an answer. */
export function moreAbout(locale: string, title: string): string {
  return locale === "pt-br" ? `Me conta mais sobre ${title}` : `Tell me more about ${title}`;
}
