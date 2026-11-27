import { contentWords, normalizeTerm, type RetrievedPassage } from "@workspace/search";
import { z } from "zod";

/**
 * Grounding enforced in code (ADR 0011). Whatever writes the answer (Claude
 * with the Citations API, or a free OpenRouter model in a JSON shape), the
 * server splits it into sentences and checks each one before the visitor sees
 * it. Nothing here trusts the prompt.
 *
 * - A sentence that cites passages must stay close to them (faithfulness).
 * - A sentence that cites nothing (a connective, a summary, an offer to say
 *   more, "the site doesn't say") passes only when it adds no new fact: every
 *   number, URL, capitalized term and name in it already appears in the
 *   question, the conversation or the passages, and its content words do too.
 * - A sentence that fails is dropped, and the answer is marked partial.
 */

/** Sentences per answer, and characters, before the rest is cut (and the answer marked partial). */
export const MAX_SENTENCES = 12;
export const MAX_ANSWER_LENGTH = 1200;
/** Longest single sentence kept. */
export const MAX_SENTENCE_LENGTH = 400;

/**
 * Share of a sentence's content words that must appear in the passages it
 * cites (or, for an uncited sentence, in any passage or the conversation).
 * Tuned with the `faithfulness` cases of apps/web/evals/profile-chat.yaml
 * (2026-11-23): grounded paraphrases score 0.88 and up, invented claims 0.38
 * and below; 0.6 leaves room on both sides. Re-checked on 2026-11-25 with
 * answers in the owner's first person, and on 2026-11-26 with conversational
 * answers (connectives ignored, uncited cases added): the same margins hold.
 */
export const FAITHFULNESS_THRESHOLD = 0.6;

const NO_WORDS: ReadonlySet<string> = new Set();

/**
 * Conversational words that carry no fact about the owner ("happy to tell you
 * more", "posso contar mais"): not counted by the faithfulness check, so a
 * connective sentence is judged by what it claims, not by how it is phrased.
 * Accent-folded, as contentWords returns them.
 */
export const CONNECTIVES: ReadonlySet<string> = new Set(
  (
    "sure happy glad here there what about tell telling share know knowing more details detail question questions ask asking " +
    "help like want would could can also yes well great good short summary summarize overall basically mainly mostly " +
    "pages page site says say said mention mentions mentioned covers cover cited source sources answer something anything " +
    "else other thing things specific specifically information info find found read let feel free version quick brief " +
    "overview example examples list below above following main key points highlights doesn don isn aren didn wasn won " +
    "not unfortunately sorry though however instead which where when who how why work works job day include includes " +
    "including involve involves practice these those this that only background instructions rules " +
    "claro certo posso pode quer queria gostaria saber mais detalhe detalhes pergunta perguntas perguntar contar conto falar " +
    "ajudar ajudo feliz aqui resumo resumindo basicamente principalmente paginas pagina site diz dizem menciona mencionam " +
    "fala falam cita fonte fontes resposta algo outra outro outras outros coisa coisas especifico especifica informacao " +
    "informacoes encontrei encontrar leia fique vontade tambem sim bem otimo boa bom versao rapido rapida breve exemplo " +
    "exemplos lista abaixo acima seguir principais pontos destaques nao infelizmente desculpe porem entanto trabalho " +
    "trabalhos dia inclui incluem incluindo envolve envolvem pratica quiser querer desses dessas desse dessa algum " +
    "alguma alguns algumas"
  ).split(/\s+/)
);

/** Sent as `response_format.json_schema.schema` on the OpenRouter fallback. Lengths and counts are enforced here, not left to the provider. */
export const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    answerable: { type: "boolean", description: "False when the passages do not answer the question at all." },
    incomplete: {
      type: "boolean",
      description: "True when the passages answer only part of the question: the sentences cover that part, and the rest is left out.",
    },
    sentences: {
      type: "array",
      description: `At most ${String(MAX_SENTENCES)} sentences. Facts cite the passages they come from; a connective sentence with no new fact may cite none.`,
      items: {
        type: "object",
        properties: {
          text: { type: "string", description: "One sentence, or one list item, in light Markdown." },
          sources: { type: "array", description: "Numbers of the passages this sentence's facts come from.", items: { type: "integer" } },
        },
        required: ["text", "sources"],
        additionalProperties: false,
      },
    },
  },
  required: ["answerable", "incomplete", "sentences"],
  additionalProperties: false,
} as const;

const ModelAnswer = z.object({
  answerable: z.boolean(),
  // Free models sometimes leave it out; missing means complete.
  incomplete: z.boolean().default(false),
  sentences: z.array(z.object({ text: z.string(), sources: z.array(z.number()) })),
});

/** Parses the model's message, tolerating a ```json fence around it. Null when it is not the expected shape. */
export function parseModelAnswer(content: string): z.infer<typeof ModelAnswer> | null {
  const text = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    const parsed = ModelAnswer.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * The Markdown the visitor may see: emphasis, lists and inline code stay;
 * links lose their target (the source cards link to pages), images, raw HTML
 * tags and bracketed numbers go, since citations come from the server alone.
 */
export function sanitizeMarkdown(text: string): string {
  let markdown = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Until nothing changes: removing one tag can join the pieces of another ("<scr<b>ipt>").
  let previous: string;
  do {
    previous = markdown;
    markdown = markdown.replace(/<\/?[a-z][a-z0-9-]*(?:\s[^<>]*)?\/?>/gi, "");
  } while (markdown !== previous);
  // Whatever "<" is left cannot open a tag: a space after it keeps "a < b" and breaks "<script".
  return markdown.replace(/<(?=[a-z/!?])/gi, "< ").replace(/\[\d+(?:\s*,\s*\d+)*\]/g, "");
}

/**
 * The sentence as plain text, for the checks: Markdown marks and list bullets
 * removed without touching what they surround, so `C#`, `snake_case`,
 * `a < b` and `x * y` survive.
 */
export function plainText(text: string): string {
  return sanitizeMarkdown(text)
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, "$2")
    .replace(/(^|[\s(])([*_])(?=\S)([^*_\n]*?\S)\2(?=[\s).,;:!?]|$)/g, "$1$3")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const URL_PATTERN = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:com|dev|io|br|org|net|ai|app|me)\b(?:\/\S*)?/i;

/**
 * Whether dropping a sentence for `reason` lost a claim, which makes the
 * answer partial: anything that cited a passage, or named a fact or a link.
 * An uncited sentence dropped only for its wording (a connective the check
 * did not recognize) or for being empty lost nothing the visitor asked for.
 */
export function isClaim(reason: DropReason, cited: readonly number[]): boolean {
  return cited.length > 0 || reason === "new-fact" || reason === "url" || reason === "bad-source";
}

/** Whether a sentence carries a URL or a domain: the model never links, the source cards do. */
export function hasUrl(text: string): boolean {
  return URL_PATTERN.test(text);
}

/**
 * The facts a sentence names that `corpus` (the question, the conversation
 * and the passages) does not: numbers and dates, and capitalized or technical
 * terms (proper names, products, "C#", "Node.js"). A word that only starts a
 * sentence or a list item is not a name. Matching is accent- and
 * case-insensitive, on the corpus as one text.
 */
export function newFacts(sentence: string, corpus: string): string[] {
  const haystack = normalizeTerm(corpus);
  const text = plainText(sentence);
  const facts = new Set<string>();
  for (const number of text.match(/\d+(?:[.,:/-]\d+)*/g) ?? []) if (!haystack.includes(normalizeTerm(number))) facts.add(number);
  const tokens = text.split(/\s+/);
  tokens.forEach((raw, index) => {
    const word = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}#+]+$/gu, "");
    if (word === "" || /^\d/.test(word)) return;
    const startsSentence = index === 0 || /[.!?:…]["')\]]*$/.test(tokens[index - 1] ?? "");
    const technical = /[#+]|\p{L}\.\p{L}|\p{Ll}\p{Lu}|\p{L}\d|\d\p{L}/u.test(word);
    const capitalized = /^\p{Lu}/u.test(word);
    // "I", "I'm", "I'd", "I've", "I'll": the speaker, not a name.
    const pronoun = /^I(?:['’](?:m|d|ve|ll))?$/.test(word);
    if (!technical && (!capitalized || startsSentence || pronoun)) return;
    if (!haystack.includes(normalizeTerm(word))) facts.add(word);
  });
  return [...facts];
}

export type DropReason = "no-sources" | "bad-source" | "empty" | "url" | "new-fact" | "unfaithful";

/** What a sentence is checked against: the passages sent, and the visitor's words (question and conversation). */
export interface Corpus {
  passages: readonly RetrievedPassage[];
  /** The question and the earlier turns, as plain text. */
  conversation: string;
}

export type SentenceCheck = { ok: true; text: string } | { ok: false; reason: DropReason };

/**
 * Checks one sentence of an answer. `cited` are 0-based indexes into the
 * passages. Cited sentences must stay close to what they cite; uncited ones
 * must add no new fact. Both may name only facts the corpus already has. The
 * text returned is the sanitized Markdown, ready to send.
 */
export function checkSentence(text: string, cited: readonly number[], corpus: Corpus): SentenceCheck {
  const markdown = sanitizeMarkdown(text);
  const plain = plainText(markdown);
  if (!/[\p{L}\p{N}]/u.test(plain) || plain.length > MAX_SENTENCE_LENGTH) return { ok: false, reason: "empty" };
  if (cited.some((index) => !Number.isInteger(index) || index < 0 || index >= corpus.passages.length))
    return { ok: false, reason: "bad-source" };
  if (hasUrl(plain)) return { ok: false, reason: "url" };
  const everything = `${corpus.conversation}\n${corpus.passages.map((passage) => `${passage.title} ${passage.keywords} ${passage.text}`).join("\n")}`;
  if (newFacts(plain, everything).length > 0) return { ok: false, reason: "new-fact" };
  const against =
    cited.length > 0
      ? [...new Set(cited)].flatMap((index) => corpus.passages[index] ?? [])
      : [...corpus.passages, { title: "", keywords: "", text: corpus.conversation }];
  if (faithfulness(plain, against, CONNECTIVES) < FAITHFULNESS_THRESHOLD) return { ok: false, reason: "unfaithful" };
  return { ok: true, text: markdown };
}

/** A piece of the model's answer and the passages it cites (0-based). */
export interface Segment {
  text: string;
  cited: readonly number[];
}

/** One sentence (or list item) of the answer, with every passage its pieces cite. */
export interface PendingSentence {
  text: string;
  cited: number[];
}

/** After a sentence end (with closing quotes or brackets) and its spaces, or after a line break. */
const BOUNDARY = /[.!?…]+["'”’)\]]*[ \t]+|\n+/g;

/**
 * Turns streamed pieces of an answer into whole sentences, so each can be
 * checked before it is sent. Pieces arrive as Claude's text blocks (a cited
 * block is usually a clause); a sentence takes the citations of every piece
 * it overlaps. `drain` returns the sentences that are complete so far, and,
 * at the end, the rest.
 */
export class SentenceBuffer {
  private text = "";
  private spans: { start: number; end: number; cited: readonly number[] }[] = [];

  push(segment: Segment) {
    const start = this.text.length;
    this.text += segment.text;
    if (segment.cited.length > 0) this.spans.push({ start, end: this.text.length, cited: segment.cited });
  }

  drain(final = false): PendingSentence[] {
    const cuts: number[] = [];
    for (const match of this.text.matchAll(BOUNDARY)) cuts.push(match.index + match[0].length);
    if (final && (cuts.at(-1) ?? 0) < this.text.length) cuts.push(this.text.length);
    const sentences: PendingSentence[] = [];
    let from = 0;
    for (const to of cuts) {
      const text = this.text.slice(from, to);
      const cited = [...new Set(this.spans.filter((span) => span.start < to && span.end > from).flatMap((span) => span.cited))];
      if (text.trim() !== "" || cited.length > 0) sentences.push({ text, cited });
      from = to;
    }
    this.text = this.text.slice(from);
    this.spans = this.spans
      .filter((span) => span.end > from)
      .map((span) => ({ ...span, start: Math.max(0, span.start - from), end: span.end - from }));
    return sentences;
  }
}

/**
 * The same verb in the other grammatical person (ADR 0011, 2026-11-25
 * revision): answers speak as the owner ("I work", "uso", "dei"), while a
 * passage may say it either way ("works", "usa", "deu"). Only endings change,
 * so a variant never brings in a fact the word did not carry. Short words need
 * it most: longer ones already meet through the 5-letter stem.
 */
export function personVariants(word: string): string[] {
  const variants = [`${word}s`, `${word}es`];
  if (word.endsWith("s")) variants.push(word.slice(0, -1));
  if (word.endsWith("es")) variants.push(word.slice(0, -2));
  if (word.endsWith("y")) variants.push(`${word.slice(0, -1)}ies`);
  if (word.endsWith("ies")) variants.push(`${word.slice(0, -3)}y`);
  // Portuguese present ("uso"/"usa", "escrevo"/"escreve") and preterite ("dei"/"deu", "automatizei"/"automatizou", "construi"/"construiu").
  if (word.endsWith("o")) variants.push(`${word.slice(0, -1)}a`, `${word.slice(0, -1)}e`);
  if (word.endsWith("a") || word.endsWith("e")) variants.push(`${word.slice(0, -1)}o`);
  if (word.endsWith("ei")) variants.push(`${word.slice(0, -2)}ou`, `${word.slice(0, -1)}u`);
  if (word.endsWith("ou")) variants.push(`${word.slice(0, -2)}ei`);
  if (word.endsWith("eu")) variants.push(`${word.slice(0, -1)}i`);
  if (word.endsWith("i")) variants.push(`${word}u`);
  if (word.endsWith("iu")) variants.push(word.slice(0, -1));
  return variants;
}

/** Two words match when equal, or when they share a 5-letter stem ("build" and "built" do not; "projeto" and "projetos" do). */
function matchesForm(word: string, vocabulary: Set<string>, stems: Set<string>): boolean {
  return vocabulary.has(word) || (word.length >= 5 && stems.has(word.slice(0, 5)));
}

/** A word matches in its own form or in another grammatical person (`personVariants`). */
function matches(word: string, vocabulary: Set<string>, stems: Set<string>): boolean {
  return matchesForm(word, vocabulary, stems) || personVariants(word).some((variant) => matchesForm(variant, vocabulary, stems));
}

/**
 * Share of the sentence's content words found in the passages (1 when it has
 * none to check). Words in `ignore` (conversational connectives) are not
 * counted.
 */
export function faithfulness(
  sentence: string,
  passages: readonly Pick<RetrievedPassage, "title" | "text" | "keywords">[],
  ignore: ReadonlySet<string> = NO_WORDS
): number {
  const words = contentWords(sentence).filter((word) => !ignore.has(word));
  if (words.length === 0) return 1;
  const vocabulary = new Set(passages.flatMap((passage) => contentWords(`${passage.title} ${passage.keywords} ${passage.text}`)));
  const stems = new Set([...vocabulary].filter((word) => word.length >= 5).map((word) => word.slice(0, 5)));
  return words.filter((word) => matches(word, vocabulary, stems)).length / words.length;
}

export interface GroundedSentence {
  /** Sanitized Markdown. */
  text: string;
  /** 0-based indexes into the passages sent to the model. */
  passages: number[];
}

export interface GroundingResult {
  answerable: boolean;
  /** The model said the passages cover only part of the question. */
  incomplete: boolean;
  sentences: GroundedSentence[];
  dropped: DropReason[];
  /** A dropped sentence was a claim (`isClaim`), so the answer is partial. */
  claimDropped: boolean;
}

/**
 * The OpenRouter fallback's JSON answer, checked sentence by sentence
 * (`checkSentence`). Source numbers are 1-based in the schema. Null when the
 * reply is not the expected shape.
 */
export function groundAnswer(content: string, corpus: Corpus): GroundingResult | null {
  const answer = parseModelAnswer(content);
  if (answer === null) return null;
  const dropped: DropReason[] = [];
  const sentences: GroundedSentence[] = [];
  let claimDropped = false;
  for (const sentence of answer.sentences.slice(0, MAX_SENTENCES)) {
    const cited = [...new Set(sentence.sources)].map((id) => id - 1);
    const check = checkSentence(sentence.text, cited, corpus);
    if (!check.ok) {
      dropped.push(check.reason);
      claimDropped ||= isClaim(check.reason, cited);
      continue;
    }
    sentences.push({ text: check.text.trim(), passages: cited });
  }
  return {
    answerable: answer.answerable,
    incomplete: answer.incomplete,
    sentences: answer.answerable ? sentences : [],
    dropped,
    claimDropped,
  };
}
