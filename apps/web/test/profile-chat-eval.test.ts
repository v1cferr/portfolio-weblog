import { describe, expect, it } from "vitest";

import {
  loadEvalSet,
  retrieverFor,
  runFaithfulness,
  runOffTopic,
  runRetrieval,
  runUncited,
  runVague,
  wordingIssues,
} from "../evals/profile-chat";

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

describe("profile chat eval: wording checks", () => {
  it("flags a role said twice and a past role in the present tense", () => {
    expect(
      wordingIssues("Sou Analista de Sistemas de IA. Trabalho como Analista de Sistemas de IA na FAI·UFSCar desde agosto de 2026.", "pt-br")
    ).toContain('repeats "Analista de Sistemas de IA"');
    expect(wordingIssues("Antes disso, trabalho como Estagiário de desenvolvimento front-end na Xmart Solutions.", "pt-br")).toContain(
      'present tense for past "Estagiário de desenvolvimento front-end"'
    );
  });

  it("does not count a title inside a longer one as a repeat", () => {
    expect(
      wordingIssues(
        "Before that, I was an AI software developer intern from March 2026 to July 2026, and then an AI software developer there from July 2026 to August 2026.",
        "en-us"
      )
    ).toEqual([]);
  });

  it("passes a natural answer", () => {
    expect(
      wordingIssues(
        "Sou Analista de Sistemas de IA na FAI·UFSCar desde agosto de 2026. Antes, fui Estagiário de desenvolvimento front-end na Xmart Solutions.",
        "pt-br"
      )
    ).toEqual([]);
  });
});
