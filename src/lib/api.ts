/**
 * API fetch helper that routes to Vercel when the app runs in Capacitor (APK).
 * In local development (next dev), relative paths work fine.
 * In production (static export in Capacitor), we need the absolute Vercel URL.
 */
const API_BASE = (process.env.NEXT_PUBLIC_VERCEL_URL || "").replace(/\/+$/, "");

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Use relative URLs on localhost — Vercel blocks CORS from localhost origins
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "10.0.2.2")) {
    return fetch(input, init);
  }
  const url = typeof input === "string" && API_BASE
    ? `${API_BASE}${input}`
    : input;
  return fetch(url, init);
}
