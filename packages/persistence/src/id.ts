/** Stable ID generation. Uses the platform crypto (Node 20+ and browsers). */
export function newId(): string {
  return globalThis.crypto.randomUUID();
}
