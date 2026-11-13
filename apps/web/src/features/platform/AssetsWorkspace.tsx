"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  StudioAssetListSchema,
  StudioAssetSchema,
  StudioProjectListSchema,
  UpdateStudioAssetSchema,
  type StudioAsset,
} from "@/lib/contracts/workspace";
import ImageThumbnail from "@/features/projects/ProjectImageThumbnail";
import ProductionAssetUpload from "./ProductionAssetUpload";
import ProjectImageLibrary from "@/features/projects/ProjectImageLibrary";
import { useWorkspaceSession } from "./WorkspaceSession";
import { useWorkspaceData } from "./use-workspace-data";
import { DataState, Modal, dateLabel } from "./WorkspaceComponents";
import { PageHeader, EmptyState } from "./WorkspaceUI";
import { safeAssetUrl } from "./workspace-view-model";
import styles from "./platform.module.css";
import own from "./workspace-screens.module.css";
function AssetPreview({ asset, onAccessLost }: { asset: StudioAsset; onAccessLost: () => void }) {
  const summary = useMemo(
    () => ({
      ...asset,
      durationSeconds: null,
      contentUrl: safeAssetUrl(asset.contentUrl),
      nativeContentUrl: safeAssetUrl(asset.nativeContentUrl),
    }),
    [asset],
  );
  return asset.category === "image" && summary.contentUrl ? (
    <ImageThumbnail asset={summary} number={1} label={asset.name} onAccessLost={onAccessLost} />
  ) : (
    <div className={own.assetPreview}>
      {asset.category === "3d" ? "3D asset" : asset.category} · {asset.mimeType}
      <span>Preview unavailable for this format</span>
    </div>
  );
}
export default function AssetsWorkspace({
  initialProjectId = "",
  initialUpload = false,
}: {
  initialProjectId?: string;
  initialUpload?: boolean;
}) {
  const { sessionKey } = useWorkspaceSession();
  return (
    <AssetsSession
      key={sessionKey}
      initialProjectId={initialProjectId}
      initialUpload={initialUpload}
    />
  );
}
function AssetsSession({
  initialProjectId,
  initialUpload,
}: {
  initialProjectId: string;
  initialUpload: boolean;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId);
  const [collection, setCollection] = useState("");
  const [archived, setArchived] = useState(false);
  const [upload, setUpload] = useState(initialUpload);
  const [uploadProject, setUploadProject] = useState(initialProjectId);
  const [edit, setEdit] = useState<StudioAsset | null>(null);
  const [archive, setArchive] = useState<StudioAsset | null>(null);
  const [error, setError] = useState("");
  const query = new URLSearchParams({
    limit: "100",
    archived: String(archived),
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(projectId ? { projectId } : {}),
    ...(collection ? { collection } : {}),
  });
  const source = useWorkspaceData(`assets?${query}`, StudioAssetListSchema);
  const projects = useWorkspaceData("projects?limit=100", StudioProjectListSchema);
  const uploadChoice = projects.data?.projects.find((p) => p.id === uploadProject && p.canEdit);
  const mutate = async (asset: StudioAsset, fields: Record<string, unknown>) => {
    const parsed = UpdateStudioAssetSchema.safeParse({
      expectedRevision: asset.revision,
      ...fields,
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(" "));
      return null;
    }
    return source.mutate(
      `assets/${asset.id}`,
      z.object({ asset: StudioAssetSchema }),
      parsed.data,
      "PATCH",
    );
  };
  return (
    <div className={styles.page}>
      <PageHeader
        title="Asset Library"
        description="Find and organize the private assets behind your creative work."
      >
        <button className={styles.button} onClick={() => setUpload(true)}>
          Upload files
        </button>
      </PageHeader>
      <DataState {...source} />
      <div className={styles.toolbar}>
        <label className={styles.field}>
          Search assets
          <input
            type="search"
            value={search}
            maxLength={160}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset or project"
          />
        </label>
        <label className={styles.field}>
          Asset type
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documents</option>
            <option value="3d">3D Assets</option>
          </select>
        </label>
        <label className={styles.field}>
          Project
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All projects</option>
            {projects.data?.projects.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Collection
          <input
            value={collection}
            maxLength={120}
            onChange={(e) => setCollection(e.target.value)}
            placeholder="Filter by collection"
          />
        </label>
        <label className={styles.field}>
          Library view
          <select value={String(archived)} onChange={(e) => setArchived(e.target.value === "true")}>
            <option value="false">Active assets</option>
            <option value="true">Archived assets</option>
          </select>
        </label>
      </div>
      {source.data?.assets.length ? (
        <>
          <p className={styles.muted}>
            {source.data.assets.length} shown of {source.data.total}
            {source.data.total > 100 ? " · Refine filters to find more assets." : ""}
          </p>
          <div className={own.projectGrid}>
            {source.data.assets.map((asset) => (
              <article className={styles.card} key={asset.id}>
                <AssetPreview asset={asset} onAccessLost={source.revoke} />
                <div className={own.cardBody}>
                  <h2>{asset.name}</h2>
                  <Link href={`/projects/${asset.projectId}`}>{asset.projectName}</Link>
                  <p className={own.meta}>
                    {asset.category} · {(asset.byteSize / 1024 / 1024).toFixed(2)} MB ·{" "}
                    {dateLabel(asset.createdAt)}
                    {asset.width && asset.height ? ` · ${asset.width} × ${asset.height}` : ""}
                  </p>
                  <p className={styles.muted}>
                    Collection: {asset.collection || "Unfiled"}
                    {asset.archived ? " · Archived in library" : ""}
                  </p>
                  <div className={own.assetActions}>
                    {(safeAssetUrl(asset.downloadUrl) ||
                      safeAssetUrl(asset.contentUrl) ||
                      safeAssetUrl(asset.nativeContentUrl)) && (
                      <a
                        className={styles.secondary}
                        href={
                          safeAssetUrl(asset.downloadUrl) ||
                          safeAssetUrl(asset.contentUrl) ||
                          safeAssetUrl(asset.nativeContentUrl)!
                        }
                        download
                      >
                        Download asset
                      </a>
                    )}
                    <Link
                      className={styles.secondary}
                      href={`/app/projects/${asset.projectId}/assets/${asset.id}`}
                    >
                      Asset details
                    </Link>
                    {asset.canEdit && (
                      <>
                        <button
                          className={styles.secondary}
                          onClick={() => {
                            setEdit(asset);
                            setError("");
                          }}
                        >
                          Edit collection
                        </button>
                        <button className={styles.secondary} onClick={() => setArchive(asset)}>
                          {asset.archived ? "Restore" : "Archive"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title={
            search || category || projectId || collection
              ? "No matching assets"
              : archived
                ? "No archived assets"
                : "Your creative library starts here"
          }
          description="Upload supported files to an authorized project, then organize your images, video, finished WAV audio, documents and 3D assets into collections."
        >
          <button className={styles.button} onClick={() => setUpload(true)}>
            Upload project image
          </button>
        </EmptyState>
      )}
      {upload && !source.denied && (
        <Modal
          title="Upload project assets"
          onClose={() => {
            setUpload(false);
            source.refresh();
          }}
        >
          <p className={styles.muted}>
            Choose an editable project for verified private uploads. Supported files are checked on
            the server before they become ready assets.
          </p>
          <label className={styles.field}>
            Upload to project
            <select value={uploadProject} onChange={(e) => setUploadProject(e.target.value)}>
              <option value="">Choose a project</option>
              {projects.data?.projects
                .filter((p) => p.canEdit)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          {uploadChoice ? (
            <div key={uploadChoice.id}>
              <ProductionAssetUpload
                projectId={uploadChoice.id}
                onUploaded={source.refresh}
                onAccessLost={source.revoke}
              />
              <ProjectImageLibrary projectId={uploadChoice.id} canEdit />
            </div>
          ) : (
            <EmptyState
              title="Choose a project"
              description="An editable project is required so uploaded images stay private and authorized."
            >
              <Link href="/projects" className={styles.secondary}>
                Create or open a project
              </Link>
            </EmptyState>
          )}
        </Modal>
      )}
      {edit && !source.denied && (
        <Modal title="Edit collection" onClose={() => setEdit(null)}>
          <form
            className={own.dialogForm}
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await mutate(edit, {
                  collection: String(new FormData(e.currentTarget).get("collection")),
                })
              )
                setEdit(null);
            }}
          >
            <label className={styles.field}>
              Collection name
              <input name="collection" defaultValue={edit.collection} maxLength={120} />
            </label>
            <p className={styles.muted}>
              Leave empty to move this asset to Unfiled. This changes library metadata only.
            </p>
            {(error || source.error) && (
              <p className={styles.error} role="alert">
                {error || source.error}
              </p>
            )}
            <button className={styles.button} disabled={source.busy}>
              Save collection
            </button>
          </form>
        </Modal>
      )}
      {archive && !source.denied && (
        <Modal
          title={archive.archived ? "Restore asset" : "Archive asset"}
          onClose={() => setArchive(null)}
        >
          <p>
            {archive.archived ? "Restore" : "Archive"} “{archive.name}” in your library? Private
            files and published versions are retained. Existing project use stays intact.
          </p>
          {source.error && (
            <p className={styles.error} role="alert">
              {source.error}
            </p>
          )}
          <button
            className={styles.button}
            disabled={source.busy}
            onClick={async () => {
              if (await mutate(archive, { archived: !archive.archived })) setArchive(null);
            }}
          >
            {archive.archived ? "Restore asset" : "Confirm archive"}
          </button>
        </Modal>
      )}
    </div>
  );
}
