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
    store = url && key ? new SupabaseStore(url, key) : new MemoryStore();
  }
  return store;
}

export type { DataStore } from "./types";
