"use client";

import { useState } from "react";
import { ArrowDownToLine, BookmarkPlus, RotateCcw, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CreativeMode } from "@/lib/contracts/shape";
import { originalEdits, type EditSettings } from "./image-processing";
import styles from "./playground.module.css";

const controls = [
  { key: "brightness", label: "Brightness", min: 30, max: 170, step: 1, unit: "%" },
  { key: "contrast", label: "Contrast", min: 30, max: 170, step: 1, unit: "%" },
  { key: "saturation", label: "Saturation", min: 0, max: 200, step: 1, unit: "%" },
  { key: "softness", label: "Softness", min: 0, max: 4, step: 0.1, unit: "px" },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100, step: 1, unit: "%" },
] as const;
const presets = [
  { name: "Original", values: originalEdits },
  { name: "Sunlit", values: { brightness: 108, contrast: 104, saturation: 112, softness: 0 } },
  { name: "Soft", values: { brightness: 108, contrast: 90, saturation: 85, softness: 0.4 } },
  { name: "Vivid", values: { brightness: 100, contrast: 118, saturation: 125, softness: 0 } },
];
type Props = {
  mode: CreativeMode;
  edits: EditSettings;
  ready: boolean;
  exporting: boolean;
  notice: string;
  setEdits(patch: Partial<EditSettings>): void;
  reset(): void;
  capture(): void;
  download(): void;
};
export function EditingPanel({
  mode,
  edits,
  ready,
  exporting,
  notice,
  setEdits,
  reset,
  capture,
  download,
}: Props) {
  const [tab, setTab] = useState("Adjust");
  return (
    <>
      <div className={styles.panelIntro}>
        <span className={styles.eyebrow}>Make it yours</span>
        <h2>A little refinement.</h2>
        <p>Every adjustment stays in your browser.</p>
      </div>
      <div className={styles.editTabs} role="group" aria-label="Editing tools">
        {["Edit", "Adjust", "Enhance"].map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {mode !== "image" ? (
        <div className={styles.emptyPanel}>
          <Sparkles size={26} />
          <h3>Room for your next idea</h3>
          <p>
            Media editing for this mode is not connected. Switch to Image for local canvas tools.
          </p>
        </div>
      ) : (
        <>
          {tab === "Adjust" && (
            <div className={styles.adjustments}>
              <div className={styles.sectionHeading}>
                <h3>Light & color</h3>
                <button
                  type="button"
                  className={styles.textButton}
                  disabled={!ready}
                  onClick={reset}
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              </div>
              {controls.map((control) => (
                <div className={styles.sliderField} key={control.key}>
                  <label htmlFor={`edit-${control.key}`}>
                    {control.label}
                    <output htmlFor={`edit-${control.key}`}>
                      {edits[control.key]}
                      {control.unit}
                    </output>
                  </label>
                  <input
                    id={`edit-${control.key}`}
                    aria-label={control.label}
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={edits[control.key]}
                    disabled={!ready}
                    onChange={(event) => setEdits({ [control.key]: Number(event.target.value) })}
                  />
                </div>
              ))}
              <p className={styles.supporting}>
                Sharpness export supports crops up to 4 megapixels. Preview is scaled to fit.
              </p>
              <h3>Local presets</h3>
              <div className={styles.presets}>
                {presets.map((preset) => (
                  <button
                    type="button"
                    key={preset.name}
                    disabled={!ready}
                    onClick={() => setEdits(preset.values)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {tab === "Edit" && (
            <div className={styles.adjustments}>
              <h3>Composition</h3>
              <label className={styles.fieldLabel} htmlFor="image-crop">
                Centered crop
              </label>
              <select
                id="image-crop"
                disabled={!ready}
                value={edits.crop}
                onChange={(event) => setEdits({ crop: event.target.value as EditSettings["crop"] })}
              >
                <option value="original">Original dimensions</option>
                <option value="square">Square · 1:1</option>
                <option value="portrait">Portrait · 3:4</option>
                <option value="landscape">Landscape · 16:9</option>
              </select>
              <p className={styles.supporting}>
                The crop stays centered on the source image. Rotation is applied after cropping.
              </p>
              <div className={styles.rotation}>
                <button
                  type="button"
                  disabled={!ready}
                  aria-label="Rotate left 90 degrees"
                  onClick={() =>
                    setEdits({
                      rotation: ((edits.rotation + 270) % 360) as EditSettings["rotation"],
                    })
                  }
                >
                  <RotateCcw size={18} />
                </button>
                <output aria-label="Image rotation">{edits.rotation}°</output>
                <button
                  type="button"
                  disabled={!ready}
                  aria-label="Rotate right 90 degrees"
                  onClick={() =>
                    setEdits({
                      rotation: ((edits.rotation + 90) % 360) as EditSettings["rotation"],
                    })
                  }
                >
                  <RotateCw size={18} />
                </button>
              </div>
              <button type="button" className={styles.textButton} disabled={!ready} onClick={reset}>
                Reset all edits
              </button>
            </div>
          )}
          {tab === "Enhance" && (
            <div className={styles.emptyPanel}>
              <Sparkles size={26} />
              <h3>AI enhancements</h3>
              <p>
                Upscaling, background removal and generative edits need a supported provider and are
                not connected.
              </p>
              <button disabled className={styles.secondaryButton} type="button">
                AI enhance unavailable
              </button>
            </div>
          )}
          <div className={styles.exportArea}>
            <Button
              className={styles.secondaryButton}
              variant="outline"
              disabled={!ready}
              onClick={capture}
            >
              <BookmarkPlus size={16} />
              Capture local variant
            </Button>
            <small>Up to 8 edit snapshots in this tab. Original files stay unchanged.</small>
            <Button
              className={styles.downloadButton}
              disabled={!ready || exporting}
              onClick={download}
            >
              <ArrowDownToLine size={17} />
              {exporting ? "Exporting…" : "Download PNG"}
            </Button>
            <p role="status" aria-label="Image export status" className={styles.supporting}>
              {notice}
            </p>
          </div>
        </>
      )}
      <div className={styles.delivery}>
        <h3>Next steps</h3>
        <div>
          {["Share", "Save asset to project", "Add to moodboard", "Send for review"].map(
            (label) => (
              <button disabled type="button" key={label} title="Not connected in this workspace">
                {label}
              </button>
            ),
          )}
        </div>
        <small>
          Asset publishing and collaboration are not connected yet. Saving a prompt draft does not
          save an image.
        </small>
      </div>
    </>
  );
}
