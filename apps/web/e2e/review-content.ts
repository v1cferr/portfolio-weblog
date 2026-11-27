import { readFileSync } from "node:fs";
import path from "node:path";

/*
 * Content in review renders only on preview deployments, or on a build made
 * with CONTENT_PREVIEW=1 (ADR 0019). The specs read the same switch, plus the
 * file's status, to know whether the tattoos page should exist in the build
 * under test: CI builds without the switch, so there it must be hidden.
 */
const status = /^status:\s*(\w+)/m.exec(readFileSync(path.join(import.meta.dirname, "../../../content/profile/tattoos.yaml"), "utf8"))?.[1];

/** True when the build under test renders /tattoos (and its post and curiosity). */
export const TATTOOS_VISIBLE = status === "published" || (status === "review" && process.env.CONTENT_PREVIEW === "1");
