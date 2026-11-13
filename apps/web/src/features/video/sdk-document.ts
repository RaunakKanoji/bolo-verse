import { VideoEditorDocumentSchema, type VideoEditorDocument } from "@/lib/contracts/video-editor";
export type PreviewSources = Map<string, { url: string; mimeType: string }>;
export type SdkClip = {
  alias: string;
  start: number;
  length: number;
  asset: Record<string, unknown>;
  [key: string]: unknown;
};
export type SdkDocument = {
  timeline: { background: string; tracks: { clips: SdkClip[] }[] };
  output: { format: string; resolution: string; aspectRatio: string };
};
export const sdkBuiltInFontUrl =
  "https://fonts.gstatic.com/s/opensans/v44/mem8YaGs126MiZpBA-U1UpcaXcl0Aw.ttf";
function unsupported(): never {
  throw new Error(
    "Unsupported editor change. Use the bounded clip and text controls; your last valid edit is retained.",
  );
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : unsupported();
}
function keys(value: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(value).some((key) => !allowed.includes(key))) unsupported();
}
const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : unsupported();
const same = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  const l = object(left),
    r = object(right);
  return (
    Object.keys(l).length === Object.keys(r).length &&
    Object.keys(l).every((key) => same(l[key], r[key]))
  );
};
/** URLs exist only in this ephemeral SDK projection. Shape persistence receives asset IDs. */
export function documentToSdk(input: VideoEditorDocument, sources: PreviewSources): SdkDocument {
  const document = VideoEditorDocumentSchema.parse(input);
  return {
    timeline: {
      background: "#000000",
      tracks: [
        ...document.overlays.map((overlay) => ({
          clips: [
            {
              alias: overlay.id,
              start: overlay.startSeconds,
              length: overlay.durationSeconds,
              position: overlay.kind === "caption" ? "bottom" : "center",
              asset: {
                type: "rich-text",
                text: overlay.text,
                font: {
                  family: "Open Sans",
                  size: overlay.style.fontSize,
                  color: overlay.style.color,
                },
                align: {
                  horizontal: overlay.style.align,
                  vertical: overlay.kind === "caption" ? "bottom" : "middle",
                },
              },
            },
          ],
        })),
        {
          clips: document.clips.map((clip) => {
            const source = sources.get(clip.assetId);
            if (!source || !source.url.startsWith("blob:"))
              throw new Error(
                "A private source preview is unavailable. Reload the source catalog.",
              );
            return {
              alias: clip.id,
              start: clip.startSeconds,
              length: clip.durationSeconds,
              fit: "contain",
              asset: source.mimeType.startsWith("video/")
                ? {
                    type: "video",
                    src: source.url,
                    trim: clip.trimStartSeconds,
                    volume: clip.audioLevel,
                  }
                : { type: "image", src: source.url },
            };
          }),
        },
      ],
    },
    output: { format: "mp4", resolution: "hd", aspectRatio: document.aspectRatio },
  };
}
/** Reject every edit outside the v1 projection, including URLs, fonts and transforms. */
export function documentFromSdk(
  value: unknown,
  previous: VideoEditorDocument,
  sources: PreviewSources,
): VideoEditorDocument {
  const root = object(value);
  keys(root, ["timeline", "output"]);
  const output = object(root.output);
  keys(output, ["format", "resolution", "aspectRatio"]);
  if (output.format !== "mp4" || output.resolution !== "hd") unsupported();
  const timeline = object(root.timeline);
  keys(timeline, ["background", "tracks", "fonts"]);
  if (
    timeline.fonts !== undefined &&
    (!previous.overlays.length ||
      !Array.isArray(timeline.fonts) ||
      timeline.fonts.length !== 1 ||
      !same(timeline.fonts[0], { src: sdkBuiltInFontUrl }))
  )
    unsupported();
  if (timeline.background !== "#000000" || !Array.isArray(timeline.tracks)) unsupported();
  const baseline = documentToSdk(previous, sources);
  const identities = new Map(
    baseline.timeline.tracks.flatMap((track) => track.clips).map((clip) => [clip.alias, clip]),
  );
  const clips: VideoEditorDocument["clips"] = [],
    overlays: VideoEditorDocument["overlays"] = [],
    seen = new Set<string>();
  for (const trackValue of timeline.tracks) {
    const track = object(trackValue);
    keys(track, ["clips"]);
    if (!Array.isArray(track.clips)) unsupported();
    for (const clipValue of track.clips) {
      const clip = object(clipValue);
      keys(clip, ["alias", "start", "length", "asset", "fit", "position"]);
      if (typeof clip.alias !== "string" || seen.has(clip.alias)) unsupported();
      seen.add(clip.alias);
      const expected = identities.get(clip.alias);
      if (!expected) unsupported();
      const asset = object(clip.asset),
        expectedAsset = expected.asset;
      if (clip.fit !== expected.fit || clip.position !== expected.position) unsupported();
      const source = previous.clips.find((item) => item.id === clip.alias);
      if (source) {
        keys(
          asset,
          expectedAsset.type === "video" ? ["type", "src", "trim", "volume"] : ["type", "src"],
        );
        if (asset.type !== expectedAsset.type || asset.src !== expectedAsset.src) unsupported();
        clips.push({
          ...source,
          startSeconds: number(clip.start),
          durationSeconds: number(clip.length),
          trimStartSeconds: asset.type === "video" ? number(asset.trim) : source.trimStartSeconds,
          audioLevel: asset.type === "video" ? number(asset.volume) : source.audioLevel,
        });
      } else {
        keys(asset, ["type", "text", "font", "align"]);
        const overlay = previous.overlays.find((item) => item.id === clip.alias);
        if (!overlay) unsupported();
        if (
          asset.type !== "rich-text" ||
          !same(asset.font, expectedAsset.font) ||
          !same(asset.align, expectedAsset.align) ||
          typeof asset.text !== "string"
        )
          unsupported();
        overlays.push({
          ...overlay,
          text: asset.text,
          startSeconds: number(clip.start),
          durationSeconds: number(clip.length),
        });
      }
    }
  }
  const expectedPartitions = baseline.timeline.tracks
    .map((track) => track.clips.map((clip) => clip.alias).filter((id) => seen.has(id)))
    .filter((track) => track.length);
  const actualPartitions = timeline.tracks
    .map((track) => (object(track).clips as unknown[]).map((clip) => object(clip).alias))
    .filter((track) => track.length);
  if (JSON.stringify(expectedPartitions) !== JSON.stringify(actualPartitions)) unsupported();
  // Track reordering changes compositing semantics, which v1 cannot encode.
  const expectedOrder = baseline.timeline.tracks
    .flatMap((track) => track.clips.map((clip) => clip.alias))
    .filter((id) => seen.has(id));
  const actualOrder = timeline.tracks.flatMap((track) =>
    (object(track).clips as unknown[]).map((clip) => object(clip).alias),
  );
  if (JSON.stringify(expectedOrder) !== JSON.stringify(actualOrder)) unsupported();
  return VideoEditorDocumentSchema.parse({
    schemaVersion: 1,
    aspectRatio: output.aspectRatio,
    clips,
    overlays,
  });
}
