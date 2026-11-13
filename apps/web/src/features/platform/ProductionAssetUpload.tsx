"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { FinalizedImageUploadResultSchema } from "@/lib/contracts/creation";
import { apiResultSchema } from "@/lib/contracts/api";
import styles from "./platform.module.css";
const supported: Record<string, string> = {
  pdf: "application/pdf",
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
  webm: "video/webm",
  mp4: "video/mp4",
  wav: "audio/wav",
};
export default function ProductionAssetUpload({
  projectId,
  onUploaded,
  onAccessLost,
}: {
  projectId: string;
  onUploaded: () => void;
  onAccessLost: () => void;
}) {
  const [choice, setChoice] = useState<{ file: File; key: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pending = useRef<AbortController | null>(null);
  const active = useRef(false);
  useLayoutEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      pending.current?.abort();
    };
  }, []);
  return (
    <section className={styles.card}>
      <h3>Production files</h3>
      <p>
        Upload a finished PDF, GLB, glTF, WebM, MP4 or PCM WAV file, up to 20 MiB. Images use the
        verified image upload below. Other audio formats are not supported.
      </p>
      <p className={styles.muted}>
        The library names these assets by type and identifier. Your original filename is not stored.
      </p>
      <form
        className={styles.form}
        onSubmit={async (e) => {
          e.preventDefault();
          if (!choice || busy) return;
          const type = Object.values(supported).includes(choice.file.type.split(";")[0])
            ? choice.file.type.split(";")[0]
            : supported[choice.file.name.split(".").at(-1)?.toLowerCase() ?? ""];
          if (!type || choice.file.size < 1 || choice.file.size > 20 * 1024 * 1024) {
            setError("Choose a supported production file between 1 byte and 20 MiB.");
            return;
          }
          const controller = new AbortController();
          pending.current = controller;
          setBusy(true);
          setError("");
          setNotice("");
          try {
            const query = new URLSearchParams({ projectId, idempotencyKey: choice.key });
            const response = await fetch(`/api/v1/workspace/uploads?${query}`, {
              method: "POST",
              credentials: "same-origin",
              cache: "no-store",
              redirect: "error",
              signal: AbortSignal.any([controller.signal, AbortSignal.timeout(120000)]),
              headers: { "Content-Type": type },
              body: choice.file,
            });
            if ([401, 403, 404].includes(response.status)) {
              onAccessLost();
              return;
            }
            const result = apiResultSchema(FinalizedImageUploadResultSchema).safeParse(
              await response.json(),
            );
            if (!result.success)
              throw new Error("The upload returned an unexpected response. Retry the same file.");
            if (!result.data.ok) throw new Error(result.data.error.message);
            if (!response.ok || result.data.data.asset.projectId !== projectId)
              throw new Error("The asset could not be verified for this project.");
            if (active.current && !controller.signal.aborted && pending.current === controller) {
              setNotice("Production asset uploaded and ready.");
              onUploaded();
            }
          } catch (reason) {
            if (active.current && !controller.signal.aborted && pending.current === controller)
              setError(
                reason instanceof Error
                  ? reason.message
                  : "The file could not be uploaded. Retry the same selected file.",
              );
          } finally {
            if (active.current && pending.current === controller) {
              pending.current = null;
              setBusy(false);
            }
          }
        }}
      >
        <label className={styles.field}>
          Choose production file
          <input
            type="file"
            accept=".pdf,.glb,.gltf,.webm,.mp4,.wav"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              setChoice(file ? { file, key: crypto.randomUUID() } : null);
              setError("");
              setNotice("");
            }}
          />
        </label>
        {busy && <p role="status">Uploading and validating your production file…</p>}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        <div className={styles.actions}>
          <button className={styles.button} disabled={!choice || busy}>
            {busy ? "Uploading…" : "Upload production file"}
          </button>
          {busy && (
            <button
              className={styles.secondary}
              type="button"
              onClick={() => {
                pending.current?.abort();
                pending.current = null;
                setBusy(false);
                setNotice("Upload cancelled. The selected file remains available for retry.");
              }}
            >
              Cancel production upload
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
