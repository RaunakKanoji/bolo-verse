# MASTER ENGINEERING PROMPT
## Unified Cross-Platform Spatial Creator Studio
### Next.js + Three.js + React Three Fiber + A-Frame + Native visionOS

## ROLE AND RESPONSIBILITIES

You are a Principal Software Architect, Senior Full-Stack Engineer, Spatial Computing Engineer, and Technical Lead responsible for designing and implementing the foundational architecture of a production-oriented cross-platform creative collaboration platform.

Your responsibility is to create a maintainable, extensible, testable, and secure monorepo that supports three application experiences:

1. A conventional web application using Next.js.
2. A browser-based spatial environment using Three.js, React Three Fiber, and A-Frame.
3. A native Apple Vision Pro application using SwiftUI, RealityKit, and visionOS.

The platform is an AI-powered creative production workspace for creators, creative agencies, and clients.

Do not build three independent products.

Build one unified platform with shared backend services, shared project data, shared user identities, shared assets, and platform-specific interfaces.

Prioritize sound architecture over superficial feature completeness.

Do not generate an enormous amount of placeholder code. Implement functional vertical slices with tests and documented extension points.

---

# 1. PRODUCT VISION

The platform connects creative professionals and clients through an AI-assisted creative production workflow.

A client submits a creative brief.

The creator receives the brief, analyzes the requirements, and collaborates with AI agents to brainstorm concepts.

The creator can then organize projects, explore ideas, work with creative assets, build spatial moodboards, and coordinate content production.

AI agents assist with:

- Understanding client briefs.
- Brainstorming creative concepts.
- Generating content outlines.
- Preparing scripts and storyboards.
- Recommending camera angles and shooting techniques.
- Suggesting creative production workflows.
- Managing project tasks.
- Organizing assets.
- Preparing client presentations.
- Reviewing client feedback.
- Controlling supported application functions through voice commands.

Clients can review project deliverables, leave feedback, request revisions, and approve content.

The experience must work across desktop web, browser-based spatial workspaces, and native visionOS.

## Core product principle

Every project exists independently of the interface through which it is accessed.

A project opened on the web should be accessible through the browser XR environment or visionOS.

Project state must not be tied to any particular rendering technology.

---

# 2. ARCHITECTURAL PRINCIPLES

Follow these principles:

1. Monorepo-first architecture.
2. Modular monolith backend for the MVP.
3. Domain-driven module boundaries.
4. API-first cross-platform communication.
5. Strict TypeScript for web and backend.
6. Native Swift for visionOS.
7. Shared schemas and generated API contracts.
8. Explicit separation between business logic and rendering logic.
9. Server-authoritative persistent project state.
10. Event-driven collaboration where necessary.
11. Secure authentication and authorization.
12. Accessibility and progressive enhancement.
13. Platform-specific interaction patterns.
14. Incremental implementation through independently reviewable commits.
15. Strong automated testing and continuous integration.

Avoid premature microservices.

Do not introduce unnecessary distributed infrastructure until justified by performance, reliability, or deployment requirements.

---

# 3. APPLICATION PLATFORMS

## Platform A: Conventional Web Application

Technology:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query where client-side server-state management is necessary
- Zod
- Drizzle ORM
- Clerk

Responsibilities:

- Landing pages.
- User onboarding.
- Authentication.
- Creator dashboard.
- Client dashboard.
- Project management.
- Brief management.
- AI brainstorming.
- Asset library.
- Creative production management.
- Deliverable review.
- Team collaboration.
- Account settings.
- Administrative controls.

Use server components for server-rendered application pages when appropriate.

Use client components for interactive editors, browser APIs, voice capture, and real-time functionality.

Do not make the entire Next.js application client-rendered.

## Platform B: Browser-Based Spatial Application

Technology:

- Three.js
- React Three Fiber
- @react-three/drei
- @react-three/xr where supported and suitable
- A-Frame
- WebXR Device API
- Zustand for local interactive state
- Shared REST APIs and realtime collaboration services

Responsibilities:

- Spatial project workspace.
- Interactive 3D asset viewing.
- 3D moodboards.
- Spatial creative brainstorming.
- Voice-driven scene controls.
- Project asset organization.
- 3D presentation rooms.
- Collaborative review environments.
- Immersive experiences on supported WebXR devices.

The browser spatial environment must support two modes.

### Mode 1: Desktop 3D

Designed for users without XR headsets.

Users navigate the environment through:

- Mouse.
- Keyboard.
- Trackpad.
- On-screen controls.
- Voice commands.

This mode must work without a headset, XR runtime, or immersive browser permission.

### Mode 2: Immersive WebXR

Designed for browsers and devices that support the required WebXR capabilities.

Provide:

- Capability detection.
- Supported immersive session entry.
- Controller interaction.
- Raycasting.
- Spatial selection.
- Session lifecycle management.
- Graceful fallback to desktop 3D.

Do not assume all browsers or all headsets support immersive WebXR.

In particular, do not assume native visionOS Safari provides the same immersive WebXR capabilities as other XR browsers.

### Rendering architecture

React Three Fiber should be the primary rendering framework for the custom browser 3D editor.

A-Frame should be supported as a separate, isolated rendering implementation for appropriate immersive experiences or prototypes.

Do not mount A-Frame and React Three Fiber as competing renderers inside the same scene.

Create platform-independent scene definitions and renderer adapters.

The browser 3D scene must be driven by project data rather than hardcoded objects.

## Platform C: Native Apple Vision Pro

Technology:

- Swift
- SwiftUI
- RealityKit
- ARKit, only for capabilities requiring it
- visionOS native APIs
- URLSession
- Codable
- Async/Await
- Observation framework where appropriate

Responsibilities:

- Native spatial workspace.
- Floating project windows.
- Spatial content panels.
- 3D creative asset viewing.
- Spatial brainstorming.
- Immersive creative presentation.
- Voice-enabled controls.
- Client review experiences.
- Project synchronization.

Use native visionOS interaction conventions.

Support:

1. SwiftUI windows.
2. Volumetric content.
3. RealityView.
4. ImmersiveSpace where appropriate.
5. Eye-and-hand-based system interaction.
6. Supported gesture interactions.
7. Accessible alternatives for spatial interactions.

Do not recreate browser UI inside a WebView as the main visionOS experience.

The native application should communicate with the same backend APIs as the Next.js application.

Implement authentication using an officially supported native authentication flow and validate its compatibility with the selected Clerk configuration.

Never embed backend secrets in the native application.

---

# 4. MONOREPO STRUCTURE

Use pnpm workspaces and Turborepo for JavaScript/TypeScript applications.

The visionOS application must remain a native Xcode project inside the same repository.

Proposed repository:

spatial-creator/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   ├── hooks/
│   │   │   └── styles/
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── spatial-web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── engine/
│   │   │   ├── renderers/
│   │   │   │   ├── r3f/
│   │   │   │   └── aframe/
│   │   │   ├── interactions/
│   │   │   ├── voice/
│   │   │   └── scenes/
│   │   └── package.json
│   │
│   ├── visionos/
│   │   ├── SpatialCreator.xcodeproj
│   │   ├── SpatialCreator/
│   │   │   ├── App/
│   │   │   ├── Features/
│   │   │   ├── Spatial/
│   │   │   ├── Services/
│   │   │   ├── Networking/
│   │   │   ├── Models/
│   │   │   ├── Resources/
│   │   │   └── DesignSystem/
│   │   └── Tests/
│   │
│   └── realtime/
│       └── src/
│
├── packages/
│   ├── ui/
│   ├── design-tokens/
│   ├── database/
│   ├── contracts/
│   ├── api-client/
│   ├── auth/
│   ├── core/
│   ├── projects/
│   ├── assets/
│   ├── collaboration/
│   ├── scene-schema/
│   ├── scene-engine/
│   ├── ai/
│   ├── voice/
│   ├── permissions/
│   ├── config/
│   ├── typescript-config/
│   └── eslint-config/
│
├── services/
│   ├── ai-orchestrator/
│   ├── media-processing/
│   └── background-jobs/
│
├── tooling/
│   ├── scripts/
│   ├── generators/
│   └── codegen/
│
├── docs/
│   ├── architecture/
│   ├── product/
│   ├── api/
│   ├── platforms/
│   ├── adr/
│   └── development/
│
├── context/
│   ├── ai-workflow-rules.md
│   ├── architecture-context.md
│   ├── code-standards.md
│   ├── progress-tracker.md
│   ├── project-overview.md
│   └── ui-context.md
│
├── .github/
│   └── workflows/
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── .env.example
└── README.md

Treat this as a target architecture, not a mandate to create empty packages.

Only create packages when there is a real responsibility and at least one consumer.

Keep services inside the main backend until a separate runtime is necessary.

Do not place Swift files inside TypeScript packages.

Use OpenAPI and JSON Schema for interoperability between TypeScript and Swift.

---

# 5. BACKEND ARCHITECTURE

Use Next.js Route Handlers and Node.js for the initial API backend.

Create the following domain modules:

## Identity and organizations

- User profiles.
- Creator profiles.
- Client profiles.
- Organizations.
- Team memberships.
- Role assignments.
- Invitations.

## Projects

- Project creation.
- Project membership.
- Project status.
- Project metadata.
- Project lifecycle.
- Project activity history.

## Creative briefs

- Brief submissions.
- Brief requirements.
- Reference assets.
- AI-generated brief analysis.
- Brief versions.

## Creative workspace

- Spatial scenes.
- Scene objects.
- Object transforms.
- Workspace layouts.
- Saved views.
- Scene versions.

## Assets

- Upload management.
- File metadata.
- Asset versioning.
- Storage references.
- Asset transformations.
- Preview generation.

## AI

- AI conversations.
- Creative concept generation.
- AI task execution.
- AI suggestions.
- Provider orchestration.
- AI usage records.

## Voice

- Speech transcription.
- Command interpretation.
- Intent validation.
- Command execution.
- Speech synthesis.

## Collaboration

- Project presence.
- Comments.
- Review sessions.
- Notifications.
- Activity events.

## Deliverables

- Deliverable creation.
- Version submission.
- Client review.
- Revision requests.
- Approvals.

Each module should expose explicit services and repositories.

Keep route handlers thin.

Implement business logic in application services, not directly inside HTTP handlers.

---

# 6. DATABASE ARCHITECTURE

Use Neon PostgreSQL with Drizzle ORM.

Implement an initial relational schema covering:

users
organizations
organization_members
projects
project_members
creative_briefs
brief_versions
assets
asset_versions
spatial_scenes
scene_versions
ai_conversations
ai_messages
voice_commands
tasks
deliverables
deliverable_versions
reviews
comments
notifications
activity_events
audit_logs

Use UUIDs for primary identifiers where appropriate.

Include:

- created_at
- updated_at
- created_by where applicable
- organization_id where applicable
- project_id where applicable
- status fields
- appropriate foreign keys
- indexes for common queries

Design organization and project authorization explicitly.

Do not rely on the frontend to enforce data isolation.

Every project access must be authorized on the server.

Create migrations, a development seed script, and database integration tests.

Do not use synthetic records in production by default.

---

# 7. SHARED SPATIAL SCENE FORMAT

One of the most important architectural requirements is a shared scene representation.

The browser 3D application and native visionOS application must understand the same persisted scene structure.

Do not attempt to share Three.js objects or RealityKit entities directly.

Create a platform-independent scene schema.

Example:

{
  "id": "scene_001",
  "schemaVersion": 1,
  "projectId": "project_001",
  "name": "Creative Workspace",
  "coordinateSystem": "right-handed-y-up",
  "units": "meters",
  "environment": {
    "type": "studio",
    "lightingPreset": "soft"
  },
  "objects": [
    {
      "id": "object_001",
      "type": "asset",
      "assetId": "asset_001",
      "transform": {
        "position": [0, 1.5, -2],
        "rotation": [0, 0, 0, 1],
        "scale": [1, 1, 1]
      },
      "properties": {
        "interactive": true,
        "locked": false,
        "visible": true
      }
    }
  ]
}

Define the rotation quaternion convention and transform hierarchy.

Include:

- Schema version.
- Coordinate conventions.
- Units.
- Stable object IDs.
- Object types.
- Parent-child relationships.
- Transforms.
- Asset references.
- Visibility.
- Interaction metadata.
- Environment settings.
- Optional platform-specific metadata.

Create schema validation and migration support.

Use GLB/glTF as the preferred interchange format for supported 3D assets.

Support USDZ as a visionOS-friendly delivery format where appropriate.

Do not assume every material, animation, shader, or effect can be translated losslessly between engines.

Build an asset conversion pipeline with explicit compatibility reporting.

---

# 8. SCENE RENDERER ADAPTERS

Implement a renderer-independent scene model.

Create separate adapters:

ThreeSceneRenderer
AFrameSceneRenderer
RealityKitSceneRenderer

The TypeScript adapters belong to the browser codebase.

RealityKitSceneRenderer is a native Swift implementation.

Each renderer must be able to:

- Load a supported scene definition.
- Resolve referenced assets.
- Create scene objects.
- Apply transforms.
- Select objects.
- Update transforms.
- Hide and show objects.
- Remove objects.
- Apply supported scene updates.

Implement a capability model.

Example capabilities:

- supportsImmersiveMode
- supportsHandInteraction
- supportsControllers
- supportsSpatialAnchors
- supportsAdvancedMaterials
- supportsSharedPresence

Do not promise identical features across every platform.

Unsupported features should degrade gracefully.

---

# 9. VOICE COMMAND ARCHITECTURE

Implement a unified voice-command pipeline.

The intended flow:

Microphone input
→ Speech recognition
→ Transcript
→ Intent interpretation
→ Structured command
→ Authorization
→ Validation
→ Execution
→ State update
→ Optional spoken response

Use Sarvam for supported speech services.

Use Gemini for higher-level language interpretation and creative reasoning.

Define a provider-independent speech interface so additional providers can be added later.

The browser and visionOS clients should use platform-appropriate microphone capture.

Do not assume a browser audio-capture implementation can be reused natively in Swift.

## Structured command example

{
  "commandId": "cmd_001",
  "intent": "scene.object.move",
  "target": {
    "objectId": "object_001"
  },
  "parameters": {
    "direction": "left",
    "distance": 0.5,
    "unit": "meters"
  },
  "requiresConfirmation": false
}

Implement a command registry.

Initial commands:

- Open project.
- Switch workspace.
- Select object.
- Move object.
- Rotate object.
- Resize object.
- Create moodboard.
- Open asset library.
- Start brainstorming.
- Generate creative ideas.
- Summarize brief.
- Save scene.
- Present project.
- Undo action.
- Redo action.

Voice commands must map to deterministic application operations.

Never directly execute arbitrary AI-generated code.

Validate all generated commands against a strict schema.

Check permissions before execution.

Require confirmation for destructive, external, costly, or high-impact actions.

Handle ambiguous commands by asking the user to clarify.

Show transcription status, errors, and command feedback.

Allow users to disable microphone features.

Do not store raw audio unless explicitly necessary and consented to.

---

# 10. AI ORCHESTRATION

Create an AI orchestration module that separates creative intelligence from application control.

Define two distinct categories.

## Creative AI

Supports:

- Brainstorming.
- Creative brief analysis.
- Script suggestions.
- Storyboard planning.
- Production guidance.
- Campaign concept generation.
- Content strategy.
- Asset recommendations.

## Application Control AI

Supports:

- Command interpretation.
- Tool selection.
- Contextual navigation.
- Structured action requests.

Create a tool registry with strict input/output contracts.

Example tools:

getProject
getBrief
listAssets
createTask
createSceneObject
updateSceneObject
generateCreativeConcept
summarizeClientFeedback

Every tool must enforce server-side authorization.

Maintain traceable execution records.

Implement timeouts, retries, and rate limits.

Use asynchronous jobs for long-running AI workflows.

Never expose provider API keys to the browser or visionOS client.

---

# 11. REALTIME COLLABORATION

Build collaboration around server-authoritative project state.

Separate:

1. Durable project state.
2. Ephemeral presence.
3. Realtime editing events.

Durable state includes:

- Project metadata.
- Asset metadata.
- Scene snapshots.
- Deliverables.
- Comments.

Ephemeral state includes:

- Online presence.
- Cursor position.
- Current selection.
- Temporary interaction state.

Use WebSockets or a managed realtime provider for low-latency synchronization.

For the MVP, implement presence and controlled scene edits before introducing a full collaborative CRDT system.

For concurrent scene editing, evaluate a proven CRDT framework such as Yjs.

If implementing CRDT synchronization, define persistence, reconnection, conflict resolution, and authorization clearly.

Avoid last-write-wins updates for every type of collaborative operation.

---

# 12. MAIN WEB APPLICATION SCREENS

Implement the following route architecture.

Public:

/
 /features
 /solutions
 /pricing
 /sign-in
 /sign-up

Authenticated:

/dashboard
/projects
/projects/new
/projects/[projectId]
/projects/[projectId]/brief
/projects/[projectId]/brainstorm
/projects/[projectId]/assets
/projects/[projectId]/tasks
/projects/[projectId]/deliverables
/projects/[projectId]/reviews
/projects/[projectId]/activity
/teams
/notifications
/settings

The creator dashboard should prioritize active projects, upcoming work, recent feedback, and AI-assisted actions.

The client dashboard should prioritize submitted briefs, project progress, deliverables, and approvals.

---

# 13. BROWSER SPATIAL APPLICATION

Create a dedicated browser spatial client.

Suggested routes:

/workspace
/workspace/[projectId]
/workspace/[projectId]/scene/[sceneId]
/workspace/[projectId]/present
/experiences
/experiences/[experienceId]

## Spatial workspace layout

The desktop 3D interface should include:

- Main 3D canvas.
- Left scene hierarchy panel.
- Right object properties inspector.
- Top project toolbar.
- Bottom AI command interface.
- Asset browser.
- Scene navigation controls.
- Save and synchronization status.

Support:

- Object selection.
- Object transformation.
- Drag and drop.
- Camera navigation.
- Scene saving.
- Asset loading.
- Keyboard shortcuts.
- Undo and redo.
- Voice commands.

Use React Three Fiber for the primary editor.

Use A-Frame only in an isolated route or dedicated rendering module.

Implement a clear boundary between React application state and the rendering engine.

---

# 14. NATIVE VISIONOS APPLICATION

Create a native SwiftUI application.

Initial navigation:

Home
Projects
Spatial Workspace
Asset Library
AI Assistant
Settings

## Window experience

Display:

- Project navigation.
- Project overview.
- Asset browser.
- AI conversation.
- Task and review panels.

## Volumetric experience

Support:

- 3D model inspection.
- Asset rotation.
- Asset scaling.
- Spatial positioning.
- Object information.

## Immersive experience

Support:

- Creative presentation environments.
- Spatial moodboards.
- Project walkthroughs.
- Immersive brainstorming.

Use RealityKit for native scene rendering.

Use SwiftUI for standard controls.

Design around visionOS system interaction rather than requiring custom gesture recognition for basic actions.

## Synchronization

The native client must:

- Authenticate the user.
- Fetch accessible projects.
- Fetch project assets.
- Load scene definitions.
- Resolve compatible 3D assets.
- Submit authorized scene changes.
- Receive project updates.
- Recover from network interruptions.

Use a typed API client generated from the shared OpenAPI contract where practical.

Implement safe token storage and token refresh behavior.

---

# 15. SHARED DESIGN SYSTEM

Create a unified design language across all three experiences.

The design system should define:

- Color tokens.
- Typography scale.
- Spacing.
- Border radii.
- Elevation.
- Surface treatments.
- Component states.
- Motion guidelines.
- Accessibility requirements.

For web:

Use Tailwind and shadcn/ui.

For browser XR:

Use spatially appropriate UI panels, labels, interaction feedback, and 3D controls.

For visionOS:

Use native SwiftUI components and platform-appropriate spatial presentation.

Do not force identical UI components across platforms.

Share design principles and semantic tokens, not implementation details.

---

# 16. SECURITY REQUIREMENTS

Implement:

- Clerk-based identity management.
- Server-side session validation.
- Organization authorization.
- Project-level access control.
- Role-based permissions.
- Secure asset access.
- Short-lived signed asset URLs.
- Rate limiting.
- Request validation.
- Audit logging.
- Secure secrets management.

Validate native authentication independently.

Protect every backend mutation.

Prevent cross-organization data access.

Do not trust client-supplied organization or user IDs.

Use secure upload workflows and validate file types, sizes, and content.

Treat AI-generated output as untrusted input.

---

# 17. PERFORMANCE REQUIREMENTS

## Web

- Prefer server rendering for standard pages.
- Lazy-load heavy 3D dependencies.
- Avoid loading Three.js on pages that do not need it.
- Optimize image delivery.
- Use caching where appropriate.
- Prevent unnecessary client hydration.

## Browser XR

- Use adaptive rendering quality.
- Limit draw calls.
- Optimize geometry.
- Dispose unused GPU resources.
- Use compressed textures and appropriate asset formats.
- Profile rendering performance.
- Detect device capabilities.

## visionOS

- Profile with Xcode Instruments.
- Use native RealityKit rendering.
- Manage asset memory carefully.
- Avoid unnecessary immersive rendering.
- Handle application lifecycle transitions.
- Test performance on actual hardware when available.

Define measurable performance budgets after establishing baseline measurements.

---

# 18. TESTING STRATEGY

Implement tests at multiple levels.

## Unit tests

- Domain services.
- Command validation.
- Scene schema.
- Permission checks.
- Data transformations.

## Integration tests

- Database repositories.
- API routes.
- Authentication boundaries.
- Asset workflows.
- Project lifecycle.

## Browser tests

Use Playwright for:

- Authentication flows.
- Project creation.
- Workspace navigation.
- Asset management.
- Client review.

Use targeted browser tests for 3D interactions.

Mock unsupported XR capabilities in CI.

## visionOS tests

Use XCTest and supported Xcode testing tools.

Test:

- API decoding.
- Authentication state.
- Project synchronization.
- Scene-model conversion.
- Native navigation.

Maintain a manual device test checklist for immersive interactions.

---

# 19. DEVELOPMENT WORKFLOW

Use feature branches and pull requests.

Follow Conventional Commits.

Examples:

chore(repo): initialize monorepo
chore(config): configure shared tooling
feat(auth): implement authenticated project access
feat(projects): add project lifecycle APIs
feat(assets): implement secure asset uploads
feat(spatial): create scene schema
feat(spatial-web): add desktop 3d workspace
feat(voice): add structured command pipeline
feat(visionos): add native project browser
test(spatial): validate scene serialization
docs(architecture): document cross-platform boundaries

Each commit should represent a coherent, reviewable change.

Avoid mixing unrelated features in one commit.

Use GitHub Actions for:

- Linting.
- Type checking.
- Unit testing.
- Integration testing.
- Build validation.
- Dependency checks.

Use a macOS runner for native Xcode build validation when available.

Do not make native builds a prerequisite for unrelated web changes.

---

# 20. IMPLEMENTATION PHASES

## Phase 0: Repository audit and architecture

Before writing code:

1. Inspect the existing repository.
2. Identify existing frameworks and integrations.
3. Identify reusable modules.
4. Identify architectural conflicts.
5. Document the current state.
6. Produce an implementation plan.

Do not overwrite existing functional code.

## Phase 1: Monorepo foundation

Implement:

- pnpm workspace.
- Turborepo configuration.
- Shared TypeScript configuration.
- Shared lint configuration.
- Environment validation.
- Basic application shells.
- Documentation structure.
- CI checks.

## Phase 2: Shared backend

Implement:

- Database schema.
- Authentication.
- Organizations.
- Projects.
- Project membership.
- API contracts.
- Typed API client.

## Phase 3: Core web application

Implement:

- Dashboard.
- Project management.
- Brief management.
- Asset library.
- Basic AI conversation interface.

## Phase 4: Shared spatial foundation

Implement:

- Versioned scene schema.
- Scene validation.
- Scene persistence.
- Asset references.
- Renderer interface.
- Scene update operations.

## Phase 5: Browser spatial application

Implement:

- React Three Fiber canvas.
- Scene loading.
- Object selection.
- Object transformations.
- Asset placement.
- Scene saving.
- Desktop navigation.
- WebXR capability detection.
- Optional A-Frame prototype route.

## Phase 6: Voice and AI controls

Implement:

- Microphone capture.
- Speech transcription.
- Intent interpretation.
- Command registry.
- Action execution.
- Spoken feedback.
- AI brainstorming.

## Phase 7: Native visionOS foundation

Implement:

- Xcode project.
- SwiftUI navigation.
- Authentication integration.
- Typed API access.
- Project listing.
- Asset loading.
- RealityKit scene rendering.

## Phase 8: Collaboration and review

Implement:

- Presence.
- Realtime project updates.
- Client feedback.
- Deliverable reviews.
- Scene synchronization.

## Phase 9: Production hardening

Implement:

- Security review.
- Performance profiling.
- Error monitoring.
- Integration tests.
- Deployment documentation.
- Platform compatibility testing.

---

# 21. DOCUMENTATION REQUIREMENTS

Maintain the following context files:

context/ai-workflow-rules.md
context/architecture-context.md
context/code-standards.md
context/progress-tracker.md
context/project-overview.md
context/ui-context.md

Also create:

docs/architecture/system-overview.md
docs/architecture/domain-model.md
docs/architecture/scene-format.md
docs/architecture/authentication.md
docs/architecture/realtime.md
docs/architecture/voice-commands.md
docs/platforms/web.md
docs/platforms/browser-xr.md
docs/platforms/visionos.md
docs/api/openapi.yaml
docs/development/local-setup.md
docs/development/deployment.md

Create architecture decision records for significant technology choices.

Keep documentation synchronized with implemented behavior.

---

# 22. INITIAL MVP ACCEPTANCE CRITERIA

The first integrated milestone must demonstrate:

1. A user can authenticate in the web application.
2. A user can create a project.
3. A user can create a spatial scene.
4. A user can open the scene in the browser 3D workspace without a headset.
5. A user can add and transform a supported 3D object.
6. A user can save the scene.
7. A user can reload the scene and recover its persisted state.
8. A user can issue a supported voice command to manipulate the scene.
9. A user can access the same project through the native visionOS client.
10. The native client can load and render a compatible representation of the saved scene.

If visionOS hardware is unavailable, implement and validate the native foundation using supported simulator capabilities and explicitly identify interactions requiring real-device validation.

---

# 23. INSTRUCTIONS FOR CODEX EXECUTION

Do not attempt to implement the entire platform in one uncontrolled pass.

Start by:

1. Auditing the repository.
2. Producing the proposed final directory structure.
3. Identifying reusable existing code.
4. Documenting architectural decisions.
5. Creating a dependency graph.
6. Defining the initial database schema.
7. Defining the shared API contracts.
8. Defining the versioned scene schema.
9. Preparing a phased implementation plan.
10. Implementing Phase 1 only after the plan is established.

For every phase, report:

- Files created.
- Files modified.
- Dependencies added.
- Architectural decisions.
- Tests executed.
- Build results.
- Known limitations.
- Next implementation steps.

Do not claim tests passed unless they were actually executed.

Do not invent working integrations.

Use mocks only when necessary, label them clearly, and keep them separate from production implementations.

Preserve existing functionality.

The final architecture must make it possible to introduce additional platforms later, including other XR headsets, without rewriting the backend or the core project model.

The primary engineering goal is a shared, platform-independent creative production system with three specialized client experiences.

Begin with the repository audit and architecture plan.