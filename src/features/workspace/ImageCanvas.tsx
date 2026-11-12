"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowLeft,
  Box,
  Contrast,
  ImageIcon,
  Layers3,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Upload,
  Waves,
} from "lucide-react";
import StudioShell from "./StudioShell";
import { useImageCanvas } from "./useImageCanvas";
import styles from "./image-canvas.module.css";

type Adjustments = { brightness: number; contrast: number; saturation: number; softness: number };
const original: Adjustments = { brightness: 100, contrast: 100, saturation: 100, softness: 0 };
const presets = [
  { name: "Original", values: original },
  { name: "Sunlit", values: { brightness: 108, contrast: 104, saturation: 112, softness: 0 } },
  { name: "Soft", values: { brightness: 108, contrast: 90, saturation: 85, softness: 0.4 } },
  { name: "Vivid", values: { brightness: 100, contrast: 118, saturation: 125, softness: 0 } },
];
const controls = [
  { key: "brightness", label: "Brightness", icon: Sun, min: 30, max: 170, step: 1 },
  { key: "contrast", label: "Contrast", icon: Contrast, min: 30, max: 170, step: 1 },
  { key: "saturation", label: "Saturation", icon: Waves, min: 0, max: 200, step: 1 },
  { key: "softness", label: "Softness", icon: SlidersHorizontal, min: 0, max: 4, step: 0.1 },
] as const;
const filterFor = (values: Adjustments) =>
  `brightness(${values.brightness}%) contrast(${values.contrast}%) saturate(${values.saturation}%) blur(${values.softness}px)`;

export default function ImageCanvas({
  assetId,
  projectId,
}: {
  assetId?: string;
  projectId?: string;
}) {
  const image = useImageCanvas(assetId);
  const [adjustments, setAdjustments] = useState<Adjustments>(original);
  const [compare, setCompare] = useState(false);
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const filter = filterFor(compare ? original : adjustments);
  const dirty = JSON.stringify(adjustments) !== JSON.stringify(original);
  async function download() {
    if (!image.image.current || exporting) return;
    setExporting(true);
    setNotice("");
    try {
      const source = image.image.current;
      const canvas = document.createElement("canvas");
      const sourceWidth = image.sample ? Math.floor(source.naturalWidth / 3) : source.naturalWidth;
      canvas.width = sourceWidth;
      canvas.height = source.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image export is unavailable in this browser.");
      if (!("filter" in context) && dirty)
        throw new Error(
          "This browser cannot export image adjustments. Try a current desktop browser.",
        );
      context.filter = filterFor(adjustments);
      context.drawImage(
        source,
        0,
        0,
        sourceWidth,
        source.naturalHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error("The PNG could not be exported."))),
          "image/png",
        ),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "boloverse-image-edit.png";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("PNG exported. Your original and project files are unchanged.");
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : "Export failed. Try again.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <StudioShell
      title="Creative canvas"
      action={
        projectId ? (
          <Link href={`/app/projects/${projectId}`} className={styles.back}>
            <ArrowLeft size={15} />
            Project
          </Link>
        ) : undefined
      }
    >
      <div className={styles.editor}>
        <aside className={styles.left}>
          <div className={styles.mode}>
            <ImageIcon size={20} />
            <span>Image</span>
            <span className={styles.local}>Local canvas</span>
          </div>
          <h1>Make it your own.</h1>
          <p className={styles.subtitle}>
            A little light. A different mood.
            <br />
            Space to explore your creative work.
          </p>
          <div className={styles.group}>
            <h2>Source image</h2>
            <p>
              {image.localUpload
                ? "Local upload. Nothing is uploaded to a server."
                : image.sample
                  ? "Original illustrative sample. Not a saved project asset."
                  : "Authorized project asset. Edits stay in this browser."}
            </p>
            <button className={styles.upload} type="button" onClick={() => file.current?.click()}>
              <Upload size={17} />
              Choose local image
            </button>
            <input
              ref={file}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label="Choose local image file"
              className={styles.file}
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) {
                  image.setUpload(selected);
                  setAdjustments(original);
                  setNotice("");
                  setCompare(false);
                }
                e.target.value = "";
              }}
            />
            <small>Static PNG, JPEG, WebP · up to 20 MiB</small>
          </div>
          <div className={styles.group}>
            <h2>Creative direction</h2>
            <p>
              For ideas, scripts, and storyboards, use the assistant in your project’s Spatial
              Studio.
            </p>
            <Link
              className={styles.assistantLink}
              href={projectId ? `/studio/xr/${projectId}` : "/studio/xr"}
            >
              <Sparkles size={17} />
              Open project assistant
            </Link>
          </div>
          <div className={styles.localNote}>
            <Box size={21} />
            <p>Take your assets into a spatial workspace. Arrange, inspect, and save a layout.</p>
            <Link href={projectId ? `/studio/xr/${projectId}` : "/xr/preview"}>
              Open Spatial Studio
            </Link>
          </div>
        </aside>
        <section className={styles.center} aria-label="Image canvas">
          <div className={styles.preview}>
            <div className={styles.previewTop}>
              <span>{image.sample ? "Illustrative sample" : image.name}</span>
              <span>{compare ? "Original" : "Preview"}</span>
            </div>
            {image.url && (
              <div
                className={`${styles.image} ${image.sample ? styles.sample : ""}`}
                role="img"
                aria-label="Image adjustment preview"
                style={{ backgroundImage: `url("${image.url}")`, filter }}
              />
            )}
            {image.loading && (
              <p className={styles.loading} role="status">
                Opening image…
              </p>
            )}
            {image.error && (
              <div className={styles.loading}>
                <p role="alert">{image.error}</p>
                <button type="button" onClick={image.retry}>
                  Retry image
                </button>
              </div>
            )}
            <div className={styles.previewActions}>
              <button
                type="button"
                disabled={!image.url}
                onClick={() => setCompare((v) => !v)}
                aria-pressed={compare}
              >
                <Layers3 size={17} />
                {compare ? "Show edits" : "Show original"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustments(original);
                  setCompare(false);
                  setNotice("");
                }}
                disabled={!dirty}
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
          <div className={styles.caption}>
            <span>{image.name}</span>
            <span>{dirty ? "Local changes · not saved" : "Original image"}</span>
          </div>
          <section className={styles.presets} aria-label="Image presets">
            <div className={styles.sectionHeading}>
              <h2>
                <Layers3 size={19} />
                Explore a mood
              </h2>
              <span>Local adjustments</span>
            </div>
            <div>
              {presets.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  aria-pressed={JSON.stringify(adjustments) === JSON.stringify(preset.values)}
                  onClick={() => {
                    setAdjustments(preset.values);
                    setCompare(false);
                  }}
                >
                  <span
                    className={`${styles.presetImage} ${image.sample ? styles.sample : ""}`}
                    style={{
                      backgroundImage: image.url ? `url("${image.url}")` : undefined,
                      filter: filterFor(preset.values),
                    }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </section>
        </section>
        <aside className={styles.right}>
          <section className={styles.adjustments}>
            <div className={styles.sectionHeading}>
              <h2>
                <SlidersHorizontal size={19} />
                Adjust image
              </h2>
              <span>Edit</span>
            </div>
            {controls.map(({ key, label, icon: Icon, min, max, step }) => (
              <label className={styles.control} key={key}>
                <span>
                  <Icon size={18} />
                  {label}
                  <output>
                    {adjustments[key]}
                    {key === "softness" ? "px" : "%"}
                  </output>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={adjustments[key]}
                  aria-label={label}
                  onChange={(e) => {
                    setAdjustments((current) => ({ ...current, [key]: Number(e.target.value) }));
                    setCompare(false);
                  }}
                />
              </label>
            ))}
          </section>
          <section className={styles.export}>
            <h2>
              <ArrowDownToLine size={20} />
              Ready when you are
            </h2>
            <p>Download your adjusted image as a PNG. The original asset is preserved.</p>
            <button
              type="button"
              disabled={!image.url || exporting}
              onClick={() => void download()}
            >
              <ArrowDownToLine size={18} />
              {exporting ? "Preparing PNG…" : "Download PNG"}
            </button>
            <p role="status" aria-label="Image export status" className={styles.notice}>
              {notice}
            </p>
          </section>
          <section className={styles.generation}>
            <Sparkles size={22} />
            <h2>From an idea to an image</h2>
            <p>
              Image generation isn’t connected. You can adjust an image here or brainstorm with your
              project assistant.
            </p>
            <Link href={projectId ? `/studio/xr/${projectId}` : "/studio/xr"}>
              Explore the assistant
            </Link>
          </section>
        </aside>
      </div>
    </StudioShell>
  );
}
