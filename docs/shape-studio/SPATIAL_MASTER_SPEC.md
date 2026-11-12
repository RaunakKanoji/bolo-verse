# SHAPE STUDIO SPATIAL
## Native Apple visionOS Application — Master Engineering Specification

### YOUR ROLE

You are a principal Apple platform engineer, senior Swift developer, RealityKit specialist, spatial computing architect, AI systems engineer, and product designer.

You are responsible for implementing **Shape Studio Spatial**, a native Apple Vision Pro application for AI-powered creative production and collaboration.

Build the application using Apple's native spatial computing frameworks and design conventions.

This is not a WebXR application, an iPad application running in compatibility mode, or a web application wrapped inside a native window.

It must be a genuine visionOS application.

### PRIMARY OBJECTIVE

Build a spatial creative operating system where content creators can:

1. Receive and understand MSME client briefs.
2. Brainstorm marketing ideas using conversational AI.
3. Create campaign concepts, images, videos, audio, and 3D assets.
4. Organize references into spatial moodboards.
5. Manipulate 3D products and environments.
6. Create shot lists and production storyboards.
7. Collaborate with other creators.
8. Present creative concepts to clients.
9. Collect feedback and approvals.
10. Deliver approved assets.

The product must integrate with the existing Shape Studio web platform.

Do not create a separate backend or duplicate the business logic unnecessarily.

---

# SECTION 1 — DEVELOPMENT ENVIRONMENT

## 1.1 Required tools

Use:

- Xcode with the installed visionOS SDK
- Swift 6 and Swift Concurrency
- SwiftUI
- RealityKit
- ARKit
- Reality Composer Pro
- Swift Package Manager
- XCTest and Swift Testing where appropriate
- visionOS Simulator
- Instruments

Use the latest stable SDK available in the development environment.

Before writing code:

1. Identify the installed Xcode version.
2. Identify the installed visionOS SDK.
3. Verify the deployment target.
4. Check API availability.
5. Inspect the existing repository.
6. Identify reusable backend contracts.
7. Document any SDK or hardware limitations.

Do not invent framework APIs.

If an API is unavailable in the installed SDK, provide a compatible implementation or isolate the feature behind a documented capability boundary.

If Xcode or a macOS development environment is unavailable, generate source files and documentation but explicitly report that native compilation and simulator testing have not been performed.

## 1.2 Application identity

Application name: Shape Studio

Platform: visionOS

Application type: Native spatial creative workspace

Use a placeholder reverse-domain bundle identifier until the project's actual identifier is configured.

Support system appearance and accessibility settings.

---

# SECTION 2 — SPATIAL APPLICATION ARCHITECTURE

Shape Studio must support three primary presentation modes.

## Mode A — Shared Space windows

This is the default application experience.

Use SwiftUI WindowGroup scenes.

Provide windows for:

- Main workspace
- Project browser
- AI assistant
- Asset library
- Media preview
- Client review

Users should be able to arrange windows in their surroundings using native visionOS window management.

Do not implement custom window dragging when the system already provides appropriate behavior.

## Mode B — Volumetric workspace

Use a volumetric WindowGroup for supported 3D content.

This mode is designed for:

- Product visualization
- 3D asset inspection
- Material previews
- Scene composition
- Spatial mockups

Use RealityView and RealityKit entities.

Implement object selection, transformation, and state persistence.

Respect the finite bounds of a volume.

Do not assume a volume is equivalent to an unbounded immersive scene.

## Mode C — Full Space

Use ImmersiveSpace for immersive creative production.

This mode supports:

- Spatial moodboards
- Immersive storyboards
- Virtual production environments
- Large-scale scene composition
- Spatial AI guidance
- 3D campaign presentations

Use the supported immersive styles appropriate to the target SDK.

The user must be able to enter and exit immersive mode explicitly.

Never open an immersive environment unexpectedly.

---

# SECTION 3 — APPLICATION LIFECYCLE

Implement a central application coordinator.

Responsibilities:

- Authentication state
- Active organization
- Selected project
- Open application windows
- Active volumetric scene
- Immersive space state
- Asset loading
- Background task coordination
- Network availability
- Permission state

Use Swift's Observation framework where appropriate.

Avoid placing every state variable in one global object.

Separate:

- Session state
- Project state
- Generation state
- Scene state
- AI conversation state
- UI presentation state

Use dependency injection for services.

Implement structured concurrency and cancellation.

---

# SECTION 4 — VISUAL DESIGN SYSTEM

## 4.1 Design philosophy

Follow Apple's visionOS design principles.

The visual direction is:

- Minimal
- Spatial
- Calm
- Premium
- Translucent
- Content-focused
- Context-aware

The supplied Shape Studio reference image should inform the overall aesthetic.

However, do not reproduce the web interface exactly.

Use native materials, ornaments, hover effects, and spatial presentation conventions.

## 4.2 Color palette

Use a light, Apple-inspired visual language.

Suggested brand colors:

Primary accent: #7C83FF

Secondary accent: #AF62F5

Soft lavender: #E8E5FF

Background inspiration: #F7F8FC

Primary text inspiration: #171923

Secondary text inspiration: #697184

For native visionOS windows, prefer adaptive system materials and semantic colors.

Do not force opaque white backgrounds onto every window.

Use brand colors sparingly for selection, primary actions, progress, and identity.

## 4.3 Materials

Use native SwiftUI glass materials where appropriate.

Create reusable components:

- SpatialGlassPanel
- SpatialToolbar
- SpatialNavigationItem
- SpatialProjectCard
- SpatialAssetCard
- SpatialPromptEditor
- SpatialMediaPreview
- SpatialAIControl
- SpatialStatusIndicator
- SpatialInspector

Avoid manually layering excessive blur effects.

Do not make every surface translucent.

Use sufficiently opaque surfaces for long-form text and detailed controls.

## 4.4 Typography

Use system typography.

Define consistent styles for:

- Page titles
- Section headings
- Object labels
- Metadata
- Descriptions
- Interactive controls

Maintain readable text at comfortable viewing distances.

## 4.5 Motion

Use subtle transitions for:

- Opening panels
- Selecting assets
- Switching tools
- Presenting details
- Highlighting selected objects
- Entering immersive mode

Avoid continuous unnecessary animation.

Respect Reduce Motion settings.

---

# SECTION 5 — MAIN WORKSPACE

Build the main Shape Studio workspace as the application's starting window.

## Layout

Top navigation:

- Workspace
- Create
- Brainstorm
- Projects
- Review

Main content:

- Active campaigns
- Recent creative assets
- Upcoming deadlines
- Client feedback
- AI assistant entry point
- Quick creation actions

Each project card should contain:

- Project name
- MSME client
- Campaign thumbnail
- Current status
- Deadline
- Assigned collaborators
- Open project action

## Interaction

Selecting a project opens the project workspace.

Selecting an asset opens a media preview.

Selecting a supported 3D asset provides an option to open a volume.

Selecting Brainstorm opens the AI brainstorming workspace.

Selecting Create opens the AI content creation interface.

Use native visionOS navigation and presentation patterns.

---

# SECTION 6 — AI CONTENT CREATION STUDIO

This is the first major functional module.

## 6.1 Windowed layout

Create a three-region interface.

Left region:
Prompt and generation settings.

Center region:
Media preview.

Right region:
Asset properties, versions, and history.

Allow auxiliary regions to collapse.

Do not force the desktop layout into a window that is too narrow.

## 6.2 Creation modes

Support four creation categories:

### Image

- Text prompt
- Reference image
- Aspect ratio
- Model selection
- Style presets
- Resolution
- Number of variants
- Generation history

### Video

- Text prompt
- Image-to-video where supported
- Duration
- Aspect ratio
- Reference assets
- Preview and playback
- Export

### Audio

- Voice generation
- Voiceover
- Narration
- Speech transcription
- Supported language selection
- Audio preview

### 3D

- Import 3D models
- View 3D assets
- Inspect materials
- Preview generated models when a provider supports them
- Open assets in a volume
- Add assets to spatial scenes

All controls must be based on verified provider capabilities.

Do not expose unsupported controls as working functionality.

## 6.3 Generation architecture

Use the existing backend to orchestrate generation.

Workflow:

1. User enters a prompt.
2. Client validates input.
3. Client submits a generation request.
4. Backend creates a generation job.
5. Provider processes the request.
6. Client observes job status.
7. Backend stores completed assets.
8. Client retrieves signed asset URLs.
9. Asset appears in the workspace.
10. User can save, review, or export the result.

Support:

- Queued
- Running
- Completed
- Failed
- Cancelled, where supported

Provide useful error messages.

Do not store API keys inside the native application.

## 6.4 Media preview

Implement native media viewers.

Images:
Zoom, inspect, compare, and export.

Videos:
Playback, seek, pause, and preview.

Audio:
Playback and waveform visualization where practical.

3D:
RealityKit model viewer with supported transformations.

Use the appropriate native frameworks for each media type.

---

# SECTION 7 — SPATIAL PRODUCT STUDIO

This is a defining feature of Shape Studio Spatial.

## Objective

Allow creators to place and manipulate 3D product models in a spatial workspace.

Example:

An MSME skincare company uploads a 3D model of a perfume bottle.

The creator opens the asset in Apple Vision Pro.

The model appears in a volume.

The creator can inspect the product and build a campaign scene around it.

## 7.1 Object management

Implement:

- Object selection
- Translation
- Rotation
- Scaling
- Visibility
- Duplication
- Deletion
- Reset transform
- Material inspection

Use supported RealityKit entity components and gesture mechanisms.

Ensure object manipulation is predictable and comfortable.

## 7.2 Scene composition

Allow users to add:

- Product models
- Platforms
- Background objects
- Decorative elements
- Text elements
- Reference images
- Lights where supported
- Camera presets

Implement a scene hierarchy inspector.

Support selecting objects from either the scene or hierarchy.

## 7.3 Transform controls

Provide numerical controls for:

- Position
- Rotation
- Scale

Support direct manipulation gestures.

Use a consistent coordinate system.

Store transformations in meters and document the conventions.

Implement undo and redo.

## 7.4 Materials

Support material presets where practical.

Examples:

- Matte
- Glossy
- Metallic
- Glass-like
- Fabric-like

Use supported RealityKit materials.

Do not assume every material type can reproduce arbitrary web shaders.

## 7.5 Lighting

Provide configurable lighting presets:

- Soft studio
- Product spotlight
- Warm cinematic
- Neutral daylight
- Dramatic contrast

Use available RealityKit lighting and image-based lighting capabilities.

Document limitations.

Do not claim physically accurate product rendering without appropriate validation.

---

# SECTION 8 — IMMERSIVE CREATIVE ENVIRONMENT

Implement an optional ImmersiveSpace named CreativeEnvironment.

## 8.1 Entry

Provide an Enter Immersive Studio action.

Use the appropriate SwiftUI immersive space presentation APIs.

Handle:

- Opening
- Open failure
- User cancellation
- Closing
- Scene restoration

Do not assume immersive space opening always succeeds.

## 8.2 Environment

Create a calm, minimal creative environment.

Suggested aesthetic:

- Soft neutral surroundings
- Subtle atmospheric lighting
- Spacious layout
- Floating creative surfaces
- Minimal environmental distraction

Avoid unnecessary visual complexity.

## 8.3 Spatial content

Allow the user to arrange:

- Moodboard panels
- Product models
- Storyboard frames
- Reference imagery
- Creative notes
- Campaign concept cards

Each element should have a stable scene identifier.

Persist transforms and content references.

## 8.4 Layout presets

Implement:

- Focus Layout
- Moodboard Layout
- Production Layout
- Presentation Layout

Focus Layout:
One primary asset with minimal controls.

Moodboard Layout:
Multiple references arranged in a spatial composition.

Production Layout:
3D scene and contextual tools.

Presentation Layout:
Approved campaign assets arranged for client viewing.

## 8.5 Comfort

Use comfortable default viewing distances.

Avoid placing objects excessively close to the user's face.

Avoid unexpected movement of large spatial elements.

Keep controls discoverable.

Provide a clear exit mechanism.

Respect system comfort and accessibility conventions.

---

# SECTION 9 — SPATIAL AI ASSISTANT

Implement a conversational AI assistant named Shape AI.

## 9.1 Interface

Create a floating SwiftUI assistant panel.

The panel contains:

- Conversation history
- Prompt input
- Microphone control
- Suggested actions
- Context indicator
- Response status

## 9.2 Voice workflow

Use supported speech services.

Pipeline:

Microphone input → Speech recognition → Conversation service → AI response → Optional speech synthesis.

Use Sarvam where its capabilities match the required workflow.

Use native speech APIs as appropriate.

Obtain required permissions.

Show when the microphone is active.

Allow users to stop listening.

Do not continuously record without explicit user action and clear indication.

## 9.3 Context

The AI assistant may access authorized:

- Project briefs
- Brand guidelines
- Campaign goals
- Selected assets
- Moodboard content
- Scene object metadata
- Review feedback

Send only the necessary context to external providers.

Respect user permissions and organizational data boundaries.

## 9.4 AI actions

Implement typed AI actions such as:

- GenerateCampaignIdeas
- CreateMoodboard
- GenerateShotList
- SuggestSceneLayout
- GenerateImage
- SummarizeClientFeedback
- CreateRevisionPlan
- ExplainSelectedAsset

AI actions should produce structured outputs.

For example:

```json
{
  "action": "SuggestSceneLayout",
  "projectId": "project_001",
  "suggestions": [
    {
      "objectId": "product_001",
      "position": [0, 0, -1.2],
      "scale": [1, 1, 1]
    }
  ]
}
```

Validate the output before applying it.

Show a preview of significant changes.

Require confirmation for destructive operations, external sharing, or publishing.

---

# SECTION 10 — SPATIAL MOODBOARD

Build a spatial moodboard system.

Users should be able to create a moodboard from:

- Images
- Video references
- Text notes
- Color palettes
- 3D objects
- AI-generated concepts

## Windowed experience

Provide a conventional moodboard editor using SwiftUI.

## Spatial experience

Allow supported moodboard items to appear as spatial panels.

Users can:

- Select
- Rearrange
- Group
- Inspect
- Open details
- Save layouts

Persist the moodboard as structured project data.

Do not rely on screenshots of the spatial scene as the primary persistence mechanism.

---

# SECTION 11 — PRODUCTION PLANNING

Create a production planning module.

Features:

- Shot lists
- Storyboards
- Creative scripts
- Scene references
- Production checklists
- Equipment notes
- Shooting schedules

## Spatial storyboard

Allow storyboard frames to be arranged in sequence around the user.

Selecting a frame opens its details.

Each frame may contain:

- Shot description
- Reference image
- Camera framing
- Movement notes
- Lighting notes
- Audio notes
- Estimated duration

The AI assistant can suggest shot sequences.

Users must be able to edit all AI-generated plans.

---

# SECTION 12 — CLIENT COLLABORATION

The application must support creator and MSME workflows.

## Creator capabilities

- Submit concepts
- Share previews
- Request feedback
- Create revisions
- Track approval status
- Deliver assets

## Client capabilities

- View submitted work
- Compare versions
- Leave comments
- Request changes
- Approve content

## Review experience

Build a native review window.

Support:

- Image annotations
- Timestamped video comments
- Asset-specific feedback
- Version comparisons
- Approval decisions

For spatial assets, allow comments to reference stable object identifiers.

Do not implement real-time multiuser spatial synchronization in the initial MVP unless the existing backend already supports it.

---

# SECTION 13 — SHARED BACKEND INTEGRATION

Use the existing Shape Studio backend.

Expected services:

- Authentication
- Organizations
- Projects
- Clients
- Briefs
- Assets
- AI generation
- Conversations
- Reviews
- Spatial scenes

Create a typed API client.

Suggested Swift service structure:

```text
Services/
├── APIClient.swift
├── AuthenticationService.swift
├── ProjectService.swift
├── AssetService.swift
├── GenerationService.swift
├── ConversationService.swift
├── SceneService.swift
└── ReviewService.swift
```

Use async/await.

Handle HTTP errors explicitly.

Support cancellation.

Implement request timeouts.

Avoid unbounded retries.

Use secure token storage.

Use short-lived signed URLs for private media access.

---

# SECTION 14 — CROSS-PLATFORM SCENE FORMAT

The web and visionOS applications must use a shared scene representation.

Use a language-neutral schema.

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

Document quaternion ordering and transformation conventions.

The backend stores scene state.

The web client renders compatible assets using Three.js.

The native client renders compatible assets using RealityKit.

Use an asset conversion pipeline for GLB/glTF and USDZ where necessary.

Do not assume the same shader or material behaves identically across engines.

---

# SECTION 15 — APP INTENTS AND APPLE INTELLIGENCE

Investigate App Intents integration.

Expose suitable actions such as:

- Open Project
- Show Recent Assets
- Start Brainstorming
- Open Creative Studio
- View Pending Reviews

Use supported App Intents APIs.

Where the Foundation Models framework is available and appropriate, investigate on-device intelligence for lightweight tasks.

Potential uses:

- Summarizing notes
- Structuring creative briefs
- Categorizing assets
- Suggesting task organization

Do not assume on-device models can replace specialized image, video, audio, or 3D generation services.

Check device, OS, model availability, and supported capabilities at runtime.

Provide graceful fallback behavior.

---

# SECTION 16 — SECURITY AND PRIVACY

Implement:

- Secure authentication
- Organization-level authorization
- Project permissions
- Secure token storage
- Encrypted transport
- Signed asset URLs
- Permission-aware microphone usage
- Explicit AI data-sharing controls
- Audit events for important actions

Never embed provider secrets in the native app.

Never assume that an authenticated user can access every project.

Do not send camera, microphone, hand-tracking, or spatial data to external AI providers unless required, authorized, and clearly disclosed.

Minimize retention of sensitive spatial and sensor information.

---

# SECTION 17 — PERFORMANCE

Optimize for spatial computing.

Implement:

- Asynchronous asset loading
- Texture optimization
- Model complexity limits
- Entity reuse
- Efficient scene updates
- Task cancellation
- Asset caching
- Memory monitoring
- Scene lifecycle cleanup

Avoid unnecessary continuous update loops.

Do not perform expensive processing on the main actor.

Use Instruments to identify bottlenecks.

Measure frame pacing and rendering performance on supported hardware.

The simulator is useful for development but does not replace physical-device performance testing.

---

# SECTION 18 — PROJECT STRUCTURE

Use a feature-oriented native architecture.

Suggested structure:

```text
ShapeStudioSpatial/
├── App/
│   ├── ShapeStudioApp.swift
│   ├── AppCoordinator.swift
│   └── AppDependencies.swift
│
├── Core/
│   ├── Networking/
│   ├── Authentication/
│   ├── Persistence/
│   ├── DesignSystem/
│   └── Utilities/
│
├── Features/
│   ├── Workspace/
│   ├── Projects/
│   ├── CreativeStudio/
│   ├── Brainstorm/
│   ├── AssetLibrary/
│   ├── SpatialStudio/
│   ├── AIAssistant/
│   ├── ProductionPlanning/
│   └── ClientReview/
│
├── Spatial/
│   ├── RealityKit/
│   ├── Entities/
│   ├── Components/
│   ├── Gestures/
│   ├── SceneManagement/
│   ├── AssetLoading/
│   └── Environments/
│
├── Services/
├── Models/
├── Resources/
├── PreviewContent/
└── Tests/
```

Use Reality Composer Pro content where appropriate.

Keep networking independent from SwiftUI views.

Keep RealityKit scene logic separate from business workflows.

---

# SECTION 19 — IMPLEMENTATION ROADMAP

## Phase 0 — Environment and architecture

- Inspect repository
- Verify SDK
- Review backend contracts
- Define native architecture
- Document risks

Deliverable:
Implementation plan.

## Phase 1 — Native application foundation

- Create visionOS target
- Configure application scenes
- Establish design system
- Implement navigation
- Implement dependency injection
- Create service interfaces

Deliverable:
Running native application shell.

## Phase 2 — Project workspace

- Authentication
- Organization selection
- Project listing
- Project details
- Asset browsing
- API integration

Deliverable:
Functional project workspace.

## Phase 3 — AI creation interface

- Prompt editor
- Model selector
- Generation jobs
- Media preview
- Asset persistence
- Generation history

Deliverable:
Functional AI content creation workflow.

## Phase 4 — Volumetric asset viewer

- RealityKit model loading
- USDZ support
- Object selection
- Rotation and scaling
- Transform persistence

Deliverable:
Interactive 3D asset viewer.

## Phase 5 — Spatial production studio

- Scene hierarchy
- Multiple objects
- Scene composition
- Material controls
- Lighting presets
- Save and restore scenes

Deliverable:
Spatial scene editor.

## Phase 6 — AI brainstorming

- Conversational AI
- Voice input
- Project context
- Moodboard creation
- Structured AI actions

Deliverable:
AI-assisted creative workspace.

## Phase 7 — Immersive environment

- ImmersiveSpace
- Spatial moodboards
- Production layouts
- Spatial asset presentation
- Environment controls

Deliverable:
Immersive creative studio.

## Phase 8 — Client workflows

- Review
- Comments
- Version comparison
- Approvals
- Delivery

Deliverable:
Connected creator-to-client workflow.

## Phase 9 — Testing and optimization

- Unit tests
- API tests
- Simulator tests
- Device testing where available
- Accessibility review
- Performance profiling
- Security review

Deliverable:
Validated MVP.

---

# SECTION 20 — MVP SCOPE

The first MVP must include:

1. Native visionOS application shell.
2. Main project workspace.
3. Shared backend integration.
4. Asset library.
5. AI prompt interface.
6. Generation job tracking.
7. Media preview.
8. Volumetric 3D asset viewer.
9. Basic object manipulation.
10. Scene save and restore.

The following features can follow later:

- Full immersive production studio
- Advanced spatial moodboards
- Multiuser shared spatial sessions
- Advanced scene lighting
- AI-directed scene editing
- Production storyboards
- Complex video editing
- App Intents enhancements

Prioritize a functional product over a visually impressive but nonfunctional prototype.

---

# SECTION 21 — TESTING REQUIREMENTS

Create automated tests for:

- API request decoding
- Authentication state
- Project loading
- Generation lifecycle
- Asset metadata
- Scene serialization
- Transform persistence
- Authorization failures
- Network recovery

Create simulator test scenarios for:

- Opening the workspace
- Navigating projects
- Opening an asset
- Entering a volume
- Manipulating a model
- Saving a scene
- Restoring a scene
- Entering and leaving immersive mode

Document any interaction that requires physical Apple Vision Pro hardware.

Do not claim hand-tracking or real-world spatial behavior is fully verified using only simulator tests.

---

# SECTION 22 — CODING STANDARDS

Use:

- Swift 6 concurrency checking
- Small cohesive types
- Explicit dependency injection
- Protocol-based service boundaries
- Structured errors
- Codable models
- Clear naming
- Testable state management
- MainActor isolation for UI state
- Safe asynchronous operations

Avoid:

- Massive SwiftUI view files
- Force-unwrapped optionals
- Unstructured concurrency
- Hardcoded API credentials
- Networking inside view bodies
- Global mutable state
- Unnecessary third-party packages
- Deprecated APIs
- Unverified SDK calls

Use meaningful Conventional Commits.

Examples:

```text
chore(visionos): initialize native application

feat(visionos): implement workspace navigation

feat(visionos): integrate project API

feat(spatial): implement volumetric asset viewer

feat(spatial): add object manipulation

feat(ai): connect creative generation jobs

feat(spatial): persist scene transformations

test(visionos): cover scene serialization
```

---

# SECTION 23 — FINAL ACCEPTANCE CRITERIA

The MVP is successful when:

- The native app builds with the installed visionOS SDK.
- The application opens in the Shared Space.
- The user can authenticate.
- The user can access authorized projects.
- The user can browse creative assets.
- The user can submit supported AI generation requests.
- Generated content appears in the asset library.
- The user can open a supported 3D asset in a volume.
- The user can rotate and scale the object.
- Scene state can be saved and restored.
- The user can return to the main workspace.
- The app handles network failures gracefully.
- The design follows native visionOS conventions.
- Automated tests pass.

Any unverified device-specific behavior must be documented.

---

# FINAL EXECUTION INSTRUCTIONS

Start with an architecture and environment audit.

Then implement the application incrementally.

Do not attempt every feature at once.

First complete:

1. Native visionOS project setup.
2. Application scene architecture.
3. Apple-inspired design system.
4. Main workspace UI.
5. Shared backend service layer.
6. Basic RealityKit volumetric viewer.

After those components work, continue to AI generation and immersive features.

At the end of each implementation phase:

- Summarize completed work.
- List changed files.
- Report build results.
- Report tests performed.
- Identify remaining limitations.
- Update progress documentation.

The final result must be a real native spatial computing application, not a static UI demonstration.

Build Shape Studio Spatial as the foundation of a professional AI-powered creative operating system for Apple Vision Pro.
