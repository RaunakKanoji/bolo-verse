"use client";

import dynamic from "next/dynamic";
import type { WorkspaceProject } from "./serializers/scene-document";
import type { XRWorkspaceData } from "@/lib/contracts/xr-workspace";
import XRErrorBoundary from "./XRErrorBoundary";

export type XRWorkspaceProps = {
  project: WorkspaceProject;
  preview?: boolean;
  initialData?: XRWorkspaceData;
};

const XRWorkspaceClient = dynamic(() => import("./XRWorkspaceClient"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600"
    >
      Preparing the XR workspace…
    </div>
  ),
});

export default function XRWorkspace(props: XRWorkspaceProps) {
  return (
    <XRErrorBoundary key={props.project.id}>
      <XRWorkspaceClient {...props} />
    </XRErrorBoundary>
  );
}
