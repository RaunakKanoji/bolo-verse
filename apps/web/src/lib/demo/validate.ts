import { ArtifactPayloadSchema, BriefPayloadSchema } from "@/lib/contracts/documents";
import { BrainstormStudioContentSchema } from "@/lib/contracts/brainstorm-studio";
import { XRLayoutSchema } from "@/lib/contracts/xr-workspace";
import { z } from "zod";
import type { DemoDataset } from "./dataset";

export function validateDemoDataset(data: DemoDataset) {
  const errors: string[] = [];
  const check = (ok: unknown, message: string) => {
    if (!ok) errors.push(message);
  };
  const clients = new Set(data.clients.map((c) => c.id)),
    creators = new Set(data.profiles.map((c) => c.id));
  const projects = new Map(data.projects.map((p) => [p.id, p])),
    content = new Map(data.content.map((c) => [c.id, c]));
  const end = Date.parse(`${data.referenceDate}T23:59:59.999Z`);
  const ids = [
    ...data.clients,
    ...data.projects,
    ...data.conversations,
    ...data.content,
    ...data.comments,
    ...data.decisions,
    ...data.voice,
    ...data.layouts,
  ].map((x) => x.id);
  check(
    ids.length === new Set(ids).size && ids.every((id) => z.uuid().safeParse(id).success),
    "Resource identifiers must be unique UUIDs.",
  );
  for (const p of data.projects) {
    check(
      clients.has(p.clientId) && creators.has(p.creatorId),
      `${p.title}: missing client or creator.`,
    );
    check(
      BriefPayloadSchema.safeParse(p.brief).success &&
        Boolean(
          p.brief.notes &&
          p.brief.brandRequirements &&
          p.brief.deadline &&
          p.brief.keyMessage &&
          p.brief.channels?.length,
        ),
      `${p.title}: incomplete brief.`,
    );
    check(
      Date.parse(p.createdAt) >= end - 31 * 86400000 &&
        Date.parse(p.updatedAt) >= Date.parse(p.createdAt) &&
        Date.parse(p.updatedAt) <= end,
      `${p.title}: invalid project chronology.`,
    );
    check(
      p.directions.filter((d) => d.selected).length === 1,
      `${p.title}: select exactly one direction.`,
    );
    for (const d of p.directions)
      check(
        ArtifactPayloadSchema.safeParse(d.payload).success &&
          d.payload.briefVersionId === p.briefId,
        `${p.title}: invalid direction link.`,
      );
    for (const s of p.scripts)
      check(
        ArtifactPayloadSchema.safeParse(s.payload).success &&
          s.payload.briefVersionId === p.briefId &&
          p.directions.some((d) => d.id === s.payload.directionVersionId && d.selected),
        `${p.title}: invalid script link.`,
      );
    if (p.storyboard) {
      const board = p.storyboard.payload,
        script = p.scripts.find((s) => s.id === board.scriptVersionId)?.payload;
      check(
        ArtifactPayloadSchema.safeParse(board).success &&
          script &&
          board.shots.length === script.sections.length &&
          board.shots.every(
            (s, n) =>
              s.durationSeconds === script.sections[n].durationSeconds &&
              s.narration === script.sections[n].spokenText &&
              s.textOverlay === script.sections[n].onScreenText &&
              s.assetIds.length > 0,
          ),
        `${p.title}: storyboard and script disagree.`,
      );
    }
  }
  for (const session of data.conversations)
    check(
      projects.has(session.projectId) &&
        session.messages.length >= 2 &&
        session.messages.every((m) => BrainstormStudioContentSchema.safeParse(m.content).success),
      "Invalid conversation.",
    );
  for (const c of data.content)
    check(
      projects.has(c.projectId) &&
        c.provider === null &&
        c.providerJobId === null &&
        c.cost === null &&
        (c.status !== "complete" || Boolean(c.assetId && c.preview)),
      "Invalid synthetic content/provenance.",
    );
  for (const c of [...data.comments, ...data.decisions]) {
    const output = content.get(c.contentId);
    check(
      output &&
        output.projectId === c.projectId &&
        Date.parse(c.createdAt) >= Date.parse(output.createdAt) &&
        Date.parse(c.createdAt) <= end,
      "Review must follow submission of the same project/version.",
    );
  }
  for (const v of data.voice)
    check(
      projects.has(v.projectId) &&
        ["en-IN", "hi-IN", "kn-IN"].includes(v.language) &&
        /^[A-Z_]+$/.test(v.intent) &&
        v.result.includes("nothing executed"),
      "Invalid synthetic voice command.",
    );
  for (const l of data.layouts) {
    const p = projects.get(l.projectId);
    const known = new Set(
      p
        ? [
            "project-overview",
            "client-review",
            `brief-${p.briefId}`,
            ...p.directions.map((d) => `artifact-${d.id}`),
            ...p.scripts.map((s) => `artifact-${s.id}`),
            ...(p.storyboard ? [`artifact-${p.storyboard.id}`] : []),
          ]
        : [],
    );
    check(
      XRLayoutSchema.safeParse(l.layout).success && l.layout.objects.every((o) => known.has(o.id)),
      "Invalid XR layout content.",
    );
  }
  return {
    errors,
    counts: {
      profiles: data.profiles.length,
      clients: data.clients.length,
      projects: data.projects.length,
      briefs: data.projects.length,
      conversations: data.conversations.length,
      messages: data.conversations.reduce((n, s) => n + s.messages.length, 0),
      directions: data.projects.reduce((n, p) => n + p.directions.length, 0),
      scripts: data.projects.reduce((n, p) => n + p.scripts.length, 0),
      storyboards: data.projects.filter((p) => p.storyboard).length,
      content: data.content.length,
      voice: data.voice.length,
      comments: data.comments.length,
      decisions: data.decisions.length,
      layouts: data.layouts.length,
      tasks: data.projects.reduce((n, p) => n + p.tasks.length, 0),
    },
  };
}
