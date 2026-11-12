import CreativePlayground from "@/features/playground/CreativePlayground";

/** Preserve existing public and authorized asset-editor routes. */
export default function ImageCanvas(props: {
  assetId?: string;
  projectId?: string;
  authConfigured?: boolean;
}) {
  const authConfigured =
    props.authConfigured ??
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  return <CreativePlayground {...props} authConfigured={authConfigured} />;
}
