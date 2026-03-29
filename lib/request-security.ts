export function getAllowedOrigins() {
  const origins = new Set<string>();

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    origins.add(process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""));
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.add(process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""));
  }

  origins.add("https://slottick.com");
  origins.add("https://www.slottick.com");

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://192.168.8.103:3000");
  }

  return origins;
}

export function hasValidOrigin(req: Request) {
  const method = req.method.toUpperCase();

  // only protect state-changing requests
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return true;
  }

  const origin = req.headers.get("origin");
  if (!origin) return false;

  return getAllowedOrigins().has(origin.replace(/\/$/, ""));
}