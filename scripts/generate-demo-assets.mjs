import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const sharp = require("sharp");
const folder = new URL("../apps/web/public/demo-assets/", import.meta.url);
await mkdir(folder, { recursive: true });
const brands = [
  ["chai", "ChaiCraft", "#D68834", "#42271C", "Har Cup Mein Khushi"],
  ["urban", "UrbanThread", "#6A77A0", "#222B3C", "Make the city your runway"],
  ["green", "GreenNest", "#4F745B", "#314C3B", "One reusable habit"],
  ["tech", "TechNova", "#567FB5", "#182842", "A simpler start"],
  ["local", "LocalRoots", "#B76F58", "#593C37", "Close to home"],
];
const manifest = {};
for (const [key,name,color,dark,tag] of brands) {
  for (const type of ["brand", "campaign", "frame-0", "frame-1", "frame-2", "frame-3", "frame-4"]) {
    const frame = type.startsWith("frame"), n = frame ? Number(type.slice(-1)) : 0;
    const title = frame ? ["The arrival", "Shared preparation", "A moment together", "Product detail", "The invitation"][n] : type === "brand" ? "Brand study" : tag;
    // Original schematic artwork: intentionally labelled, never stock/provider imagery.
    const illustration = key === "chai" ? `<path d="M250 140h130v65q0 44-65 44t-65-44z" fill="#fff2d8"/><path d="M380 150q70 0 38 60h-38" fill="none" stroke="#fff2d8" stroke-width="12"/><path d="M280 115q-25-25 0-48m40 48q25-25 0-48m40 48q-25-25 0-48" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>` : key === "urban" ? `<path d="M270 90l45 30 45-30 60 50-30 45-20-10v100H260V175l-20 10-30-45z" fill="${color}"/><path d="M315 120v155" stroke="#e5e7eb" stroke-width="4"/>` : key === "green" ? `<path d="M315 270Q180 120 380 85Q420 230 315 270z" fill="${color}"/><path d="M310 270l55-150" stroke="#eef2df" stroke-width="5"/>` : key === "tech" ? `<rect x="250" y="100" width="140" height="160" rx="24" fill="${color}"/><circle cx="320" cy="180" r="42" fill="${dark}"/><path d="M320 149v31l23 17" fill="none" stroke="#e9f0fa" stroke-width="6"/>` : `<path d="M245 150h150v110H245z" fill="${color}"/><path d="M230 150l30-65h120l30 65z" fill="#f3e4d4"/><path d="M300 195h40v65h-40z" fill="${dark}"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="${dark}"/><rect x="16" y="16" width="608" height="368" rx="14" fill="none" stroke="${color}"/><text x="38" y="54" fill="#ffffff" font-family="sans-serif" font-size="22">${name}</text>${illustration}<text x="38" y="320" fill="#ffffff" font-family="sans-serif" font-size="24">${title}</text><text x="38" y="354" fill="#dddddd" font-family="sans-serif" font-size="14">${frame ? `Storyboard ${n+1} · ` : ""}Original synthetic illustration · Demo only</text></svg>`;
    const bytes = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
    const nameOnDisk = `${key}-${type}.png`;
    await writeFile(new URL(nameOnDisk, folder), bytes);
    manifest[`demo-fixtures/v1/${nameOnDisk}`] = { file: nameOnDisk, mimeType: "image/png", width: 640, height: 400, byteSize: bytes.length, checksumSha256: createHash("sha256").update(bytes).digest("hex"), base64: bytes.toString("base64") };
  }
}
await writeFile(new URL("../apps/web/src/lib/demo/asset-manifest.json", import.meta.url), JSON.stringify(manifest));
console.log(`Generated ${Object.keys(manifest).length} original synthetic PNG fixtures.`);
