import { NextRequest, NextResponse } from "next/server";
import { uploadToBunny } from "@/lib/bunny";

// CORS headers for Capacitor cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const churchId = (formData.get("church_id") as string) || "general";
    const category = (formData.get("category") as string) || "gallery";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB` },
        { status: 400 }
      );
    }

    // Infer MIME from extension when file.type is empty (common on Android)
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const mimeFromExt: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
      avif: "image/avif",
    };
    const mimeType = file.type || mimeFromExt[ext] || "";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type: "${file.type || ext}". Allowed: JPG, PNG, WEBP, GIF, AVIF` },
        { status: 400 }
      );
    }

    // Generate a unique storage path
    const uuid = crypto.randomUUID();
    const storagePath = `churches/${churchId}/${category}/${uuid}.${ext}`;

    // Read file as buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to BunnyCDN
    const result = await uploadToBunny(buffer, storagePath, mimeType);

    // Try to get image dimensions by reading binary headers (best-effort)
    let width = 0;
    let height = 0;
    try {
      // Detect image type from magic bytes (works even with empty file.type)
      const magic = buffer.length >= 8 ? buffer.toString("hex", 0, 8) : "";
      if (magic.startsWith("89504e47") && buffer.length >= 24) {
        // PNG: IHDR chunk at bytes 16-23
        width = buffer.readUInt32BE(16);
        height = buffer.readUInt32BE(20);
      } else if (magic.startsWith("ffd8")) {
        // JPEG: scan for SOF0 marker (0xFF 0xC0) which contains dimensions
        for (let i = 0; i < buffer.length - 9; i++) {
          if (buffer[i] === 0xFF && buffer[i + 1] === 0xC0) {
            height = buffer.readUInt16BE(i + 5);
            width = buffer.readUInt16BE(i + 7);
            break;
          }
        }
      } else if (magic.startsWith("52494646") && buffer.length >= 30) {
        // WEBP: RIFF header, VP8/VP8L at bytes 12-15
        if (buffer.toString("ascii", 12, 16) === "VP8 " && buffer.length >= 30) {
          width = buffer.readUInt16LE(26) & 0x3FFF;
          height = buffer.readUInt16LE(28) & 0x3FFF;
        } else if (buffer.toString("ascii", 12, 16) === "VP8L" && buffer.length >= 25) {
          const bits = buffer.readUInt32LE(21);
          width = (bits & 0x3FFF) + 1;
          height = ((bits >> 14) & 0x3FFF) + 1;
        }
      }
    } catch {
      // Non-fatal — dimensions default to 0
    }

    return NextResponse.json({
      cdnUrl: result.cdnUrl,
      fileSize: file.size,
      width,
      height,
      storagePath: storagePath,
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Upload failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
