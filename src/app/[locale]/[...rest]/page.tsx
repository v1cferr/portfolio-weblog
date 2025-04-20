import { notFound } from "next/navigation";

/**
 * Catch-all page component for handling unmatched routes.
 *
 * This component triggers the `notFound()` function, which displays
 * the 404 Not Found page when a user navigates to a route that does not exist.
 *
 * @returns {never} This component does not render anything; it always triggers a not found response.
 */
export default function CatchAllPage(): never {
  notFound();
}
