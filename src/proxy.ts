/**
 * Middleware for internationalization (i18n) handling
 *
 * Note: While Next.js 16+ recommends migrating to the new "proxy" convention,
 * this project uses next-intl which doesn't have full support yet.
 * Migration will be performed when next-intl provides complete proxy support.
 *
 * @see https://nextjs.org/docs/messages/middleware-to-proxy (Future proxy migration)
 * @see https://next-intl-docs.vercel.app/ (next-intl documentation)
 */

import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Internationalization middleware created by next-intl
 * Handles locale detection and routing based on the routing configuration
 */
export default createMiddleware(routing);

/**
 * Middleware configuration
 *
 * Matcher: Specifies which routes should be processed by this middleware
 * - "/" catches the root path
 * - "/(en-us|pt-br|zh-cn)/:path*" catches all locale-prefixed routes
 *
 * This ensures proper locale handling for all supported languages
 */
export const config = {
  matcher: ["/", "/(en-us|pt-br|zh-cn)/:path*"],
};
