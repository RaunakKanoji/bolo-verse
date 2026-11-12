"use client";

import dynamic from "next/dynamic";

const StudioExperiment = dynamic(() => import("./StudioExperiment"), {
  ssr: false,
  loading: () => <p role="status">Preparing your local studio…</p>,
});

export default function StudioClient() {
  return <StudioExperiment />;
}
