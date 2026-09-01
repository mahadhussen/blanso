import type { DataStore } from "./types";
import { MemoryStore } from "./memory";
import { SupabaseStore } from "./supabase";

// Enda stället som väljer lagring. Med Supabase-env: riktig persistens mot
// Balaanso. Utan: in-memory-demon. Resten av appen märker ingenting.

let store: DataStore | null = null;

export function getStore(): DataStore {
  if (!store) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      store = new SupabaseStore(url, key);
    } else if (process.env.NODE_ENV === "production" && process.env.BLANSO_DEMO !== "1") {
      // Felkonfiguration får ALDRIG tyst bli RAM i produktion: bokningar skulle
      // tas emot och försvinna. Demoläge är opt-in via BLANSO_DEMO=1.
      throw new Error(
        "Blanso i produktion utan databas: sätt SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, eller BLANSO_DEMO=1 för uttryckligt demoläge.",
      );
    } else {
      store = new MemoryStore();
    }
  }
  return store;
}

export type { DataStore } from "./types";
