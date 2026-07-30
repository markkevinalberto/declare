import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Declare — Church Service & Volunteer Scheduling",
    short_name: "Declare",
    description: "Plan Sunday services and schedule volunteers.",
    start_url: "/",
    display: "standalone",
    background_color: "#08121F",
    theme_color: "#245BFF",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
