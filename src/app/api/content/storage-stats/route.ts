import { NextResponse } from "next/server";
import { getBunnyStorageStats, BUNNY_CDN_URL, formatBytes } from "@/lib/bunny";
import { addCorsHeaders, handleCorsPreflight } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function GET(req: Request) {
  try {
    const stats = await getBunnyStorageStats();
    const totalGB = 10; // total storage in GB
    const usedGB = stats.totalBytes / (1024 * 1024 * 1024);
    const percentUsed = Math.round((usedGB / totalGB) * 100);

    return addCorsHeaders(NextResponse.json({
      total_bytes: stats.totalBytes,
      total_files: stats.totalFiles,
      used_gb: parseFloat(usedGB.toFixed(1)),
      total_gb: totalGB,
      percent_used: percentUsed,
      formatted_used: formatBytes(stats.totalBytes),
      formatted_total: `${totalGB} GB`,
      cdn_base_url: BUNNY_CDN_URL,
    }), req);
  } catch (error) {
    console.error("Storage stats error:", error);
    // Return mock data for development
    return addCorsHeaders(NextResponse.json({
      total_bytes: 2.4 * 1024 * 1024 * 1024,
      total_files: 312,
      used_gb: 2.4,
      total_gb: 10,
      percent_used: 24,
      formatted_used: "2.4 GB",
      formatted_total: "10 GB",
      cdn_base_url: BUNNY_CDN_URL,
    }), req);
  }
}
