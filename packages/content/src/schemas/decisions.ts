import { z } from "zod";

import { LocalizedText } from "./common";

/*
 * Plain-language summaries of the architecture decision records
 * (content/decisions.yaml). The records themselves live in docs/decisions/ and
 * are read as they are; this file only adds, per record, why the decision
 * matters to someone who does not write code.
 */

/** An ADR number as its file names it: four digits, "0006". */
export const DecisionNumber = z.string().regex(/^\d{4}$/, 'ADR numbers are four digits, as in the file name ("0006")');
export type DecisionNumber = z.infer<typeof DecisionNumber>;

/** Why a decision matters, in English and Portuguese at least: the list page shows it in both editorial locales. */
const Why = LocalizedText.refine(
  (value) => value["en-us"] !== undefined && value["pt-br"] !== undefined,
  "a summary needs en-us and pt-br"
);

export const DecisionSummary = z.strictObject({ why: Why });
export type DecisionSummary = z.infer<typeof DecisionSummary>;

/** content/decisions.yaml: one entry per ADR, keyed by its number. */
export const DecisionSummaries = z.record(DecisionNumber, DecisionSummary);
export type DecisionSummaries = z.infer<typeof DecisionSummaries>;
