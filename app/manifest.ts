import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest. Lets the app install to the iPhone home screen and open full-screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Closet",
    short_name: "Closet",
    description: "Your fits, picked for you.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#141414",
    theme_color: "#141414",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
