"use client";
import Link from "next/link";
import { useState } from "react";
import { Image, Clapperboard, Megaphone, Mic, Palette, Box } from "lucide-react";
import { StudioProjectListSchema, StudioAssetListSchema } from "@/lib/contracts/workspace";
import { ProjectBriefResultSchema } from "@/lib/contracts/project-briefs";
import { useWorkspaceSession } from "./WorkspaceSession";
import CreationVoice from "./CreationVoice";
import { useWorkspaceData } from "./use-workspace-data";
import { DataState, dateLabel } from "./WorkspaceComponents";
import { PageHeader, EmptyState } from "./WorkspaceUI";
import styles from "./platform.module.css";
import own from "./workspace-screens.module.css";
export default function CreationWorkspace({
  initialProjectId = "",
}: {
  initialProjectId?: string;
}) {
  const { sessionKey } = useWorkspaceSession();
  return <CreationSession key={sessionKey} initialProjectId={initialProjectId} />;
}
function CreationSession({ initialProjectId }: { initialProjectId: string }) {
  const source = useWorkspaceData("projects?limit=100", StudioProjectListSchema);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [format, setFormat] = useState("Poster / image");
  const project = source.data?.projects.find((project) => project.id === projectId);
  const editor = `/studio/create${project ? `?projectId=${project.id}` : ""}`;
  const brainstorm = `/brainstorm${project ? `?projectId=${project.id}` : ""}`;
  const modes = [
    {
      name: "Video Creation",
      icon: Clapperboard,
      description:
        "Arrange project clips, add titles and captions, and preview with the embedded Shotstack editor.",
      formats: "Image and video timelines · MP4 rendering when configured",
      href: `/create/video${project ? `?projectId=${project.id}` : ""}`,
    },
    {
      name: "Image Design",
      icon: Image,
      description: "Compose, crop, adjust and export images in the existing image canvas.",
      formats: "PNG · JPEG · WebP",
      href: editor,
    },
    {
      name: "Social Media Content",
      icon: Megaphone,
      description: "Shape campaign imagery with local image tools and project-aware prompts.",
      formats: "Image design · campaign concepts",
      href: editor,
    },
    {
      name: "Audio & Voice",
      icon: Mic,
      description:
        "Draft scripts and review speech transcripts in Brainstorm Studio. Audio editing is not connected.",
      formats: "Text · provider-confirmed transcription",
      href: brainstorm,
    },
    {
      name: "Brand Assets",
      icon: Palette,
      description:
        "Develop visual assets with the image canvas and keep requirements in your project brief.",
      formats: "Raster image design",
      href: editor,
    },
    {
      name: "Spatial Content",
      icon: Box,
      description:
        "Arrange authorized ready assets in the desktop 3D editor or explore the public demo.",
      formats: "Canonical project scene · supported 3D assets",
      href: project ? `/workspace/${project.id}` : "/spatial-studio",
    },
  ];
  return (
    <div className={styles.page}>
      <PageHeader
        title="Create something extraordinary."
        description="Choose how you want to bring your ideas to life."
      />
      <DataState {...source} />
      <section className={styles.card}>
        <h2>Choose your creative context</h2>
        <div className={styles.toolbar}>
          <label className={styles.field}>
            Creation project
            <select
              aria-label="Creation project"
              value={projectId}
              onChange={(e) => {
                if (window.dispatchEvent(new Event("shape-before-navigate", { cancelable: true })))
                  setProjectId(e.target.value);
              }}
            >
              <option value="">Local work · no saved project</option>
              {source.data?.projects.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            Content format
            <select
              aria-label="Content format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {[
                "Poster / image",
                "Social image",
                "Video concept",
                "Audio script",
                "Brand image",
                "Spatial scene",
              ].map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        </div>
        <p className={styles.muted}>
          {format} selected for planning. Choose output dimensions and export settings inside the
          editor.{" "}
          {project
            ? `Project: ${project.name}.`
            : "Local image editing is available without saving a project."}
        </p>
        <div className={styles.actions}>
          <Link
            className={styles.secondary}
            href={project ? `/assets?projectId=${project.id}` : "/assets"}
          >
            Browse asset library
          </Link>
          <Link className={styles.secondary} href={brainstorm}>
            Open AI assistant
          </Link>
          {project && (
            <Link className={styles.secondary} href={`/projects/${project.id}`}>
              Open project workspace
            </Link>
          )}
        </div>
      </section>
      <section className={own.projectGrid} aria-label="Creation modes">
        {modes.map((mode) => (
          <article className={styles.card} key={mode.name}>
            <mode.icon className={own.metricsIcon} aria-hidden="true" />
            <h2>{mode.name}</h2>
            <p>{mode.description}</p>
            <p className={styles.muted}>{mode.formats}</p>
            <Link className={styles.button} href={mode.href}>
              Start {mode.name}
            </Link>
          </article>
        ))}
      </section>
      {project && <ProjectCreationContext key={project.id} projectId={project.id} />}
      <CreationVoice projectId={project?.id} />
      <section className={styles.card}>
        <h2>Editing integrations</h2>
        <p>
          Use the image canvas, embedded Shotstack video timeline, Brainstorm Studio and browser
          recording tools. Cloud video rendering requires a configured server connection.
        </p>
        <div className={styles.grid}>
          <div>
            <h3>Shotstack</h3>
            <p className={styles.muted}>
              Embedded timeline and preview · render availability checked per project
            </p>
            <Link
              className={styles.secondary}
              href={`/create/video${project ? `?projectId=${project.id}` : ""}`}
            >
              Open video editor
            </Link>
          </div>
          {["IMG.LY", "Descript", "Adobe Express"].map((name) => (
            <div key={name}>
              <h3>{name}</h3>
              <span className={styles.badge}>Not connected</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function ProjectCreationContext({ projectId }: { projectId: string }) {
  const brief = useWorkspaceData(`/api/v1/projects/${projectId}/brief`, ProjectBriefResultSchema);
  const assets = useWorkspaceData(
    `assets?projectId=${projectId}&archived=false&limit=6`,
    StudioAssetListSchema,
  );
  return (
    <div className={styles.split}>
      <section className={styles.card}>
        <h2>Creative brief reference</h2>
        <DataState {...brief} />
        {brief.data?.brief ? (
          <>
            <h3>{brief.data.brief.title || brief.data.brief.product}</h3>
            <p>{brief.data.brief.objective}</p>
            <p className={styles.muted}>
              Audience: {brief.data.brief.audience} · Saved version {brief.data.version}
            </p>
          </>
        ) : (
          <p className={styles.muted}>
            No saved brief is available. Define the objective, audience and requirements in the
            project Brief tab.
          </p>
        )}
        <Link className={styles.secondary} href={`/projects/${projectId}?tab=brief`}>
          Open project brief
        </Link>
      </section>
      <section className={styles.card}>
        <h2>Recent project assets</h2>
        <DataState {...assets} />
        {assets.data?.assets.length ? (
          <ul className={styles.list}>
            {assets.data.assets.map((asset) => (
              <li key={asset.id}>
                <Link href={`/app/projects/${asset.projectId}/assets/${asset.id}`}>
                  {asset.name}
                </Link>
                <p className={styles.muted}>
                  {asset.category} · {dateLabel(asset.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No project assets yet"
            description="Upload a project asset to use it in your next creation."
          />
        )}
        <Link href={`/assets?projectId=${projectId}`} className={styles.secondary}>
          Open project assets
        </Link>
      </section>
    </div>
  );
}
