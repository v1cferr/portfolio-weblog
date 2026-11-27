import { describe, expect, it } from "vitest";

import { ContentValidationError, findContentRoot, loadTattoos, loadTattoosContent, Tattoos, tattooMedia } from "../src";
import { makeContent } from "./fixture";

const done = {
  id: "usb-trident",
  state: "done",
  title: { "pt-br": "Tridente USB" },
  origin: { "en-us": "Universal Serial Bus" },
  placement: { "pt-br": "Pulso direito" },
  date: { on: "2024", approximate: true, part: "early" },
  meaning: { "pt-br": "Tecnologia" },
  body: { "pt-br": ["Um parágrafo."] },
  media: { src: "/tattoos/usb.jpg", width: 3, height: 4, alt: { "pt-br": "Pulso" } },
};
const idea = {
  id: "golden-ratio",
  state: "idea",
  title: { "pt-br": "Razão áurea" },
  origin: { "pt-br": "Matemática" },
  placement: { "pt-br": "Pescoço, cogitado" },
  meaning: { "pt-br": "Harmonia" },
  body: { "pt-br": ["Só uma ideia."] },
};
const page = (tattoos: unknown[], extra: Record<string, unknown> = {}) => ({
  manifesto: { text: "O leão me lembra.", gloss: { "en-us": "The lion reminds me." } },
  tattoos,
  ...extra,
});

describe("tattoos page content", () => {
  it("parses tattoos and ideas, with defaults", () => {
    const parsed = Tattoos.parse(page([done, idea]));
    expect(parsed.status).toBe("published");
    expect(parsed.manifesto.language).toBe("pt-br");
    expect(parsed.tattoos.map((t) => t.state)).toEqual(["done", "idea"]);
    expect(parsed.tattoos[1]?.quotes).toEqual([]);
  });

  it("needs a date on a done tattoo, and none (nor a photo) on an idea", () => {
    expect(Tattoos.safeParse(page([{ ...done, date: undefined }])).success).toBe(false);
    expect(Tattoos.safeParse(page([{ ...idea, date: { on: "2027" } }])).success).toBe(false);
    expect(Tattoos.safeParse(page([{ ...idea, media: done.media }])).success).toBe(false);
  });

  it("takes a precise date, and a part of the year only with a bare year", () => {
    expect(Tattoos.safeParse(page([{ ...done, date: { on: "2023-11-18" } }])).success).toBe(true);
    expect(Tattoos.safeParse(page([{ ...done, date: { on: "2023-11", part: "late" } }])).success).toBe(false);
    expect(Tattoos.safeParse(page([{ ...done, date: { on: "2023", part: "winter" } }])).success).toBe(false);
  });

  it("rejects a repeated id", () => {
    expect(Tattoos.safeParse(page([done, { ...done }])).success).toBe(false);
  });

  it("is shown only when published, or in review when asked", () => {
    const at = (status: string) => makeContent({ "profile/tattoos.yaml": page([done], { status }) });
    expect(loadTattoos(at("published"))?.tattoos).toHaveLength(1);
    expect(loadTattoos(at("review"))).toBeUndefined();
    expect(loadTattoos(at("review"), { includeReview: true })?.tattoos).toHaveLength(1);
    expect(loadTattoos(at("draft"), { includeReview: true })).toBeUndefined();
    expect(loadTattoos(makeContent({}))).toBeUndefined();
  });

  it("reports invalid content and lists its photos for the media check", () => {
    const bad = makeContent({ "profile/tattoos.yaml": page([{ ...done, state: "maybe" }]) });
    expect(loadTattoosContent(bad).issues[0]?.message).toMatch(/tattoos\.0\.state/);
    expect(() => loadTattoos(bad)).toThrow(ContentValidationError);
    const { tattoos } = loadTattoosContent(makeContent({ "profile/tattoos.yaml": page([done, idea]) }));
    expect(tattooMedia(tattoos)).toEqual([{ src: "/tattoos/usb.jpg", width: 3, height: 4, file: "profile/tattoos.yaml" }]);
  });
});

describe("the real tattoos file", () => {
  it("is valid, and the golden ratio is only an idea", () => {
    const { tattoos, issues } = loadTattoosContent(findContentRoot());
    expect(issues).toEqual([]);
    const golden = tattoos?.tattoos.find((tattoo) => tattoo.id === "golden-ratio");
    expect(golden?.state).toBe("idea");
    expect(golden?.date).toBeUndefined();
  });
});
