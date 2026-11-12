# Full-screen studio status

Implemented: viewport-filling studio shell, project identity/navigation, independently scrolling desktop inspector and navigator, assistant within the companion panel, and selected-card focus/move/rotate/scale toolbar. Narrow screens stack the existing panels. Public previews remain unsaved. No API or database changes.

Validation: lint and TypeScript pass; production build passes. All four XR foundation Playwright checks pass against the production build at port 3107, including exact 1440×900 viewport bounds, no desktop page overflow, mobile horizontal overflow, selection, authorization fallback, and scene teardown/reopen. Desktop screenshot reviewed. Development server on port 3001 remained on the dynamic loading placeholder in automated browsers; production browser checks passed.

Suite limitation: pnpm test reports 297 passing and one failing existing asset node-depth validation test in tests/unit/xr-asset-validation.test.ts:235. Asset parser code was not changed for this layout work. Headset, native visionOS, and controller behavior remain physically unverified.
