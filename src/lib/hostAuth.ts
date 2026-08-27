import { cookies } from "next/headers";

// Minimal åtkomstgrind för värdpanelen så gästers namn och e-post inte ligger
// öppet. Detta är en enkel delad kod, inte fullständig autentisering — nästa
// steg är riktig inloggning per värd. Koden sätts via env, med ett dev-standard.

export const HOST_COOKIE = "blanso_host";

export function hostPasscode(): string {
  return process.env.BLANSO_HOST_PASSCODE ?? "blanso";
}

export async function isHostAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(HOST_COOKIE)?.value === hostPasscode();
}
