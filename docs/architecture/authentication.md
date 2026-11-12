# Authentication and authorization

The web and native clients use the same Clerk instance and server-authorized projects. Authenticated UI routes are not the authorization boundary: private API operations resolve identity and enforce persisted project membership independently.

## Implemented transports

- Browser sessions use the existing Clerk Next.js integration and `getCurrentSubject`.
- V1 additionally accepts Clerk **session** bearer JWTs through [`getV1Subject`](../../apps/web/src/server/auth/api-identity.ts). OAuth and machine tokens are not accepted by this policy.
- A supplied malformed or invalid Authorization header never falls back to ambient cookies. Native verification pins the configured Clerk issuer; a present `azp` must be in the trusted-origin list.
- Cookie mutations require an exact trusted Origin. Any Origin supplied with bearer transport is also checked. Native originless requests are allowed only after bearer verification. Legacy routes retain their browser policy.

The client cannot supply its effective user identity or role. [SQL predicates](../../apps/web/src/server/db/projects.ts) grant read access to project members/workspace owners and edit access to creator/editor members/workspace owners. Scene writes recheck membership and ready project assets inside the mutation. Read-only access does not permit assistant/provider requests.

Private asset delivery uses bounded authenticated proxies and a second access check after reading storage. Browser previews and native USDZ have separate supported subsets and limits. Short-lived signed upload/download URLs remain an interface/future workflow, not a shipped replacement for these proxies.

The [native adapter](../../apps/visionos/ShapeStudio/Core/Authentication/ClerkAuthenticationService.swift) uses Clerk hosted authentication and SDK Keychain storage. The application owns one session observer across windows. Session changes cancel/discard private requests and clear private selection/drafts/models. Failed credential cleanup exposes retry and preserves only a nonsensitive pending-signout preference, preventing automatic account restoration before cleanup.

The current app pins ClerkKit 1.5.8 for the installed Xcode 26.0.1 toolchain; newer tested releases used unsupported `weak let` syntax. This is a compatibility decision, not proof of live login or inclusion of subsequent SDK fixes. Native registration, the real bundle ID and hosted authentication still need configured-account acceptance.

Server environment validation remains lazy and server-only at `apps/web/src/server/config/env.ts`. Preserve deployment markers when invoking tasks: they prevent local demo behavior from running on Vercel. Never send provider keys, database URLs, storage credentials or session tokens through generated contracts, logs or client configuration.

Organization administration/invitations are a later domain slice. Existing personal workspace membership must not be advertised as full organization isolation. Extend identity mappings and SQL policies together, with revoked membership and cross-tenant integration tests.

## Browser spatial boundary

The independent spatial application is served under the web gateway origin. Private SSR bootstrap requests go to a fixed web API origin with only session transport forwarded, no-store reads and redirect rejection. The web API remains responsible for all identity and project authorization. The browser spatial client uses publishable Clerk configuration for renewal and a session-scoped editor lifecycle; server Clerk/provider/database/storage credentials remain web-only. Session changes must unmount private editor state, abort pending work and obtain fresh authorized project data.
