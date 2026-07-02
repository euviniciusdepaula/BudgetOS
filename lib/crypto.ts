/**
 * Chave de acesso do Vault — gerada uma única vez; apenas o hash
 * SHA-256 é persistido no banco.
 */

const KEY_PREFIX = "bgt_";
const KEY_BYTES = 18;

export function generateAccessKey(): string {
  const bytes = new Uint8Array(KEY_BYTES);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    ""
  );
  return `${KEY_PREFIX}${body}`;
}

export async function hashAccessKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key.trim());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");
}
