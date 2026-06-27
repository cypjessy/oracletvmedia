import { NextRequest, NextResponse } from "next/server";
import { deleteFromBunny } from "@/lib/bunny";
import { addCorsHeaders, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { storage_paths } = body as { storage_paths: string[] };

    if (!storage_paths || !Array.isArray(storage_paths) || storage_paths.length === 0) {
      return addCorsHeaders(NextResponse.json({ error: "No storage_paths provided" }, { status: 400 }), req);
    }

    const results = await Promise.allSettled(
      storage_paths.map((path) => deleteFromBunny(path))
    );

    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;
    const failed = results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value === false)
    ).length;

    return addCorsHeaders(NextResponse.json({
      deleted: succeeded,
      failed,
      total: storage_paths.length,
    }), req);
  } catch (error) {
    console.error("Delete error:", error);
    return addCorsHeaders(NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    ), req);
  }
}
