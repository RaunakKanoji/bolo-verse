import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "BoloVerse", short_name: "BoloVerse", description: "A creator workspace and local recording lab", start_url: "/", display: "standalone", orientation: "landscape", background_color: "#f6f7fb", theme_color: "#4f46a5", icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ] };
}
