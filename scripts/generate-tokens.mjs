import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = JSON.parse(await readFile(resolve(root, "packages/design-tokens/tokens.json"), "utf8"));
const check = process.argv.includes("--check");
if (source.version !== 1 || JSON.stringify(Object.keys(source.light)) !== JSON.stringify(Object.keys(source.dark)))
  throw new Error("Token versions and appearance keys must match.");
const camel = name => name.replace(/-([a-z])/g, (_, character) => character.toUpperCase());
for (const appearance of ["light", "dark"]) {
  for (const [key, value] of Object.entries(source[appearance])) {
    if (!/^[a-z]+(?:-[a-z]+)*$/.test(key) || !/^#[0-9A-F]{6}(?:[0-9A-F]{2})?$/.test(value))
      throw new Error(`Invalid semantic color: ${appearance}.${key}`);
  }
}
for (const group of ["radii", "spacing", "typography"])
  for (const [key, value] of Object.entries(source[group]))
    if (!/^[a-z]+$/.test(key) || !Number.isFinite(value) || value < 0 || value > 100)
      throw new Error(`Invalid numeric token: ${group}.${key}`);
const palette = appearance => Object.entries(source[appearance]).map(([key, value]) => `  --${key}: ${value};`).join("\n");
const css = `/* Generated from tokens.json. Run pnpm tokens:generate; do not edit. */\n:root {\n${palette("light")}\n${Object.entries(source.radii).map(([key,value])=>`  --radius-${key}: ${value}px;`).join("\n")}\n${Object.entries(source.spacing).map(([key,value])=>`  --space-${key}: ${value}px;`).join("\n")}\n${Object.entries(source.typography).map(([key,value])=>`  --type-${key}: ${value}px;`).join("\n")}\n  color-scheme: light;\n}\n@media (prefers-color-scheme: dark) {\n  :root:not([data-shape-theme="light"]) {\n${palette("dark")}\n    color-scheme: dark;\n  }\n}\n:root[data-shape-theme="dark"] {\n${palette("dark")}\n  color-scheme: dark;\n}\n`;
const swift = `// Generated from tokens.json. Native views should prefer system materials.\npublic enum ShapeTokens {\n${["light","dark"].map(appearance => `  public enum ${appearance[0].toUpperCase()+appearance.slice(1)} {\n${Object.entries(source[appearance]).map(([key,value])=>`    public static let ${camel(key)} = "${value}"`).join("\n")}\n  }`).join("\n")}\n${["radii","spacing","typography"].map(group => `  public enum ${group[0].toUpperCase()+group.slice(1)} {\n${Object.entries(source[group]).map(([key,value])=>`    public static let ${key}: Double = ${value}`).join("\n")}\n  }`).join("\n")}\n}\n`;
for (const [name, content] of [["tokens.css", css], ["ShapeTokens.swift", swift]]) {
  const file = resolve(root, "packages/design-tokens/generated", name);
  if (check) {
    if (await readFile(file, "utf8").catch(() => "") !== content) throw new Error(`Generated token drift: ${name}`);
  } else {
    await mkdir(resolve(root, "packages/design-tokens/generated"), { recursive: true });
    await writeFile(file, content);
  }
}
process.stdout.write(check ? "Design token outputs match their source.\n" : "Generated CSS and Swift design tokens.\n");
