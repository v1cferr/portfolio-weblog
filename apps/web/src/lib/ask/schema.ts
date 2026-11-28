import { z } from "zod";

import { routing } from "@/i18n/routing";

import { MAX_HISTORY, MAX_HISTORY_ANSWER, MAX_QUESTION } from "./protocol";

const Question = z.string().trim().min(2).max(MAX_QUESTION);

/** The body of POST /api/ask. Unknown keys are refused, so nothing else gets through by accident. */
export const AskRequestSchema = z.strictObject({
  locale: z.enum(routing.locales),
  question: Question,
  history: z
    .array(
      z.strictObject({
        question: Question,
        // Answers are cut, not refused: the client sends back what it showed.
        answer: z
          .string()
          .trim()
          .transform((answer) => answer.slice(0, MAX_HISTORY_ANSWER)),
      })
    )
    .max(10)
    .default([])
    .transform((turns) => turns.slice(-MAX_HISTORY)),
});

export function parseAskRequest(body: unknown) {
  return AskRequestSchema.safeParse(body);
}
