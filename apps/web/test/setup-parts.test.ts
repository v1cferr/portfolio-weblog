import { Setup } from "@workspace/content";
import { describe, expect, it } from "vitest";

import { partLightboxItems } from "../src/features/setup/part-gallery";

const photo = (id: string, extra: object = {}) => ({
  src: `/setup/parts/${id}.jpg`,
  width: 1200,
  height: 1200,
  alt: { "en-us": `The ${id}`, "pt-br": `O ${id}` },
  ...extra,
});

const setup = Setup.parse({
  id: "setup",
  updatedAt: "2026-11",
  groups: [
    {
      id: "components",
      title: { "en-us": "Components" },
      items: [
        {
          id: "cpu",
          role: { "en-us": "CPU" },
          model: "Core i5",
          media: photo("cpu", { credit: { label: "Intel", url: "https://newsroom.intel.com" } }),
        },
        { id: "ram", role: { "en-us": "RAM" }, model: "Vulcan" },
      ],
    },
    {
      id: "desk",
      title: { "en-us": "Desk" },
      items: [{ id: "mouse", role: { "en-us": "Mouse" }, model: "DeathAdder", media: photo("mouse") }],
    },
  ],
});

describe("setup part photos", () => {
  const parts = partLightboxItems(setup, "pt-br", (label) => `Imagem: ${label}`);

  it("puts every part with a photo in one gallery, in page order, skipping parts without one", () => {
    expect(parts.items.map((item) => item.src)).toEqual(["/setup/parts/cpu.jpg", "/setup/parts/mouse.jpg"]);
    expect(parts.indexOf.get("mouse")).toBe(1);
    expect(parts.indexOf.has("ram")).toBe(false);
  });

  it("captions a photo with the model and credits third-party images", () => {
    expect(parts.items[0]).toMatchObject({
      alt: "O cpu",
      caption: "Core i5",
      credit: { text: "Imagem: Intel", url: "https://newsroom.intel.com" },
    });
    expect(parts.items[1]?.credit).toBeUndefined();
  });
});
