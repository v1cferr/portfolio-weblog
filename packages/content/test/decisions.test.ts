import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { ContentValidationError, findContentRoot, loadDecisions, loadDecisionsContent, parseDecision } from "../src";
import { makeContent } from "./fixture";

const why = (n: string) => ({ why: { "en-us": `Why ${n}`, "pt-br": `Por que ${n}` } });

/**
 * A content root with docs/decisions/ next to it, under a parent of its own:
 * makeContent's roots all sit in the same tmp folder, so their siblings would be shared.
 */
function isolated(records: Record<string, string> | undefined, summaries: Record<string, unknown>): string {
  const parent = makeContent({});
  const root = path.join(parent, "content");
  mkdirSync(root);
  writeFileSync(path.join(root, "decisions.yaml"), JSON.stringify(summaries));
  if (records === undefined) return root;
  const dir = path.join(parent, "docs", "decisions");
  mkdirSync(dir, { recursive: true });
  for (const [name, text] of Object.entries(records)) writeFileSync(path.join(dir, name), text);
  return root;
}

const SIMPLE = "# 0001. Content first\n\n- Status: accepted (2026-10-09)\n- Jira: PWL-1\n\n## Context\n\nText.\n";

describe("parseDecision", () => {
  it("reads number, title, status, date and body", () => {
    const { decision, issues } = parseDecision("0001-content-first.md", SIMPLE);
    expect(issues).toEqual([]);
    expect(decision).toMatchObject({
      number: "0001",
      slug: "0001-content-first",
      file: "docs/decisions/0001-content-first.md",
      title: "Content first",
      status: "accepted",
      date: "2026-10-09",
      supersededBy: [],
      partlySuperseded: false,
      revisions: [],
    });
    expect(decision?.body.startsWith("- Status: accepted")).toBe(true);
    expect(decision?.body).not.toContain("# 0001.");
  });

  it("follows a status line that wraps, with a note and a partial supersession", () => {
    const text =
      "# 0004. Old integrations\n\n- Status: accepted (2026-10-09, decided with the owner); partly superseded by\n  [0008](0008-spotify.md) for Spotify and by\n  [0015](0015-wow.md) for the WoW page\n- Jira: PWL-98\n";
    const { decision } = parseDecision("0004-old-integrations.md", text);
    expect(decision).toMatchObject({ status: "accepted", date: "2026-10-09", supersededBy: ["0008", "0015"], partlySuperseded: true });
  });

  it("reads other statuses and revision sections", () => {
    const text =
      "# 0002. X\n\n- Status: superseded (2026-01-02); superseded by [0003](0003-y.md)\n\n## Revision (2026-02-03, tap to open)\n\n## Revision (2026-03-04)\n";
    const { decision } = parseDecision("0002-x.md", text);
    expect(decision).toMatchObject({
      status: "superseded",
      supersededBy: ["0003"],
      partlySuperseded: false,
      revisions: [
        { date: "2026-02-03", label: "tap to open" },
        { date: "2026-03-04", label: "" },
      ],
    });
  });

  it("does not take a mention in another list item for a supersession", () => {
    const text = "# 0008. Spotify\n\n- Status: accepted (2026-11-22)\n- Partly supersedes: [0004](0004-x.md)\n";
    expect(parseDecision("0008-spotify.md", text).decision?.supersededBy).toEqual([]);
  });

  it("reports malformed records", () => {
    expect(parseDecision("notes.md", SIMPLE).issues).toHaveLength(1);
    expect(parseDecision("0002-x.md", SIMPLE).issues[0]).toMatch(/heading says 0001/);
    expect(parseDecision("0001-x.md", "# 0001. X\n\nNo status.\n").issues[0]).toMatch(/Status/);
    expect(parseDecision("0001-x.md", "# 0001. X\n\n- Status: maybe (2026-01-01)\n").issues[0]).toMatch(/unknown status/);
  });
});

describe("loadDecisions", () => {
  it("loads records newest first with their summaries, skipping the README", () => {
    const root = isolated(
      { "README.md": "# Index\n", "0001-content-first.md": SIMPLE, "0002-next.md": "# 0002. Next\n\n- Status: accepted (2026-10-10)\n" },
      { "0001": why("0001"), "0002": why("0002") }
    );
    const decisions = loadDecisions(root);
    expect(decisions.map((d) => d.number)).toEqual(["0002", "0001"]);
    expect(decisions[1]?.why?.["pt-br"]).toBe("Por que 0001");
  });

  it("asks for a summary per record, and a record per summary", () => {
    const root = isolated({ "0001-content-first.md": SIMPLE }, { "0009": why("0009") });
    const { issues } = loadDecisionsContent(root);
    expect(issues.map((issue) => issue.message)).toEqual(["ADR 0001 has no summary", "0009: no ADR has this number"]);
    expect(() => loadDecisions(root)).toThrow(ContentValidationError);
  });

  it("asks for both editorial locales in a summary", () => {
    const root = isolated({ "0001-content-first.md": SIMPLE }, { "0001": { why: { "en-us": "Only English" } } });
    expect(loadDecisionsContent(root).issues[0]?.message).toMatch(/en-us and pt-br/);
  });

  it("is empty without a docs/decisions folder", () => {
    expect(loadDecisionsContent(isolated(undefined, {})).decisions).toEqual([]);
  });

  it("parses every record in the repository, each with a summary", () => {
    const { decisions, issues } = loadDecisionsContent(findContentRoot());
    expect(issues).toEqual([]);
    expect(decisions.length).toBeGreaterThanOrEqual(15);
    expect(decisions.find((d) => d.number === "0004")).toMatchObject({ supersededBy: ["0008", "0015"], partlySuperseded: true });
  });
});
