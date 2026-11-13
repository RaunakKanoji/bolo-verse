import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "@playwright/test";

// Synthetic INPUTS only. No app account, seed, provider, upload or DB call.
const root = resolve(import.meta.dirname, "..");
const fixture = JSON.parse(await readFile(resolve(root, "docs/demo/fixtures/nova-coffee.json"), "utf8"));
const output = resolve(root, "output/demo/nova-coffee");
const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 640 }, deviceScaleFactor: 1 });
  const brief = `<html><head><meta charset="utf-8"><style>body{font:12pt Arial,sans-serif;color:#2d211b;margin:38pt}h1{font-size:25pt}h2{font-size:11pt;margin:17pt 0 4pt;text-transform:uppercase}p{line-height:1.4;margin:4pt 0}.label{color:#6755a4;font-size:10pt;font-weight:bold}.note{margin-top:22pt;padding:12pt;border:1px solid #c5b6a6}</style></head><body><p class="label">SYNTHETIC DEMONSTRATION INPUT • NO CLIENT APPROVAL</p><h1>Nova Coffee</h1><p>Product launch campaign · ${escape(fixture.deadline)}</p>${[["Objective",fixture.objectives],["Audience",fixture.audience],["Deliverables",fixture.deliverables],["Distribution",fixture.channel],["Creative constraints",fixture.instructions]].map(([title,value])=>`<h2>${title}</h2><p>${escape(value)}</p>`).join("")}<p class="note">This fictional brief and its two reference images are upload inputs. They are not evidence of live AI generation, extracted document context, persisted project data or client approval.</p></body></html>`;
  await page.setContent(brief, { waitUntil: "load" });
  await page.pdf({ path: resolve(output, "nova-coffee-brief.pdf"), format: "A4", printBackground: true, displayHeaderFooter: false });
  for (const [file, art] of [
    ["nova-coffee-product.png", '<rect x="230" y="115" width="180" height="405" rx="45" fill="#54392d"/><rect x="257" y="76" width="126" height="65" rx="9" fill="#251a15"/><rect x="230" y="250" width="180" height="165" fill="#e9ddc3"/><text x="320" y="308" text-anchor="middle" font-size="32" fill="#36251c">NOVA</text><text x="320" y="349" text-anchor="middle" font-size="20" fill="#36251c">COLD BREW</text>'],
    ["nova-coffee-brand.png", '<text x="60" y="190" font-size="63" fill="#36251c">NOVA</text><text x="64" y="235" font-size="25" fill="#6b503d">A slower morning.</text><rect x="60" y="310" width="150" height="150" rx="8" fill="#36251c"/><rect x="245" y="310" width="150" height="150" rx="8" fill="#b88757"/><rect x="430" y="310" width="150" height="150" rx="8" fill="#e9ddc3" stroke="#b88757"/>'],
  ]) {
    await page.setContent(`<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><rect width="640" height="640" fill="#f5f0e6"/><g font-family="Arial,sans-serif">${art}<text x="320" y="590" text-anchor="middle" font-size="14" fill="#6755a4">SYNTHETIC REFERENCE · NOT AI-GENERATED</text></g></svg></body></html>`);
    await page.screenshot({ path: resolve(output, file) });
  }
} finally { await browser.close(); }
const files = [];
for (const name of ["nova-coffee-brief.pdf", "nova-coffee-product.png", "nova-coffee-brand.png"]) {
  const bytes = await readFile(resolve(output, name));
  files.push({ name, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
}
await writeFile(resolve(output, "manifest.json"), JSON.stringify({ synthetic: true, files }, null, 2) + "\n");
console.log(`Created synthetic upload inputs in ${relative(root, output)}. No accounts or project records were created.`);
