import crypto from "node:crypto";
import { NextResponse } from "next/server";

// Issues a short-lived signature so the browser can upload a file directly
// to Cloudinary (bypassing this server entirely for the file bytes, which
// avoids Vercel's ~4.5MB serverless function body limit -- important for
// product videos and ebooks).
export async function POST(request: Request): Promise<NextResponse> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Le stockage de fichiers (Cloudinary) n'est pas encore configuré." },
      { status: 503 }
    );
  }

  const { folder } = (await request.json()) as { folder: string };
  const timestamp = Math.round(Date.now() / 1000);

  const paramsToSign: Record<string, string | number> = { folder, timestamp };
  const toSign = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");
  const signature = crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");

  return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder });
}
