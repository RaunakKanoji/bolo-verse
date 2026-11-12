# SHAPE STUDIO — CROSS-PLATFORM IMPLEMENTATION MASTER PROMPT

## ROLE AND OBJECTIVE

You are a principal full-stack engineer, senior Apple platform developer, spatial computing architect, AI systems engineer, and senior product designer.

Your task is to implement the complete Shape Studio application across:

1. Web browsers
2. Apple visionOS / Apple Vision Pro

Shape Studio is an AI-powered content creation and collaboration platform connecting creative professionals with micro, small, and medium enterprises (MSMEs).

The application allows creators to receive client briefs, brainstorm ideas, generate images and videos, create 3D product scenes, plan production, collaborate with clients, manage approvals, and deliver creative assets.

You must implement the 18 planned application screens as functional, connected product experiences.

The supplied design references are the primary visual specification.

Do not merely reproduce them as static images.

Build real components, real navigation, real data models, real state management, and real backend integrations.

Preserve existing functionality in the repository.

Do not replace working code without a justified reason.

---

# SECTION 1 — REPOSITORY AUDIT

Before modifying code:

1. Inspect the entire repository.
2. Identify the current application architecture.
3. Review installed dependencies.
4. Inspect database schemas.
5. Review authentication.
6. Inspect AI integrations.
7. Identify existing UI components.
8. Identify existing WebXR components.
9. Identify any native visionOS project.
10. Review deployment configuration.
11. Inspect tests.
12. Read existing context and specification files.

If the repository contains the six context files, read them:

- ai-workflow-rules.md
- architecture-context.md
- code-standards.md
- progress-tracker.md
- project-overview.md
- ui-context.md

Treat the existing repository as the source of truth.

Produce an audit report classifying each feature as:

- Implemented and tested
- Implemented but untested
- Partially implemented
- Mocked
- Missing
- Blocked

Do not assume previous prompts were fully implemented.

---

# SECTION 2 — TECHNOLOGY STACK

## Web

Use:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React
- Motion for React
- TanStack Query
- Zustand
- Zod
- React Hook Form
- Three.js
- React Three Fiber
- Drei

Use A-Frame only where a separate WebXR experience benefits from it.

Avoid having A-Frame and React Three Fiber compete for ownership of the same rendering canvas.

## visionOS

Use:

- Swift
- SwiftUI
- RealityKit
- ARKit where supported
- Reality Composer Pro
- Swift Concurrency
- Observation
- URLSession
- Codable
- Swift Package Manager

The visionOS application must be native.

Do not use a WebView as the primary application interface.

## Backend

Use the established backend architecture, preferably:

- Node.js / Next.js API
- Neon PostgreSQL
- Existing ORM
- Clerk
- Cloudflare R2
- Vercel
- Background job infrastructure

AI providers:

- Gemini
- Sarvam
- Other supported image, video, audio, and 3D generation providers

Use provider adapters.

Do not assume one provider supports every media type.

---

# SECTION 3 — MONOREPO STRUCTURE

If the existing repository supports migration without unnecessary disruption, organize it as:

```text
shape-studio/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   └── styles/
│   │
│   └── visionos/
│       ├── ShapeStudio.xcodeproj
│       ├── ShapeStudio/
│       │   ├── App/
│       │   ├── Core/
│       │   ├── Features/
│       │   ├── Spatial/
│       │   ├── Services/
│       │   ├── Models/
│       │   └── Resources/
│       └── Tests/
│
├── packages/
│   ├── database/
│   ├── api-contract/
│   ├── ai/
│   ├── storage/
│   ├── design-tokens/
│   └── shared-types/
│
├── docs/
├── context/
└── README.md
```

Do not move existing files solely to match this example.

Document the migration if structural changes are required.

Swift and TypeScript must share API contracts, not executable frontend components.

Use OpenAPI or an equivalent language-neutral contract.

---

# SECTION 4 — DESIGN SYSTEM

## Design direction

Use the attached Apple-inspired Shape Studio references.

The application should feel:

- Premium
- Minimal
- Calm
- Spatial
- Intelligent
- Professional
- Highly usable

## Colors

```css
:root {
  --background: #F7F8FC;
  --surface: #FFFFFF;
  --surface-secondary: #F0F2FA;

  --text-primary: #171923;
  --text-secondary: #697184;

  --accent-primary: #7C83FF;
  --accent-secondary: #AF62F5;
  --accent-soft: #E8E5FF;

  --border-subtle: rgba(95, 105, 145, 0.12);

  --glass-fill: rgba(255, 255, 255, 0.68);
  --glass-border: rgba(255, 255, 255, 0.72);

  --radius-card: 24px;
  --radius-panel: 28px;
  --radius-control: 14px;
}
```

Use semantic design tokens throughout the web application.

Export corresponding values for Swift.

For visionOS, prefer adaptive system materials and semantic colors over manually reproducing CSS glass effects.

## Typography

Web:
Geist or Inter.

visionOS:
Native system typography.

## Components

Implement reusable components:

- GlassPanel
- FloatingToolbar
- NavigationRail
- SpatialNavigationBar
- ProjectCard
- CampaignCard
- AssetCard
- MediaPreview
- PromptEditor
- ModelSelector
- AspectRatioSelector
- GenerationSettings
- GenerationHistory
- VariantSelector
- AIConversationPanel
- VoiceInputControl
- MoodboardCard
- StoryboardFrame
- TimelineTrack
- ReviewComment
- ApprovalControls
- DeliverableCard
- SceneInspector
- MaterialInspector
- LightingInspector

Create web and native implementations that follow the same visual principles but use platform-appropriate components.

---

# SECTION 5 — APPLICATION ROUTES

Implement the following web routes:

```text
/workspace
/create
/brainstorm
/projects
/projects/[projectId]
/projects/[projectId]/brief
/projects/[projectId]/assets
/projects/[projectId]/timeline
/projects/[projectId]/review
/projects/[projectId]/deliverables
/studio/image
/studio/video
/studio/audio
/studio/3d
/studio/production
/storyboard
/shot-planning
/assets
/brand-intelligence
/team
/clients
/clients/[clientId]
/reviews
/deliver
/profile
/settings
```

Use route groups and nested layouts where appropriate.

For visionOS, implement equivalent feature destinations using SwiftUI navigation, windows, volumes, and immersive spaces.

Do not force URL-style routing into native spatial navigation.

---

# SECTION 6 — SCREEN 01: CREATOR DASHBOARD

## Web

Create a responsive workspace with:

- Top navigation
- Left navigation rail
- Featured campaign
- Active projects
- Recent assets
- Upcoming deadlines
- Pending approvals
- Quick actions
- AI assistant entry point

Use glass panels and soft gradients.

The layout must work on desktop, tablet, and mobile.

## visionOS

Create a native SwiftUI workspace window.

Allow project details, media previews, and AI assistant content to open in separate windows.

Use native window management.

Do not simulate an entire desktop operating system inside one window.

## Functionality

Connect:

- Project API
- Asset API
- Review API
- Task API

Use loading, empty, error, and success states.

---

# SECTION 7 — SCREEN 02: AI BRAINSTORMING

## Web

Build an infinite creative canvas.

Support:

- Text nodes
- Image nodes
- Video references
- Campaign ideas
- Moodboards
- AI suggestions
- Connections
- Grouping
- Dragging
- Zooming
- Panning
- Undo and redo

Use a suitable canvas library.

## visionOS

Build a spatial brainstorming experience.

Allow selected ideas and references to appear as floating spatial panels.

Support arranging, selecting, grouping, and inspecting content.

Use RealityKit only where 3D or spatial rendering adds value.

Use SwiftUI for text-heavy panels.

## AI integration

Support prompts such as:

"Generate five campaign concepts for this MSME."

"Create a minimalist product photography moodboard."

"Turn the selected concept into a storyboard."

AI-generated changes must be previewed or accepted before being applied.

---

# SECTION 8 — SCREEN 03: AI IMAGE GENERATION

Implement the screenshot-inspired creative studio.

## Web layout

Left:
Prompt and generation settings.

Center:
Large image preview.

Right:
Editing controls, variants, and generation history.

## Features

- Prompt input
- Reference upload
- Model selection
- Style presets
- Aspect ratio
- Generation submission
- Progress tracking
- Result preview
- Version history
- Download
- Save to project
- Send for review

## visionOS

Create a floating generation window.

Allow the selected image to open in a larger preview window.

Place settings in a separate inspector when useful.

Support native selection and interaction.

Use the same generation API.

---

# SECTION 9 — SCREEN 04: VIDEO EDITING

## Web

Build a functional timeline editor.

Features:

- Video preview
- Clip library
- Multiple tracks
- Trim
- Split
- Reorder
- Audio tracks
- Text overlays
- Basic transitions
- Export workflow

Use an appropriate browser media architecture.

Do not assume that advanced editing can be implemented using only HTML video elements.

Use background rendering or a dedicated processing service where required.

## visionOS

Build a spatial video workstation.

Use SwiftUI and native media playback.

Provide:

- Large video preview
- Clip selection
- Timeline window
- Audio controls
- Export status

Prioritize review, assembly, and basic editing before advanced compositing.

Do not implement an overly complex 3D timeline solely for visual effect.

---

# SECTION 10 — SCREEN 05: 3D PRODUCT EDITOR

## Web

Use React Three Fiber and Drei.

Features:

- Model import
- Object selection
- Move
- Rotate
- Scale
- Duplicate
- Delete
- Scene hierarchy
- Material inspector
- Lighting presets
- Camera controls
- Save scene

## visionOS

Use RealityKit.

Provide a volumetric WindowGroup for 3D asset inspection.

Support:

- Selection
- Rotation
- Scaling
- Transform persistence
- Material presets
- Scene loading

Use native gestures.

Respect volume bounds.

Use USDZ or another supported asset representation.

---

# SECTION 11 — SCREEN 06: VIRTUAL PRODUCTION

## Web

Build a 3D scene composition environment.

Support:

- Product placement
- Camera presets
- Lighting
- Backgrounds
- Materials
- Scene hierarchy
- Composition guides
- Preview rendering

## visionOS

Implement an optional ImmersiveSpace.

Allow creators to compose scenes spatially.

Support:

- Multiple objects
- Object transforms
- Lighting presets
- Camera visualization
- Scene save and restore

Provide an explicit exit action.

Do not unexpectedly enter immersive mode.

---

# SECTION 12 — SCREEN 07: STORYBOARD PLANNER

## Web

Create:

- Storyboard grid
- Shot sequence
- Frame details
- Script notes
- Camera instructions
- Duration
- Reordering
- Export

## visionOS

Present storyboard frames in a comfortable spatial arrangement.

Allow users to inspect individual frames and rearrange sequences.

Keep text-heavy shot details in readable SwiftUI panels.

---

# SECTION 13 — SCREEN 08: CLIENT REVIEW

## Web

Implement:

- Submitted assets
- Version comparison
- Comments
- Image annotations
- Timestamped video feedback
- Revision requests
- Approval controls

## visionOS

Create a spatial review gallery.

Allow approved and pending versions to be compared.

Display comments near the relevant asset.

Do not assume simultaneous multiuser spatial sessions are available.

## Backend

Persist:

- Review status
- Reviewer identity
- Comments
- Asset version
- Approval decisions
- Audit history

---

# SECTION 14 — SCREEN 09: ASSET LIBRARY

## Web

Implement:

- Asset grid
- Search
- Filters
- Collections
- File metadata
- Preview
- Upload
- Download
- Version history

## visionOS

Implement a native asset browser.

Allow supported 3D assets to open in volumes.

Allow images and videos to open in dedicated preview windows.

Use signed URLs for private assets.

---

# SECTION 15 — SCREEN 10: CAMPAIGN MANAGER

## Web

Implement:

- Project timeline
- Tasks
- Milestones
- Assignments
- Deadlines
- Status tracking
- Deliverables

## visionOS

Use SwiftUI windows for planning and task management.

Allow selected milestones or campaign assets to be presented spatially.

Do not make ordinary form editing unnecessarily immersive.

---

# SECTION 16 — SCREENS 11–18

Implement the remaining screens using the same architecture.

## 11. AI Voice Assistant

Text and voice conversation.

Project-aware context.

Typed AI actions.

Clear microphone state.

## 12. Brand Intelligence

Brand guidelines.

Tone of voice.

Audience.

Color palette.

Visual references.

AI suggestions.

## 13. Shot Planning

Shot lists.

Camera framing.

Lighting references.

Equipment notes.

Location references.

## 14. Spatial Presentation

Web presentation mode.

Native immersive presentation gallery.

Asset sequencing.

Presentation controls.

## 15. Team Collaboration

Project membership.

Comments.

Assignments.

Activity feed.

Presence where supported.

## 16. Asset Export

Export presets.

File formats.

Resolution.

Delivery packages.

Signed download links.

## 17. Client Brief Intake

Structured brief forms.

Brand context.

Campaign objectives.

Reference uploads.

Budget and deadline fields.

## 18. Creator Profile

Portfolio.

Skills.

Account settings.

Notification preferences.

Organization membership.

---

# SECTION 17 — SHARED DATABASE

Design or extend the existing database with:

- User
- Organization
- OrganizationMember
- Client
- BrandKit
- Project
- ProjectMember
- CreativeBrief
- Campaign
- Task
- Milestone
- Asset
- AssetVersion
- GenerationJob
- GenerationOutput
- Moodboard
- MoodboardNode
- Storyboard
- StoryboardFrame
- SpatialScene
- SpatialObject
- Conversation
- ConversationMessage
- Review
- ReviewComment
- Approval
- Deliverable
- AuditEvent

Use organization-scoped authorization.

Use stable IDs.

Use migrations.

Do not delete existing production data.

---

# SECTION 18 — SHARED API

Use versioned endpoints.

Examples:

```text
GET    /api/v1/projects
POST   /api/v1/projects

GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id

GET    /api/v1/projects/:id/assets
POST   /api/v1/assets/upload-session

POST   /api/v1/generations
GET    /api/v1/generations/:id

POST   /api/v1/ai/conversations
POST   /api/v1/ai/conversations/:id/messages

GET    /api/v1/spatial-scenes/:id
PUT    /api/v1/spatial-scenes/:id

POST   /api/v1/reviews
POST   /api/v1/reviews/:id/comments
POST   /api/v1/reviews/:id/approve
```

Generate TypeScript and Swift API clients from a shared contract where practical.

Validate requests.

Enforce authorization.

Use structured errors.

Implement rate limiting.

---

# SECTION 19 — CROSS-PLATFORM SCENE MODEL

Use a canonical scene representation.

Example:

```json
{
  "schemaVersion": 1,
  "sceneId": "scene_001",
  "projectId": "project_001",
  "units": "meters",
  "coordinateSystem": "right-handed-y-up",
  "objects": [
    {
      "id": "object_001",
      "assetId": "asset_001",
      "position": [0, 0, -1],
      "rotation": [0, 0, 0, 1],
      "scale": [1, 1, 1],
      "visible": true
    }
  ]
}
```

Document coordinate conventions.

Use glTF/GLB for compatible web workflows.

Use USD/USDZ for compatible Apple workflows.

Implement conversion where necessary.

Preserve original assets.

Do not assume identical rendering across Three.js and RealityKit.

---

# SECTION 20 — AUTHENTICATION

Use the existing Clerk authentication infrastructure.

For visionOS, implement a supported native authentication flow compatible with the backend.

Investigate OAuth/OIDC with PKCE where appropriate.

Do not assume that a particular Clerk SDK supports visionOS without verification.

Store credentials securely.

Never embed backend secrets in the native app.

---

# SECTION 21 — AI SERVICE ARCHITECTURE

Create provider adapters for:

- Text generation
- Image generation
- Video generation
- Audio generation
- Speech recognition
- Speech synthesis
- 3D generation where available

Use a common job orchestration layer.

Every generation request must:

1. Validate input.
2. Check permissions.
3. Create a job.
4. Invoke the provider.
5. Track status.
6. Store output.
7. Persist metadata.
8. Notify clients.
9. Support retry or cancellation where available.

Do not expose provider API keys to clients.

Do not invent provider capabilities.

---

# SECTION 22 — PERFORMANCE

## Web

- Lazy-load 3D modules.
- Optimize images.
- Virtualize large asset lists.
- Minimize rerenders.
- Use background processing.
- Avoid blocking the main thread.
- Profile memory and rendering performance.

## visionOS

- Optimize models and textures.
- Load assets asynchronously.
- Limit scene complexity.
- Avoid unnecessary entity updates.
- Manage immersive scene lifecycle.
- Profile rendering performance.
- Test on physical hardware when available.

---

# SECTION 23 — ACCESSIBILITY

Web:

- WCAG 2.2 AA target
- Keyboard navigation
- Screen-reader labels
- Reduced-motion support
- Visible focus states
- Readable contrast

visionOS:

- Native accessibility labels
- Comfortable target sizes
- Appropriate spatial distances
- Reduced-motion support
- Native interaction conventions
- Accessible alternatives to complex gestures

---

# SECTION 24 — TESTING

Implement:

- Unit tests
- Component tests
- API integration tests
- End-to-end web tests
- Swift unit tests
- visionOS simulator tests
- Device validation where available

Test:

- Authentication
- Tenant isolation
- Project creation
- Asset uploads
- AI generation
- Scene serialization
- Scene persistence
- Reviews
- Approvals
- Export
- Network failures
- Permission failures

Do not claim physical-device validation unless performed.

---

# SECTION 25 — PHASED IMPLEMENTATION

## Phase 0 — Audit

Inspect repository.

Produce gap analysis.

## Phase 1 — Foundation

Shared design tokens.

API contracts.

Database.

Authentication.

Storage.

## Phase 2 — Web core

Dashboard.

Projects.

Asset library.

Client briefs.

## Phase 3 — AI creation

Image generation.

AI assistant.

Generation history.

## Phase 4 — Collaboration

Brainstorming.

Review.

Approvals.

Campaign management.

## Phase 5 — Web production

3D editor.

Storyboard.

Shot planning.

Basic video workflow.

## Phase 6 — Native visionOS foundation

Native project.

SwiftUI workspace.

Authentication.

Project API.

Asset browser.

## Phase 7 — Native spatial capabilities

RealityKit viewer.

Volumes.

Scene persistence.

Spatial interaction.

## Phase 8 — Immersive production

ImmersiveSpace.

Spatial moodboards.

Virtual production.

Presentation mode.

## Phase 9 — Remaining features

Voice.

Brand intelligence.

Advanced editing.

Export.

Team collaboration.

## Phase 10 — Quality assurance

Testing.

Performance.

Accessibility.

Security.

Deployment.

---

# SECTION 26 — 24-HOUR PROTOTYPE PRIORITIES

If working under a 24-hour hackathon constraint, do not attempt the entire roadmap.

Prioritize one complete creator-to-client workflow:

1. Creator signs in.
2. Creator opens a project.
3. Creator reads the MSME brief.
4. Creator brainstorms with AI.
5. Creator generates an image.
6. Creator saves it to the project.
7. Creator opens a 3D asset preview.
8. Creator submits work for review.
9. Client comments or approves.

Web is the primary functional platform.

For visionOS, prioritize:

- Native application shell
- Project browser
- Asset preview
- RealityKit volumetric viewer
- Shared API connection

Defer complex immersive editing and multiuser collaboration.

---

# SECTION 27 — IMPLEMENTATION STANDARDS

Use Conventional Commits.

Examples:

```text
chore(repo): configure cross-platform workspace

feat(design): implement shared visual tokens

feat(web): build creator dashboard

feat(ai): add generation job orchestration

feat(assets): implement media storage

feat(visionos): initialize native application

feat(spatial): implement volumetric asset viewer

feat(review): add approval workflow

test(api): verify project authorization
```

Maintain progress documentation.

Do not commit secrets.

Do not merge untested functionality as complete.

---

# FINAL EXECUTION INSTRUCTIONS

Start by auditing the repository.

Then implement Phase 1 and the initial web creative studio.

Do not attempt all 18 screens simultaneously.

For each phase:

1. Identify files to create or modify.
2. Implement functional components.
3. Connect the backend.
4. Add tests.
5. Run available checks.
6. Document limitations.
7. Update progress tracking.
8. Create meaningful commits.

The final product must feel like one coherent Shape Studio ecosystem, with a high-productivity web application and a genuinely spatial native visionOS experience.

Prioritize functionality, design consistency, accessibility, and maintainability.

Do not deliver a collection of disconnected UI mockups.
