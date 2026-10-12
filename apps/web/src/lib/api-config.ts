/**
 * Resolves the API base URL across local development, SSR, and Vercel services deployment.
 * 
 * - Vercel Server-side: process.env.API_URL (injected via Vercel service binding)
 * - Vercel Client-side (Browser): uses relative /api or NEXT_PUBLIC_API_URL
 * - Local Development: falls back to http://localhost:8000
 */
export function getApiBaseUrl(): string {
  if (typeof process !== "undefined" && process.env.API_URL) {
    return process.env.API_URL.replace(/\/$/, "");
  }

  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  // In browser on production Vercel deployment
  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isLocalhost) {
      return "";
    }
  }

  return "http://localhost:8000";
}

/**
 * Builds a fully qualified or rewritten endpoint URL.
 * 
 * Examples:
 *   apiUrl("/v1/auth/send-code") -> "http://localhost:8000/v1/auth/send-code" (local)
 *                                -> "/api/v1/auth/send-code" (Vercel browser)
 */
export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (!base) {
    if (!cleanPath.startsWith("/api/")) {
      return `/api${cleanPath}`;
    }
    return cleanPath;
  }

  return `${base}${cleanPath}`;
}
