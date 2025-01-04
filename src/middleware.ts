import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Define into the matcher all the availables language have defined into routing.ts
  matcher: ["/", "/(en-us|pt-br|zh-cn)/:path*"],
};
