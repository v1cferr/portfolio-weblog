import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Every page path except API routes, Next internals and files with an
  // extension. Unlike v1, unprefixed paths such as /projects are matched too,
  // so they redirect to a locale instead of returning 404.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
