# Shared API contract

`openapi.yaml` is generated from the same serialized artifact as `packages/api-contract/openapi.json`. It uses JSON syntax, which is valid YAML 1.2. Do not edit it manually. `pnpm contracts:generate` refreshes both and `pnpm contracts:check` rejects drift. The specification covers implemented v1 JSON operations; binary image/GLB/USDZ routes remain documented in the platform and native architecture guides.

Generated Swift models remain in the language-neutral artifact directory and are copied into the native Swift package by `pnpm native:sync`. Neither artifact directory is a TypeScript workspace package. Scene v1 schema compatibility is explained in [scene format](../architecture/scene-format.md).
