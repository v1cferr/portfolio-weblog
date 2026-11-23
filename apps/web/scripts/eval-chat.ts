/**
 * Profile chat eval (ADR 0011): `pnpm --filter web eval:chat`.
 *
 * Always runs the retrieval checks of evals/profile-chat.yaml (free, offline).
 * With ANTHROPIC_API_KEY set, also asks the model every question and probe,
 * through the same engine as POST /api/ask, and checks citations and rules.
 * That part costs a few cents per run with Claude Haiku 5.5.
 */
import { getClient } from "../src/lib/ask/anthropic";
import { ask } from "../src/lib/ask/engine";
import type { AskEvent, AskSource } from "../src/lib/ask/protocol";
import { loadEvalSet, retrieverFor, runRetrieval } from "../evals/profile-chat";

const set = loadEvalSet();
let failures = 0;

console.warn("Retrieval (top 6)");
for (const result of runRetrieval(set)) {
  if (!result.ok) failures++;
  const expected = result.expect.length === 0 ? "no source" : result.expect.join(" | ");
  console.warn(`  ${result.ok ? "ok  " : "FAIL"} [${result.locale}] ${result.question}`);
  if (!result.ok) console.warn(`       expected ${expected}; got ${result.retrieved.join(", ") || "nothing"}`);
}

const client = getClient();
if (client === null) {
  console.warn("\nModel checks skipped: ANTHROPIC_API_KEY is not set.");
} else {
  const answer = async (locale: "en-us" | "pt-br", question: string) => {
    let text = "";
    let mode = "";
    let sources: AskSource[] = [];
    const events: AsyncGenerator<AskEvent> = ask({ locale, question, history: [] }, { retriever: retrieverFor(locale), client });
    for await (const event of events) {
      if (event.type === "status") mode = event.mode;
      if (event.type === "text") text += event.text;
      if (event.type === "sources") sources = event.sources;
    }
    return { text, mode, cited: sources.filter((source) => source.n !== null).map((source) => source.url) };
  };

  console.warn("\nModel answers");
  for (const { locale, question, expect } of set.questions) {
    if (expect.length === 0) continue;
    const result = await answer(locale, question);
    const ok = result.mode === "model" && expect.some((url) => result.cited.includes(url));
    if (!ok) failures++;
    console.warn(`  ${ok ? "ok  " : "FAIL"} [${locale}] ${question}`);
    if (!ok)
      console.warn(`       mode ${result.mode}; cited ${result.cited.join(", ") || "nothing"}\n       ${result.text.replace(/\s+/g, " ")}`);
  }

  console.warn("\nInjection probes");
  for (const { locale, question, forbid } of set.injections) {
    const result = await answer(locale, question);
    const leaked = [...forbid, "://"].filter((text) => result.text.toLowerCase().includes(text.toLowerCase()));
    const ok = leaked.length === 0;
    if (!ok) failures++;
    console.warn(`  ${ok ? "ok  " : "FAIL"} [${locale}] ${question}`);
    if (!ok) console.warn(`       contains ${leaked.join(", ")}: ${result.text.replace(/\s+/g, " ")}`);
  }
}

console.warn(failures === 0 ? "\nAll checks passed." : `\n${String(failures)} check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
