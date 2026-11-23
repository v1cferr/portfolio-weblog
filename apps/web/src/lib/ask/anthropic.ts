import Anthropic from "@anthropic-ai/sdk";

/**
 * The API client, or null without ANTHROPIC_API_KEY: the chat then answers
 * extractively. Server code only (the route and the eval script); the key is
 * never exposed to the browser, since nothing client-side imports this.
 */
export function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey === undefined || apiKey === "") return null;
  return new Anthropic({ apiKey, maxRetries: 1, timeout: 20_000 });
}
