# Demonstration walkthrough

13 November 2026. **The full live rehearsal is blocked; this is the exact operator walkthrough after setup, not a claim that it ran.**

## Prepare the inputs and accounts

1. Run `node scripts/generate-demo-fixtures.mjs`. It produces `output/demo/nova-coffee/nova-coffee-brief.pdf`, `nova-coffee-product.png`, `nova-coffee-brand.png` and a hash manifest from the checked-in synthetic fixture JSON. The PDF and images are explicitly labeled synthetic. They are not generation results.
2. Configure the variables in DEPLOYMENT_CHECKLIST.md and one active designated development creator. Use separate real Clerk client/creator accounts, preferably in separate browser profiles. No demo passwords, spoofed headers or public auth bypass exist.
3. Run `pnpm demo:preflight`, then `pnpm dev`. Normally use `http://127.0.0.1:3000`; the internal spatial app is port3001. If using another port, align origins and build/runtime configuration.

## Complete live workflow — acceptance recording required

1. **Client intake:** sign in as client, visit `/projects/new`, enter the Nova Coffee brief fields from `fixtures/nova-coffee.json`. Choose Reel for the supported content type. Attach the PDF and two PNG references. Submit once. Observe per-file phases/completed count; do not describe them as measured byte progress. If a transfer fails, use the explicit incomplete-upload retry; do not create another project.
2. **Persistence:** open the saved project link, refresh, inspect its original Brief and asset library. Open/retrieve all three assets. Record the real project ID privately. Uploaded PDF text is not automatically extracted; entered brief fields are the AI context.
3. **Creator assignment:** sign in as designated creator and open `/projects`. Open the same client-created project; confirm original brief and assets. In an unrelated account, that project must be unavailable.
4. **Brainstorm:** open project-linked Brainstorm Studio, choose **Generate Campaign Ideas**, customize the message and send explicitly. Show pending/error handling. With Gemini actually configured, review the returned concepts and save one idea. Refresh/reopen the saved session and verify the idea remains. Follow-up context includes only the actor's bounded saved ideas, saved brief and recent exchanges.
5. **Production — currently manual:** use the script/storyboard templates for planning suggestions in Brainstorm. Open the project's **Production** tab. Enter a creative direction linked to the saved brief, save version1. Select Script, choose its brief/direction sources, edit timed sections and save. Open **Storyboard**, choose the script source and author six scene cards with descriptions, framing, dialogue, duration and notes. Save, edit scene2, save another immutable version, then refresh and compare history. This step does **not** demonstrate direct AI artifact generation; that remains an explicit missing acceptance requirement.
6. **Voice:** open `/create?projectId=PROJECT_UUID` or the project-aware Creation tool, accept microphone disclosure, record “Open the storyboard.” Show the actual recognized transcript. Choose Propose action, review it, then Apply. The authorized project's Storyboard tab should open. If STT is unavailable, type the same command and clearly state that this demonstrates parsing/navigation only. Never claim typed or mocked STT is real speech recognition.
7. **Spatial:** open `/spatial-studio`, the project 3D editor or `/xr/hud`. Show one pointer-driven desktop interaction without a headset. Save/reload only in an authorized project with eligible ready assets. The local procedural demo is explicitly unsaved and is not persistence evidence.
8. **Real image generation:** open the actual project-aware image canvas at `/studio/create?projectId=PROJECT_UUID`. Select the configured Gemini image model, enter the Nova Coffee prompt and submit explicitly. Run the configured worker if required. Wait for genuine ready status, preview and retrieve the returned image, then refresh and locate it in project images. Do not substitute either synthetic reference or a static sample if generation fails.
9. **Publication/review:** in **Deliverables**, publish the verified image as immutable v1 and assign the submitting client's real Clerk identity. Switch to that client and `/review`; inspect exactly v1, add feedback and request changes. Refresh and verify the persisted comment/decision.
10. **Revision:** as creator, create/upload a genuinely different revised image, publish it as a successor to reviewed v1, and explicitly share v2. As client, open v2 and approve. Verify v1 and its comments still exist; approval must not overwrite either version.
11. **Timeline:** as creator, inspect project Activity. Confirm persisted creation/brief/assets/concepts/artifact versions/review/feedback/approval events. Other actors' private Brainstorm ideas must not be exposed.

## Credential-free presentation fallback

Show the real creator screens, clearly unsaved Brainstorm drafting, ten editable prompts, local image composition/export and desktop procedural/XR samples. Show this report's limitations. Do not call the fallback a completed client collaboration workflow or successful AI generation.

Stop and disclose a critical failure. Do not hide it with fixture responses, fabricate comments/approvals or run an unconfigured billable retry loop.
