/**
 * GET /api/content/storage-stats
 *
 * Returns BunnyCDN storage usage statistics for the dashboard UI.
 * Data is fetched server-side using the API key env var.
 *
 * Returns (JSON):
 *   { usedGB, totalGB, percentUsed, formattedUsed, formattedTotal }
 */

import { NextResponse } from "next/server";
import { getBunnyStorageStats, formatBytes } from "@/lib/bunny";

const TOTAL_STORAGE_GB = 10; // BunnyCDN storage zone limit

export async function GET() {
  try {
    if (!process.env.BUNNY_STORAGE_API_KEY) {
      return NextResponse.json(
        {
          usedGB: 0,
          totalGB: TOTAL_STORAGE_GB,
          percentUsed: 0,
          formattedUsed: "0 B",
          formattedTotal: `${TOTAL_STORAGE_GB} GB`,
        },
        { status: 200 },
      );
    }

    const stats = await getBunnyStorageStats();
    const usedGB = stats.totalBytes / (1024 * 1024 * 1024);
    const percentUsed = Math.round((usedGB / TOTAL_STORAGE_GB) * 100);

    return NextResponse.json(
      {
        usedGB: parseFloat(usedGB.toFixed(2)),
        totalGB: TOTAL_STORAGE_GB,
        percentUsed: Math.min(percentUsed, 100),
        formattedUsed: formatBytes(stats.totalBytes),
        formattedTotal: `${TOTAL_STORAGE_GB} GB`,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=60",
        },
      },
    );
  } catch (err) {
    console.error("Storage stats error:", err);
    return NextResponse.json(
      {
        usedGB: 0,
        totalGB: TOTAL_STORAGE_GB,
        percentUsed: 0,
        formattedUsed: "0 B",
        formattedTotal: `${TOTAL_STORAGE_GB} GB`,
      },
      { status: 200 },
    );
  }
}
