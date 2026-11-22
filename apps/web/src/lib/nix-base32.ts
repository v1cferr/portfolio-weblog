/** Nix's base32 alphabet: no e, o, u or t, to avoid accidental words. */
const NIX_BASE32 = "0123456789abcdfghijklmnpqrsvwxyz";

/** Nix's base32 (as in nix-hash --to-base32): 5 bits at a time, last byte first. */
export function nixBase32(bytes: Uint8Array): string {
  const length = Math.ceil((bytes.length * 8) / 5);
  let out = "";
  for (let n = length - 1; n >= 0; n--) {
    const bit = n * 5;
    const i = Math.floor(bit / 8);
    const j = bit % 8;
    const value = ((bytes[i] ?? 0) >> j) | (j > 3 ? (bytes[i + 1] ?? 0) << (8 - j) : 0);
    out += NIX_BASE32[value & 0x1f] ?? "";
  }
  return out;
}
