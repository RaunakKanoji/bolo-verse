# MASTER IMPLEMENTATION PROMPT
## XR Creator Studio — A-Frame + WebXR Application

### 1. Role and engineering expectations

You are a principal software engineer, XR systems architect, senior Three.js developer, and product designer responsible for building a production-oriented prototype of an immersive creative collaboration platform.

Your task is to design and implement a working cross-platform XR application using **A-Frame, Three.js, WebXR, Next.js, TypeScript, and our existing application technology stack**.

The application is a unified creative workspace where content creators receive briefs from clients, brainstorm with AI assistants, develop creative concepts, manipulate spatial content, organize projects, and collaborate with clients in immersive environments.

Do not build a static VR showroom or a collection of disconnected 3D demonstrations.

Build a functional application with persistence, authentication, usable interactions, reusable components, meaningful workflows, and an extensible architecture.

### 2. Primary product vision

The platform should enable the following end-to-end experience:

1. A client creates a project and submits a creative brief.
2. A creator reviews the brief through the web dashboard.
3. The creator launches an immersive XR workspace associated with the project.
4. The creator interacts with a voice-powered AI assistant to brainstorm ideas.
5. The AI assistant helps develop concepts, scripts, shot lists, storyboards, and production recommendations.
6. The creator places images, videos, documents, and 3D objects inside the virtual environment.
7. The creator arranges and manipulates these objects using desktop input or XR controllers.
8. The workspace saves the scene and associated project data.
9. The creator submits a version of the work for client review.
10. The client can inspect the deliverables, comment, and approve or request revisions.

The application must be designed to accommodate future integrations with external content creation software, production intelligence systems, and more sophisticated AI agents.

### 3. Technical stack

Use the following technologies.

**Core application**
- Next.js with App Router
- TypeScript with strict type checking
- React
- Node.js runtime
- Tailwind CSS
- shadcn/ui

**XR and rendering**
- A-Frame as the primary immersive application framework
- Three.js as the underlying rendering engine
- WebXR Device API for immersive headset sessions
- A-Frame entity-component-system architecture
- Native A-Frame interaction components where appropriate
- glTF/GLB for 3D asset interchange

**Backend and infrastructure**
- Neon PostgreSQL
- Drizzle ORM or Prisma; select one and explain the choice
- Clerk for authentication
- Cloudflare R2 for uploaded media and 3D assets
- Vercel for deployment
- Zod for runtime schema validation

**AI services**
- Gemini for creative reasoning and structured AI responses
- Sarvam AI for speech-to-text and text-to-speech where supported
- Server-side AI orchestration
- Tool-based scene manipulation through validated commands

**Collaboration**
- Yjs or Liveblocks for realtime state synchronization
- A server-authoritative persistence layer
- Project-based access control

**Development**
- pnpm
- ESLint
- Prettier
- Vitest
- Playwright
- GitHub Actions

Use stable, compatible dependency versions. Verify actual APIs and library compatibility before implementation.

Do not add libraries solely because they appear in this specification. Prefer a smaller, maintainable dependency set.

---

# PART I — APPLICATION ARCHITECTURE

## 4. Application structure

Start with a single Next.js application containing a dedicated XR runtime.

Do not create unnecessary microservices during the MVP.

Use a modular architecture similar to:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── briefs/
│   │   ├── assets/
│   │   └── reviews/
│   ├── xr/
│   │   └── [projectId]/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   └── api/
│       ├── projects/
│       ├── briefs/
│       ├── scenes/
│       ├── assets/
│       ├── ai/
│       └── reviews/
├── components/
│   ├── ui/
│   ├── dashboard/
│   └── xr-shell/
├── features/
│   ├── authentication/
│   ├── projects/
│   ├── briefs/
│   ├── assets/
│   ├── storyboards/
│   ├── ai-assistant/
│   └── reviews/
├── xr/
│   ├── runtime/
│   ├── scenes/
│   ├── components/
│   ├── systems/
│   ├── interactions/
│   ├── entities/
│   ├── environments/
│   ├── controllers/
│   ├── ui/
│   └── serializers/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── storage/
│   ├── ai/
│   └── permissions/
├── server/
│   ├── services/
│   └── repositories/
├── schemas/
├── types/
└── tests/
```

Maintain strict boundaries between application business logic and the A-Frame rendering implementation.

A future migration to another XR renderer should not require rewriting the database, AI tools, project management, or collaboration services.

## 5. A-Frame runtime integration

A-Frame must be initialized only in the browser.

Implement:

- A client-only XR entry point.
- Safe runtime initialization.
- A single scene owner per mounted XR route.
- Correct registration of custom components and systems.
- Cleanup of event listeners and subscriptions.
- Proper teardown of scene-related resources.
- Loading and error states.
- Desktop fallback.
- XR capability detection.

Avoid importing browser-dependent A-Frame modules during server rendering.

Do not assume React can directly manage A-Frame's entity lifecycle without a defined integration strategy.

Create an adapter layer exposing methods such as:

```ts
interface XRSceneAdapter {
  initialize(): Promise<void>;
  loadScene(sceneId: string): Promise<void>;
  createEntity(input: SceneEntityInput): string;
  updateEntity(
    entityId: string,
    changes: SceneEntityPatch
  ): void;
  removeEntity(entityId: string): void;
  selectEntity(entityId: string): void;
  serializeScene(): SceneDocument;
  dispose(): void;
}
```

The adapter should coordinate between the application state and the A-Frame scene.

Use A-Frame's component lifecycle methods for custom components, including initialization, updates, and removal.

Register components once and ensure hot reload does not cause duplicate registration failures.

---

# PART II — XR ENVIRONMENT

## 6. Build the immersive creative studio

The initial virtual environment should resemble a modern creative production workspace.

It should feel like a usable professional studio rather than a gaming environment.

Create the following spatial zones:

### A. Main workspace

The primary workspace contains:

- Project overview panel
- Active creative brief
- Task overview
- Asset library
- AI assistant panel
- Spatial content canvas
- Navigation controls

### B. Brainstorming zone

A dedicated area for creative ideation.

Include:

- Concept cards
- AI-generated suggestions
- Moodboard panels
- Creative references
- Idea grouping
- Notes and annotations

### C. Storyboard zone

An interactive space for organizing visual content.

Include:

- Storyboard frames
- Scene descriptions
- Shot order
- Image references
- Video previews
- Scene annotations

### D. Asset gallery

An environment for reviewing uploaded assets.

Support:

- Images
- Video files
- GLB/glTF models
- Documents represented through preview cards
- Asset metadata
- Asset selection

### E. Client review area

A simplified environment for reviewing submitted creative work.

Include:

- Submitted deliverables
- Version information
- Comments
- Approval status
- Revision requests

For the MVP, these zones may be different layouts or modes inside a single virtual room. Do not create five separate complex environments unless the architecture requires them.

## 7. Visual direction

Use a minimal, professional spatial interface.

Design characteristics:

- Dark neutral environment
- Soft environmental lighting
- Subtle blue and violet accents
- Rounded spatial panels
- High-contrast typography
- Clean iconography
- Consistent spacing
- Minimal visual clutter
- Restrained animations

Avoid excessive neon effects, distracting particles, and decorative elements that reduce performance or readability.

Use physically meaningful scale.

One A-Frame world unit should correspond to approximately one meter.

Place primary content at comfortable viewing distances and provide repositioning controls.

Do not rely exclusively on color to communicate state.

## 8. Spatial user interface components

Build reusable spatial components.

Required components:

```text
XRPanel
XRButton
XRText
XRIcon
XRCard
XRImage
XRVideo
XRModelViewer
XRToolbar
XRModal
XRNotification
XRLoadingIndicator
XRAssetBrowser
XRProjectOverview
XRBriefPanel
XRStoryboardFrame
XRAssistantPanel
```

Each component must support appropriate interaction states:

- Default
- Hover or focus
- Selected
- Disabled
- Loading
- Error

Implement interaction feedback using subtle material changes, highlighting, or animation.

For text-heavy operations, provide a companion 2D interface instead of forcing complex forms into VR.

---

# PART III — INTERACTION SYSTEM

## 9. Cross-platform interaction

Support three interaction modes.

### Desktop mode

Users should be able to interact without a headset.

Implement:

- Mouse selection
- Pointer raycasting
- Keyboard navigation
- Camera movement
- Object inspection
- Dragging and repositioning
- Zoom or distance controls
- Accessible alternatives for critical actions

### VR controller mode

Implement:

- Controller raycasting
- Trigger-based selection
- Object grabbing
- Object placement
- Object rotation
- Teleportation
- UI interaction

Use supported A-Frame controller components and input events.

Do not assume controller mappings are identical across headsets.

### Hand tracking

Design an abstraction for future hand tracking.

For the MVP, implement hand tracking only where reliably supported by the target headset and browser.

Provide controller-based fallbacks.

## 10. Object manipulation

Users must be able to:

1. Select an object.
2. Move it.
3. Rotate it.
4. Scale it within defined limits.
5. Duplicate it.
6. Delete it.
7. Reset its transform.
8. Save changes.

Define a consistent manipulation state machine:

```text
IDLE
  ↓
HOVERED
  ↓
SELECTED
  ↓
MANIPULATING
  ↓
COMMITTED
  ↓
IDLE
```

Support cancellation and restoration of the previous transform.

Implement undo and redo for scene editing commands.

Use typed commands rather than directly mutating scene state from arbitrary UI components.

---

# PART IV — PROJECT AND DATA MANAGEMENT

## 11. Database design

Design normalized PostgreSQL tables for:

- Users
- Organizations
- Organization memberships
- Projects
- Project memberships
- Creative briefs
- Project assets
- XR scenes
- Scene versions
- Storyboards
- Storyboard frames
- AI conversations
- AI messages
- AI actions
- Review submissions
- Review comments
- Approval records
- Audit events

Use UUID identifiers and timestamps.

Enforce organization and project ownership boundaries.

Every protected API endpoint must verify authorization server-side.

Never trust client-provided organization IDs or project IDs without checking membership and permissions.

## 12. Scene persistence

Store scene state in a renderer-independent JSON format.

Example:

```json
{
  "schemaVersion": 1,
  "sceneId": "scene-001",
  "projectId": "project-001",
  "environment": {
    "preset": "creative-studio"
  },
  "entities": [
    {
      "id": "entity-001",
      "type": "image-panel",
      "assetId": "asset-001",
      "transform": {
        "position": [0, 1.5, -2],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
      },
      "properties": {
        "title": "Campaign Reference"
      }
    }
  ]
}
```

The IDs above are illustrative.

Define Zod schemas for scene documents, entities, transforms, and properties.

Requirements:

- Schema versioning
- Validation before persistence
- Scene loading
- Autosave
- Manual save
- Scene duplication
- Version history
- Restore previous version
- Optimistic concurrency control

Do not persist raw A-Frame DOM markup as the canonical scene representation.

Persist declarative scene data and reconstruct A-Frame entities from it.

---

# PART V — CONTENT CREATION

## 13. Asset management

Implement an asset management system using Cloudflare R2.

Supported MVP formats:

- PNG
- JPEG
- WebP
- MP4
- GLB
- glTF with validated dependencies
- PDF as a document attachment with a safe preview

Requirements:

- Authenticated uploads
- Signed upload URLs
- File size limits
- MIME and content validation
- Upload progress
- Asset metadata
- Thumbnail generation where supported
- Asset ownership
- Safe deletion
- Asset loading into XR scenes

Do not expose R2 credentials to the browser.

Use private buckets for sensitive project assets.

Generate time-limited authorized access URLs.

Do not allow arbitrary remote model URLs to bypass asset validation.

## 14. Spatial storyboard editor

Build a functional storyboard workflow.

Users should be able to:

1. Create a storyboard.
2. Add a frame.
3. Attach an image or video.
4. Add a description.
5. Specify shot type.
6. Specify camera movement.
7. Reorder frames.
8. Preview the sequence.
9. Save changes.
10. Submit the storyboard for review.

The XR interface should display storyboard frames as spatial cards.

Support drag-and-drop ordering in desktop mode and controller-based repositioning in XR mode.

The canonical storyboard order must be stored separately from spatial positioning.

---

# PART VI — AI CREATIVE ASSISTANT

## 15. AI assistant architecture

Build an AI assistant capable of helping creators with project-related tasks.

Use Gemini for creative reasoning and structured outputs.

Use Sarvam for voice capabilities where supported.

The initial architecture should be:

```text
Microphone
    ↓
Speech-to-text
    ↓
Conversation Orchestrator
    ↓
Gemini
    ↓
Structured Tool Call
    ↓
Authorization + Validation
    ↓
Application Command
    ↓
XR Scene Update
    ↓
Text-to-speech Response
```

All AI provider credentials must remain server-side.

Implement text input as a fallback when microphone access or speech services are unavailable.

## 16. AI capabilities

The assistant should support:

### Creative brainstorming

Example user requests:

- "Give me three ideas for this campaign."
- "Suggest a visual direction."
- "Create a concept based on the client brief."
- "Generate a shot list."
- "Summarize the creative requirements."

### Scene manipulation

Example requests:

- "Create a new storyboard panel."
- "Move this image to the left."
- "Duplicate the selected frame."
- "Group these references."
- "Remove the selected object."

### Project assistance

Example requests:

- "What are the project deliverables?"
- "What feedback did the client provide?"
- "Summarize the remaining tasks."
- "Prepare this storyboard for review."

AI responses must be grounded in project data available to the authorized user.

Do not fabricate project information.

## 17. Structured AI tool execution

Define explicit tools such as:

```ts
type CreativeTool =
  | "create_storyboard_frame"
  | "update_storyboard_frame"
  | "create_scene_entity"
  | "move_scene_entity"
  | "delete_scene_entity"
  | "summarize_brief"
  | "generate_shot_list"
  | "list_project_assets";
```

Each tool must have a strict Zod schema.

The AI model must not directly modify the database or execute arbitrary JavaScript.

All tool calls must pass through:

1. Schema validation
2. Authentication
3. Authorization
4. Resource ownership checks
5. Business rule validation
6. Command execution
7. Audit logging

Require explicit user confirmation before destructive actions, irreversible changes, external publication, or client-facing submissions.

Display pending actions before execution where appropriate.

Provide useful error messages when a requested action cannot be performed.

---

# PART VII — CLIENT REVIEW WORKFLOW

## 18. Review and approval

Implement a functional review workflow.

A creator can submit a storyboard or asset collection for review.

A client can:

- View submitted content
- Inspect a storyboard
- Leave comments
- Request changes
- Approve a submission

Use explicit review states:

```text
DRAFT
SUBMITTED
IN_REVIEW
CHANGES_REQUESTED
APPROVED
```

Maintain a history of review transitions.

Clients must not be able to modify the creator's working scene unless explicitly granted editing permissions.

For the MVP, a client review session may be asynchronous rather than a live multi-user VR meeting.

---

# PART VIII — REALTIME COLLABORATION

## 19. Collaboration foundation

Design the architecture to support multiple creators working on the same project.

Implement basic realtime presence if feasible within the MVP.

Represent:

- Connected users
- User display names
- Current project
- Current scene
- Selected object
- Last activity

Do not attempt to build a complete multiplayer avatar system in the first implementation.

If implementing concurrent scene editing, use a well-defined synchronization model with Yjs or Liveblocks.

Avoid naïve last-write-wins updates that silently overwrite another user's work.

Persist authoritative scene versions separately from ephemeral presence data.

---

# PART IX — SECURITY, PERFORMANCE, AND RELIABILITY

## 20. Security requirements

Implement:

- Clerk authentication
- Server-side role-based authorization
- Organization isolation
- Project-level permissions
- Signed asset URLs
- Secure AI API calls
- Input validation
- Rate limiting for expensive operations
- Audit logs
- Protection against unauthorized scene modifications

Do not expose private client briefs or assets through public scene URLs.

Never place secrets in `NEXT_PUBLIC_` environment variables.

## 21. XR performance

Optimize for standalone VR headsets.

Requirements:

- Avoid unnecessary draw calls
- Reuse geometries and materials
- Use compressed textures
- Support optimized GLB assets
- Lazy-load media
- Dispose of unused resources
- Minimize transparent overlapping surfaces
- Avoid excessive dynamic lighting
- Profile GPU and CPU performance
- Prevent large React updates from rebuilding the entire scene

Aim for stable headset-native refresh rates, measuring performance on physical hardware rather than assuming desktop performance represents VR performance.

Create a development performance overlay displaying:

- Frame rate
- Draw calls
- Triangle count
- Texture memory estimates where available
- Scene entity count
- Loading status

## 22. Accessibility and comfort

Implement:

- Seated and standing interaction options
- Adjustable panel placement
- Comfortable default viewing distances
- Teleport locomotion
- Optional snap turning
- Reduced-motion settings
- Readable text
- Non-audio feedback
- Keyboard and mouse alternatives
- Clear session exit controls

Avoid unnecessary camera movement and forced animations.

---

# PART X — IMPLEMENTATION ROADMAP

## Phase 1 — Foundation

Implement:

- Next.js application setup
- TypeScript configuration
- Tailwind and shadcn/ui
- Clerk authentication
- Neon database
- Basic project management
- A-Frame runtime
- XR route
- Desktop 3D preview
- Enter VR / Exit VR controls
- XR capability detection

**Acceptance criteria:** An authenticated user can open a project, launch a 3D scene in a desktop browser, and enter VR on a supported headset.

## Phase 2 — Spatial workspace

Implement:

- Studio environment
- Spatial panels
- Project brief panel
- Asset display
- Object selection
- Object manipulation
- Scene serialization
- Scene persistence

**Acceptance criteria:** A creator can place an object in the scene, move it, save the project, reload the application, and recover the saved state.

## Phase 3 — Creative tools

Implement:

- Asset uploads
- Asset browser
- Storyboard creation
- Storyboard editing
- Spatial storyboard display
- Scene versioning

**Acceptance criteria:** A creator can build and save a storyboard containing multiple frames and associated media.

## Phase 4 — AI assistant

Implement:

- Gemini integration
- AI conversation interface
- Sarvam speech integration
- Structured AI tool calls
- Scene manipulation through AI
- AI-generated creative suggestions

**Acceptance criteria:** A creator can request a storyboard frame using text or voice, review the proposed action, execute it, and see the result persisted.

## Phase 5 — Client review

Implement:

- Review submissions
- Client review dashboard
- Comments
- Approval and revision workflows
- Review history

**Acceptance criteria:** A creator can submit a storyboard, and an authorized client can review it and request changes.

## Phase 6 — Collaboration and polish

Implement:

- Basic realtime presence
- Improved interaction feedback
- Performance optimization
- Responsive desktop interface
- Error handling
- Automated tests
- Deployment configuration

Do not expand the MVP into a full video editor, multiplayer social world, or native headset application.

---

# PART XI — ENGINEERING WORKFLOW

## 23. Development process

Before writing code:

1. Inspect the existing repository.
2. Identify the current framework and dependencies.
3. Review existing architecture and feature specification documents.
4. Preserve existing functionality.
5. Identify reusable components and services.
6. Produce an implementation plan.
7. Define the database changes.
8. Identify integration risks.

If the repository contains context files such as:

```text
ai-workflow-rules.md
architecture-context.md
code-standards.md
progress-tracker.md
project-overview.md
ui-context.md
```

Read and follow them.

Update these files as the implementation progresses.

Do not overwrite established architecture decisions without documenting the reason.

## 24. Commit conventions

Use Conventional Commits.

Examples:

```text
chore: initialize XR development foundation
feat(xr): add A-Frame scene runtime
feat(xr): implement desktop and VR interaction
feat(scene): add scene serialization
feat(scene): persist spatial objects
feat(assets): add R2 asset management
feat(storyboard): implement spatial storyboard
feat(ai): integrate Gemini creative assistant
feat(voice): add Sarvam voice interaction
feat(review): implement client review workflow
test(xr): add scene interaction tests
perf(xr): optimize scene rendering
docs: document XR architecture
```

Keep commits focused and logically scoped.

Do not create empty or cosmetic commits solely to make the history appear active.

## 25. Testing requirements

Implement tests for:

- Scene schema validation
- Scene serialization
- Scene restoration
- Object manipulation commands
- Undo and redo
- Project permissions
- Asset authorization
- AI tool validation
- Review state transitions

Use Playwright for desktop browser workflows.

Document manual testing procedures for XR headset interactions.

Do not claim that headset testing has passed unless the application has actually been tested on physical hardware.

## 26. Required deliverables

Produce:

1. A working Next.js application.
2. A functional A-Frame XR environment.
3. A desktop-compatible 3D workspace.
4. Basic XR controller interaction.
5. Persistent scene editing.
6. Project and brief management.
7. Asset uploads and display.
8. Spatial storyboard functionality.
9. Gemini AI integration.
10. Sarvam voice integration.
11. Client review workflow.
12. Database schema and migrations.
13. Environment variable documentation.
14. Setup and deployment instructions.
15. Automated tests.
16. Architecture documentation.

Use real implementations for the core user journey.

Where external credentials or hardware are unavailable, provide a clearly labeled mock adapter or development fallback.

Never represent mocked AI responses, simulated controller events, or placeholder backend data as production functionality.

## 27. Definition of done

The MVP is complete when the following workflow succeeds:

An authenticated creator opens a project, reviews a client brief, enters the XR studio, uploads a reference image, places it into the spatial workspace, manipulates its position, creates a storyboard, asks the AI assistant for a creative suggestion, saves the scene, exits, returns later, and finds the workspace restored.

The creator can then submit the storyboard to a client, who can review the content and request revisions.

The experience must function in desktop mode and support immersive VR on a compatible headset.

## 28. Final implementation instructions

Begin by inspecting the repository and creating an implementation plan.

Then implement the application incrementally, starting with the XR foundation.

For each phase:

- Explain the architecture decisions.
- Implement the actual code.
- Add validation and tests.
- Run available quality checks.
- Document unresolved limitations.
- Update progress tracking.
- Create focused commits when appropriate.

Prioritize a functional, maintainable application over unnecessary complexity.

Do not stop after generating architecture diagrams or mock interfaces.

**Start with Phase 1: establish the Next.js and A-Frame foundation, implement a working XR scene, and verify that the scene can load successfully in desktop mode before adding the remaining application features.**
