/**
 * DELETE /api/content/delete
 *
 * Proxies file deletion to BunnyCDN. The API key stays server-side.
 *
 * Body (JSON):
 *   { storage_paths: string[] }
 *
 * Returns (JSON):
 *   { success: boolean, deleted: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteFromBunny } from "@/lib/bunny";

export async function DELETE(request: NextRequest) {
  try {
    if (!process.env.BUNNY_STORAGE_API_KEY) {
      return NextResponse.json(
        { error: "BunnyCDN API key not configured on server" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const storagePaths: string[] = body.storage_paths;

    if (!Array.isArray(storagePaths) || storagePaths.length === 0) {
      return NextResponse.json(
        { error: "storage_paths must be a non-empty array" },
        { status: 400 },
      );
    }

    // Delete each file from BunnyCDN
    const results = await Promise.allSettled(
      storagePaths.map((path) => deleteFromBunny(path)),
    );

    const deleted = results.filter((r) => r.status === "fulfilled" && r.value).length;
    const failed = storagePaths.length - deleted;

    if (failed > 0) {
      console.warn(`BunnyCDN delete: ${deleted}/${storagePaths.length} deleted, ${failed} failed`);
    }

    return NextResponse.json(
      { success: failed === 0, deleted },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (err) {
    console.error("Content delete error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    );
  }
}
