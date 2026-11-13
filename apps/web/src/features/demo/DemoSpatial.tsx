"use client";
import { useEffect, useRef, useState } from "react";
import type { SceneDocument } from "@/xr/serializers/scene-document";
import type { StudioAdapter } from "@/xr/runtime/studio-adapter";
import { useXRCapabilities } from "@/xr/useXRCapabilities";
import styles from "./demo.module.css";

export default function DemoSpatial({ document }: { document: SceneDocument }) {
  const host = useRef<HTMLDivElement>(null),
    adapter = useRef<StudioAdapter | null>(null);
  const [status, setStatus] = useState("Preparing synthetic spatial studio…");
  const [selected, setSelected] = useState(document.entities[0]);
  const [ready, setReady] = useState(false),
    [active, setActive] = useState(false),
    [pending, setPending] = useState(false);
  const { capabilities } = useXRCapabilities();
  useEffect(() => {
    let alive = true;
    let owned: StudioAdapter | undefined;
    void import("@/xr/runtime/studio-adapter")
      .then(async ({ StudioAdapter }) => {
        if (!alive || !host.current) return;
        owned = new StudioAdapter(
          host.current,
          {
            id: document.projectId,
            name: document.entities[0].properties.title,
            objective: document.entities[0].properties.body,
          },
          {
            onSelect: (entity) => {
              if (alive) setSelected(entity);
            },
            onSession: (value) => {
              if (alive) setActive(value);
            },
            onStats: () => {},
            onError: (message, fatal) => {
              if (alive) {
                setStatus(message);
                if (fatal) setReady(false);
              }
            },
          },
          document,
        );
        owned.setEditable(false);
        adapter.current = owned;
        await owned.initialize();
        if (alive) {
          setReady(true);
          setStatus("Synthetic spatial studio ready. Select a panel to read its details.");
        }
      })
      .catch(() => {
        owned?.dispose();
        if (alive)
          setStatus(
            "3D could not start in this browser. The project remains available in the walkthrough.",
          );
      });
    return () => {
      alive = false;
      adapter.current = null;
      owned?.dispose();
    };
  }, [document]);
  async function enter() {
    if (pending || !adapter.current) return;
    setPending(true);
    try {
      if (active) await adapter.current.exitVR();
      else await adapter.current.enterVR();
    } catch {
      setStatus("Headset entry is unavailable. Continue in the browser's 3D view.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div className={styles.root}>
      <p role="status">{status}</p>
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <button
          className={styles.primary}
          type="button"
          disabled={!ready || pending || (!active && !capabilities?.immersiveVRSupported)}
          onClick={enter}
        >
          {pending ? "Switching…" : active ? "Exit immersive view" : "Enter immersive view"}
        </button>
        <span className={styles.muted}>
          Desktop 3D is available where WebGL is supported. Vision Pro interaction requires a device
          rehearsal.
        </span>
      </div>
      <div
        ref={host}
        data-testid="demo-spatial-host"
        style={{
          height: "min(65vh,700px)",
          minHeight: 400,
          position: "relative",
          overflow: "hidden",
          borderRadius: 14,
          background: "#201c2b",
        }}
      />
      <div className={styles.columns}>
        <nav aria-label="Synthetic spatial panels">
          {document.entities.map((entity) => (
            <button
              key={entity.id}
              type="button"
              style={{
                display: "block",
                padding: 12,
                margin: 8,
                borderRadius: 8,
                textAlign: "left",
              }}
              onClick={() => {
                setSelected(entity);
                adapter.current?.select(entity.id);
              }}
            >
              {entity.properties.title}
            </button>
          ))}
        </nav>
        <article>
          <h2>{selected.properties.title}</h2>
          <p style={{ whiteSpace: "pre-line" }}>{selected.properties.body}</p>
        </article>
      </div>
    </div>
  );
}
