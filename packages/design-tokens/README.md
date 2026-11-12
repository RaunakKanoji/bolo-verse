# Shared semantic tokens

`tokens.json` is the single source for light/dark semantic colors, radii, spacing and typography. Run `pnpm tokens:generate`; CI runs `pnpm tokens:check` to reject drift. The web imports generated CSS. Foundation-only Swift constants are available for later native consumption; use SwiftUI adaptive/system materials for native panels.

Text colors are tested at WCAG AA normal-text contrast against each opaque content surface. Glass must remain backed by a controlled canvas; decorative media should not sit directly behind important text. The accent-primary swatch is decorative; use accent-strong/foreground for readable filled actions and accent-text for text.
