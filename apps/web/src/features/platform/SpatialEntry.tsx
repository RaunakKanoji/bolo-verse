"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Box, Glasses, Monitor } from "lucide-react";
import { StudioProjectListSchema } from "@/lib/contracts/workspace";
import { PageHeader, EmptyState, ServiceNotice } from "./WorkspaceUI";
import { useWorkspaceData } from "./use-workspace-data";
import styles from "./platform.module.css";
export default function SpatialEntry() {
  const source = useWorkspaceData("projects", StudioProjectListSchema);
  const [capability, setCapability] = useState("Checking this browser…");
  useEffect(() => {
    let alive = true;
    const xr = (
      navigator as Navigator & { xr?: { isSessionSupported(mode: string): Promise<boolean> } }
    ).xr;
    if (!xr) {
      void Promise.resolve().then(() => {
        if (alive)
          setCapability("Desktop 3D is available. This browser has no immersive WebXR support.");
      });
      return () => {
        alive = false;
      };
    }
    void xr
      .isSessionSupported("immersive-vr")
      .then((supported) => {
        if (alive)
          setCapability(
            supported
              ? "This browser reports immersive VR support. Open a scene to check its available immersive controls."
              : "Immersive VR is unavailable in this browser. Use desktop 3D controls.",
          );
      })
      .catch(() => {
        if (alive)
          setCapability(
            "Immersive capability could not be checked. Desktop mode remains available.",
          );
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div className={styles.page}>
      <PageHeader
        title="Spatial Studio"
        description="Give your ideas more room. Arrange project assets on desktop, then explore supported browser XR experiences."
      />
      <div className={styles.grid}>
        <section className={styles.card}>
          <Monitor size={30} />
          <h2>Desktop 3D workspace</h2>
          <p>
            The canonical editor uses your authorized project assets and saved scene revision. Move,
            rotate, scale, undo and save explicitly.
          </p>
          <Link className={styles.button} href="/projects">
            Launch Spatial Studio
          </Link>
          <p>
            <a href="/workspace/demo">Try the desktop 3D demo</a>
          </p>
          <p className={styles.muted}>
            The procedural demo is local and does not create a project or save a private scene.
          </p>
        </section>
        <section className={styles.card}>
          <Glasses size={30} />
          <h2>Browser XR</h2>
          <p>{capability}</p>
          <Link className={styles.button} href="/xr/hud">
            Open spatial workspace
          </Link>
          <p className={styles.muted}>
            Explore the dashboard with spatial navigation, view presets and your connected project
            data.
          </p>
          <Link className={styles.secondary} href="/xr/preview">
            Open the public XR experience
          </Link>
          <p className={styles.muted}>
            The A-Frame runtime is separate from the desktop R3F editor. The native visionOS
            application remains its own platform target.
          </p>
        </section>
        <section className={styles.card}>
          <Box size={30} />
          <h2>Create a new scene</h2>
          <p>
            Start with a project and its verified models or images. New empty projects stay empty
            until you add actual assets.
          </p>
          <Link className={styles.secondary} href="/projects?new=true">
            Create a spatial project
          </Link>
        </section>
      </div>
      {!source.configured && (
        <ServiceNotice message="Connect your workspace to open private saved scenes. The desktop demo and public XR experience remain available." />
      )}
      <section>
        <div className={styles.sectionHeader}>
          <h2>Recent spatial projects</h2>
          <Link href="/projects">Open Existing Scene</Link>
        </div>
        {source.loading ? (
          <p role="status">Loading project scenes…</p>
        ) : source.error || source.denied ? (
          <div className={styles.card}>
            <p role="alert">
              Project scenes could not load. Check your account and connection, then retry.
            </p>
            <button className={styles.secondary} onClick={source.refresh}>
              Retry scenes
            </button>
          </div>
        ) : source.data?.projects.length ? (
          <div className={styles.grid}>
            {source.data.projects.slice(0, 8).map((project) => (
              <article className={styles.card} key={project.id}>
                <h3>{project.name}</h3>
                <p>{project.objective}</p>
                <a className={styles.button} href={`/workspace/${project.id}`}>
                  Open scene
                </a>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your scenes start with a project"
            description="Open an authorized project to arrange its assets. Saved scenes remain scoped to their project."
          >
            <Link className={styles.button} href="/projects">
              Choose a project
            </Link>
          </EmptyState>
        )}
      </section>
    </div>
  );
}
