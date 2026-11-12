import "server-only";
import { CreativeCapabilitiesSchema, type CreativeCapabilities } from "@/lib/contracts/shape";

/** Availability means an implemented end-to-end workflow, never credential presence. */
export function getCreativeCapabilities(): CreativeCapabilities {
  return CreativeCapabilitiesSchema.parse({
    schemaVersion: 1,
    modes: [
      { id: "image", label: "Image", availability: "not_implemented", reason: "Image generation is not connected. Import an image to use local adjustments and export.", settings: [] },
      { id: "video", label: "Video", availability: "not_implemented", reason: "Video generation, background jobs and output storage are not connected. You can prepare a prompt.", settings: [] },
      { id: "audio", label: "Audio", availability: "not_implemented", reason: "Creative audio generation and output storage are not connected. Existing assistant speech is a separate workflow.", settings: [] },
      { id: "model3d", label: "3D", availability: "not_implemented", reason: "3D generation and output storage are not connected. You can prepare a prompt for a future supported provider.", settings: [] },
    ],
  });
}
