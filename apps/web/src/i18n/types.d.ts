import type messages from "../../messages/en-us.json";
import type { routing } from "./routing";

// English is the reference catalogue: every key used in code must exist there.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
