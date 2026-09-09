import type { NextConfig } from "next";

// Locked to this project's own Cloudinary cloud -- previously accepted any
// res.cloudinary.com URL, which let anyone route the image optimizer at a
// file hosted on their own free Cloudinary account (security-report-
// monetization.md, finding C-01).
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "unconfigured";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${cloudinaryCloudName}/**`,
      },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV !== "production";
    // Turbopack's dev-mode HMR needs 'unsafe-eval' (React's dev-mode stack
    // reconstruction) and a ws: connect-src for its live-reload socket --
    // neither exists in a production build, so the deployed site keeps the
    // strict policy while local `next dev` isn't broken by it.
    const scriptSrc = isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'";
    const connectSrc = isDev
      ? "connect-src 'self' ws: https://*.supabase.co https://api.cloudinary.com"
      : "connect-src 'self' https://*.supabase.co https://api.cloudinary.com";

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "object-src 'none'",
              "img-src 'self' data: https://res.cloudinary.com https://images.unsplash.com",
              connectSrc,
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
            ].join("; "),
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
