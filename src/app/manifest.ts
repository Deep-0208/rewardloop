import type { MetadataRoute } from "next";

/**
 * PWA Manifest configured for automatic full-screen PWA execution when downloaded/installed.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RewardLoop",
    short_name: "RewardLoop",
    description:
      "Digital loyalty system for local salons — billing first, loyalty second.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    display_override: ["fullscreen", "standalone", "minimal-ui"],
    background_color: "#F8FAFC",
    theme_color: "#4F46E5",
    orientation: "portrait",
    categories: ["business", "utilities"],
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
