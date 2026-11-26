import type { NextConfig } from "next";

// cacheComponents is off on purpose: every screen sits behind the login
// cookie and reads live closet data, so the classic dynamic model is simpler.
const nextConfig: NextConfig = {
  // Dev only: lets the iPhone on the same Wi-Fi load the dev server's scripts.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  // Rate my fit reads docs/STYLE_RULES.md at runtime; make sure Vercel ships it.
  outputFileTracingIncludes: { "/api/ai/rate": ["./docs/STYLE_RULES.md"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
