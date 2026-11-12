# Shared TypeScript configuration

`@shape/typescript-config/base.json` contains strict, renderer-independent compiler defaults. The root Next application adds DOM libraries, JSX, its plugin/aliases and generated route includes. The scene-schema package uses the base without browser types. Consumers declare `workspace:*`; this package contains no executable runtime or Swift code.
