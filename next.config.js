/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" }, // Facebook avatar proxy
      { protocol: "https", hostname: "scontent.xx.fbcdn.net" }, // Fallback direct FB CDN pattern
      { protocol: "https", hostname: "ayfkmchipjlmxzfwrwyf.supabase.co" }, // Supabase project assets (signed URLs)
      { protocol: "https", hostname: "images.unsplash.com" }, // Unsplash gallery images
    ],
  },
};

module.exports = nextConfig
