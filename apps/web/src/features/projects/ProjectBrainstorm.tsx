"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BrainstormRequestSchema,
  BrainstormResponseSchema,
  type BrainstormResult,
  type CreativeDirection,
} from "@/lib/contracts/brainstorm";
import styles from "./brainstorm.module.css";

const quickPrompts = [
  ["Three campaign directions", "Suggest three distinct campaign directions."],
  ["Low-budget production", "Suggest three practical directions for a small production budget."],
  [
    "Audience-first hooks",
    "Suggest three directions with hooks suited to the saved brief's audience.",
  ],
] as const;
function directionText(direction: CreativeDirection, version: number) {
  return `AI-generated suggestion · source brief v${version}\n${direction.name}\n${direction.concept}\nVisual direction: ${direction.visualDirection}\nProposed deliverable: ${direction.proposedDeliverable}\nProduction suggestion: ${direction.productionSuggestion}`;
}
export default function ProjectBrainstorm({
  projectId,
  sourceBriefVersion,
  disabled,
  onAddToBrief,
  onAccessLost,
}: {
  projectId: string;
  sourceBriefVersion: number;
  disabled: boolean;
  onAddToBrief: (text: string) => boolean;
  onAccessLost: () => void;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<BrainstormResult | null>(null);
  const pending = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      pending.current?.abort();
    },
    [projectId, sourceBriefVersion],
  );
  const visibleResult = result?.sourceBriefVersion === sourceBriefVersion ? result : null;

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || disabled || sourceBriefVersion < 1) return;
    const parsed = BrainstormRequestSchema.safeParse({ message, briefVersion: sourceBriefVersion });
    if (!parsed.success) {
      setError("Enter a message of 1–2000 characters.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    setResult(null);
    const controller = new AbortController();
    pending.current = controller;
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch(`/api/v1/projects/${projectId}/brainstorm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: controller.signal,
        cache: "no-store",
      });
      if (controller.signal.aborted) return;
      if (response.status === 401 || response.status === 403) {
        setMessage("");
        setResult(null);
        onAccessLost();
        return;
      }
      const envelope = BrainstormResponseSchema.safeParse(await response.json());
      if (!envelope.success)
        throw new Error("Unexpected reply. Your message is kept. Try again later.");
      if (!envelope.data.ok) throw new Error(envelope.data.error.message);
      if (!response.ok || envelope.data.data.sourceBriefVersion !== sourceBriefVersion)
        throw new Error("The saved brief changed. Refresh the brief before trying again.");
      setResult(envelope.data.data);
    } catch (cause) {
      if (cause instanceof Error && !(cause instanceof TypeError) && cause.name !== "AbortError")
        setError(cause.message);
      else
        setError(
          "Could not confirm a Gemini reply. Your message is kept. Retrying sends a new request and counts toward your limit.",
        );
    } finally {
      clearTimeout(timeout);
      if (pending.current === controller) pending.current = null;
      setBusy(false);
    }
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copied. Suggestions remain unsaved until you add them to a brief and save it.");
    } catch {
      setError("Clipboard access was blocked. Select the direction text and copy it manually.");
    }
  }
  return (
    <section className={styles.panel} aria-labelledby="brainstorm-heading">
      <h3 id="brainstorm-heading">Brainstorm with Gemini</h3>
      <p className={styles.hint}>
        {sourceBriefVersion > 0
          ? `Uses saved brief version ${sourceBriefVersion}; unsaved brief edits are not sent.`
          : "Save a client brief to enable brainstorming."}
      </p>
      <p className={styles.hint}>
        AI-generated suggestions, not completed assets. Replies stay in memory for this page.
        Sending a message contacts Gemini when configured.
      </p>
      <form onSubmit={send} className={styles.form} aria-label="Creative brainstorming">
        <label htmlFor="brainstorm-message">Brainstorm message</label>
        <textarea
          id="brainstorm-message"
          value={message}
          maxLength={2000}
          rows={3}
          disabled={disabled || busy || sourceBriefVersion < 1}
          onChange={(event) => setMessage(event.target.value)}
        />
        <div className={styles.actions}>
          {quickPrompts.map(([label, prompt]) => (
            <Button
              type="button"
              variant="outline"
              key={label}
              disabled={disabled || busy || sourceBriefVersion < 1}
              onClick={() => setMessage(prompt)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className={styles.actions}>
          <Button type="submit" disabled={disabled || busy || sourceBriefVersion < 1}>
            {busy ? "Asking Gemini…" : "Ask Gemini"}
          </Button>
        </div>
      </form>
      {(busy || notice) && (
        <p role="status" aria-live="polite">
          {busy ? "Gemini is preparing ideas…" : notice}
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {visibleResult && (
        <div aria-label="AI-generated directions" role="region">
          <p className={styles.hint}>
            {visibleResult.format === "plain_text"
              ? "Unstructured Gemini reply"
              : "AI-generated directions"}
          </p>
          {visibleResult.format === "plain_text" && (
            <p className={styles.hint}>
              Gemini did not return validated direction cards. This is its plain-text response; no
              actions were executed.
            </p>
          )}
          <p className={styles.reply}>{visibleResult.reply}</p>
          {visibleResult.directions.map((direction, index) => (
            <article key={index} className={styles.direction}>
              <h4>{direction.name}</h4>
              <p>{direction.concept}</p>
              <dl>
                <dt>Visual direction</dt>
                <dd>{direction.visualDirection}</dd>
                <dt>Proposed deliverable</dt>
                <dd>{direction.proposedDeliverable}</dd>
                <dt>Production suggestion</dt>
                <dd>{direction.productionSuggestion}</dd>
              </dl>
              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => void copy(directionText(direction, sourceBriefVersion))}
                >
                  Copy {direction.name}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => {
                    if (onAddToBrief(directionText(direction, sourceBriefVersion))) {
                      setNotice(
                        "Added to unsaved brief notes. Review the notes and choose Save brief to persist them.",
                      );
                      setError("");
                    } else
                      setError(
                        "Brief notes would exceed 5000 characters. Shorten the notes or copy the direction manually.",
                      );
                  }}
                >
                  Add {direction.name} to brief notes
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
