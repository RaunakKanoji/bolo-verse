# MASTER IMPLEMENTATION PROMPT
## Browser-Based XR Creative Studio — A-Frame + WebXR + Next.js

### Role and objective

You are a principal software architect, senior full-stack engineer, XR engineer, and product designer responsible for implementing a production-oriented XR creative workspace inside our existing content creator application.

Our platform connects content creators with MSME clients and supports the complete creative production lifecycle:

1. MSME clients submit creative briefs.
2. Creators review requirements and brainstorm with AI assistants.
3. Creators generate ideas, scripts, storyboards, designs, and other creative assets.
4. Creators work with integrated creative tools and AI services.
5. Clients review content, request revisions, and approve deliverables.
6. Creators manage production and delivery.

We want to extend this experience into an immersive spatial environment.

**Primary goal:** Implement a browser-based XR studio that works as an interactive 3D workspace on desktop and can enter immersive VR mode on supported devices.

The initial XR framework must be **A-Frame**, which uses Three.js internally.

The application must be designed so that the XR implementation can eventually be extended with React Three Fiber, native visionOS, and additional XR platforms.

Do not rebuild the existing application from scratch.

---

# PHASE 0 — REPOSITORY ANALYSIS

Before writing code, inspect the existing repository.

Identify:

- Next.js version and App Router structure.
- Existing TypeScript configuration.
- Tailwind and shadcn/ui implementation.
- Authentication and Clerk configuration.
- Neon PostgreSQL integration.
- Existing ORM and database schemas.
- API routes and server actions.
- Project, client, creator, and asset models.
- Existing AI service integrations.
- Current design tokens and component library.
- Existing testing and CI configuration.
- Existing project documentation and feature specifications.

Read and follow the existing project context files if present:

- `ai-workflow-rules.md`
- `architecture-context.md`
- `code-standards.md`
- `progress-tracker.md`
- `project-overview.md`
- `ui-context.md`

Do not overwrite existing configurations unnecessarily.

Do not introduce a second ORM, authentication provider, or conflicting design system.

Create a short implementation plan identifying which existing modules can be reused and which new modules are required.

Preserve all existing application functionality.

---

# PHASE 1 — XR TECHNOLOGY ARCHITECTURE

## 1.1 Core technology stack

Use the following technologies.

**Frontend**
- Next.js with App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons

**XR and 3D**
- A-Frame as the initial XR scene framework
- Three.js through A-Frame
- WebXR Device API
- WebGL rendering
- GLTF/GLB 3D assets
- Browser-native XR session capabilities

**Backend**
- Node.js through existing Next.js server routes
- Neon PostgreSQL
- Existing ORM
- Clerk authentication
- Existing file storage integration, preferably Cloudflare R2 if already configured

**AI services**
- Gemini for brainstorming and creative assistance
- Sarvam for supported speech-to-text and text-to-speech capabilities
- Existing AI integration abstractions

**Deployment**
- Vercel
- HTTPS-enabled deployment
- Existing environment variable management

Do not introduce Unity, Unreal Engine, or native device SDKs into the browser implementation.

## 1.2 Architecture principles

Follow these principles:

1. Browser-first implementation.
2. Progressive enhancement for XR.
3. Shared application backend.
4. Shared authentication.
5. Shared project data.
6. Clear separation between React UI and A-Frame scene management.
7. Reusable domain services.
8. Minimal duplication of business logic.
9. Lazy-loaded 3D assets.
10. Graceful fallback when immersive XR is unsupported.

The desktop experience must remain fully usable without a headset.

Do not assume every WebXR-capable browser supports every XR feature.

---

# PHASE 2 — APPLICATION ROUTES

Implement the XR studio under the existing authenticated application.

Suggested routes:

```text
/app
  /studio
    /page.tsx
    /xr
      /page.tsx
      /[projectId]
        /page.tsx
    /projects
      /[projectId]
        /page.tsx
```

Adapt this structure to the existing routing conventions.

### `/studio`

The standard creative workspace.

Include an entry point labeled:

**Open Spatial Studio**

This opens the browser-based 3D workspace.

### `/studio/xr`

The XR studio landing page.

Responsibilities:

- Detect browser capabilities.
- Display available interaction modes.
- Load recent projects.
- Show a 3D studio preview.
- Allow users to enter the spatial workspace.

### `/studio/xr/[projectId]`

The main immersive workspace.

Responsibilities:

- Load the selected project.
- Render its spatial workspace.
- Display creative assets.
- Provide project tools.
- Support AI interaction.
- Save spatial workspace state.

Use authenticated, authorized project access for every route and data operation.

---

# PHASE 3 — XR CAPABILITY DETECTION

Create a reusable capability detection module.

Suggested location:

```text
lib/xr/capabilities.ts
```

Implement detection for:

- WebXR API availability.
- Immersive VR session support.
- Immersive AR session support.
- WebGL rendering availability.
- Pointer input.
- Touch input.
- Microphone availability.
- Secure context availability.

Example interface:

```typescript
export interface XRCapabilities {
  webxrAvailable: boolean;
  immersiveVRSupported: boolean;
  immersiveARSupported: boolean;
  webglAvailable: boolean;
  secureContext: boolean;
  pointerSupported: boolean;
  touchSupported: boolean;
}
```

Use:

```typescript
navigator.xr?.isSessionSupported(
  "immersive-vr"
);
```

and:

```typescript
navigator.xr?.isSessionSupported(
  "immersive-ar"
);
```

Handle unavailable APIs and rejected promises.

Do not identify XR support solely from the browser user-agent string.

Create a React hook:

```typescript
useXRCapabilities()
```

The hook should return:

```typescript
{
  capabilities,
  loading,
  error,
  refresh
}
```

Capability detection must run client-side.

Do not access browser globals during server rendering.

### XR modes

Support three modes initially:

**Desktop mode**

Standard 3D scene using mouse, keyboard, and optional touch controls.

**Immersive VR mode**

Available only when the browser and device support an immersive VR session.

**Immersive AR mode**

Feature-gated and available only when the browser supports an immersive AR session and the scene is configured for it.

If XR is unavailable, display:

"Immersive XR is unavailable on this browser. You can still explore the studio in 3D."

Never block the desktop experience solely because XR is unsupported.

---

# PHASE 4 — A-FRAME INTEGRATION

## 4.1 Install dependencies

Install compatible versions of:

```bash
npm install aframe three
```

Add TypeScript declarations using maintained packages if compatible, or define minimal local types for the APIs actually used.

Do not disable TypeScript checking globally.

Avoid loading A-Frame during server-side rendering.

## 4.2 Client-only scene component

Create:

```text
components/xr/
  xr-scene.tsx
  xr-scene-loader.tsx
  xr-capability-panel.tsx
  xr-mode-controls.tsx
  xr-error-boundary.tsx
```

Use dynamic imports to load the XR scene client-side.

Example:

```tsx
"use client";

import dynamic from "next/dynamic";

const XRScene = dynamic(
  () => import(
    "@/components/xr/xr-scene"
  ),
  {
    ssr: false,
  }
);

export default function XRStudioPage() {
  return <XRScene />;
}
```

Adapt the import and route structure as required.

Ensure A-Frame has loaded and registered its custom elements before rendering the scene.

Do not assume that `ssr: false` alone resolves all custom-element typing, lifecycle, or initialization problems.

## 4.3 Basic scene

Implement a functioning scene containing:

- Camera rig.
- Ground plane.
- Lighting.
- Environment.
- Spatial workspace.
- Floating project panels.
- Interactive 3D objects.
- Controller support where available.

Use a simple environment for the MVP.

Avoid expensive 3D assets during the first implementation.

### Scene initialization

Create a scene manager responsible for:

- Scene readiness.
- XR session events.
- Asset loading.
- Camera positioning.
- Scene cleanup.
- Error handling.
- Frame performance monitoring.

Do not create duplicate scenes during React rerenders.

Remove event listeners and dispose of custom resources when the scene unmounts.

---

# PHASE 5 — SPATIAL WORKSPACE DESIGN

The visual experience should be inspired by the clarity, material hierarchy, spacing, and restrained motion of Apple's spatial computing interfaces.

Do not copy proprietary Apple UI assets.

The workspace should feel like a premium creative productivity application rather than a traditional video game.

## 5.1 Visual language

Use:

- Light neutral surfaces.
- Soft blue accents.
- Subtle translucent materials.
- Rounded spatial panels.
- Restrained shadows.
- Comfortable panel spacing.
- Smooth transitions.
- Minimal visual clutter.

Suggested color tokens:

```css
:root {
  --xr-background: #f5f7fb;
  --xr-surface: #ffffff;
  --xr-primary: #3478f6;
  --xr-secondary: #8e8e93;
  --xr-border: #dfe4ec;
  --xr-text: #1d1d1f;
}
```

Reuse the existing design system wherever practical.

## 5.2 Workspace layout

Create a virtual studio with these areas:

**Central creative canvas**

The primary content workspace.

Supports:

- Image previews.
- Video preview surfaces.
- Storyboards.
- Design references.
- Creative briefs.
- 3D model previews.

**Left project navigator**

Contains:

- Current project.
- Project files.
- Content collections.
- Storyboard sections.
- Creative tools.

**Right AI assistant panel**

Contains:

- AI brainstorming.
- Creative recommendations.
- Script suggestions.
- Project context.
- Voice assistant controls.

**Bottom workspace toolbar**

Contains:

- Select.
- Move.
- Rotate.
- Scale.
- Reset layout.
- Save workspace.
- Enter or exit immersive mode.

**Client review panel**

Contains:

- Feedback.
- Revision requests.
- Approval status.
- Asset comments.

For the MVP, these panels may use simplified spatial representations.

Avoid trying to render the entire existing React application directly as an interactive 3D texture.

Implement a clear mapping between application data and spatial components.

---

# PHASE 6 — INTERACTION SYSTEM

Implement an interaction abstraction supporting multiple input methods.

Suggested structure:

```text
lib/xr/interactions/
  interaction-manager.ts
  desktop-input.ts
  controller-input.ts
  spatial-selection.ts
  transform-controls.ts
```

## Desktop controls

Support:

- Mouse selection.
- Click-to-activate.
- Orbit or look controls.
- Keyboard movement.
- Dragging where appropriate.
- Reset camera.

## VR controls

Where supported:

- Head tracking.
- Controller raycasting.
- Trigger selection.
- Spatial object positioning.
- Recenter workspace.

Hand tracking may be added later if supported by the target browser and device.

Do not make hand tracking a dependency for the MVP.

## Object interactions

Implement reusable behaviors:

```typescript
interface SpatialObject {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  selectable: boolean;
  movable: boolean;
}
```

Allow users to:

1. Select an object.
2. Move it.
3. Rotate it.
4. Reset its position.
5. Save its transform.

Implement keyboard-accessible alternatives for core actions in desktop mode.

Ensure interactive targets are large enough for VR controller selection.

---

# PHASE 7 — PROJECT DATA INTEGRATION

The XR workspace must connect to the existing application data.

Do not create a separate project database.

Reuse the existing project and asset identifiers.

Introduce spatial workspace persistence only where required.

Suggested data model:

```typescript
interface SpatialWorkspace {
  id: string;
  projectId: string;
  ownerId: string;
  version: number;
  environment: string;
  objects: SpatialObject[];
  updatedAt: string;
}
```

The database should store:

- Workspace identifier.
- Project identifier.
- User or organization ownership.
- Environment configuration.
- Object transforms.
- Layout version.
- Creation and update timestamps.

Choose normalized tables or JSONB based on the existing ORM and project requirements.

### Workspace operations

Implement:

```text
GET    /api/xr/workspaces/:projectId
PUT    /api/xr/workspaces/:projectId
POST   /api/xr/workspaces/:projectId/reset
```

Adapt these endpoints to the existing API conventions.

All mutations must validate inputs and enforce authorization.

Do not trust project IDs or ownership information supplied by the browser.

Implement optimistic concurrency using workspace versions or another appropriate mechanism.

Prevent one user from overwriting another user's changes silently.

---

# PHASE 8 — CREATIVE ASSET INTEGRATION

Users should be able to view existing creative assets inside the spatial studio.

Support the following asset types initially:

- Images.
- Video thumbnails and previews.
- PDFs represented as document cards.
- Text briefs.
- 3D GLB/GLTF assets.

### Asset interactions

Users should be able to:

- Open an asset.
- Preview it.
- Move its spatial representation.
- Inspect metadata.
- Return to the standard editor.

Do not attempt to reproduce full professional editing tools inside the XR scene during the MVP.

For unsupported content types, show a preview card and an **Open in Editor** action.

Use existing asset storage and authorization services.

Use short-lived signed URLs or equivalent authorized access patterns for protected files.

Avoid exposing private storage credentials to the browser.

---

# PHASE 9 — AI ASSISTANT INTEGRATION

Integrate the existing Gemini and Sarvam services through the application's established backend abstractions.

The spatial studio should include an AI assistant represented by a floating interface.

## 9.1 AI capabilities

Support:

- Creative brainstorming.
- Brief summarization.
- Content ideation.
- Script suggestions.
- Storyboard suggestions.
- Asset recommendations.
- Workspace navigation commands.

The AI should receive relevant project context only when the user is authorized to access it.

## 9.2 Voice interaction

Implement a microphone control.

Expected workflow:

```text
User activates microphone
        ↓
Audio capture
        ↓
Speech-to-text service
        ↓
Intent classification
        ↓
Authorized application action
        ↓
Assistant response
        ↓
Optional text-to-speech
```

Use Sarvam for supported speech services.

Keep service credentials on the server.

Do not continuously record microphone input without explicit user activation.

Provide visible recording and processing states.

## 9.3 AI workspace commands

Start with a restricted command vocabulary:

```typescript
type XRCommand =
  | {
      type: "OPEN_ASSET";
      assetId: string;
    }
  | {
      type: "FOCUS_PANEL";
      panelId: string;
    }
  | {
      type: "RESET_WORKSPACE";
    }
  | {
      type: "GENERATE_IDEAS";
      projectId: string;
    };
```

Example commands:

"Open the campaign storyboard."

"Show me the client's feedback."

"Focus on the design references."

"Generate three ideas for this campaign."

"Reset my workspace."

Validate every command before execution.

The AI must not directly execute arbitrary JavaScript, SQL, or unrestricted browser actions.

Require confirmation for destructive operations.

---

# PHASE 10 — BROWSER AND VISIONOS COMPATIBILITY

Create a platform compatibility layer.

Suggested location:

```text
lib/xr/platform/
  detect-platform.ts
  platform-capabilities.ts
  compatibility.ts
```

Support the following targets:

| Platform | MVP experience |
|---|---|
| Chrome desktop | 3D workspace |
| Edge desktop | 3D workspace |
| Safari macOS | 3D workspace |
| Meta Quest Browser | 3D + supported immersive VR |
| Apple Vision Pro Safari | Browser 3D + supported WebXR capabilities |
| Mobile browser | Simplified touch-based 3D |

Do not assume that every platform supports immersive VR or AR.

Use feature detection rather than hard-coded device assumptions.

### VisionOS preparation

The initial implementation must remain web-based.

Do not build the native visionOS application in this phase.

However, structure the application so a future SwiftUI and RealityKit client can reuse:

- Authentication.
- Project APIs.
- Workspace persistence.
- Asset services.
- AI services.
- Collaboration services.

Document the differences between browser-based XR and native visionOS capabilities.

---

# PHASE 11 — PERFORMANCE ENGINEERING

XR rendering requires consistent frame performance.

Implement the following:

### Rendering optimization

- Limit draw calls.
- Reuse geometries and materials.
- Use texture compression where appropriate.
- Reduce unnecessary transparency.
- Avoid excessive dynamic lighting.
- Use low-poly assets.
- Lazy-load large assets.
- Avoid unnecessary React rerenders.
- Dispose of GPU resources correctly.

### Asset optimization

- Optimize GLB/GLTF models.
- Resize large images.
- Use appropriate texture resolutions.
- Defer nonessential assets.
- Display loading placeholders.

### Performance targets

Use these as engineering goals, not guaranteed outcomes:

- Desktop scene should remain responsive.
- Avoid noticeable frame stutter during common interactions.
- Target the headset's supported refresh rate in immersive VR.
- Monitor frame time and dropped frames.
- Avoid large main-thread blocking operations.

Add a development-only performance overlay showing:

- Approximate FPS.
- Frame time.
- Draw calls where available.
- Rendered object count.

Do not ship verbose performance diagnostics in production by default.

---

# PHASE 12 — ERROR HANDLING

Handle:

- WebXR unavailable.
- Immersive session rejected.
- User cancels XR entry.
- Headset disconnects.
- WebGL initialization fails.
- Assets fail to load.
- Network requests fail.
- Microphone permission denied.
- Workspace save conflicts.
- Authentication expires.

Every error should have a recoverable fallback where possible.

For example:

If immersive VR fails, return the user to desktop 3D mode without losing unsaved workspace changes.

Do not allow an XR failure to crash the entire application.

---

# PHASE 13 — SECURITY

Follow existing application security standards.

Requirements:

1. Enforce Clerk authentication.
2. Authorize project access server-side.
3. Validate workspace mutations.
4. Protect private assets.
5. Restrict AI tool execution.
6. Protect API credentials.
7. Validate uploaded 3D asset types and sizes.
8. Prevent unsafe HTML injection into spatial panels.
9. Avoid unrestricted loading of remote scripts.
10. Do not expose confidential project briefs to unauthorized users.

Apply appropriate content security policies for A-Frame, WebGL, media assets, and API connections.

Do not weaken the entire application's CSP simply to make the XR scene work.

---

# PHASE 14 — TESTING

Implement automated tests for:

### Unit tests

- Capability detection.
- Workspace serialization.
- Transform validation.
- Command validation.
- Platform compatibility logic.

### Integration tests

- Workspace API authorization.
- Workspace persistence.
- Project asset loading.
- AI command handling.
- Save conflict behavior.

### Browser tests

Test:

- Desktop scene loads.
- Navigation works.
- Objects can be selected.
- Objects can be moved.
- Workspace saves.
- Workspace reload restores layout.
- Unsupported XR displays fallback UI.

Use the existing test framework where available.

For immersive headset testing, document manual test cases because desktop browser automation cannot fully reproduce physical XR hardware.

---

# PHASE 15 — IMPLEMENTATION SEQUENCE

Implement in small, reviewable milestones.

## Milestone 1 — Foundation

- Inspect repository.
- Confirm architecture.
- Install A-Frame.
- Configure client-only loading.
- Create XR routes.
- Implement capability detection.

Expected result:

A working XR route that renders a simple 3D scene on desktop.

## Milestone 2 — Spatial workspace

- Camera rig.
- Lighting.
- Environment.
- Floating panels.
- Selection interactions.
- Desktop navigation.

Expected result:

A usable 3D creative workspace.

## Milestone 3 — Immersive VR

- VR entry controls.
- WebXR session handling.
- Controller interaction.
- Recenter behavior.
- Exit handling.

Expected result:

A functioning immersive workspace on a supported headset/browser.

## Milestone 4 — Project integration

- Load projects.
- Load assets.
- Render asset previews.
- Save spatial layouts.
- Restore workspace state.

Expected result:

The XR workspace displays real project data.

## Milestone 5 — AI integration

- Assistant panel.
- Text-based commands.
- Voice capture.
- Sarvam integration.
- Gemini integration.
- Restricted workspace actions.

Expected result:

Users can interact with the workspace through AI-assisted commands.

## Milestone 6 — Polish and validation

- Improve visual design.
- Optimize performance.
- Add loading states.
- Improve error handling.
- Add tests.
- Document platform limitations.

Expected result:

A stable browser-based XR prototype suitable for demonstrations.

---

# PHASE 16 — CODE QUALITY AND GIT COMMITS

Follow existing repository standards.

Use strict TypeScript.

Avoid `any` unless a documented third-party compatibility boundary makes it unavoidable.

Prefer small reusable modules.

Separate:

- XR rendering.
- Input handling.
- Application state.
- Backend services.
- AI integrations.
- Persistence.

Do not introduce large monolithic components.

Use Conventional Commits.

Suggested commit sequence:

```text
chore(xr): initialize A-Frame dependencies

feat(xr): add browser capability detection

feat(xr): create client-only studio scene

feat(xr): implement spatial workspace layout

feat(xr): add desktop interaction controls

feat(xr): enable immersive VR sessions

feat(xr): integrate project assets

feat(xr): persist spatial workspace state

feat(xr): integrate AI assistant commands

feat(xr): add voice interaction support

test(xr): cover workspace and capability logic

docs(xr): document architecture and device support
```

Make commits only after the corresponding functionality has been implemented and validated.

Do not rewrite unrelated Git history.

---

# PHASE 17 — DOCUMENTATION

Create or update:

```text
docs/xr/
  architecture.md
  browser-support.md
  interaction-system.md
  workspace-schema.md
  ai-integration.md
  testing.md
  deployment.md
```

Documentation must explain:

- How to run the XR studio locally.
- How to access desktop mode.
- How to enter immersive VR.
- Which devices are supported.
- How the application connects to project data.
- How workspace persistence works.
- How to add new spatial components.
- How to integrate additional creative tools.
- Known limitations.
- Future visionOS migration strategy.

Update existing progress-tracking and architecture context files where appropriate.

---

# PHASE 18 — ACCEPTANCE CRITERIA

The implementation is complete when:

- [ ] The existing application still works.
- [ ] The XR studio route loads successfully.
- [ ] A-Frame renders without server-side rendering errors.
- [ ] Desktop users can navigate the scene.
- [ ] Users can select and manipulate spatial objects.
- [ ] XR capability detection works.
- [ ] Supported headsets can enter immersive VR.
- [ ] Unsupported browsers have a usable fallback.
- [ ] Project data loads through authorized APIs.
- [ ] Creative assets appear in the workspace.
- [ ] Workspace layouts persist across reloads.
- [ ] AI commands use validated application actions.
- [ ] Microphone permissions are handled safely.
- [ ] The implementation passes existing type checks and tests.
- [ ] New tests cover critical XR functionality.
- [ ] Documentation is updated.

Do not claim hardware compatibility without testing it on the target device.

---

# FINAL INSTRUCTIONS

Begin by examining the existing repository and producing a concise implementation plan.

Then implement the XR foundation, desktop workspace, and capability detection first.

Proceed through the milestones in order.

Prioritize a working end-to-end experience over implementing many incomplete features.

Do not fabricate integrations or use placeholder data when real existing project data is available.

If an external service is not configured, provide a clearly labeled mock adapter for development without pretending that the real integration is operational.

Preserve the existing application's architecture, visual consistency, security boundaries, and development conventions.

At completion, report:

1. Files created or modified.
2. Features implemented.
3. Database changes.
4. APIs added.
5. Tests executed and results.
6. Known limitations.
7. Hardware testing still required.
8. Next recommended development milestone.

**Build a functional, extensible browser-based XR creative studio, not merely a visual demonstration.**