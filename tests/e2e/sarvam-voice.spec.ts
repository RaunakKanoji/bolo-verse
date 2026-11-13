import { spawn, type ChildProcess } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { instrumentVoice, waitForVoiceData } from "../helpers/voice-browser";
import type { XRCommand } from "../../apps/web/src/lib/contracts/xr-assistant";
import { createWorkspaceFixture } from "../browser-fixtures/xr-workspace-data";
let origin = "",
  harness: ChildProcess | undefined;
test.beforeAll(async () => {
  harness = spawn(process.execPath, ["scripts/test-sarvam-voice-harness.mjs"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const timer = setTimeout(() => {
      harness?.kill("SIGTERM");
      reject(new Error(`Voice fixture timeout: ${output}`));
    }, 25000);
    harness!.stdout!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      const match = /VOICE_HARNESS_READY (\d+)/.exec(output);
      if (match) {
        origin = `http://127.0.0.1:${match[1]}`;
        clearTimeout(timer);
        resolve();
      }
    });
    harness!.stderr!.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    harness!.once("error", reject);
    harness!.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Voice fixture exited ${code}: ${output}`));
    });
  });
});
test.afterAll(async () => {
  if (harness && harness.exitCode === null)
    await new Promise<void>((resolve) => {
      harness!.once("exit", () => resolve());
      harness!.kill("SIGTERM");
    });
});
const ok = (data: unknown) => ({ ok: true, data, requestId: "voice-fixture" });
async function fixture(page: Page) {
  let failure: "silence" | "outage" | "forbidden" | undefined;
  let command: XRCommand = { type: "FOCUS_PANEL", panelId: "project-overview" };
  let version = 1;
  let release: (() => void) | undefined;
  let gate: Promise<void> | undefined;
  let readinessGate: Promise<void> | undefined;
  let releaseReadiness: (() => void) | undefined;
  let statusCalls = 0;
  const calls = { stt: 0, proposals: 0, approval: 0 };
  await page.route(`${origin}/api/xr/workspaces/**`, async (route) => {
    calls.approval++;
    await gate;
    return route.fulfill({
      status: failure === "forbidden" ? 403 : 200,
      json:
        failure === "forbidden"
          ? {
              ok: false,
              error: { code: "FORBIDDEN", message: "Access lost", retryable: false },
              requestId: "voice-fixture",
            }
          : ok({
              ...createWorkspaceFixture(),
              workspace: { ...createWorkspaceFixture().workspace, version },
            }),
    });
  });
  await page.route(`${origin}/api/xr/assistant/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() === "GET") {
      statusCalls++;
      await readinessGate;
      return route.fulfill({
        json: ok({
          mode: "live",
          textAvailable: true,
          sttAvailable: true,
          ttsAvailable: false,
          message: "HTTP fixture only; no live provider.",
        }),
      });
    }
    if (path.endsWith("/transcribe")) {
      calls.stt++;
      expect(route.request().headers()["x-speech-consent"]).toBe("xr-voice-v1");
      expect(route.request().postDataBuffer()!.byteLength).toBeGreaterThan(12);
      await gate;
      if (failure)
        return route.fulfill({
          status: failure === "silence" ? 400 : 503,
          json: {
            ok: false,
            error: {
              code: failure === "silence" ? "INVALID_INPUT" : "SERVICE_UNAVAILABLE",
              message:
                failure === "silence"
                  ? "No speech was recognized. Try again or type a command."
                  : "Speech provider unavailable. Type a command instead.",
              retryable: true,
            },
            requestId: "voice-fixture",
          },
        });
      return route.fulfill({
        json: ok({ text: "Focus the overview", language: "en-IN", mode: "live" }),
      });
    }
    calls.proposals++;
    await gate;
    return route.fulfill({
      json: ok({
        mode: "live",
        reply: "Proposed: focus the overview panel.",
        commands: [command],
      }),
    });
  });
  await instrumentVoice(page);
  return {
    calls,
    statusCalls: () => statusCalls,
    holdReadiness: () => {
      readinessGate = new Promise<void>((resolve) => {
        releaseReadiness = resolve;
      });
    },
    releaseReadiness: () => {
      readinessGate = undefined;
      releaseReadiness?.();
    },
    reset: () => {
      command = { type: "RESET_WORKSPACE" };
    },
    command: (panelId: string) => {
      command = { type: "FOCUS_PANEL", panelId };
    },
    version: (value: number) => {
      version = value;
    },
    fail: (value: typeof failure) => {
      failure = value;
    },
    hold: () => {
      gate = new Promise<void>((resolve) => {
        release = resolve;
      });
    },
    release: () => {
      gate = undefined;
      release?.();
    },
  };
}
async function openVoice(page: Page) {
  await page.goto(origin);
  await expect(page.getByRole("button", { name: "Send to assistant", exact: true })).toBeDisabled();
  await page.getByText("Voice controls", { exact: true }).click();
  await page.getByRole("checkbox").check();
}
const tracksStopped = (page: Page) =>
  page.evaluate(() =>
    ((window as Window & { voiceTracks?: MediaStreamTrack[] }).voiceTracks ?? []).every(
      (track) => track.readyState === "ended",
    ),
  );
async function recordAndStop(page: Page) {
  await page.getByRole("button", { name: "Record voice message", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop and send", exact: true })).toBeVisible();
  await waitForVoiceData(page);
  await page.getByRole("button", { name: "Stop and send", exact: true }).click();
}

test("voice transcript is visible and a proposal never applies before explicit review and Apply", async ({
  page,
}) => {
  const service = await fixture(page);
  await openVoice(page);
  await recordAndStop(page);
  await expect(page.getByLabel("Voice transcript")).toHaveText("Focus the overview");
  await expect(page.getByRole("button", { name: "Focus panel", exact: true })).toBeVisible();
  await expect(page.getByTestId("applied-count")).toHaveText("0");
  await page.getByRole("button", { name: "Focus panel", exact: true }).click();
  await expect(page.getByText(/Does not change or save the layout/)).toBeVisible();
  await expect(page.getByTestId("applied-count")).toHaveText("0");
  await page
    .getByRole("region", { name: "Creative assistant", exact: true })
    .screenshot({ path: test.info().outputPath("voice-review-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .getByRole("region", { name: "Creative assistant", exact: true })
    .screenshot({ path: test.info().outputPath("voice-review-mobile.png") });
  await page.getByRole("button", { name: "Apply proposal", exact: true }).click();
  await expect(page.getByTestId("applied-count")).toHaveText("1");
  expect(service.calls).toEqual({ stt: 1, proposals: 1, approval: 1 });
  await expect.poll(() => tracksStopped(page)).toBe(true);
});

test("cancel while transcribing ignores the late transcript and never asks Gemini", async ({
  page,
}) => {
  const service = await fixture(page);
  service.hold();
  await openVoice(page);
  await recordAndStop(page);
  await expect.poll(() => service.calls.stt).toBe(1);
  await page.getByRole("button", { name: "Cancel request", exact: true }).click();
  service.release();
  await expect(
    page.getByRole("button", { name: "Record voice message", exact: true }),
  ).toBeEnabled();
  expect(service.calls.proposals).toBe(0);
  await expect(page.getByLabel("Voice transcript")).toHaveCount(0);
  await expect.poll(() => tracksStopped(page)).toBe(true);
});

test("silence and provider outage preserve typed-command fallback", async ({ page }) => {
  const service = await fixture(page);
  await openVoice(page);
  for (const mode of ["silence", "outage"] as const) {
    service.fail(mode);
    await recordAndStop(page);
    await expect(page.getByRole("alert")).toContainText(/type a command|Type a command/);
    await expect(page.getByRole("textbox", { name: "Ask about this project" })).toBeEnabled();
  }
  expect(service.calls.proposals).toBe(0);
});

test("local context change invalidates old proposals and unmount stops microphone tracks", async ({
  page,
}) => {
  await fixture(page);
  await openVoice(page);
  await page.getByRole("textbox", { name: "Ask about this project" }).fill("Focus overview");
  await page.getByRole("button", { name: "Send to assistant", exact: true }).click();
  await expect(page.getByRole("button", { name: "Focus panel", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Change local context", exact: true }).click();
  await expect(page.getByRole("button", { name: "Focus panel", exact: true })).toHaveCount(0);
  await page.getByText("Voice controls", { exact: true }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Record voice message", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop and send", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Unmount assistant", exact: true }).click();
  await expect.poll(() => tracksStopped(page)).toBe(true);
  await page.getByRole("button", { name: "Mount assistant", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Ask about this project" })).toHaveValue("");
});

test("microphone denial offers typing without an STT request", async ({ page }) => {
  const service = await fixture(page);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Permission denied", "NotAllowedError");
    };
  });
  await openVoice(page);
  await page.getByRole("button", { name: "Record voice message", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Microphone permission was denied");
  await page.getByRole("textbox", { name: "Ask about this project" }).fill("Focus the overview");
  await page.getByRole("button", { name: "Send to assistant", exact: true }).click();
  await expect(page.getByRole("button", { name: "Focus panel", exact: true })).toBeVisible();
  expect(service.calls.stt).toBe(0);
});

test("cancelling a pending permission request stops a late stream and allows a fresh recording", async ({
  page,
}) => {
  const service = await fixture(page);
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = (constraints) =>
      new Promise<MediaStream>((resolve, reject) => {
        (window as Window & { grantVoice?: () => Promise<void> }).grantVoice = async () => {
          try {
            resolve(await original(constraints));
          } catch (error) {
            reject(error);
          }
        };
      });
  });
  await openVoice(page);
  await page.getByRole("button", { name: "Record voice message", exact: true }).click();
  await expect(page.getByText("Waiting for microphone permission…", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel recording", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Record voice message", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() =>
    (window as Window & { grantVoice?: () => Promise<void> }).grantVoice?.(),
  );
  await expect.poll(() => tracksStopped(page)).toBe(true);
  expect(service.calls.stt).toBe(0);
  await page.getByRole("button", { name: "Record voice message", exact: true }).click();
  await page.evaluate(() =>
    (window as Window & { grantVoice?: () => Promise<void> }).grantVoice?.(),
  );
  await expect(page.getByRole("button", { name: "Stop and send", exact: true })).toBeVisible();
  await waitForVoiceData(page);
  await page.getByRole("button", { name: "Stop and send", exact: true }).click();
  await expect(page.getByLabel("Voice transcript")).toHaveText("Focus the overview");
});

test("session switch discards late interpretation and sign-out clears the assistant", async ({
  page,
}) => {
  const service = await fixture(page);
  await openVoice(page);
  service.hold();
  await page.getByRole("textbox", { name: "Ask about this project" }).fill("Focus overview");
  await page.getByRole("button", { name: "Send to assistant", exact: true }).click();
  await expect.poll(() => service.calls.proposals).toBe(1);
  await page.evaluate(() => {
    (window as Window & { voiceSessionId?: string | null }).voiceSessionId = "second-session";
    window.dispatchEvent(new Event("voice-session-change"));
  });
  service.release();
  await expect(page.getByRole("textbox", { name: "Ask about this project" })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Focus panel", exact: true })).toHaveCount(0);
  await page.evaluate(() => {
    (window as Window & { voiceSessionId?: string | null }).voiceSessionId = null;
    window.dispatchEvent(new Event("voice-session-change"));
  });
  await expect(
    page.getByText("Sign in to use the creative assistant.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Ask about this project" })).toHaveCount(0);
  await expect(page.getByTestId("applied-count")).toHaveText("0");
});

test("Apply revalidates access, saved version and target rather than trusting the proposal", async ({
  page,
}) => {
  const service = await fixture(page);
  await openVoice(page);
  for (const mode of ["forbidden", "version", "target"] as const) {
    service.fail(undefined);
    service.version(mode === "version" ? 2 : 1);
    service.command(mode === "target" ? "foreign-panel" : "project-overview");
    await page.getByRole("textbox", { name: "Ask about this project" }).fill("Focus overview");
    await page.getByRole("button", { name: "Send to assistant", exact: true }).click();
    await page.getByRole("button", { name: "Focus panel", exact: true }).click();
    if (mode === "forbidden") service.fail("forbidden");
    await page.getByRole("button", { name: "Apply proposal", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByTestId("applied-count")).toHaveText("0");
  }
  expect(service.calls.approval).toBe(3);
});

test("permission loss invalidates proposals and stops an active recording", async ({ page }) => {
  await fixture(page);
  await openVoice(page);
  await page.getByRole("button", { name: "Record voice message", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop and send", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Toggle edit permission", exact: true }).click();
  await expect.poll(() => tracksStopped(page)).toBe(true);
  await page.getByText("Voice controls", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Record voice message", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Apply proposal", exact: true })).toHaveCount(0);
});

test("unsupported recording format releases the microphone and offers typing", async ({ page }) => {
  const service = await fixture(page);
  await page.addInitScript(() => {
    MediaRecorder.isTypeSupported = () => false;
  });
  await openVoice(page);
  await page.getByRole("button", { name: "Record voice message", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("compatible voice recording format");
  await expect(page.getByRole("textbox", { name: "Ask about this project" })).toBeEnabled();
  await expect.poll(() => tracksStopped(page)).toBe(true);
  expect(service.calls.stt).toBe(0);
});

test("Keep layout cancels an in-flight reset authorization without applying a reset", async ({
  page,
}) => {
  const service = await fixture(page);
  service.reset();
  await openVoice(page);
  await page.getByRole("textbox", { name: "Ask about this project" }).fill("Reset workspace");
  await page.getByRole("button", { name: "Send to assistant", exact: true }).click();
  await page.getByRole("button", { name: "Reset workspace…", exact: true }).click();
  service.hold();
  await page.getByRole("button", { name: "Confirm reset", exact: true }).click();
  await expect.poll(() => service.calls.approval).toBe(1);
  try {
    await page.getByRole("button", { name: "Keep layout", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("cancelled");
  } finally {
    service.release();
  }
  await expect(page.getByRole("textbox", { name: "Ask about this project" })).toBeEnabled();
  await expect(page.getByTestId("applied-count")).toHaveText("0");
});

test("returning after hidden-page initialization reloads assistant readiness", async ({ page }) => {
  const service = await fixture(page);
  service.holdReadiness();
  await page.goto(origin);
  await expect.poll(() => service.statusCalls()).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  try {
    await expect.poll(() => service.statusCalls()).toBe(2);
  } finally {
    service.releaseReadiness();
  }
  await page.getByRole("textbox", { name: "Ask about this project" }).fill("Focus overview");
  await expect(page.getByRole("button", { name: "Send to assistant", exact: true })).toBeEnabled();
});
