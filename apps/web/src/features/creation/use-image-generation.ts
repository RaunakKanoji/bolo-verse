"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ImageGenerationCapabilitiesSchema,
  ImageGenerationResultSchema,
  ImageGenerationListSchema,
  CreateImageGenerationSchema,
  type ImageGenerationJob,
} from "@/lib/contracts/creation";
import { AssetListSchema } from "@/lib/contracts/shape";
import { z } from "zod";
import { CreationAccessError, creationRequest } from "./creation-http";

const jobResult = ImageGenerationResultSchema;
const jobsResult = ImageGenerationListSchema;
export function useImageGeneration(projectId?: string, onAccessRevoked?: () => void) {
  const client = useQueryClient();
  const scope = ["image-generation", projectId] as const;
  const active = useRef(false);
  const pending = useRef<AbortController | null>(null);
  const revoked = useRef(false);
  const revokeAccess = useCallback(() => {
    if (revoked.current) return;
    revoked.current = true;
    pending.current?.abort();
    onAccessRevoked?.();
  }, [onAccessRevoked]);
  async function privateRequest<T>(
    url: string,
    schema: z.ZodType<T>,
    options: RequestInit = {},
    signal?: AbortSignal,
  ) {
    if (revoked.current) throw new CreationAccessError(403);
    try {
      const result = await creationRequest(url, schema, options, signal);
      if (revoked.current) throw new CreationAccessError(403);
      return result;
    } catch (reason) {
      if (reason instanceof CreationAccessError) revokeAccess();
      throw reason;
    }
  }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // A failed transport retry keeps its idempotency key until the request changes.
  const submission = useRef<{ content: string; id: string } | null>(null);
  const capabilities = useQuery({
    queryKey: ["image-generation-capabilities"],
    queryFn: ({ signal }) =>
      creationRequest(
        "/api/v1/creation/capabilities",
        ImageGenerationCapabilitiesSchema,
        {},
        signal,
      ),
    staleTime: 60_000,
  });
  const history = useQuery({
    queryKey: [...scope, "history"],
    enabled: Boolean(projectId),
    queryFn: ({ signal }) =>
      privateRequest(`/api/v1/projects/${projectId}/generations`, jobsResult, {}, signal),
    refetchInterval: (query) =>
      query.state.data?.jobs.some((job) => ["queued", "processing"].includes(job.status))
        ? 2000
        : false,
  });
  const assets = useQuery({
    queryKey: [...scope, "assets"],
    enabled: Boolean(projectId),
    queryFn: ({ signal }) =>
      privateRequest(`/api/v1/projects/${projectId}/assets`, AssetListSchema, {}, signal),
  });
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      pending.current?.abort();
      void client.cancelQueries({ queryKey: ["image-generation", projectId] });
      client.removeQueries({ queryKey: ["image-generation", projectId] });
    };
  }, [client, projectId]);
  const mutation = useMutation({
    mutationFn: ({
      action,
      signal,
    }: {
      action: (signal: AbortSignal) => Promise<{ job: ImageGenerationJob }>;
      signal: AbortSignal;
    }) => action(signal),
  });
  async function mutate(action: (signal: AbortSignal) => Promise<{ job: ImageGenerationJob }>) {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    try {
      const result = await mutation.mutateAsync({ action, signal: controller.signal });
      if (!active.current || revoked.current) return;
      client.setQueryData<z.infer<typeof jobsResult>>([...scope, "history"], (previous) => ({
        jobs: [result.job, ...(previous?.jobs ?? []).filter((job) => job.id !== result.job.id)],
      }));
      await client.invalidateQueries({ queryKey: [...scope, "history"] });
      return result.job;
    } catch (reason) {
      if (active.current)
        setError(
          reason instanceof Error ? reason.message : "The creation service could not respond.",
        );
    } finally {
      pending.current = null;
      if (active.current) setBusy(false);
    }
  }
  function generate(
    input: {
      prompt: string;
      modelId: string;
      aspectRatio: "1:1" | "16:9" | "4:5" | "9:16";
      referenceAssetId: string | null;
    },
    fresh = false,
  ) {
    if (!projectId || revoked.current || capabilities.data?.availability !== "configured") return;
    const content = JSON.stringify({ projectId, ...input });
    if (fresh || submission.current?.content !== content)
      submission.current = { content, id: crypto.randomUUID() };
    const body = CreateImageGenerationSchema.parse({
      projectId,
      ...input,
      idempotencyKey: submission.current!.id,
    });
    return mutate(async (signal) => {
      const result = await privateRequest(
        "/api/v1/generations",
        jobResult,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        signal,
      );
      submission.current = null;
      return result;
    });
  }
  function cancel(id: string) {
    return mutate((signal) =>
      privateRequest(
        `/api/v1/generations/${id}/cancel`,
        jobResult,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
        signal,
      ),
    );
  }
  return { capabilities, history, assets, busy, error, generate, cancel, revokeAccess };
}
