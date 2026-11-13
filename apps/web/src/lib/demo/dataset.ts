import { createHash } from "node:crypto";
import {
  BriefPayloadSchema,
  DirectionPayloadSchema,
  ScriptPayloadSchema,
  StoryboardPayloadSchema,
  type ScriptPayload,
} from "@/lib/contracts/documents";
import { BrainstormStudioContentSchema } from "@/lib/contracts/brainstorm-studio";
import { XRLayoutSchema } from "@/lib/contracts/xr-workspace";
import {
  profiles,
  clientDefinitions,
  projectDefinitions,
  DEMO_REFERENCE_DATE,
  DEMO_SLUG,
} from "./catalog";

export function demoId(slug: string, key: string) {
  const bytes = createHash("sha256")
    .update(`shape-demo:v1:${slug}:${key}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 0x80;
  bytes[8] = (bytes[8] & 63) | 0x80;
  const h = bytes.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const featuredShots = [
  {
    duration: 5,
    visual: "A young professional arrives home after a long day.",
    voice: "Kuch pal bas apno ke naam.",
    framing: "Medium doorway shot",
    movement: "Slow push-in",
    overlay: "",
  },
  {
    duration: 5,
    visual: "Friends prepare chai together.",
    voice: "Aur kuch khushiyan ek cup se shuru hoti hain.",
    framing: "Close-up of hands and kettle",
    movement: "Gentle lateral move",
    overlay: "",
  },
  {
    duration: 10,
    visual: "Quick montage of laughter, celebration, and sharing tea.",
    voice: "Har mulaqat, har muskaan, har yaad.",
    framing: "Wide gathering and warm close-ups",
    movement: "Rhythmic montage cuts",
    overlay: "",
  },
  {
    duration: 7,
    visual: "ChaiCraft tea being poured into cups.",
    voice: "ChaiCraft — har cup mein khushi.",
    framing: "Macro pour with label visible",
    movement: "Static pour shot",
    overlay: "Har Cup Mein Khushi",
  },
  {
    duration: 3,
    visual: "Product packshot and campaign tagline.",
    voice: "",
    framing: "Centred product packshot",
    movement: "Static",
    overlay: "Celebrate Together.",
  },
];
export function buildDemoDataset(options: { slug?: string; referenceDate?: string } = {}) {
  const slug = options.slug ?? DEMO_SLUG,
    referenceDate = options.referenceDate ?? DEMO_REFERENCE_DATE;
  const id = (key: string) => demoId(slug, key);
  const time = (day: number, hour = 10) =>
    new Date(
      Date.parse(`${referenceDate}T00:00:00.000Z`) + day * 86400000 + hour * 3600000,
    ).toISOString();
  const clients = clientDefinitions.map((c, i) => ({
    ...c,
    id: id(`client:${i}`),
    email: `${c.key}@example.invalid`,
    phone: "Not supplied (fictional contact)",
    logo: `/demo-assets/${c.key}-brand.png`,
    submittedAt: time(-29 + i),
    reviewStatus: [
      "In production",
      "Reviewing revision",
      "Approved",
      "Awaiting concepts",
      "Brief received",
    ][i],
  }));
  const projects = projectDefinitions.map((p, i) => {
    const c = clients[p.client],
      projectId = id(`project:${i}`),
      briefId = id(`brief:${i}`);
    const createdAt = time(-p.age),
      dueDate = time(p.due).slice(0, 10);
    const directions = [0, 1, 2].map((d) => ({
      id: id(`direction:${i}:${d}`),
      version: d + 1,
      selected: d === (i === 0 ? 2 : 0),
      payload: DirectionPayloadSchema.parse({
        kind: "direction",
        schemaVersion: 1,
        briefVersionId: briefId,
        title:
          i === 0
            ? ["Moments That Matter", "The First Sip", "Har Cup Mein Khushi"][d]
            : [p.concept, `${c.name}: Everyday rituals`, `${c.name}: A closer look`][d],
        hook:
          i === 0
            ? [
                "One invitation can turn a long day around.",
                "Your first sip. Your festive spark.",
                "Different cities. One shared cup.",
              ][d]
            : `${c.message} Open with a recognisable moment in the audience's day.`,
        concept:
          i === 0
            ? [
                "Friends and family share tea during festive celebrations; begin with a quiet arrival and build to a warm gathering.",
                "Fast cuts follow the joy of the first sip, with rhythmic edits and bold social captions.",
                "A multilingual festive story links friends across Indian cities through the simple act of sharing tea.",
              ][d]
            : `${p.concept}: show ${c.product.toLowerCase()} through a relatable everyday story, then end with an invitation to explore.`,
        visualTreatment: `${c.personality}. Palette ${c.colors.join(", ")}. ${d === 1 ? "Energetic close-ups and quick cuts" : "Natural light, human details and a clear product close"}.`,
        rationale: `Audience insight: ${c.audience} respond to specific, recognisable moments. ${d === (i === 0 ? 2 : 0) ? "Selected direction" : "Alternative direction, not selected"}; medium production complexity; 30-second master adapted for Reels and Shorts.`,
        constraints: [
          "Historical synthetic direction; no model request was made.",
          "Use original fictional brand assets only.",
          "Respect 9:16 safe areas and caption contrast.",
        ],
      }),
    }));
    const brief = BriefPayloadSchema.parse({
      schemaVersion: 1,
      title: p.title,
      objective:
        i === 0
          ? "Promote ChaiCraft's festive tea collection to young Indian consumers through emotionally engaging short-form content."
          : `Introduce ${c.product.toLowerCase()} through ${p.format.toLowerCase()} that makes ${c.message.toLowerCase()} tangible.`,
      audience: c.audience,
      product: c.product,
      format: "reel",
      aspectRatio: "9:16",
      tone: c.personality,
      language: i === 0 || c.key === "local" ? "hi-IN" : "en-IN",
      facts: [
        {
          id: id(`fact:${i}`),
          text: `${c.name} is a fictional ${c.industry.toLowerCase()} client for this demonstration.`,
        },
      ],
      prohibitedClaims: [
        "Unverified discounts, certifications or performance claims",
        "Invented customer testimonials",
      ],
      constraints: [
        "Only synthetic demonstration material; not cleared for real publication.",
        "No third-party copyrighted music or identifiable real people.",
        "Caption every spoken line and retain mobile safe margins.",
      ],
      brandRequirements: `Brand personality: ${c.personality}. Palette: ${c.colors.join(", ")}. Visual reference: original ${c.name} moodboard in the asset library.`,
      keyMessage: c.message,
      channels: ["Instagram Reels", "YouTube Shorts"],
      deadline: dueDate,
      notes: `Campaign overview: ${p.concept}.\nBusiness objective: build awareness with a clear product story.\nDeliverables: ${i === 0 ? "One 30-second advertisement; three 15-second reels; five promotional visuals; Hindi and English voiceovers; one five-scene storyboard." : "One 30-second master, two social cutdowns, three campaign visuals and caption copy."}\nVisual references: synthetic brand card and storyboard frames.\nTone: ${c.personality}.\nPlatform requirements: 1080×1920, 9:16, legible captions.\nBudget range: ${i === 0 ? "₹75,000; 14-day timeline" : "₹35,000–₹60,000; subject to fictional client review"}.\nSuccess metrics: proposed reach, completion rate and qualified enquiries; no measured results claimed.\nClient notes: make the product visible and the opening recognisable.\nAssigned creator: ${profiles.find((x) => x.id === c.creator)!.name}.\nProduction stage: ${p.stage}. All review states are synthetic.`,
    });
    const shots =
      i === 0
        ? featuredShots
        : [
            {
              duration: 5,
              visual: `Introduce the everyday challenge behind ${p.concept.toLowerCase()}.`,
              voice: `What would make your day a little simpler?`,
              framing: "Wide environmental shot",
              movement: "Slow push-in",
              overlay: p.concept,
            },
            {
              duration: 18,
              visual: `Show ${c.product.toLowerCase()} in use, with an unobstructed product detail and a human reaction.`,
              voice: `${c.name}. ${c.message}`,
              framing: "Medium action and product close-up",
              movement: "Controlled tracking",
              overlay: c.message,
            },
            {
              duration: 7,
              visual: `Close on an original ${c.name} brand card and clear invitation.`,
              voice: `Explore ${c.name}.`,
              framing: "Centred product and brand",
              movement: "Static",
              overlay: `Explore ${c.name}`,
            },
          ];
    const makeScript = (v: number) => ({
      id: id(`script:${i}:${v}`),
      version: v,
      language: v === 2 ? "en-IN" : brief.language,
      title: `${p.concept} · ${v === 2 ? "English adaptation" : "30-second master"}`,
      payload: ScriptPayloadSchema.parse({
        kind: "script",
        schemaVersion: 1,
        briefVersionId: briefId,
        directionVersionId: directions.find((d) => d.selected)!.id,
        sections: shots.map((s, n) => ({
          id: id(`section:${i}:${v}:${n}`),
          durationSeconds: s.duration,
          spokenText:
            i === 0 && v === 2
              ? [
                  "Some moments are just for our people.",
                  "Some joys begin with a cup.",
                  "Every meeting, every smile, every memory.",
                  "ChaiCraft. Happiness in every cup.",
                  "",
                ][n]
              : s.voice,
          onScreenText: s.overlay,
        })),
        callToAction: i === 0 ? "Celebrate Together." : `Explore ${c.name}`,
      }),
    });
    const scripts = [makeScript(1), ...(i < 3 ? [makeScript(2)] : [])];
    const storyboard =
      i < 10
        ? {
            id: id(`storyboard:${i}`),
            title: `${p.concept} · Shot plan`,
            payload: StoryboardPayloadSchema.parse({
              kind: "storyboard",
              schemaVersion: 1,
              scriptVersionId: scripts[0].id,
              shots: shots.map((s, n) => ({
                id: id(`shot:${i}:${n}`),
                durationSeconds: s.duration,
                framing: s.framing,
                cameraMovement: s.movement,
                description: s.visual,
                narration: s.voice,
                textOverlay: s.overlay,
                assetIds: [id(`asset:${i}:frame:${n}`)],
                lighting:
                  i === 0
                    ? "Saffron practicals, cream fill, deep brown shadows and muted gold highlights"
                    : `Soft key and brand accents: ${c.colors.join(", ")}`,
                shootingNotes: `Scene ${n + 1}. Original schematic placeholder frame; not generated photography. Cut on action; licensed music must be selected before production. ${n === 2 ? "Light laughter and room ambience." : "Gentle instrumental bed; no audio recording attached."}`,
              })),
            }),
          }
        : null;
    return {
      id: projectId,
      title: p.title,
      concept: p.concept,
      stage: p.stage as string,
      status:
        p.stage === "Completed" || p.stage === "Approved"
          ? ("completed" as const)
          : p.stage === "Client review"
            ? ("in_review" as const)
            : ("active" as const),
      priority: p.priority,
      format: p.format,
      clientId: c.id,
      creatorId: c.creator,
      createdAt,
      updatedAt: time(-Math.max(0, p.age - 5), 18),
      dueDate,
      briefId,
      brief,
      directions,
      scripts,
      storyboard,
      tasks: [
        "Confirm creative brief",
        "Select concept and script",
        "Prepare storyboard and previews",
        "Review and deliver",
      ].map((title, n) => ({
        id: id(`task:${i}:${n}`),
        title,
        status:
          n < (p.stage === "Completed" || p.stage === "Approved" ? 4 : p.age > 10 ? 2 : 1)
            ? ("done" as const)
            : n === 2 && p.age > 10
              ? ("in_progress" as const)
              : ("todo" as const),
        dueDate,
        ownerLabel: profiles.find((x) => x.id === c.creator)!.name,
      })),
    };
  });
  const conversations = Array.from({ length: 20 }, (_, n) => {
    const p = projects[n % 12],
      c = clients.find((x) => x.id === p.clientId)!;
    return {
      id: id(`conversation:${n}`),
      projectId: p.id,
      title: `${p.concept} · ${n < 12 ? "Creative exploration" : "Platform adaptations"}`,
      createdAt: new Date(Date.parse(p.createdAt) + 3600000).toISOString(),
      messages: [
        {
          id: id(`message:${n}:0`),
          prompt:
            n === 0
              ? "Help me create a 30-second festive advertisement for ChaiCraft targeting Gen Z consumers in India."
              : `Help develop ${p.title} for ${c.audience.toLowerCase()}. Compare three creative approaches.`,
          content: BrainstormStudioContentSchema.parse({
            reply: `Historical synthetic AI conversation; no provider execution. ${n === 0 ? "Let's explore three creative directions that combine nostalgia, celebration, and modern Indian lifestyle." : `Let's connect ${c.name}'s product story to a recognisable moment.`}`,
            concepts: p.directions.map((d) => ({
              title: d.payload.title,
              targetAudience: p.brief.audience,
              coreMessage: c.message,
              contentFormat: "30-second master / 9:16 Reels and Shorts",
              creativeDirection: d.payload.concept,
              productionRequirements: [
                "Original brand assets",
                "Caption-safe framing",
                "Human-centred lighting",
              ],
              nextSteps: [
                "Compare the hook against the audience",
                "Select one direction",
                "Prepare a five-beat script",
              ],
            })),
          }),
        },
        {
          id: id(`message:${n}:1`),
          prompt:
            "Compare the hooks, refine the selected script, and recommend visual style, voiceover and platform adaptations.",
          content: BrainstormStudioContentSchema.parse({
            reply: `Historical synthetic response. Audience analysis: ${c.audience}. The selected concept, ${p.directions.find((d) => d.selected)!.payload.title}, balances product clarity and emotional recognition. Open within two seconds, keep the product visible by the midpoint, and close with one clear invitation. Use ${c.personality.toLowerCase()} imagery and ${c.language} voiceover. Adapt the 30-second story to a 15-second hook/product/CTA cut; retain captions for sound-off playback.`,
            concepts: [
              {
                title: "Selected production outline",
                targetAudience: c.audience,
                coreMessage: c.message,
                contentFormat: "Reel, Shorts and caption copy",
                creativeDirection: p.directions.find((d) => d.selected)!.payload.concept,
                productionRequirements: [
                  "Script timing rehearsal",
                  "Original placeholder shot plan",
                  "Voiceover recording pending",
                ],
                nextSteps: [
                  "Review storyboard timing",
                  "Prepare bilingual caption copy",
                  "Request fictional client feedback",
                ],
              },
            ],
          }),
        },
      ],
    };
  });
  const categories = [
    "Social graphic",
    "Video concept",
    "Video preview",
    "Product advertisement",
    "Voiceover preparation",
    "Thumbnail",
    "Promotional banner",
    "Campaign copy",
    "Storyboard frame",
    "Caption",
  ];
  const content = Array.from({ length: 40 }, (_, n) => {
    const p = projects[n % 12],
      c = clients.find((x) => x.id === p.clientId)!;
    return {
      id: id(`content:${n}`),
      projectId: p.id,
      version: Math.floor(n / 12) + 1,
      title: `${p.concept} · ${categories[n % 10]}`,
      category: categories[n % 10],
      status:
        n === 38 ? ("pending" as const) : n === 39 ? ("failed" as const) : ("complete" as const),
      provenance: "historical_synthetic" as const,
      provider: null,
      providerJobId: null,
      cost: null,
      assetId: n >= 38 ? null : id(`asset:${n % 12}:content:${Math.floor(n / 12)}`),
      preview:
        n >= 38 ? null : `/demo-assets/${c.key}-${n % 10 === 8 ? "frame-1" : "campaign"}.png`,
      source: `${p.concept}. ${c.message} ${n % 10 === 2 ? "Video concept card only; playable video is unavailable." : n % 10 === 4 ? "Voiceover script only; speech synthesis is unavailable." : "Original synthetic preview; not a model-generated result."}`,
      createdAt: new Date(
        Date.parse(p.createdAt) + (3 + Math.floor(n / 12) * 8) * 3600000,
      ).toISOString(),
    };
  });
  const comments = Array.from({ length: 24 }, (_, n) => {
    const p = projects[n % 12],
      outputs = content.filter((x) => x.projectId === p.id && x.status === "complete");
    const output = outputs[n < 12 ? 0 : Math.min(1, outputs.length - 1)];
    return {
      id: id(`comment:${n}`),
      projectId: p.id,
      contentId: output.id,
      contentVersion: output.version,
      author:
        n < 12
          ? clients.find((x) => x.id === p.clientId)!.contact
          : profiles.find((x) => x.id === p.creatorId)!.name,
      body:
        n === 1
          ? "The overall visual direction looks excellent. Could we make the opening scene more energetic and increase the product visibility?"
          : n === 13
            ? "We've updated the opening sequence and extended the product-focused shots."
            : n < 12
              ? "The direction is promising. Keep the product label clear and simplify the opening caption."
              : "The revised preview brings the product forward and keeps the brand palette consistent.",
      createdAt: new Date(Date.parse(output.createdAt) + (n < 12 ? 2 : 4) * 3600000).toISOString(),
      synthetic: true as const,
    };
  });
  const decisions = [1, 2, 9].flatMap((index) => {
    const outputs = content.filter(
      (c) => c.projectId === projects[index].id && c.status === "complete",
    );
    return outputs
      .slice(0, 2)
      .map((output, n) => ({
        id: id(`decision:${index}:${n}`),
        projectId: output.projectId,
        contentId: output.id,
        decision: n === 0 ? ("changes_requested" as const) : ("approved" as const),
        reason:
          n === 0
            ? "Historical synthetic changes requested: increase product visibility and opening energy."
            : index === 1
              ? "Historical synthetic final approval: This version works much better. Approved for publishing."
              : "Historical synthetic final approval of the revised preview.",
        createdAt: new Date(
          Date.parse(output.createdAt) + (n === 0 ? 3 : 6) * 3600000,
        ).toISOString(),
        synthetic: true as const,
      }));
  });
  const commands = [
    ["Create a 30-second Instagram ad for ChaiCraft.", "CREATE_SCRIPT", "en-IN"],
    ["Translate this script into Hindi.", "TRANSLATE_SCRIPT", "en-IN"],
    ["Generate a Hindi voiceover for scene three.", "GENERATE_VOICEOVER", "en-IN"],
    ["Open the storyboard for the festive campaign.", "NAVIGATE_STORYBOARD", "en-IN"],
    ["Show me the client feedback.", "OPEN_CLIENT_REVIEWS", "en-IN"],
    ["Move scene three to the left panel.", "XR_MOVE_PANEL", "en-IN"],
    ["इस स्क्रिप्ट को हिंदी में दिखाओ।", "TRANSLATE_SCRIPT", "hi-IN"],
    ["चाय वाले दृश्य का स्टोरीबोर्ड खोलो।", "NAVIGATE_STORYBOARD", "hi-IN"],
    ["ಮೂರು ದೃಶ್ಯಗಳನ್ನು ತೋರಿಸಿ.", "NAVIGATE_STORYBOARD", "kn-IN"],
    ["Prepare an English voiceover draft.", "PREPARE_VOICEOVER", "en-IN"],
    ["Transcribe this campaign note.", "TRANSCRIBE", "en-IN"],
    ["Translate the caption into Kannada.", "TRANSLATE_COPY", "kn-IN"],
    ["Read the selected caption.", "TEXT_TO_SPEECH", "en-IN"],
    ["Show the approved version.", "OPEN_CLIENT_REVIEWS", "en-IN"],
    ["Keep the brief beside the storyboard.", "XR_MOVE_PANEL", "en-IN"],
  ];
  const voice = commands.map(([transcript, intent, language], n) => ({
    id: id(`voice:${n}`),
    projectId: projects[n < 6 ? 0 : n % 12].id,
    transcript,
    intent,
    language,
    parameters: { scene: n === 2 || n === 5 ? 3 : null, targetLanguage: n === 1 ? "hi-IN" : null },
    result: "Simulated history only; nothing executed. Live Sarvam is separate.",
    createdAt: time(-1, 8 + n / 2),
  }));
  const layouts = [
    "Creative Brainstorming Studio",
    "Storyboard Production Studio",
    "Client Review Studio",
  ].map((title, n) => {
    const p = projects[n === 2 ? 1 : n === 1 ? 7 : 0];
    return {
      id: id(`layout:${n}`),
      title,
      projectId: p.id,
      savedAt: time(-1),
      layout: XRLayoutSchema.parse({
        schemaVersion: 1,
        environment: "creative-studio",
        objects: [
          {
            id: "project-overview",
            type: "panel",
            transform: { position: [0, 2.3, -3.7], rotation: [0, 0, 0], scale: [1, 1, 1] },
          },
          {
            id: `brief-${p.briefId}`,
            type: "panel",
            transform: {
              position: [-2.3, 1.4, -3.2],
              rotation: [0, 15, 0],
              scale: [0.85, 0.85, 0.85],
            },
          },
          {
            id: `artifact-${n === 1 ? p.storyboard!.id : p.directions.find((d) => d.selected)!.id}`,
            type: "panel",
            transform: { position: [0, 1.3, -3.2], rotation: [0, 0, 0], scale: [0.85, 0.85, 0.85] },
          },
          ...(n === 2
            ? [
                {
                  id: "client-review",
                  type: "panel",
                  transform: {
                    position: [2.3, 1.3, -3.2],
                    rotation: [0, -15, 0],
                    scale: [0.85, 0.85, 0.85],
                  },
                },
              ]
            : []),
        ],
      }),
    };
  });
  return {
    schemaVersion: 1 as const,
    slug,
    referenceDate,
    provenance:
      "Fictional, historical synthetic demonstration data. No real model executions, uploads, identities or approvals.",
    profiles,
    clients,
    projects,
    conversations,
    content,
    comments,
    decisions,
    voice,
    layouts,
  };
}
export type DemoDataset = ReturnType<typeof buildDemoDataset>;
export type DemoScript = { id: string; version: number; title: string; payload: ScriptPayload };
