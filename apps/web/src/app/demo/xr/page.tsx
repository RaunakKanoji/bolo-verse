import Link from "next/link";
import type { Metadata } from "next";
import { demo } from "@/features/demo/snapshot";
import DemoSpatial from "@/features/demo/DemoSpatial";
import { createProjectDocument } from "@/xr/serializers/scene-document";
import type { XRProjectContent } from "@/lib/contracts/xr-workspace";
export const metadata: Metadata = {
  title: "Synthetic spatial demo",
  robots: { index: false, follow: false },
};
export default async function DemoXR({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const layout = demo.layouts.find((l) => l.id === query.layout) ?? demo.layouts[0];
  const p = demo.projects.find((p) => p.id === layout.projectId)!;
  const direction = p.directions.find((d) => d.selected)!;
  const content: XRProjectContent = {
    brief: {
      id: p.briefId,
      title: p.title,
      body: `Historical synthetic client brief.\n${p.brief.objective}\nAudience: ${p.brief.audience}\n${p.brief.keyMessage}\n${p.brief.brandRequirements}`,
      status: "proposed",
    },
    artifacts: [
      {
        id: direction.id,
        kind: "direction",
        title: direction.payload.title,
        body: `Selected synthetic direction.\n${direction.payload.concept}\n${direction.payload.visualTreatment}`,
      },
      {
        id: p.scripts[0].id,
        kind: "script",
        title: "Campaign script",
        body: p.scripts[0].payload.sections
          .map((s, n) => `${n + 1}. ${s.spokenText}\n${s.onScreenText}`)
          .join("\n\n"),
      },
      ...(p.storyboard
        ? [
            {
              id: p.storyboard.id,
              kind: "storyboard" as const,
              title: "Campaign storyboard",
              body: p.storyboard.payload.shots
                .map(
                  (s, n) =>
                    `${n + 1}. ${s.description}\n${s.framing} · ${s.durationSeconds}s\n${s.narration}`,
                )
                .join("\n\n"),
            },
          ]
        : []),
    ],
    assets: [], // Public demo uses text panels; private media APIs remain authenticated.
    reviews: demo.comments
      .filter((c) => c.projectId === p.id)
      .map((c) => ({
        id: c.id,
        kind: "comment",
        body: `Synthetic feedback: ${c.body}`,
        decision: null,
        contentVersionId: c.contentId,
        createdAt: c.createdAt,
      })),
  };
  const document = createProjectDocument(
    { id: p.id, name: p.title, objective: p.brief.objective },
    content,
    layout.layout,
  );
  return (
    <>
      <Link href={`/demo?project=${p.id}&view=5`}>Back to demo workspace</Link>
      <h1>{layout.title}</h1>
      <p>
        Fictional demo / {p.title}. Saved panel positions; read-only synthetic content. No login,
        voice capture or private project access.
      </p>
      <DemoSpatial document={document} />
    </>
  );
}
