/**
 * Sessão de desbloqueio do Vault — guarda no localStorage o hash da
 * chave digitada. O Vault fica desbloqueado enquanto o hash guardado
 * bater com vault.access_key_hash.
 */

const STORAGE_KEY = "budgetos.vault.session";

export function getStoredKeyHash(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function storeKeyHash(hash: string): void {
  window.localStorage.setItem(STORAGE_KEY, hash);
}

export function clearVaultSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
