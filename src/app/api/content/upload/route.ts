/**
 * POST /api/content/upload
 *
 * Proxies file uploads to BunnyCDN. The BunnyCDN API key stays server-side
 * (Vercel env var) and never reaches the client — whether from the web or
 * from the Capacitor Android app.
 *
 * Body (multipart/form-data):
 *   - file:          File (image)
 *   - church_id:     string (for namespacing storage paths)
 *   - category:      string (e.g. "gallery", "banners")
 *
 * Returns (JSON):
 *   { cdn_url, file_size, width, height, storage_path, file_name }
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadToBunny } from "@/lib/bunny";

export async function POST(request: NextRequest) {
  try {
    // 1. Validate BunnyCDN credentials exist on server
    if (!process.env.BUNNY_STORAGE_API_KEY) {
      return NextResponse.json(
        { error: "BunnyCDN API key not configured on server" },
        { status: 500 },
      );
    }

    // 2. Parse multipart form
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const churchId = (formData.get("church_id") as string) || "default";
    const category = (formData.get("category") as string) || "gallery";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}` },
        { status: 400 },
      );
    }

    // 4. Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

    // 5. Generate a unique storage path
    const ext = file.name.split(".").pop() || "jpg";
    const uuid = crypto.randomUUID();
    const storagePath = `churches/${churchId}/${category}/${uuid}.${ext}`;
    const fileName = file.name;

    // 6. Upload to BunnyCDN
    const result = await uploadToBunny(buffer, storagePath, file.type);

    // 7. Get image dimensions (client-side if possible, else server-side)
    let width = 0;
    let height = 0;
    try {
      // Use sharp if available (may not be in serverless), otherwise 0
      const sharp = (await import("sharp")).default;
      const metadata = await sharp(buffer).metadata();
      width = metadata.width || 0;
      height = metadata.height || 0;
    } catch {
      // sharp not available — dimensions will be set client-side
    }

    return NextResponse.json(
      {
        cdn_url: result.cdnUrl,
        file_size: fileSize,
        width,
        height,
        storage_path: storagePath,
        file_name: fileName,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("Content upload error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}
