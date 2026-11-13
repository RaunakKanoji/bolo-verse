# SHAPE STUDIO — SPATIAL XR HUD IMPLEMENTATION
## Master Codex Engineering Prompt

### ROLE

You are a senior spatial computing engineer, WebXR developer, Three.js specialist, and principal UI/UX designer.

Your task is to implement a complete Spatial XR HUD (Heads-Up Display) for the existing Shape Studio / BoloVerse application.

You must translate the previously generated desktop application screens into a coherent, interactive spatial computing environment.

This is an implementation task inside an existing repository, not a request to build a new application from scratch.

Your work must be compatible with the current Next.js application and reuse existing project, brainstorm, asset, review, authentication, and AI services wherever available.

---

# 1. PRODUCT VISION

Shape Studio is a creative workspace for creators, agencies, MSMEs, and clients.

Its spatial interface should allow users to:

- Browse and manage creative projects.
- Receive and understand client briefs.
- Brainstorm with an AI voice assistant.
- Generate and organize creative ideas.
- Work with creative assets in 3D space.
- Access content editing workflows.
- Review deliverables and client feedback.
- Control their workspace through voice, mouse, keyboard, and XR controllers.
- Move between conventional 2D and immersive 3D workflows.

The spatial interface should feel like a dedicated creative operating system.

It must not feel like a standard website projected onto a virtual wall.

However, it must also avoid unnecessary 3D effects that reduce usability.

Use spatial computing only where it improves navigation, context, visualization, manipulation, or collaboration.

---

# 2. REFERENCE DESIGN

Use the previously generated application screens and the existing screenshots as the visual reference.

The current Shape Studio visual identity includes:

- Near-black backgrounds.
- Lavender and purple accents.
- Rounded panels.
- Compact navigation.
- Minimal typography.
- Soft borders.
- Spacious layouts.
- Subtle elevation.
- Professional creator-oriented styling.

Preserve this visual identity.

Do not introduce unrelated visual themes.

## Color system

Background: #101118
Panel surface: #1B1C29
Elevated surface: #252638
Primary lavender: #A99BFF
Accent hover: #C0B5FF
Text primary: #F3F2FA
Text secondary: #B7B9C9
Muted text: #80849B
Panel border: #45415F
Success: #58C59B
Warning: #E7B66D
Error: #E27D8C

These are proposed tokens. Inspect and reuse existing tokens before adding new ones.

## Visual characteristics

Use:
- Dark translucent panels.
- Soft lavender edge highlights.
- Subtle depth separation.
- Minimal gradients.
- Smooth panel transitions.
- Rounded geometry.
- Legible typography.
- Low-intensity ambient lighting.
- Limited decorative particle effects.

Avoid:
- Excessive neon.
- Unreadable transparent surfaces.
- Constantly moving panels.
- Unnecessary particle effects.
- Heavy bloom.
- Tiny text.
- Large amounts of interface clutter.

---

# 3. REPOSITORY INSPECTION

Before implementing anything:

1. Inspect the Next.js App Router structure.
2. Identify the current Spatial Studio route.
3. Inspect Three.js, React Three Fiber, and A-Frame usage.
4. Identify existing XR session management.
5. Locate existing project and brainstorm interfaces.
6. Inspect the application design tokens.
7. Identify reusable UI components.
8. Inspect Clerk authentication.
9. Inspect Neon database services.
10. Identify existing Sarvam and Gemini integrations.
11. Identify media and asset storage.
12. Inspect available tests.

Determine which renderer currently owns the XR scene.

Do not run independent A-Frame and React Three Fiber renderers for the same immersive session.

Prefer extending the existing renderer. If React Three Fiber is already the primary renderer, use it for the HUD and scene.

If A-Frame is the current primary implementation, preserve it and build an appropriate adapter instead of introducing a competing scene.

Write a brief architecture audit before modifying the code.

---

# 4. TARGET ARCHITECTURE

Implement three layers.

## Layer A — Application services

Responsible for:
- Authentication
- Project data
- Brainstorm sessions
- Assets
- Deliverables
- Reviews
- AI services
- Voice transcription

Reuse existing backend services.

## Layer B — Spatial application state

Responsible for:
- Active workspace
- Active project
- Open spatial panels
- Selected objects
- Panel positions
- Interaction mode
- AI assistant state
- XR session state
- User preferences

Use an existing state library if available.

Otherwise use React context or a lightweight state solution appropriate to the current architecture.

## Layer C — Spatial rendering

Responsible for:
- 3D environment
- Floating panels
- Interaction surfaces
- Spatial navigation
- Scene objects
- Selection indicators
- XR input
- Desktop input
- Transitions

Keep business logic separate from 3D rendering.

---

# 5. SPATIAL COORDINATE SYSTEM

Use a consistent coordinate system.

- X: horizontal
- Y: vertical
- Z: depth
- Units: meters

The default user-facing workspace should be placed approximately 1.5–2 meters in front of the initial viewer position.

Suggested initial positions:

Main workspace:
x: 0
y: 1.5
z: -1.8

Left navigation:
x: -1.05
y: 1.45
z: -1.65

Right AI assistant:
x: 1.05
y: 1.45
z: -1.65

Bottom action dock:
x: 0
y: 0.75
z: -1.35

Top status panel:
x: 0
y: 2.15
z: -1.75

These are starting positions only.

Adjust panel widths, heights, curvature, and angular separation to ensure comfortable readability and prevent overlap.

Do not force all panels to remain permanently visible.

The layout must adapt to the active workflow and available field of view.

---

# 6. SPATIAL HUD SHELL

Build a shared SpatialHUDShell component.

It should manage:

- Main panel
- Navigation panel
- Assistant panel
- Quick-action dock
- Status indicator
- Contextual tool panels
- Modal panels
- Scene transitions

The HUD must support two operating modes.

## Mode 1 — Desktop Spatial Preview

For users without a headset.

Input:
- Mouse
- Keyboard
- Trackpad

Capabilities:
- Orbit or camera navigation
- Panel selection
- Dragging where appropriate
- Clicking controls
- Opening workspaces
- Interacting with scene objects

Do not require an XR device to use the application.

## Mode 2 — Immersive XR

For supported browsers and XR devices.

Input:
- XR controllers
- Controller rays
- Select actions
- Optional supported hand tracking

Capabilities:
- Spatial navigation
- Panel interaction
- Object selection
- Panel repositioning
- Scene exploration

Use runtime capability detection.

Do not assume hand tracking or immersive AR is available.

Provide fallback controls when a capability is missing.

---

# 7. SPATIAL NAVIGATION PANEL

Create a floating navigation panel on the left side.

Navigation items:

- Workspace
- Create
- Brainstorm
- Projects
- Review
- Assets
- Clients
- Recording Lab
- Spatial Studio
- Settings

Each item should include:
- Icon
- Label
- Active state
- Hover state
- Selected state
- Accessible action identifier

The navigation should be compact.

Allow it to expand to show full labels.

When selecting a destination:
1. Update the active workspace state.
2. Animate the current content out.
3. Mount the selected workspace.
4. Animate the new content in.
5. Preserve relevant session state.

Do not reload the entire 3D scene for ordinary navigation.

---

# 8. SPATIAL WORKSPACE DASHBOARD

Build SpatialWorkspaceDashboard.

The dashboard should contain:

## Main overview panel

Display:
- Welcome message
- Active projects
- Pending reviews
- Recent activity
- Upcoming tasks

## Project carousel

Render project cards in a shallow spatial arrangement.

Each card contains:
- Thumbnail
- Project name
- Client
- Status
- Progress
- Open action

Use a restrained curved carousel or horizontally arranged cards.

Do not place project cards so far apart that users must turn their heads excessively.

## Quick-action panel

Actions:
- Create Project
- Start Brainstorm
- Upload Asset
- Open Creation Studio
- Review Deliverables

## Recent activity

Show a compact activity feed.

Load data from existing services.

Use proper empty, loading, and error states.

---

# 9. SPATIAL BRAINSTORM STUDIO

Build SpatialBrainstormStudio.

This is one of the application's primary differentiating features.

## Layout

Center:
AI conversation workspace.

Left:
Brainstorm sessions and creative brief.

Right:
Idea board and saved concepts.

Bottom:
Voice and text input controls.

## AI conversation

Support:
- User messages
- AI responses
- Streaming text where supported
- Loading state
- Retry
- Save idea
- Convert idea to project

Use the existing Gemini integration.

Do not call AI providers directly from the browser with private credentials.

## Spatial idea cards

When an AI response contains a creative concept, allow the user to save it as a floating idea card.

Idea cards may contain:
- Concept title
- Description
- Audience
- Content format
- Creative direction
- Production requirements

Allow:
- Select
- Move
- Pin
- Group
- Expand
- Convert to task
- Convert to project

Persist card content and layout separately.

## Spatial brainstorming board

Create a spatial canvas where ideas can be arranged visually.

Support:
- Card creation
- Card movement
- Selection
- Grouping
- Connection lines
- Save layout
- Restore layout

Use actual persistent IDs for cards and relationships.

Avoid making the first implementation a complex physics simulation.

## Voice assistant

Integrate Sarvam through the existing backend.

Support:
- Push-to-talk
- Transcription
- Voice command interpretation
- Optional synthesized response
- Visible transcript
- Error feedback

Example commands:

"Start a new brainstorming session."

"Generate three campaign ideas."

"Save the second idea."

"Open the project brief."

"Turn this concept into a project."

"Show the creative board."

Use a validated command registry.

Do not execute arbitrary functions from raw model output.

---

# 10. SPATIAL PROJECTS WORKSPACE

Build SpatialProjectsWorkspace.

## Main panel

Display:
- Project search
- Status filters
- Project cards
- Recent projects
- Create Project action

## Spatial project cards

Cards should appear as floating interactive surfaces.

Each card includes:
- Cover image
- Project title
- Client
- Status
- Due date
- Progress

On selection:
- Highlight the selected card.
- Open a project detail panel.
- Load project data.
- Display relevant actions.

## Project detail view

Sections:
- Overview
- Brief
- Brainstorm
- Assets
- Tasks
- Deliverables
- Reviews

Allow users to switch sections without leaving the spatial environment.

## Project creation

Use a readable modal panel with validated fields.

Do not force users to enter long text through small 3D controls.

For desktop users, use a conventional DOM input overlay where appropriate.

For immersive XR, provide a compatible text-entry workflow using supported browser or device capabilities.

---

# 11. SPATIAL CREATION STUDIO

Build SpatialCreationStudio.

## Objective

Provide a spatial environment for organizing and producing creative content.

## Main creation surface

Display:
- Active project
- Current deliverable
- Preview area
- Creation mode
- Editing actions

## Asset shelf

Create a spatial asset library containing:
- Images
- Videos
- Audio
- Documents
- 3D models

Assets should be selectable.

Support previews for compatible formats.

## Spatial content board

Allow users to arrange:
- Images
- Video references
- Storyboard cards
- Text
- Concept cards
- 3D objects

Support:
- Select
- Move
- Rotate where appropriate
- Scale within limits
- Duplicate
- Remove
- Save layout

## Editing integration

Provide a clean adapter layer for supported editing tools.

Do not claim an external editor can run inside a 3D texture unless its integration supports that interaction.

For desktop preview:
Use an accessible DOM overlay for complex editing workflows when appropriate.

For immersive XR:
Provide spatial controls for supported editing actions.

Unsupported tools should show a clear availability state.

---

# 12. SPATIAL CLIENT REVIEW

Build SpatialReviewWorkspace.

## Main review surface

Display the selected deliverable.

Support:
- Image preview
- Video preview
- Document preview where available
- Version information

## Feedback panel

Display:
- Client comments
- Revision requests
- Approval status
- Review history

## Review actions

- Approve
- Request Changes
- Add Comment
- View Previous Version

Require appropriate permissions.

## Spatial feedback

For supported media, allow contextual feedback markers.

Each marker should reference:
- Deliverable
- Version
- Position or timestamp
- Comment
- Author

Store feedback coordinates in a format that can be restored consistently.

Do not allow comments on one version to appear incorrectly on another version.

---

# 13. AI ASSISTANT HUD

Build SpatialAIAssistant.

Place it on the right side of the main workspace.

It should contain:

- Assistant status
- Voice activity indicator
- Current transcript
- AI response
- Suggested actions
- Conversation history access

Possible assistant states:

idle
listening
transcribing
thinking
speaking
error

Provide clear visual feedback for every state.

## Voice command registry

Define commands such as:

OPEN_WORKSPACE
OPEN_PROJECT
CREATE_PROJECT
START_BRAINSTORM
SAVE_IDEA
SHOW_ASSETS
SELECT_ASSET
OPEN_REVIEW
APPROVE_DELIVERABLE
MOVE_PANEL
RESET_LAYOUT

Map each command to validated application actions.

For actions involving approval, deletion, publishing, or other consequential changes, require explicit confirmation.

---

# 14. QUICK-ACTION DOCK

Build SpatialActionDock.

Position it near the lower center of the user's comfortable viewing area.

Actions:
- Home
- Projects
- Brainstorm
- Create
- Assets
- Voice
- Reset View

Each button must provide:
- Icon
- Hover feedback
- Active feedback
- Tooltip
- Accessible label

Do not make the dock excessively large.

Allow it to hide or minimize during focused creative work.

---

# 15. SPATIAL PANEL SYSTEM

Create reusable panel primitives.

Suggested components:

SpatialPanel
SpatialButton
SpatialIconButton
SpatialText
SpatialCard
SpatialScrollArea
SpatialModal
SpatialTooltip
SpatialDock
SpatialNavigation
SpatialInputAdapter

Each panel should support:

- Unique ID
- Position
- Rotation
- Width
- Height
- Visibility
- Focus state
- Layer or depth ordering
- Optional movement
- Optional resizing
- Persisted layout

## Panel interactions

Support:
- Select
- Focus
- Close
- Minimize
- Reposition
- Reset position

Panel movement should have constraints.

Prevent:
- Panels moving behind the user unexpectedly.
- Panels becoming unreachable.
- Panels overlapping essential controls.
- Panels being scaled to unreadable sizes.

---

# 16. RENDERING STRATEGY

Use the existing XR rendering architecture.

For React Three Fiber implementations:

- Use Three.js primitives for spatial geometry.
- Use appropriate 3D text rendering.
- Use React Three Fiber for scene components.
- Use the existing XR integration for controller interaction.
- Use HTML overlays only where technically appropriate.

Important:

DOM overlays do not automatically work as interactive surfaces in every immersive XR browser.

Do not assume a normal HTML form rendered over the canvas will be visible or usable in an immersive headset session.

For immersive interaction, prefer XR-compatible 3D UI surfaces and input events.

Use separate desktop and immersive text-input adapters where necessary.

Avoid mounting an entire conventional React dashboard into a continuously updated 3D texture unless the interaction architecture has been explicitly implemented and tested.

---

# 17. INTERACTION SYSTEM

Build a unified interaction layer.

Supported input methods:

## Desktop

- Mouse pointer
- Click
- Drag
- Scroll
- Keyboard shortcuts
- Trackpad

## XR controllers

- Ray pointing
- Trigger selection
- Grip-based panel manipulation where supported
- Thumbstick navigation where appropriate

## Hand tracking

Implement only when supported.

Do not assume all XR devices provide equivalent gesture data.

## Voice

Use the existing Sarvam service.

Voice actions must be interpreted into structured commands.

## Interaction priority

When multiple input methods are available:
- Preserve a single active selection.
- Prevent duplicate actions.
- Avoid conflicts between dragging and clicking.
- Provide clear focus feedback.

---

# 18. ENVIRONMENT DESIGN

Create a restrained immersive environment.

Suggested environment:

A dark creative studio with:
- Soft ambient lighting.
- Subtle floor grid.
- Minimal environmental geometry.
- Distant background.
- Floating work surfaces.
- Optional room boundary indicators.

Avoid unnecessary visual noise.

Provide environment presets:

1. Dark Studio
2. Minimal Void
3. Creative Workspace

The Minimal Void preset should be the lowest-cost rendering option.

Do not rely on complex shaders for core functionality.

---

# 19. PERFORMANCE

Target smooth interaction on desktop and supported XR devices.

Optimize:
- Draw calls
- Geometry count
- Texture sizes
- Material complexity
- Font rendering
- React re-renders
- Event listeners
- Scene transitions

Use:
- Memoization where beneficial
- Lazy loading
- Instancing where appropriate
- Texture caching
- Suspense boundaries
- Asset disposal
- Reduced animation when needed

Do not update the entire React component tree every animation frame.

Separate high-frequency render state from application business state.

Measure performance rather than assuming it is acceptable.

---

# 20. RESPONSIVE SPATIAL LAYOUT

Spatial layout must respond to:

- Desktop viewport size
- Camera position
- XR device field of view
- Interaction mode
- User-selected workspace
- Panel visibility

Create layout presets:

COMPACT
STANDARD
FOCUSED
IMMERSIVE

## Compact

Main panel only, with minimized navigation and assistant.

## Standard

Main panel, navigation, assistant, dock.

## Focused

Main content and essential controls only.

## Immersive

Optimized for supported XR devices.

Avoid making UI positions depend on hardcoded desktop pixel coordinates.

---

# 21. STATE MANAGEMENT

Suggested state:

activeWorkspace
activeProjectId
selectedAssetId
selectedIdeaId
selectedDeliverableId
openPanels
focusedPanelId
panelLayouts
interactionMode
voiceState
xrSessionState
environmentPreset

Separate persistent and ephemeral state.

Persistent:
- Saved spatial layout
- Pinned idea cards
- Workspace preferences
- Project relationships

Ephemeral:
- Hover state
- Controller ray
- Temporary selection
- Animation progress

Do not persist transient frame-level interaction data.

---

# 22. SUGGESTED FILE STRUCTURE

Adapt this to the existing repository.

components/
  xr/
    core/
      spatial-hud-shell.tsx
      spatial-scene.tsx
      spatial-layout-manager.tsx
      xr-input-manager.tsx

    panels/
      spatial-panel.tsx
      spatial-modal.tsx
      spatial-card.tsx
      spatial-navigation.tsx
      spatial-action-dock.tsx

    workspaces/
      spatial-dashboard.tsx
      spatial-brainstorm.tsx
      spatial-projects.tsx
      spatial-project-detail.tsx
      spatial-create.tsx
      spatial-review.tsx
      spatial-assets.tsx

    assistant/
      spatial-ai-assistant.tsx
      voice-activity-indicator.tsx
      command-feedback.tsx

    environment/
      studio-environment.tsx
      floor-grid.tsx
      environment-presets.tsx

    interactions/
      pointer-interaction.ts
      controller-interaction.ts
      panel-manipulation.ts

lib/
  xr/
    spatial-layout.ts
    spatial-commands.ts
    spatial-types.ts
    spatial-persistence.ts

hooks/
  use-spatial-workspace.ts
  use-spatial-selection.ts
  use-spatial-layout.ts
  use-voice-commands.ts

Do not create unnecessary abstractions or duplicate existing components.

---

# 23. APPLICATION INTEGRATION

Connect the spatial UI to the existing application.

Required relationships:

Spatial Dashboard → Existing workspace services

Spatial Projects → Existing project APIs

Spatial Brainstorm → Existing brainstorm and AI services

Spatial Assets → Existing asset management

Spatial Review → Existing review workflows

Spatial Assistant → Existing Sarvam and Gemini integrations

The 2D and spatial experiences must share the same underlying domain data.

Do not maintain two independent project databases or incompatible data models.

Changes made in the spatial interface must be visible in the conventional web interface after successful persistence.

---

# 24. TESTING REQUIREMENTS

Implement appropriate tests.

## Component tests

Verify:
- Panel rendering
- Navigation
- Workspace switching
- Selection state
- Layout reset
- Assistant state
- Empty states
- Error states

## Integration tests

Verify:
- Project loading
- Brainstorm session loading
- Idea persistence
- Asset selection
- Review permissions
- Voice command validation

## Desktop browser tests

Verify:
- Scene initialization
- Mouse selection
- Keyboard interaction
- Panel switching
- Camera navigation
- Layout persistence

## XR testing

Test supported immersive hardware when available.

If no XR headset is available:
- Test desktop mode.
- Test XR capability detection.
- Test controller interaction logic using appropriate mocks.
- Clearly mark immersive hardware validation as pending.

Do not claim physical XR device compatibility without actual testing.

---

# 25. IMPLEMENTATION PHASES

Implement incrementally.

Phase 1:
Repository audit and renderer identification.

Phase 2:
Shared spatial HUD shell.

Phase 3:
Reusable spatial panels and navigation.

Phase 4:
Desktop spatial preview and input handling.

Phase 5:
Spatial Workspace Dashboard.

Phase 6:
Spatial Projects Workspace.

Phase 7:
Spatial Brainstorm Studio.

Phase 8:
AI assistant and voice command integration.

Phase 9:
Spatial Creation Studio.

Phase 10:
Spatial Client Review.

Phase 11:
XR controller interactions.

Phase 12:
Performance optimization and validation.

Do not attempt all phases in one unreviewable change.

---

# 26. GIT COMMIT STRATEGY

Use focused conventional commits.

Suggested commits:

feat(xr): establish spatial HUD architecture

feat(xr-ui): implement reusable floating panels

feat(xr-nav): add spatial navigation and action dock

feat(xr-workspace): build spatial dashboard

feat(xr-projects): integrate project management workspace

feat(xr-brainstorm): implement spatial ideation canvas

feat(xr-voice): add validated voice command controls

feat(xr-create): add spatial content creation workspace

feat(xr-review): implement spatial review interface

feat(xr-input): integrate XR controller interactions

perf(xr): optimize spatial UI rendering

test(xr): cover HUD navigation and interaction workflows

After each phase:
- Run type checking.
- Run linting.
- Run relevant tests.
- Fix introduced errors.
- Report changed files.
- Propose a commit message.

---

# 27. ACCEPTANCE CRITERIA

The implementation is acceptable when:

1. The existing XR scene still works.
2. The Spatial HUD loads without requiring a headset.
3. Navigation switches between functional spatial screens.
4. Projects load from the existing backend.
5. Brainstorm sessions integrate with existing AI services.
6. The assistant provides visible voice interaction states.
7. Spatial panels support selection and focus.
8. Desktop users can interact through mouse and keyboard.
9. Supported XR controllers can interact with the interface.
10. Workspace state is preserved appropriately.
11. Layouts are readable and do not overlap excessively.
12. The interface maintains the existing Shape Studio design identity.
13. Unsupported capabilities show appropriate fallbacks.
14. No duplicate database architecture is introduced.
15. Existing web application workflows remain intact.
16. Tests and validation results are documented accurately.

---

# FINAL EXECUTION INSTRUCTIONS

Start by auditing the current XR implementation.

Identify the renderer, route, scene architecture, and existing integration points.

Then implement the shared spatial HUD shell and the first functional dashboard.

Do not replace working systems unnecessarily.

Prioritize:

1. Visual consistency.
2. Functional spatial navigation.
3. Reusable UI primitives.
4. Integration with existing application data.
5. Desktop usability.
6. XR compatibility.
7. Performance.

After each implementation phase, report:

- Files created
- Files modified
- Components added
- Features connected
- Tests executed
- Known limitations
- Recommended Git commit

The finished result should feel like a coherent spatial creator operating system, not a collection of unrelated floating web pages.