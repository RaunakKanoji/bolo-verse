import "server-only";
import { isPrivateStorageConfigured } from "./private-storage";
import { z } from "zod";
import {
  ImageGenerationCapabilitiesSchema,
  ImageModelIdSchema,
  imageCreationMaxBytes,
  imageGenerationReferenceMaxBytes,
  imageCreationPromptLimit,
  type CreateImageGeneration,
} from "@/lib/contracts/creation";
import { BoundaryError } from "@/server/auth/errors";
import { getServerEnv, type ServerEnv } from "@/server/config/env";
import { validateIngestedImage } from "@/server/services/image-ingestion";
import { readBoundedBytes, type ProviderFetch } from "./xr-http";

export function getImageGenerationCapabilities(env: ServerEnv = getServerEnv()) {
  const model = ImageModelIdSchema.safeParse(env.GEMINI_IMAGE_MODEL);
  const configured = Boolean(
    model.success &&
    env.GEMINI_API_KEY &&
    env.DATABASE_URL &&
    env.CLERK_SECRET_KEY &&
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    isPrivateStorageConfigured(env),
  );
  return ImageGenerationCapabilitiesSchema.parse({
    availability: configured ? "configured" : "unconfigured",
    reason: configured
      ? "Image generation is configured. Submitting a prompt calls Gemini and may incur provider charges; connection and output quality require live verification."
      : "Connect authentication, the project database, private image storage and a supported Gemini image model to enable generation. Local image editing remains available.",
    models:
      configured && model.success
        ? [
            {
              id: model.data,
              label: model.data,
              aspectRatios: ["1:1", "16:9", "4:5", "9:16"],
              referenceImage: true,
            },
          ]
        : [],
    maxReferenceBytes: imageGenerationReferenceMaxBytes,
    maxPromptCharacters: imageCreationPromptLimit,
  });
}

type ImageInput = Pick<CreateImageGeneration, "prompt" | "modelId" | "aspectRatio"> & {
  reference: { bytes: Uint8Array; mimeType: string } | null;
  signal?: AbortSignal;
};
const ProviderResponse = z.object({
  candidates: z
    .array(
      z.object({
        finishReason: z.literal("STOP"),
        content: z.object({
          parts: z
            .array(
              z.object({
                thought: z.boolean().optional(),
                inlineData: z
                  .object({
                    mimeType: z.string(),
                    data: z.string().max(Math.ceil(imageCreationMaxBytes / 3) * 4),
                  })
                  .optional(),
              }),
            )
            .max(32),
        }),
      }),
    )
    .length(1),
});
const unavailable = () =>
  new BoundaryError(
    503,
    "SERVICE_UNAVAILABLE",
    "The image provider did not return a usable image. This request will not be retried automatically; a new request may incur another charge.",
  );

/** Fixed Google endpoint; one bounded HTTP dispatch, no implicit SDK/network retries. */
export function createGeminiImageProvider(
  env: ServerEnv = getServerEnv(),
  fetcher: ProviderFetch = fetch,
) {
  return {
    async generate(input: ImageInput): Promise<{ bytes: Uint8Array; mimeType: string }> {
      const capabilities = getImageGenerationCapabilities(env);
      if (
        capabilities.availability !== "configured" ||
        capabilities.models[0]?.id !== input.modelId
      ) {
        throw new BoundaryError(
          503,
          "PROVIDER_UNCONFIGURED",
          "This image model is not configured for the workspace.",
        );
      }
      if (input.reference) {
        if (input.reference.bytes.byteLength > imageGenerationReferenceMaxBytes)
          throw new BoundaryError(400, "INVALID_INPUT", "Reference images must be at most 10 MiB.");
        await validateIngestedImage(input.reference);
      }
      input.signal?.throwIfAborted();
      try {
        const signal = input.signal
          ? AbortSignal.any([input.signal, AbortSignal.timeout(120_000)])
          : AbortSignal.timeout(120_000);
        const response = await fetcher(
          `https://generativelanguage.googleapis.com/v1beta/models/${input.modelId}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY! },
            redirect: "error",
            cache: "no-store",
            signal,
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: input.prompt },
                    ...(input.reference
                      ? [
                          {
                            inlineData: {
                              mimeType: input.reference.mimeType,
                              data: Buffer.from(input.reference.bytes).toString("base64"),
                            },
                          },
                        ]
                      : []),
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ["IMAGE"],
                imageConfig: { aspectRatio: input.aspectRatio },
              },
            }),
          },
        );
        if (!response.ok) {
          await response.body?.cancel();
          if (response.status === 429)
            throw new BoundaryError(
              429,
              "RATE_LIMITED",
              "The image provider is busy. This job will not retry automatically; submit a new request later.",
            );
          throw unavailable();
        }
        const bytes = await readBoundedBytes(
          response,
          Math.ceil(imageCreationMaxBytes / 3) * 4 + 65_536,
        );
        const parsed = ProviderResponse.parse(
          JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
        );
        const images = parsed.candidates[0].content.parts
          .filter((part) => !part.thought && part.inlineData)
          .map((part) => part.inlineData!);
        if (images.length !== 1) throw unavailable();
        const image = images[0];
        if (!image.data || image.data.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(image.data))
          throw unavailable();
        const decoded = new Uint8Array(Buffer.from(image.data, "base64"));
        if (Buffer.from(decoded).toString("base64") !== image.data) throw unavailable();
        await validateIngestedImage({ bytes: decoded, mimeType: image.mimeType });
        return { bytes: decoded, mimeType: image.mimeType };
      } catch (error) {
        if (error instanceof BoundaryError && error.status === 429) throw error;
        throw unavailable();
      }
    },
  };
}
