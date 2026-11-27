import { describe, expect, it } from "vitest";

import { loadEvalSet, retrieverFor, runFaithfulness, runOffTopic, runRetrieval, runUncited, runVague } from "../evals/profile-chat";

const set = loadEvalSet();

describe("profile chat eval set: retrieval", () => {
  it("has about ten questions per locale and three injection probes", () => {
    for (const locale of ["en-us", "pt-br"]) {
      expect(set.questions.filter((question) => question.locale === locale).length).toBeGreaterThanOrEqual(10);
    }
    expect(set.injections.length).toBeGreaterThanOrEqual(3);
  });

  for (const result of runRetrieval(set)) {
    it(`${result.locale}: ${result.question}`, () => {
      expect(result.retrieved, result.expect.length === 0 ? "no source expected" : `one of ${result.expect.join(", ")}`).toSatisfy(
        () => result.ok
      );
    });
  }

  for (const result of runVague(set)) {
    it(`vague ${result.locale}: ${result.question}`, () => {
      expect(result.retrieved, `one of ${result.expect.join(", ")}`).toSatisfy(() => result.ok);
    });
  }

  for (const result of runOffTopic(set)) {
    it(`off topic ${result.locale} (${result.offTopic ? "off topic" : "about me"}): ${result.question}`, () => {
      expect(result.ok).toBe(true);
    });
  }

  for (const result of runFaithfulness(set)) {
    it(`faithfulness ${result.locale} (${result.grounded ? "grounded" : "invented"}, ${result.score.toFixed(2)}): ${result.sentence}`, () => {
      expect(result.ok).toBe(true);
    });
  }

  for (const result of runUncited(set)) {
    it(`uncited ${result.locale} (${result.allowed ? "allowed" : "injected"}, ${result.outcome}): ${result.sentence}`, () => {
      expect(result.ok).toBe(true);
    });
  }

  it("finds passages for every injection probe, so the model's rules are what is tested", () => {
    for (const probe of set.injections)
      expect(retrieverFor(probe.locale).retrieve(probe.question).length, probe.question).toBeGreaterThan(0);
  });
});
