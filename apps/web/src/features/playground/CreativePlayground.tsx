"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useStore } from "zustand";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StudioShell from "@/features/workspace/StudioShell";
import { useImageCanvas } from "@/features/workspace/useImageCanvas";
import { createPlaygroundStore, type PlaygroundStore } from "./playground-state";
import { exportImage, originalEdits } from "./image-processing";
import { useCreativeCapabilities, useCreativeDraft } from "./use-creative-services";
import { usePreviewImage } from "./use-preview-image";
import { ResponsivePanel } from "./ResponsivePanel";
import { PromptPanel } from "./PromptPanel";
import { PreviewViewport } from "./PreviewViewport";
import { EditingPanel } from "./EditingPanel";
import { LocalFilmstrip } from "./LocalFilmstrip";
import styles from "./playground.module.css";

type Props = { assetId?: string; projectId?: string };
function Workspace({ assetId, projectId, store }: Props & { store: PlaygroundStore }) {
  const state = useStore(store);
  const image = useImageCanvas(assetId);
  const capabilities = useCreativeCapabilities();
  const draft = useCreativeDraft(projectId, store, JSON.stringify(state.document));
  const [notice, setNotice] = useState("");
  const [exporting, setExporting] = useState(false);
  const exportingRef = useRef(false);
  const active = useRef(false);
  const downloads = useRef(new Set<string>());
  useEffect(() => {
    active.current = true;
    const urls = downloads.current;
    return () => {
      active.current = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);
  const preview = usePreviewImage(
    image.image,
    image.url,
    image.sample,
    state.compare ? originalEdits : state.edits,
  );
  async function download() {
    if (!image.url || !image.image.current || exportingRef.current) return;
    exportingRef.current = true;
    setExporting(true);
    setNotice("");
    try {
      const blob = await exportImage(
        image.image.current,
        { ...store.getState().edits },
        image.sample,
      );
      if (!active.current) return;
      const url = URL.createObjectURL(blob);
      downloads.current.add(url);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "shape-studio-image-edit.png";
      anchor.click();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        downloads.current.delete(url);
      }, 1000);
      setNotice("PNG exported. Your original and project files are unchanged.");
    } catch (reason) {
      if (active.current)
        setNotice(reason instanceof Error ? reason.message : "Export failed. Try again.");
    } finally {
      exportingRef.current = false;
      if (active.current) setExporting(false);
    }
  }
  const sourceDescription = image.localUpload
    ? "Local upload. Nothing is uploaded to a server."
    : image.sample
      ? "Original illustrative sample. Not a saved project asset."
      : "Authorized project asset. Edits stay in this browser.";
  return (
    <StudioShell
      title="AI Content Playground"
      action={
        projectId ? (
          <Link href={`/app/projects/${projectId}`} className={styles.back}>
            <ArrowLeft size={15} />
            Project
          </Link>
        ) : undefined
      }
    >
      <div className={styles.workspace}>
        <header className={styles.pageHeading}>
          <div>
            <span className={styles.eyebrow}>Your creative playground</span>
            <h1>Make it your own.</h1>
            <p>A little light. A new direction. Space to explore.</p>
          </div>
          <Link href={projectId ? `/studio/xr/${projectId}` : "/studio/xr"}>
            Project assistant
            <ArrowUpRight size={16} />
          </Link>
        </header>
        <div className={styles.columns}>
          <ResponsivePanel label="Prompt settings" side="left">
            <PromptPanel
              document={state.document}
              projectId={projectId}
              capabilities={capabilities.data}
              capabilityError={capabilities.isError}
              draft={draft}
              sourceDescription={sourceDescription}
              setMode={state.setMode}
              setPrompt={state.setPrompt}
              upload={(file) => {
                image.setUpload(file);
                state.resetSource();
                setNotice("");
              }}
            />
          </ResponsivePanel>
          <section className={styles.center} aria-label="Creative preview">
            <PreviewViewport
              mode={state.document.mode}
              projectId={projectId}
              url={preview.url}
              ratio={preview.ratio}
              name={image.name}
              sample={image.sample}
              loading={image.loading}
              error={image.error || preview.error}
              edits={state.edits}
              compare={state.compare}
              zoom={state.zoom}
              pan={state.pan}
              setCompare={state.setCompare}
              setZoom={state.setZoom}
              setPan={state.setPan}
              fit={state.fit}
              retry={image.retry}
            />
            {state.document.mode === "image" && (
              <LocalFilmstrip
                snapshots={state.snapshots}
                image={image.image}
                url={image.url}
                sample={image.sample}
                restore={state.restore}
              />
            )}
            {state.document.mode !== "image" && (
              <section className={styles.generationHistory} aria-label="Generation history">
                <h2>Generation history</h2>
                <p>No generation jobs. This mode is not connected to a generation provider.</p>
              </section>
            )}
          </section>
          <ResponsivePanel label="Image editing" side="right">
            <EditingPanel
              mode={state.document.mode}
              edits={state.edits}
              ready={Boolean(image.url) && !image.loading && !image.error}
              exporting={exporting}
              notice={notice}
              setEdits={state.setEdits}
              reset={state.resetEdits}
              capture={() => {
                state.capture();
                setNotice("Local variant captured. It is available in this tab only.");
              }}
              download={() => void download()}
            />
          </ResponsivePanel>
        </div>
      </div>
    </StudioShell>
  );
}
function ScopedPlayground(props: Props) {
  const [store] = useState(createPlaygroundStore);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0, refetchOnWindowFocus: false },
          mutations: { retry: false, gcTime: 0 },
        },
      }),
  );
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  return (
    <QueryClientProvider client={client}>
      <Workspace {...props} store={store} />
    </QueryClientProvider>
  );
}
export default function CreativePlayground(props: Props) {
  return (
    <ScopedPlayground
      key={`${props.projectId ?? "local"}:${props.assetId ?? "sample"}`}
      {...props}
    />
  );
}
