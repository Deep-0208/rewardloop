import type { MetadataRoute } from "next";

/**
 * PWA manifest — basic metadata only.
 *
 * Full PWA configuration (service worker, offline support)
 * deferred to a later sprint.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RewardLoop",
    short_name: "RewardLoop",
    description:
      "Digital loyalty system for local salons — billing first, loyalty second.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#4F46E5",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
