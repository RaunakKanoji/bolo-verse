import { describe, expect, it } from "vitest";
import tokens from "../../packages/design-tokens/tokens.json";

function luminance(hex: string) {
  const channels = [1, 3, 5].map(offset => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
describe("Shape semantic text colors", () => {
  for (const appearance of ["light", "dark"] as const) {
    it(`${appearance} body/status/action text reaches AA against its surfaces`, () => {
      const palette = tokens[appearance];
      for (const text of ["text-primary", "text-secondary", "accent-text", "success", "warning", "destructive"] as const)
        for (const surface of ["canvas", "surface", "surface-secondary"] as const)
          expect(contrast(palette[text], palette[surface]), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(palette["accent-foreground"], palette["accent-strong"])).toBeGreaterThanOrEqual(4.5);
    });
  }
});
