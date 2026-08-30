import { upload } from "@vercel/blob/client";

export type UploadKind = "image" | "video" | "pdf" | "ebook";

const FOLDER: Record<UploadKind, string> = {
  image: "products/images",
  video: "products/videos",
  pdf: "products/pdf",
  ebook: "products/ebooks",
};

/**
 * Uploads a file directly from the browser to Vercel Blob storage and
 * returns its public URL. Throws if the store isn't configured yet
 * (missing BLOB_READ_WRITE_TOKEN on the server) or the upload fails.
 */
export async function uploadFile(file: File, kind: UploadKind): Promise<string> {
  const blob = await upload(`${FOLDER[kind]}/${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    clientPayload: kind,
  });
  return blob.url;
}
