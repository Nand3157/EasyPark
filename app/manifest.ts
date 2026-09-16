import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EasyPark — Smart Parking Discovery",
    short_name: "EasyPark",
    description: "Find, compare, and navigate to parking spots with live maps and offline cache.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#2563eb",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
