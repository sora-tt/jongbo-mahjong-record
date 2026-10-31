import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  name: "jongbo | 麻雀記録",
  short_name: "jongbo",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#e8736b",
  icons: [
    {
      src: "/icons/jongbo-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/jongbo-512.png",
      sizes: "512x512",
      type: "image/png",
    },
    {
      src: "/icons/jongbo-512-maskable.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
});

export default manifest;
