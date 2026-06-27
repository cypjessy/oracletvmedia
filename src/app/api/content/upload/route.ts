import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToBunny } from "@/lib/bunny";
import { addCorsHeaders, handleCorsPreflight } from "@/lib/cors";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const churchId = formData.get("church_id") as string | null;
    const category = formData.get("category") as string | null;

    if (!file) {
      return addCorsHeaders(NextResponse.json({ error: "No file provided" }, { status: 400 }), req);
    }

    if (!churchId) {
      return addCorsHeaders(NextResponse.json({ error: "Missing church_id" }, { status: 400 }), req);
    }

    if (!category) {
      return addCorsHeaders(NextResponse.json({ error: "Missing category" }, { status: 400 }), req);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return addCorsHeaders(NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Allowed: JPG, PNG, WEBP, HEIC` },
        { status: 400 },
      ), req);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return addCorsHeaders(NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 10MB` },
        { status: 400 },
      ), req);
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Compress and resize with Sharp
    const compressed = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // Generate filename
    const timestamp = Date.now();
    const ext = category === "banners" ? "webp" : "webp";
    const filename = `${timestamp}.${ext}`;
    const storagePath = `churches/${churchId}/${category}/${filename}`;

    // Upload to BunnyCDN
    const result = await uploadToBunny(compressed, storagePath);

    // Extract dimensions from the compressed image
    const metadata = await sharp(compressed).metadata();

    return addCorsHeaders(NextResponse.json({
      cdn_url: result.cdnUrl,
      storage_path: storagePath,
      file_size: compressed.length,
      width: metadata.width,
      height: metadata.height,
      original_name: file.name,
    }), req);
  } catch (error) {
    console.error("Upload error:", error);
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    ), req);
  }
}

