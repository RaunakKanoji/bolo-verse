import "server-only";
import { headers } from "next/headers";
import { z } from "zod";
import { createShapeClient } from "../../../../packages/api-contract/generated/client";
import { parseBootstrap } from "./api";
import { internalOrigin, sessionHeaders } from "./server-transport";

export async function loadWorkspace(projectId: string) {
  z.uuid().parse(projectId);
  const origin = internalOrigin(process.env.WEB_INTERNAL_ORIGIN);
  const forwarded = sessionHeaders(await headers());
  const client = createShapeClient((path, init) =>
    fetch(new URL(String(path), origin), {
      ...init,
      headers: forwarded,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    }),
  );
  const [project, assets, scene] = await Promise.all([
    client.getProject(projectId),
    client.listProjectAssets(projectId),
    client.getSpatialScene(projectId),
  ]);
  return parseBootstrap(projectId, project, assets, scene);
}
