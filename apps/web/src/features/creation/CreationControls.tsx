"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Upload } from "lucide-react";
import type { CreativeMode } from "@/lib/contracts/shape";
import { imageGenerationReferenceMaxBytes } from "@/lib/contracts/creation";
import { CreationAccessError } from "./creation-http";
import { uploadReferenceImage } from "./upload-reference-image";
import type { useImageGeneration } from "./use-image-generation";
import styles from "./creation.module.css";

type Generation = ReturnType<typeof useImageGeneration>;
export function CreationControls({
  generation,
  mode,
  prompt,
  projectId,
  canEdit,
}: {
  generation: Generation;
  mode: CreativeMode;
  prompt: string;
  projectId?: string;
  canEdit: boolean;
}) {
  const [modelId, setModelId] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [reference, setReference] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const active = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      controller.current?.abort();
    };
  }, []);
  const catalog = generation.capabilities.data;
  const model = catalog?.models.find((entry) => entry.id === modelId) ?? catalog?.models[0];
  const aspectRatio =
    model?.aspectRatios.find((entry) => entry === ratio) ?? model?.aspectRatios[0];
  const configured = catalog?.availability === "configured" && Boolean(model);
  const allowed = mode === "image" && Boolean(projectId) && canEdit && configured;
  const canUpload = mode === "image" && Boolean(projectId) && canEdit;
  const supportedAssets = generation.assets.data?.assets.filter(
    (asset) =>
      ["image/png", "image/jpeg", "image/webp"].includes(asset.mimeType) &&
      asset.contentUrl &&
      asset.byteSize <= imageGenerationReferenceMaxBytes,
  );
  async function upload(file: File) {
    if (!projectId || !canUpload || controller.current) return;
    if (file.size > imageGenerationReferenceMaxBytes) {
      setError("This image exceeds the configured reference image size limit.");
      return;
    }
    const request = new AbortController();
    controller.current = request;
    setUploading(true);
    setError("");
    try {
      const id = await uploadReferenceImage(projectId, file, request.signal);
      if (!active.current) return;
      await generation.assets.refetch();
      if (active.current) setReference(id);
    } catch (reason) {
      if (reason instanceof CreationAccessError) generation.revokeAccess();
      if (active.current)
        setError(
          reason instanceof Error ? reason.message : "The reference image could not upload.",
        );
    } finally {
      controller.current = null;
      if (active.current) setUploading(false);
    }
  }
  const unavailable =
    mode !== "image"
      ? "Generation for this mode is not implemented. Your prompt remains a separate draft."
      : !projectId
        ? "Open an authorized project to generate and save images. Local editing is available here."
        : !canEdit
          ? "Editable project access is required to generate images."
          : generation.capabilities.isError
            ? "Generation capabilities could not be verified. Refresh before generating."
            : (catalog?.reason ?? "Checking image generation availability…");
  return (
    <section className={styles.controls} aria-label="Image generation settings">
      <label htmlFor="image-generation-model">Generation model</label>
      <select
        id="image-generation-model"
        value={model?.id ?? ""}
        disabled={!allowed || generation.busy}
        onChange={(event) => {
          setModelId(event.target.value);
          setReference("");
        }}
      >
        {!model && <option value="">No image model connected</option>}
        {catalog?.models.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.label}
          </option>
        ))}
      </select>
      {mode === "image" && model && (
        <>
          <label htmlFor="image-aspect-ratio">Image aspect ratio</label>
          <select
            id="image-aspect-ratio"
            value={aspectRatio ?? ""}
            disabled={!allowed || generation.busy}
            onChange={(event) => setRatio(event.target.value)}
          >
            {model.aspectRatios.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </>
      )}
      {allowed && model?.referenceImage && (
        <>
          <label htmlFor="project-reference-image">Project reference image</label>
          <select
            id="project-reference-image"
            value={reference}
            disabled={uploading || generation.busy}
            onChange={(event) => setReference(event.target.value)}
          >
            <option value="">No reference image</option>
            {supportedAssets?.map((asset, index) => (
              <option
                key={asset.id}
                value={asset.id}
              >{`Project image ${index + 1} (${asset.width ?? "?"} × ${asset.height ?? "?"})`}</option>
            ))}
            {reference && !supportedAssets?.some((asset) => asset.id === reference) && (
              <option value={reference}>Uploaded reference image</option>
            )}
          </select>
        </>
      )}
      {canUpload && (
        <>
          <button
            type="button"
            className={styles.secondary}
            disabled={uploading || generation.busy}
            onClick={() => fileInput.current?.click()}
          >
            <Upload size={15} />
            {uploading ? "Uploading private reference…" : "Upload private reference"}
          </button>
          <input
            ref={fileInput}
            className={styles.file}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Choose private reference image"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
          <small>
            Uploads a private project image up to 10 MiB. No image provider is called by upload.
            When generation is available, you can explicitly use it as a reference.
          </small>
        </>
      )}
      <p id="image-generation-availability">{unavailable}</p>
      {(error || generation.error) && (
        <p role="alert" className={styles.error}>
          {error || generation.error}
        </p>
      )}
      <button
        type="button"
        className={styles.generate}
        disabled={!allowed || !prompt.trim() || !aspectRatio || generation.busy || uploading}
        aria-describedby="image-generation-availability"
        onClick={() => {
          if (model && aspectRatio)
            void generation.generate({
              prompt,
              modelId: model.id,
              aspectRatio,
              referenceAssetId: model.referenceImage ? reference || null : null,
            });
        }}
      >
        <Sparkles size={17} />
        {generation.busy ? "Submitting…" : `Generate ${mode === "model3d" ? "3D asset" : mode}`}
      </button>
      <small>
        {allowed
          ? "Creates a project image job. Provider usage may incur a charge. Your original images stay unchanged."
          : "No generation request or charge is created while unavailable."}
      </small>
    </section>
  );
}
