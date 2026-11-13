# Known limitations

13 November 2026. The full prototype decision is **NOT READY**.

## P0 — prevents complete live acceptance

- Clerk publishable/secret configuration, an active `DEMO_CREATOR_CLERK_ID`, real development client/creator sessions and callbacks are required. No accounts or bypass credentials were fabricated.
- Private R2 account/access/secret configuration is absent. The bucket field being present is not proof of a created bucket, CORS or successful object persistence.
- Gemini text/image and Sarvam STT model fields are missing. Present API-key fields were not validated and must never be logged. No real provider success, billable generation or physical microphone recognition is claimed.
- The production editor supports manual structured direction/script/storyboard/note versioning and copying saved idea text. Direct structured AI artifact generation is explicitly unavailable. Template replies are suggestions, not automatically saved production artifacts.
- Final combined build verification is blocked by concurrent dependency drift and a missing spatial Clerk module. The last isolated browser rerun could not start because automatic permission review timed out. Baseline evidence applies to the earlier tree only.

## Functional bounds

- Client intake first commits project metadata, initial brief and designated membership atomically, then uploads files individually. A failed file leaves a real project and a retryable incomplete submission; it does not roll back already transferred files or claim all-or-nothing cloud upload.
- Intake files use the existing supported MIME/extension/byte limits. PDF, static PNG/JPEG/WebP, bounded self-contained glTF/GLB, WebM/MP4 and PCM WAV are supported where advertised. Office documents, arbitrary audio and document extraction are not implemented. No filename or component presence proves codec support.
- The submitted initial brief is proposed, never an invented approval. Its author may read that submitted version; later proposed creator revisions remain private until approved under established policy.
- Personal workspaces and explicit project memberships are implemented; organizations, self-service creator invitations and complex reassignment are not.
- Review/publication concerns verified uploaded images. Video/audio reviews and new rendering providers are not implied by upload or preview support.
- No raw command audio is persisted. Synthetic microphone capture, mocked STT, command parsing, action execution and real physical recognition are separate evidence categories.
- Text-only storyboard cards are not generated image frames. Synthetic Nova Coffee references are upload inputs, not AI results or approved deliverables.
- Browser R3F, A-Frame and direct Three.js recording stay isolated. The main browser demo can run without a headset; immersive/device/native accessibility acceptance remains separate.
- Presence/realtime, advanced collaboration, analytics and conversion remain later domains. No invented activity, performance metrics or approvals fill those gaps.

## Verification environment

The first workspace check hit a sandbox socket `EPERM`; its socket-enabled rerun passed. A later broad browser run passed 115 cases before interruption, with four timeouts around fullscreen/spatial initialization and 54 cases not run. Resource contention and a nearly full disk affected later checks. Do not present that run as a full pass. Only task-owned temporary traces were removed; unrelated services and data were preserved.
