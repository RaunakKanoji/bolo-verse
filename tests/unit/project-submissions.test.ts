import { describe, expect, it } from "vitest";
import { ProjectSubmissionSchema, submissionBrief } from "@/lib/contracts/project-submissions";
import { submissionFileType } from "@/features/platform/project-submission-upload";
const input = {
  idempotencyKey: "b3000000-0000-4000-8000-000000000001",
  name: "Nova",
  description: "Launch campaign",
  brand: "Nova Coffee",
  contentType: "poster" as const,
  audience: "Professionals",
  objectives: "Introduce cold brew",
  deliverables: "Visual",
  channel: "Instagram",
  deadline: "2026-12-01",
  instructions: "Use logo",
};
describe("project submission boundary", () => {
  it("keeps every requirement in a valid v1 brief", () => {
    const brief = submissionBrief(ProjectSubmissionSchema.parse(input));
    expect(brief.notes).toContain(input.description);
    expect(brief.notes).toContain(input.deliverables);
    expect(brief.notes).toContain(input.instructions);
    expect(brief.format).toBe("poster");
  });
  it("rejects role claims, long inputs and invalid dates", () => {
    for (const extra of [
      { role: "editor" },
      { creatorId: "user" },
      { description: "x".repeat(2001) },
      { deadline: "2026-13-40" },
    ])
      expect(ProjectSubmissionSchema.safeParse({ ...input, ...extra }).success).toBe(false);
  });
  it("accepts only supported matching file extensions and MIME within bounds", () => {
    for (const [name, type] of [
      ["brief.pdf", "application/pdf"],
      ["brand.PNG", "image/png"],
      ["photo.jpeg", "image/jpeg"],
      ["clip.mp4", "video/mp4"],
      ["preview.webm", "video/webm"],
      ["model.glb", "model/gltf-binary"],
    ])
      expect(submissionFileType({ name, type, size: 42 })).toBe(type);
    expect(submissionFileType({ name: "brief.pdf", type: "", size: 42 })).toBe("application/pdf");
    for (const file of [
      { name: "brief.exe", type: "application/pdf", size: 42 },
      { name: "brief.pdf", type: "image/png", size: 42 },
      { name: "brief.pdf", type: "application/pdf", size: 0 },
      { name: "brief.pdf", type: "application/pdf", size: 20 * 1024 * 1024 + 1 },
    ])
      expect(() => submissionFileType(file)).toThrow();
  });
});
