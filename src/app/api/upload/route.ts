import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Client-side direct-to-Blob upload: the browser uploads bytes straight to
// Vercel Blob storage, this route only issues a short-lived signed token.
// This avoids the ~4.5MB body-size limit of Vercel serverless functions,
// which matters for product videos, PDFs, and ebooks.
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const kind = (clientPayload as string | null) ?? "image";
        const allowedContentTypes: Record<string, string[]> = {
          image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
          video: ["video/mp4", "video/webm", "video/quicktime"],
          pdf: ["application/pdf"],
          ebook: ["application/pdf", "application/epub+zip", "application/x-mobipocket-ebook"],
        };
        const maxSizes: Record<string, number> = {
          image: 10 * 1024 * 1024,
          video: 200 * 1024 * 1024,
          pdf: 50 * 1024 * 1024,
          ebook: 50 * 1024 * 1024,
        };
        return {
          allowedContentTypes: allowedContentTypes[kind] ?? allowedContentTypes.image,
          maximumSizeInBytes: maxSizes[kind] ?? maxSizes.image,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ kind }),
        };
      },
      onUploadCompleted: async () => {
        // No database to update in this project — the returned blob URL is
        // stored directly on the product by the client.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
