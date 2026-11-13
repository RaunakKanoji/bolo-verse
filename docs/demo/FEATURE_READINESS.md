# Prototype feature readiness

13 November 2026, Asia/Kolkata. **Decision: NOT READY for the complete live client-to-approval demonstration.** Local SQL/HTTP fixtures are distinct from real authentication, provider, storage, speech and deployed acceptance. See TEST_RESULTS.md for the exact verification boundary.

| Feature | Current implementation / status | Inspected files, APIs, entities | Evidence, fixes and remaining blockers |
| --- | --- | --- | --- |
| Client project submission | **Partially implemented**: dedicated `/projects/new`, all brief fields, atomic metadata/brief/assignment and sequential private uploads | `features/platform/ProjectSubmission.tsx`, `lib/contracts/project-submissions.ts`, `server/db/project-submissions.ts`; `POST /api/projects/submissions`; projects, project_members, brief_versions | New SQL/unit/browser coverage. Metadata-first upload retry preserves the project and UUID keys. Client-to-creator ownership correction passes the final focused SQL gate. Real Clerk, designated creator and R2 acceptance blocked. |
| Creator project workspace | **Implemented and tested** in baseline automated environment; new intake integration pending final gate | `features/platform/ProjectWorkspace.tsx`, `server/db/workspace.ts`; workspace project list/detail, briefs/assets; projects/members/assets/tasks | Baseline workspace suite, production builds and browser navigation passed. Assignment uses persisted project membership. No real client-submitted project has been opened by a real creator here. |
| AI brainstorming | **Partially implemented**: real server adapter, persisted private sessions/replies/ideas, ten editable templates | `features/brainstorm/BrainstormStudio.tsx`, `server/services/brainstorm-studio.ts`, `lib/contracts/brainstorm-templates.ts`; brainstorm sessions/messages/ideas routes and tables | Added saved-idea context, redaction-before-truncation and stale-context rejection with regression tests. No document extraction, streaming or analysis of uploaded media. Live Gemini key/model/account acceptance blocked. |
| Creative production | **Partially implemented**: manual direction/script/text-storyboard/note editor and immutable versions; private saved-idea handoff | `features/projects/ProjectProduction.tsx`, `server/db/production-artifacts.ts`; `GET/POST /api/projects/:id/artifacts`; artifact_versions, brief_versions, actor-private brainstorm ideas | Seven SQL cases passed in the final focused gate; new artifact browser cases remain unverified. Scene cards are text, not generated image frames. Direct structured artifact generation remains unavailable. |
| Voice controls | **Partially implemented**: actual MediaRecorder capture, Sarvam STT adapter, transcript, strict proposals and explicit Apply | `features/platform/CreationVoice.tsx`, `lib/contracts/creative-actions.ts`, `xr/assistant/voice-capture.ts`; existing brainstorm transcribe endpoint | Added allowlisted `Open the storyboard.` after project authorization. New test records a synthetic browser microphone, mocks STT and mounts the actual storyboard panel. This does not verify real recognition or a physical microphone. |
| Browser spatial workspace | **Implemented and tested** in prior/baseline automated slices; **live hardware unverified** | `apps/spatial-web/src/editor`, `xr/runtime/studio-adapter.ts`, `xr/hud`; canonical scenes and authorized workspace APIs | Desktop fallback, R3F, separate A-Frame and mono recorder retained. Current full browser sweep was interrupted after resource-related failures; affected cases need rerun. Voice still uses existing tool handoffs, not a new immersive authoring system. |
| AI content generation | **Blocked** for live demo; real Gemini-image/private-R2 worker source and automated provider fixtures exist | `server/providers/gemini-image.ts`, `server/services/image-generation.ts`, `scripts/process-image-jobs.ts`; generation/upload/finalize endpoints; assets, processing_jobs, image_generation_requests | Existing leases/dispatch-once/cancel/retry/promotion tests in baseline. Missing identity/storage/model configuration prevents a real saved generation. No static reference is used as generation evidence. Video generation remains unavailable. |
| Client review/revision/approval | **Partially implemented**: immutable uploaded-image publication, recipient grants, feedback and revision history | `server/db/reviews.ts`, `server/db/deliverables.ts`, `features/projects/ProjectDeliverables.tsx`, `features/reviews`; deliverable/review APIs; content_versions, access_grants, review_comments, review_decisions | Existing baseline review/revision SQL and fixture browsers passed. Added read-only project-client review assignment correction; editors remain excluded from assignment. Real two-account revision/approval acceptance blocked. |
| Project timeline | **Partially implemented**: persisted project, brief, asset, task, review, feedback, approval plus new artifact and actor-private concept events | `server/db/workspace.ts`, `lib/contracts/workspace.ts`; overview/project detail; existing domain rows | No synthetic events. New production/concept activity regression awaits final verification; other actors' private ideas must not appear. V1 generated artifacts are synchronized separately. |

## Sixteen acceptance criteria

| # | Required criterion | Evidence / current disposition |
| --- | --- | --- |
| 1 | Client project submission | New atomic API/UI and isolated tests; live **unverified**. |
| 2 | Uploaded assets persist | Existing SQL/storage-fixture tests; real R2 refresh/readback **blocked**. |
| 3 | Creator can access project | New explicit designated membership; live account acceptance **unverified**. |
| 4 | Brainstorming returns real results | Genuine HTTP adapter; provider fixtures only in this run. **Blocked** by configuration. |
| 5 | Creative artifacts can be saved | New immutable save/list/history path; final focused SQL tests passed; live **unverified**. |
| 6 | Script and storyboard workflows | Manual structured edit/save slice; direct AI artifact generation **missing**. |
| 7 | Voice command executes | Allowlisted storyboard navigation added; synthetic microphone/STT-fixture flow is separate from real speech. Physical acceptance **unverified**. |
| 8 | Real AI content generation | **Blocked**: no live configured generation attempted. |
| 9 | Generated deliverables persist | Worker/promotion/publication fixtures; real generation/storage **unverified**. |
| 10 | Client reviews deliverable | Exact-version grants and read-only member integration; live **unverified**. |
| 11 | Feedback persists | Existing PostgreSQL append/history tests; real client refresh **unverified**. |
| 12 | Creator submits revision | Existing immutable-v2 and retry tests; real two-account workflow **unverified**. |
| 13 | Client approves revised deliverable | Existing exact-version decision tests; live **unverified**. |
| 14 | Timeline reflects activity | Existing persisted events plus new production/own-concept projection; focused SQL passes; complete live history **unverified**. |
| 15 | Critical build checks pass | Pre-change baseline passed 14 tasks/733 tests/both builds; final changed-tree gate blocked by dependency drift/missing spatial Clerk module. |
| 16 | Browser demonstration without headset | Local creator screens, image tools and desktop spatial fallbacks exist. Full live workflow **unverified**. |

No row labeled “Implemented and tested” establishes live service acceptance. Native visionOS completion is not a gate for this browser prototype.
