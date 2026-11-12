# Shape Studio Spatial

A native SwiftUI/RealityKit application for visionOS 26+, with a checked-in Xcode project and an independent Swift 6.2 package. It shares the existing Shape Studio backend; it does not embed the web dashboard.

## Run

1. Open `ShapeStudio.xcodeproj`, select **ShapeStudio** and an Apple Vision Pro simulator. The labelled procedural study and local prompt editor require no credentials.
2. Copy `Config/Local.xcconfig.example` to ignored `Config/Local.xcconfig`. Set the HTTPS backend origin and the same public Clerk publishable key as the web server. The example escapes URL slashes for xcconfig.
3. For live sign-in, choose a unique bundle identifier/signing team, enable Clerk Native API and register the actual Apple App ID prefix/bundle ID in that Clerk instance. Never put backend secrets or session tokens in the app configuration.
4. Apply the shared backend migrations through `0005_spatial_scenes.sql` in your intended database. No live database was migrated during implementation.

The workspace, product volume and spatial inspector each use one native window. Opening them again brings the existing window forward. Use **Open Workspace** in the volume or inspector to return to the main screen, or **Close volume** to return and close the product view. The main workspace is the launch destination; transient product/inspector windows do not restore on app launch.

ClerkKit is pinned to **1.5.8**. Releases 1.5.9 through 1.7.1 use `weak let`, which failed compilation on the installed Xcode 26.0.1 / Swift 6.2. This compatibility pin does not include subsequent SDK fixes; re-evaluate it with a newer Xcode and repeat authentication acceptance before release. No SDK source is patched.

## Implemented

- Native workspace, project browser, asset library, image preview, four-mode prompt editor and spatial inspector windows.
- Hosted Clerk auth adapter, SDK Keychain storage, one application-owned session observer, cancellation and private-state clearing. Failed credential cleanup exposes retry and persists a nonsecret sign-out fence.
- Authorized project/assets services, bounded image previews and private prompt drafts with explicit revision-checked saves.
- RealityKit product volume with procedural study, bounded local USDZ imports, targeted gestures, numeric controls, visibility, undo/redo/reset and local scene export/restore.
- Eligible authorized project USDZ delivery; canonical project scene saves preserve other objects and retain edits on conflicts. Applying saved transforms requires explicit action.
- Optional mixed-immersion local study with visible exit controls.

Image export produces a downsampled PNG preview. Local prompts are ephemeral until saved to an authorized project. Local models remain in the app sandbox (8 files / 128 MiB); private project models use temporary files and no durable cache.

## Boundaries

Media-generation jobs, native AI conversation/microphone recording, native review/approval, upload/finalization, USDZ conversion and multi-object immersive editing remain unimplemented. The UI labels unavailable capabilities; no sample represents a completed generation or client approval. Existing web AI/XR functionality is preserved.

USDZ imports/delivery accept at most 32 MiB, 64 stored archive entries, 16 PNG/JPEG textures, 4,096-pixel texture dimensions and 16 megapixels total. Entity/mesh/material budgets are checked after RealityKit loads a model, before attachment. These checks do not guarantee peak native decoder allocation. See [spatial implementation details](ShapeStudio/Spatial/README.md).

## Checks

From the repository root:

```sh
pnpm native:sync       # after updating generated API or token artifacts
pnpm native:check      # fail on copied-artifact drift
pnpm native:test
xcodebuild -project apps/visionos/ShapeStudio.xcodeproj -scheme ShapeStudio \
  -destination 'generic/platform=visionOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

For UI tests select an installed Vision Pro simulator and Product → Test, or pass its ID to `xcodebuild test`. UI tests expect empty public configuration. Test sources do not imply execution; see [actual validation evidence](../../docs/shape-studio/native-validation.md).

Maintainers can regenerate the checked-in project using `ruby scripts/generate-visionos-project.rb` with `xcodeproj` gem 1.28.1 after adding app/UI-test Swift files. Ordinary builds require neither Ruby nor pnpm. Swift compiles copied generated Codable/token sources inside its package; it does not import TypeScript executable code.
