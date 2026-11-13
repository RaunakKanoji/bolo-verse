# Voice and AI command boundaries

The browser XR implementation has explicit microphone consent, capture ownership, transcription/listening feedback and cleanup. [Sarvam speech adapters](../../apps/web/src/server/providers/xr-speech.ts) and the [Gemini assistant adapter](../../apps/web/src/server/providers/xr-assistant.ts) execute server-side. Live credentials/provider behavior remain separate acceptance gates.

Existing private routes are `/api/xr/assistant/{projectId}`, `/transcribe` and `/speak`. Their [application service](../../apps/web/src/server/xr-assistant/service.ts) authorizes creator/editor access, resolves project context and applies a shared durable request budget before provider calls. Native voice/conversation is not connected to these routes and has no microphone capture implementation yet.

The existing command families include:

- `apps/web/src/lib/contracts/commands.ts`: bounded recording/product commands in a versioned envelope with request ID and expected scene revision.
- `apps/web/src/lib/contracts/xr-assistant.ts`: XR proposals `OPEN_ASSET`, `FOCUS_PANEL`, `RESET_WORKSPACE` and `GENERATE_IDEAS`. Validation checks both shape and the exact authorized project/asset/panel set.

- `apps/web/src/lib/contracts/creative-actions.ts`: reviewed production planning actions for `/create`. UUID-only asset navigation is resolved against the authorized project; scene/review actions open existing workflows. Text/duration affect a labeled local planning draft, saves use the existing private creative-draft CAS, captions use persistent Brainstorm/Gemini and review sharing still requires an explicit version/reviewer. Transcription reuses the private Brainstorm Sarvam route.

A shared browser microphone lease coordinates these capture paths with camera recording and the original mono canvas recorder. These families are not a completed cross-platform registry. Existing browser proposals require explicit application; destructive reset requires confirmation. No path executes arbitrary model-generated code. Raw command audio is not persisted by the current speech request path.

## Planned unified pipeline

```text
Platform microphone capture → supported speech adapter → transcript
→ constrained interpretation → versioned command → authorization
→ strict validation → deterministic operation → state feedback
→ optional spoken response
```

Separate creative suggestions from application control. A creative reply may propose ideas without mutating a scene. A control command must reference stable resource IDs and a registered operation with bounded parameters, permission requirements and explicit confirmation policy.

The initial shared registry should expose only operations implemented by the receiving platform. Ambiguous targets require clarification. Destructive, externally visible, costly or high-impact actions require confirmation. Saving remains an authorized server mutation with revision checks; interpreting a command does not grant permission to perform it.

Add native microphone capture through native APIs with permission/listening indicators and a single owner. Browser MediaRecorder code cannot be reused as Swift capture code. Preserve audio byte/duration limits, cancellation, timeouts and sanitized errors across adapters.

Before extending the registry, test malformed/untrusted model output, foreign resource IDs, unsupported platform operations, repeated command IDs, stale revisions, revocation and user cancellation. Voice control in the new R3F/canonical editor is a future vertical slice; existing XR voice support does not satisfy it automatically.
