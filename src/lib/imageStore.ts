import { randomBytes } from "crypto";
import { createServerClient } from "./store/supabase";

// Bilduppladdning bakom ETT kontrakt, precis som DataStore och PaymentProvider.
// Med Supabase-env laddas värdens foton upp till Storage-hinken och blir riktiga
// publika URL:er. Utan env (lokal demo) finns ingen lagring — då faller
// createListing tillbaka på platshållarbilder. Körs ENBART på servern.

export const BUCKET = "listing-photos";
export const MAX_PHOTOS = 8;
export const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per bild

// Endast format en webbläsare säkert renderar, och som next/image kan optimera.
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export interface UploadInput {
  type: string;
  bytes: Uint8Array;
}

export interface ImageStore {
  // Returnerar publika URL:er i samma ordning som filerna kom in.
  uploadListingImages(keyPrefix: string, files: UploadInput[]): Promise<string[]>;
}

export class UploadError extends Error {}

// Läser och VALIDERAR värdens filer innan något laddas upp. Kastar UploadError
// med ett gästvänligt meddelande vid fel typ eller för stor fil — aldrig ett
// tyst fall som slinker vidare och publicerar med trasiga bilder.
export async function filesToUploads(files: File[]): Promise<UploadInput[]> {
  if (files.length > MAX_PHOTOS) {
    throw new UploadError(`Add at most ${MAX_PHOTOS} photos.`);
  }
  const out: UploadInput[] = [];
  for (const file of files) {
    if (!EXT_BY_TYPE[file.type]) {
      throw new UploadError("Photos must be JPG, PNG, WebP or AVIF.");
    }
    if (file.size > MAX_BYTES) {
      throw new UploadError("Each photo must be 5 MB or smaller.");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    out.push({ type: file.type, bytes });
  }
  return out;
}

class SupabaseImageStore implements ImageStore {
  private client = createServerClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  async uploadListingImages(keyPrefix: string, files: UploadInput[]): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = EXT_BY_TYPE[file.type] ?? "jpg";
      const path = `${keyPrefix}/${i + 1}-${randomBytes(6).toString("hex")}.${ext}`;
      const { error } = await this.client.storage.from(BUCKET).upload(path, file.bytes, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw new UploadError(`Could not upload a photo: ${error.message}`);
      const { data } = this.client.storage.from(BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }
}

// Ingen lagring konfigurerad (lokal demo). Signalerar det till anroparen så att
// createListing väljer platshållarbilder i stället — värden får aldrig ett fel.
class NullImageStore implements ImageStore {
  async uploadListingImages(): Promise<string[]> {
    return [];
  }
}

let imageStore: ImageStore | null = null;

export function getImageStore(): ImageStore {
  if (!imageStore) {
    const hasSupabase =
      !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    imageStore = hasSupabase ? new SupabaseImageStore() : new NullImageStore();
  }
  return imageStore;
}
