import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return { name: "Shape Studio", short_name: "Shape Studio", description: "A creator workspace and local recording lab", start_url: "/", display: "standalone", background_color: "#F7F8FC", theme_color: "#4f46a5", icons: [
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  ] };
}
