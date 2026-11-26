import { contentWords, type RetrievedPassage } from "@workspace/search";
import { z } from "zod";

/**
 * Grounding enforced in code (ADR 0011): the model must answer in a fixed
 * JSON shape where every sentence names the numbered passages it comes from,
 * and the server keeps only the sentences that pass every check below. The
 * prompt asks for the same, but nothing here trusts it.
 */

export const MAX_SENTENCES = 8;
export const MAX_SENTENCE_LENGTH = 300;

/**
 * Share of a sentence's content words that must appear in the passages it
 * cites. Tuned with the `faithfulness` cases of apps/web/evals/profile-chat.yaml
 * (2026-11-23): grounded paraphrases score 0.88 and up, invented claims 0.38
 * and below; 0.6 leaves room on both sides. Re-checked on 2026-11-25 with
 * answers in the owner's first person: the same margins hold, since pronouns
 * are stop words and verbs meet across persons (`personVariants`).
 */
export const FAITHFULNESS_THRESHOLD = 0.6;

/** Sent as `response_format.json_schema.schema`. Lengths and counts are enforced here, not left to the provider. */
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
      description: `At most ${String(MAX_SENTENCES)} short sentences, each backed by the passages it cites.`,
      items: {
        type: "object",
        properties: {
          text: { type: "string", description: `One sentence, at most ${String(MAX_SENTENCE_LENGTH)} characters.` },
          sources: { type: "array", description: "Numbers of the passages this sentence comes from.", items: { type: "integer" } },
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

export interface GroundedSentence {
  text: string;
  /** 0-based indexes into the passages sent to the model. */
  passages: number[];
}

export type DropReason = "no-sources" | "bad-source" | "empty" | "unfaithful";

export interface GroundingResult {
  answerable: boolean;
  /** The model said the passages cover only part of the question. */
  incomplete: boolean;
  sentences: GroundedSentence[];
  dropped: DropReason[];
}

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

/** Removes links, URLs and Markdown the model may have written: sentences are plain text, links come from the source cards. */
export function plainText(text: string): string {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, " ")
    .replace(/\[\d+(?:\s*,\s*\d+)*\]/g, " ")
    .replace(/[*_`#>|]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
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

/** Share of the sentence's content words found in the passages (1 when it has none to check). */
export function faithfulness(sentence: string, passages: readonly Pick<RetrievedPassage, "title" | "text" | "keywords">[]): number {
  const words = contentWords(sentence);
  if (words.length === 0) return 1;
  const vocabulary = new Set(passages.flatMap((passage) => contentWords(`${passage.title} ${passage.keywords} ${passage.text}`)));
  const stems = new Set([...vocabulary].filter((word) => word.length >= 5).map((word) => word.slice(0, 5)));
  return words.filter((word) => matches(word, vocabulary, stems)).length / words.length;
}

/**
 * Keeps the sentences that cite at least one passage, cite only passages
 * that were sent (1..n), are plain text once links and Markdown are gone,
 * and stay close to the passages they cite.
 */
export function groundAnswer(content: string, passages: readonly RetrievedPassage[]): GroundingResult | null {
  const answer = parseModelAnswer(content);
  if (answer === null) return null;
  const dropped: DropReason[] = [];
  const sentences: GroundedSentence[] = [];
  for (const sentence of answer.sentences.slice(0, MAX_SENTENCES)) {
    if (sentence.sources.length === 0) {
      dropped.push("no-sources");
      continue;
    }
    if (sentence.sources.some((id) => !Number.isInteger(id) || id < 1 || id > passages.length)) {
      dropped.push("bad-source");
      continue;
    }
    const text = plainText(sentence.text).slice(0, MAX_SENTENCE_LENGTH);
    if (text.length < 2) {
      dropped.push("empty");
      continue;
    }
    const cited = [...new Set(sentence.sources)].map((id) => id - 1);
    const sources = cited.flatMap((index) => (passages[index] ? [passages[index]] : []));
    if (faithfulness(text, sources) < FAITHFULNESS_THRESHOLD) {
      dropped.push("unfaithful");
      continue;
    }
    sentences.push({ text, passages: cited });
  }
  return { answerable: answer.answerable, incomplete: answer.incomplete, sentences: answer.answerable ? sentences : [], dropped };
}
