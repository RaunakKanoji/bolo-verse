"use client";

import { useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Box, Film, ImageIcon, Mic2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  creativePromptLimit,
  type CreativeCapabilities,
  type CreativeDraftDocument,
  type CreativeMode,
} from "@/lib/contracts/shape";
import type { useCreativeDraft } from "./use-creative-services";
import styles from "./playground.module.css";

const modes = [
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "video", label: "Video", icon: Film },
  { id: "audio", label: "Audio", icon: Mic2 },
  { id: "model3d", label: "3D", icon: Box },
] as const;
type Props = {
  document: CreativeDraftDocument;
  projectId?: string;
  capabilities?: CreativeCapabilities;
  capabilityError: boolean;
  draft: ReturnType<typeof useCreativeDraft>;
  sourceDescription: string;
  setMode(mode: CreativeMode): void;
  setPrompt(mode: CreativeMode, prompt: string): void;
  upload(file: File): void;
};
export function PromptPanel({
  document,
  projectId,
  capabilities,
  capabilityError,
  draft,
  sourceDescription,
  setMode,
  setPrompt,
  upload,
}: Props) {
  const file = useRef<HTMLInputElement>(null);
  const { register, handleSubmit } = useForm<{ prompt: string }>({
    values: { prompt: document.prompts[document.mode] },
  });
  const capability = capabilities?.modes.find((mode) => mode.id === document.mode);
  const label = modes.find((mode) => mode.id === document.mode)?.label ?? "Image";
  return (
    <>
      <div className={styles.panelIntro}>
        <span className={styles.eyebrow}>Creative direction</span>
        <h2>Start with an idea.</h2>
        <p>Give your next creation a little shape.</p>
      </div>
      <fieldset className={styles.modes}>
        <legend className={styles.srOnly}>Creation mode</legend>
        {modes.map(({ id, label: name, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={document.mode === id}
            disabled={draft.busy}
            onClick={() => setMode(id)}
          >
            <Icon size={18} aria-hidden="true" />
            <span>{name}</span>
          </button>
        ))}
      </fieldset>
      <form onSubmit={handleSubmit(() => void draft.save())} className={styles.promptForm}>
        <label htmlFor="creative-prompt">{label} prompt</label>
        <textarea
          id="creative-prompt"
          rows={6}
          maxLength={creativePromptLimit}
          placeholder={`Describe the ${document.mode === "model3d" ? "3D object" : document.mode} you have in mind…`}
          disabled={draft.busy || !draft.canEdit}
          {...register("prompt", {
            maxLength: creativePromptLimit,
            onChange: (event) => setPrompt(document.mode, event.target.value as string),
          })}
        />
        <div className={styles.metadata}>
          <span>Prompt draft</span>
          <span>
            {document.prompts[document.mode].length}/{creativePromptLimit}
          </span>
        </div>
        <label htmlFor="creative-model">Generation model</label>
        <select id="creative-model" disabled aria-describedby="generation-availability">
          <option>No model connected</option>
        </select>
        <p id="generation-availability" className={styles.supporting}>
          {capability?.reason ??
            (capabilityError
              ? "The capability catalog is unavailable. Generation is disabled until support can be verified."
              : "Checking generation capabilities. No generation model is active.")}
        </p>
        {projectId ? (
          <div className={styles.draftActions}>
            <Button
              className={styles.secondaryButton}
              variant="outline"
              type="submit"
              disabled={draft.busy || !draft.canEdit || !draft.dirty || draft.conflict}
            >
              {draft.busy ? "Please wait…" : "Save prompt draft"}
            </Button>
            <button
              className={styles.textButton}
              type="button"
              disabled={draft.busy}
              onClick={() => void draft.reload()}
            >
              Reload saved draft
            </button>
            <small>
              {!draft.canEdit && !draft.busy
                ? "View-only project access."
                : draft.dirty
                  ? "Unsaved prompt changes"
                  : `Saved prompt revision ${draft.revision}`}
            </small>
          </div>
        ) : (
          <p className={styles.supporting}>
            Prompts stay in this workspace tab. <Link href="/app/projects">Open a project</Link> to
            save a draft.
          </p>
        )}
        {draft.error && (
          <p className={styles.error} role="alert">
            {draft.error}
            {draft.conflict &&
              " Reload the saved draft before saving again. Your text has been kept here."}
          </p>
        )}
        {draft.notice && (
          <p className={styles.supporting} role="status">
            {draft.notice}
          </p>
        )}
      </form>
      {document.mode === "image" && (
        <section className={styles.sourceSection} aria-label="Source image">
          <h3>Reference & local canvas</h3>
          <p>{sourceDescription}</p>
          <Button
            className={styles.secondaryButton}
            variant="outline"
            type="button"
            onClick={() => file.current?.click()}
          >
            <Upload size={16} />
            Choose local image
          </Button>
          <input
            ref={file}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Choose local image file"
            className={styles.file}
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) upload(selected);
              event.target.value = "";
            }}
          />
          <small>
            Static PNG, JPEG, WebP · up to 20 MiB. Local editing only; this file is not sent to AI.
          </small>
        </section>
      )}
      <div className={styles.generateArea}>
        <Button
          className={styles.generateButton}
          disabled
          aria-describedby="generation-availability"
        >
          <Sparkles size={18} />
          Generate {label === "3D" ? "3D asset" : label.toLowerCase()}
        </Button>
        <small>Generation is not connected. No job or charge is created.</small>
      </div>
    </>
  );
}
