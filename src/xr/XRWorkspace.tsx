"use client";

import dynamic from "next/dynamic";
import type { WorkspaceProject } from "./serializers/scene-document";

export type XRWorkspaceProps = { project: WorkspaceProject; preview?: boolean };

const XRWorkspaceClient = dynamic(() => import("./XRWorkspaceClient"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-sm text-slate-300"
    >
      Preparing the XR workspace…
    </div>
  ),
});

export default function XRWorkspace(props: XRWorkspaceProps) {
  return <XRWorkspaceClient key={props.project.id} {...props} />;
}
