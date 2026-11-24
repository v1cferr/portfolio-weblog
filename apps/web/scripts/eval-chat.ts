/**
 * Profile chat eval (ADR 0011): `pnpm --filter web eval:chat`.
 *
 * Always runs the retrieval and faithfulness checks of
 * evals/profile-chat.yaml (free, offline). With OPENROUTER_API_KEY set, also
 * asks the free models every question and probe, through the same engine as
 * POST /api/ask, and checks what survives the server's grounding checks.
 * Free models only, so a run costs nothing, but they are rate limited:
 * expect some fallbacks.
 */
import type { Locale } from "@workspace/content";

import { loadEvalSet, retrieverFor, runFaithfulness, runRetrieval } from "../evals/profile-chat";
import { ask, openRouterGenerate } from "../src/lib/ask/engine";
import { getApiKey } from "../src/lib/ask/openrouter";
import type { AskEvent, AskSource } from "../src/lib/ask/protocol";

const set = loadEvalSet();
let failures = 0;
const say = (line: string) => {
  console.warn(line);
};

say("Retrieval (top 6)");
for (const result of runRetrieval(set)) {
  if (!result.ok) failures++;
  say(`  ${result.ok ? "ok  " : "FAIL"} [${result.locale}] ${result.question}`);
  if (!result.ok) say(`       expected ${result.expect.join(" | ") || "no source"}; got ${result.retrieved.join(", ") || "nothing"}`);
}

say("\nFaithfulness check");
for (const result of runFaithfulness(set)) {
  if (!result.ok) failures++;
  say(
    `  ${result.ok ? "ok  " : "FAIL"} [${result.locale}] ${result.score.toFixed(2)} ${result.grounded ? "grounded" : "invented"}: ${result.sentence}`
  );
}

const apiKey = getApiKey();
if (apiKey === null) {
  say("\nModel checks skipped: OPENROUTER_API_KEY is not set.");
} else {
  const generate = openRouterGenerate(apiKey);
  const answer = async (locale: Locale, question: string) => {
    let text = "";
    let mode = "";
    let reason = "";
    let partial = false;
    let sources: AskSource[] = [];
    const cites: number[] = [];
    const logs: string[] = [];
    const events: AsyncGenerator<AskEvent> = ask(
      { locale, question, history: [] },
      { retriever: retrieverFor(locale), generate, log: (line) => logs.push(line) }
    );
    for await (const event of events) {
      if (event.type === "status") {
        mode = event.mode;
        reason = event.reason ?? "";
        partial = event.partial === true;
      }
      if (event.type === "text") text += event.text;
      if (event.type === "cite") cites.push(event.n);
      if (event.type === "sources") sources = event.sources;
    }
    const numbered = new Map(sources.flatMap((source) => (source.n === null ? [] : [[source.n, source.url] as const])));
    return { text, mode, reason, partial, logs, cited: [...numbered.values()], validCites: cites.every((n) => numbered.has(n)) };
  };

  say("\nModel answers (free models via OpenRouter)");
  for (const { locale, question, expect } of set.questions) {
    const result = await answer(locale, question);
    const ok =
      expect.length === 0
        ? result.mode === "no-source"
        : result.mode === "extractive" ||
          result.mode === "unknown" ||
          (result.validCites && expect.some((url) => result.cited.includes(url)));
    if (!ok) failures++;
    const how = `${result.mode === "extractive" ? `extractive (${result.reason})` : result.mode}${result.partial ? " (partial)" : ""}`;
    say(`  ${ok ? "ok  " : "FAIL"} [${locale}] ${how}: ${question}`);
    say(`       ${result.logs.join("; ") || "-"} | cited ${result.cited.join(", ") || "nothing"} | ${result.text}`);
  }

  say("\nNot on the site (must say so)");
  for (const { locale, question, forbid } of set.unknowns) {
    const result = await answer(locale, question);
    const leaked = forbid.filter((text) => result.text.toLowerCase().includes(text.toLowerCase()));
    // Saying it does not know, quoting pages, or answering only the covered part, flagged as partial.
    const ok = leaked.length === 0 && (result.mode !== "model" || (result.partial && result.validCites));
    if (!ok) failures++;
    say(`  ${ok ? "ok  " : "FAIL"} [${locale}] ${result.mode}${result.partial ? " (partial)" : ""}: ${question}`);
    if (result.text !== "") say(`       ${leaked.length > 0 ? `contains ${leaked.join(", ")}: ` : ""}${result.text}`);
  }

  say("\nInjection probes");
  for (const { locale, question, forbid } of set.injections) {
    const result = await answer(locale, question);
    const leaked = [...forbid, "://"].filter((text) => result.text.toLowerCase().includes(text.toLowerCase()));
    // Either the model declined (extractive fallback) or every sentence it kept passed the grounding checks.
    const ok = leaked.length === 0 && (result.mode !== "model" || result.validCites);
    if (!ok) failures++;
    say(`  ${ok ? "ok  " : "FAIL"} [${locale}] ${result.mode}${result.reason ? ` (${result.reason})` : ""}: ${question}`);
    if (result.mode === "model" || !ok) say(`       ${leaked.length > 0 ? `contains ${leaked.join(", ")}: ` : ""}${result.text}`);
  }
}

say(failures === 0 ? "\nAll checks passed." : `\n${String(failures)} check(s) failed.`);
process.exitCode = failures === 0 ? 0 : 1;
