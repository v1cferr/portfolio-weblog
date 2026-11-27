/**
 * Off-topic questions (ADR 0011, 2026-11-27): "what is the capital of
 * France?" has nothing to do with the owner or this site, so it gets a fixed
 * reply and the suggested questions, with no model call. Claude reads the
 * whole site, so every question that reaches it costs a full (if cached)
 * request; this keeps that for questions that could be about the owner.
 *
 * Deliberately conservative: a question is off topic only when the search
 * found nothing better than word noise (`NOISE_SCORE`, and no page keyword
 * such as a technology's name), it is the first of
 * the conversation (a follow-up like "and before that?" names nothing yet is
 * on topic), and it names neither the owner nor anything the site is about. "Who is Victor?", "tell me about
 * yourself" and "is he a good fit?" all name the owner and reach the model.
 */
import { fold } from "./small-talk";

/** Words that point at the owner: names, and "you/he/I" in the questions' languages (suggested questions say "my"). */
const OWNER =
  /\b(?:victor|v1c|v1cferr|ferreira|voce|voces|vc|ce|tu|te|teu|tua|teus|tuas|contigo|seu|sua|seus|suas|ele|dele|nele|eu|meu|minha|meus|minhas|mim|comigo|you|your|yours|yourself|he|him|his|himself|i|im|ive|id|my|mine|myself)\b/;

/** What the site is about, as word stems; any of them keeps the question for the model. */
const SITE =
  /\b(?:trabalh|carreir|cargo|emprego|empresa|experienc|projet|estud|formac|faculdad|curso|certific|habilidad|competenc|tecnolog|stack|ferrament|contrat|vaga|perfil|curricul|cv|portfolio|site|blog|weblog|post|artig|setup|tatuag|tattoo|wow|warcraft|linkedin|github|recomend|work|job|career|role|company|employ|experience|project|stud|educat|degree|course|certif|skill|technolog|tool|hire|hiring|recruit|resume|recommend|writ)\w*/;

/**
 * The best search score that is still word noise: a common word of the
 * question ("quanto", "like", "vai") found in some page scores about 4 to 7,
 * while a real match ("RAG", "tecnologias", "São Paulo") scores 10 or more.
 */
export const NOISE_SCORE = 8;

/** What the search found, as far as this check needs: the score, the matched terms and the page's keywords. */
interface Hit {
  score: number;
  terms: readonly string[];
  keywords: string;
}

/**
 * Whether a hit matched one of its page's keywords (technologies, tags,
 * organizations): "Nix" in "Como uso Nix?" is the site's topic even when it
 * scores like noise, while "quanto" or "like" never is a keyword.
 */
function matchesKeyword(hit: Hit): boolean {
  const keywords = new Set(fold(hit.keywords).split(" "));
  return hit.terms.some((term) => keywords.has(fold(term)));
}

/** Whether a first question the search found nothing real for is about anything but the owner and this site. */
export function isOffTopic(question: string, retrieved: readonly Hit[], historyLength: number): boolean {
  if (historyLength > 0) return false;
  if (retrieved.some((hit) => hit.score >= NOISE_SCORE || matchesKeyword(hit))) return false;
  const text = fold(question);
  if (text === "") return false;
  return !OWNER.test(text) && !SITE.test(text);
}

const REPLIES: Record<"pt-br" | "en-us", string> = {
  "pt-br":
    "Essa fica fora do que eu respondo aqui: só falo sobre mim e o meu trabalho, com base nas páginas deste site. Que tal uma destas perguntas?",
  "en-us":
    "That one is outside what I answer here: I only talk about me and my work, from this site's pages. How about one of these questions?",
};

/** The fixed off-topic reply; zh-cn pages fall back to English. */
export function offTopicReply(locale: string): string {
  return locale === "pt-br" ? REPLIES["pt-br"] : REPLIES["en-us"];
}
