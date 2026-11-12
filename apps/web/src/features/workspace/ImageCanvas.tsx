import CreativePlayground from "@/features/playground/CreativePlayground";

/** Preserve existing public and authorized asset-editor routes. */
export default function ImageCanvas(props: { assetId?: string; projectId?: string }) {
  return <CreativePlayground {...props} />;
}
