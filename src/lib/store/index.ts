import type { DataStore } from "./types";
import { MemoryStore } from "./memory";

// Enda stället som väljer lagring. När Supabase kopplas på:
//   if (process.env.SUPABASE_URL) return new SupabaseStore(...)
// Resten av appen märker ingenting.

let store: DataStore | null = null;

export function getStore(): DataStore {
  if (!store) store = new MemoryStore();
  return store;
}

export type { DataStore } from "./types";
