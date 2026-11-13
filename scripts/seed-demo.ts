import nextEnv from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "../apps/web/src/server/db/schema";
import { parseDemoConfig } from "../apps/web/src/server/demo/config";
import { seedDemo, resetDemo, validateSeededDemo } from "../apps/web/src/server/demo/seed-runner";
import { buildDemoDataset } from "../apps/web/src/lib/demo/dataset";

async function main() {
  nextEnv.loadEnvConfig(process.cwd());
  const args = process.argv.slice(2);
  const local = args.includes("--local");
  if (!local)
    throw new Error(
      "Demo seed refused: only --local is supported while Clerk provisioning is deferred. No remote database will be contacted.",
    );
  const config = parseDemoConfig({ ...process.env, DEMO_SEED_TARGET: "local" });
  await mkdir(".demo", { recursive: true });
  const pg = new PGlite(`.demo/${config.slug}`);
  try {
    const db = drizzle(pg, { schema });
    await migrate(db, { migrationsFolder: "drizzle" });
    if (args.includes("--reset")) {
      const confirmation = args.find((a) => a.startsWith("--confirm="))?.slice(10);
      console.log(
        JSON.stringify({
          archived: await resetDemo(db, config, confirmation),
          immutableHistoryRetained: true,
        }),
      );
      return;
    }
    let inserted = false;
    if (!args.includes("--validate")) inserted = (await seedDemo(db, config)).inserted;
    const report = await validateSeededDemo(db, config);
    if (report.errors.length)
      throw new Error(
        "Demo validation failed; record counts or persisted fixture relationships differ from the manifest. Rehearsal edits are preserved. Use a fresh DEMO_WORKSPACE_SLUG.",
      );
    if (!args.includes("--validate") && !report.archived) {
      // Only this original fictional dataset is exportable. Never serialize arbitrary DB rows.
      const snapshot = {
        dataset: buildDemoDataset(config),
        counts: report.counts,
        source: "Validated isolated PostgreSQL (PGlite) seed snapshot",
        liveVerified: false,
      };
      await writeFile("apps/web/src/lib/demo/snapshot.json", JSON.stringify(snapshot));
    }
    console.log(
      JSON.stringify(
        { target: "isolated-local-pglite", slug: config.slug, inserted, ...report },
        null,
        2,
      ),
    );
  } finally {
    await pg.close();
  }
}
main().catch(() => {
  // Drivers and environment validation can contain secrets. Never print their errors.
  console.error(
    "Demo command refused or failed. Require DEMO_SEED_ENABLED=true, a non-production environment, --local and the exact --confirm=<slug> for archive reset. Check the demo seed guide; no remote database was contacted.",
  );
  process.exitCode = 1;
});
