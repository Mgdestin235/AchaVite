export type UploadKind = "image" | "video" | "pdf" | "ebook";

const FOLDER: Record<UploadKind, string> = {
  image: "products/images",
  video: "products/videos",
  pdf: "products/pdf",
  ebook: "products/ebooks",
};

const RESOURCE_TYPE: Record<UploadKind, string> = {
  image: "image",
  video: "video",
  pdf: "raw",
  ebook: "raw",
};

type SignatureResponse = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  error?: string;
};

/**
 * Uploads a file directly from the browser to Cloudinary and returns its
 * public URL. The file bytes never pass through our server (only a short
 * -lived signature does), so large videos/ebooks aren't limited by Vercel's
 * serverless function body size. Throws if Cloudinary isn't configured yet
 * or the upload fails.
 */
export async function uploadFile(file: File, kind: UploadKind): Promise<string> {
  const folder = FOLDER[kind];

  const sigRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
  const sigData = (await sigRes.json()) as SignatureResponse;
  if (!sigRes.ok) {
    throw new Error(sigData.error || "Échec de préparation du téléversement");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sigData.apiKey);
  formData.append("timestamp", String(sigData.timestamp));
  formData.append("signature", sigData.signature);
  formData.append("folder", sigData.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sigData.cloudName}/${RESOURCE_TYPE[kind]}/upload`,
    { method: "POST", body: formData }
  );
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(uploadData?.error?.message || "Échec du téléversement");
  }

  return uploadData.secure_url as string;
}
