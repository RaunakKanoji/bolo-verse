# UI context

Light mode is primary: soft canvas, frosted surfaces, lavender selection, subtle borders, readable type and generous spacing. Semantic tokens originate in `packages/design-tokens/tokens.json`, generate CSS/Swift constants, and include dark appearance. Native views use system materials/typography with shared accents, radii and spacing; volumes and immersive studies use native gaze/pinch targeting without raw tracking access.

The web creative playground has a narrow tools rail, floating primary navigation and controls / preview / editing columns. Narrow layouts must preserve draft/edit state, keep controls reachable and avoid page overflow. Icon-only links retain accessible names. Respect reduced motion and keyboard focus. Alt+1…4 navigate outside editable fields.

Image, Video, Audio and 3D keep distinct prompt drafts. Creation settings must reflect actual implemented capabilities. Generate remains disabled while the job/provider/storage pipeline is absent. The illustrative image and local edit snapshots are labelled; they are not server generation history. Local PNG export must produce actual edited pixels.

The existing dashboard, full-screen XR scene, protected asset preview and recording lab remain available. An infinite brainstorming canvas, real server generation history, sharing, moodboards and client reviews are later phases; do not present their controls as functional.

The unified target uses R3F for a future custom browser editor while preserving the isolated A-Frame experience. Phase 1 retains the working shells. Native SwiftUI windows, volumes and immersive scenes use their own interaction conventions; share semantic tokens rather than renderer objects or CSS implementations.
