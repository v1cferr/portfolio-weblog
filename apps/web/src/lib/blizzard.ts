import "server-only";

import { slugifyRealm, type WowCharacter } from "@workspace/content";

import { type BattleNetFailure, type BattleNetClient, createBattleNetClient, type LiveCharacter } from "./battlenet";

/*
 * Battle.net for the /wow page, from the server only (ADR 0015). The site's
 * own client credentials (BATTLENET_CLIENT_ID, BATTLENET_CLIENT_SECRET) read
 * public profiles; no user login ever happens at runtime. Each character is
 * asked at most once a day (Next's data cache, tag "wow"), and anything that
 * goes wrong (no keys, 403, 404, a timeout) leaves the character as
 * content/games/wow.yaml has it.
 */

/** Profiles change slowly; one request per character a day is plenty. */
export const WOW_REVALIDATE_SECONDS = 86_400;

export interface CharacterView {
  character: WowCharacter;
  /** Present when Battle.net answered for this character. */
  live?: LiveCharacter;
  /** When the live data was fetched (ISO); undefined for a snapshot. */
  fetchedAt?: string;
  /** Why a character that asked for live data shows the snapshot. */
  failure?: BattleNetFailure;
}

let client: BattleNetClient | undefined;
let warned = false;

function battleNet(): BattleNetClient {
  client ??= createBattleNetClient({
    clientId: process.env.BATTLENET_CLIENT_ID,
    clientSecret: process.env.BATTLENET_CLIENT_SECRET,
    init: { next: { revalidate: WOW_REVALIDATE_SECONDS, tags: ["wow"] } },
  });
  return client;
}

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.warn(`World of Warcraft live data unavailable: ${message}`);
}

/** Each character, refreshed from Battle.net when it allows it (`live`), else as the file has it. */
export async function getCharacterViews(characters: readonly WowCharacter[], now: () => Date = () => new Date()): Promise<CharacterView[]> {
  return Promise.all(
    characters.map(async (character): Promise<CharacterView> => {
      if (!character.live) return { character };
      const result = await battleNet().character(
        character.game === "retail"
          ? {
              game: "retail",
              region: character.region,
              realmSlug: character.realmSlug ?? slugifyRealm(character.realm),
              name: character.name,
            }
          : { game: "forever", region: character.region, name: character.name, surname: character.surname }
      );
      if (!result.ok) {
        warnOnce(
          result.reason === "no-credentials"
            ? "BATTLENET_CLIENT_ID and BATTLENET_CLIENT_SECRET are not set"
            : `${character.name} answered ${result.reason}${result.status === undefined ? "" : ` (${String(result.status)})`}`
        );
        return { character, failure: result.reason };
      }
      return { character, live: result.data, fetchedAt: now().toISOString() };
    })
  );
}
