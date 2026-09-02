import { describe, it, expect } from "vitest";
import { filesToUploads, UploadError, MAX_PHOTOS, MAX_BYTES } from "./imageStore";

function fakeFile(type: string, size: number): File {
  // File i Node 20: bytes spelar ingen roll för valideringen, bara size/type.
  return new File([new Uint8Array(size)], "photo", { type });
}

describe("filesToUploads (värdfoton, validering)", () => {
  it("godkänner giltiga bilder och läser bytes", async () => {
    const out = await filesToUploads([fakeFile("image/jpeg", 100), fakeFile("image/png", 200)]);
    expect(out).toHaveLength(2);
    expect(out[0].type).toBe("image/jpeg");
    expect(out[0].bytes.byteLength).toBe(100);
  });

  it("vägrar fel filtyp", async () => {
    await expect(filesToUploads([fakeFile("application/pdf", 100)])).rejects.toBeInstanceOf(
      UploadError,
    );
  });

  it("vägrar för stor fil", async () => {
    await expect(filesToUploads([fakeFile("image/png", MAX_BYTES + 1)])).rejects.toBeInstanceOf(
      UploadError,
    );
  });

  it("vägrar fler än taket", async () => {
    const many = Array.from({ length: MAX_PHOTOS + 1 }, () => fakeFile("image/webp", 10));
    await expect(filesToUploads(many)).rejects.toBeInstanceOf(UploadError);
  });

  it("tomt urval ger tom lista", async () => {
    expect(await filesToUploads([])).toEqual([]);
  });
});
