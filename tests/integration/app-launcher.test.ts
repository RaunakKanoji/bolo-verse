import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer, createConnection, type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const repository = fileURLToPath(new URL("../..", import.meta.url));
const apps = ["web", "spatial-web"] as const;
type Ready = { ready: true; cwd: string; pid: number; mode: string };

async function freePorts(): Promise<number[]> {
  const reservations = await Promise.all(apps.map(() => new Promise<ReturnType<typeof createServer>>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  })));
  const ports = reservations.map((server) => (server.address() as AddressInfo).port).sort((left, right) => left - right);
  await Promise.all(reservations.map((server) => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  })));
  return ports;
}

function listening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    const finish = (open: boolean) => { socket.destroy(); resolve(open); };
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(500, () => finish(false));
  });
}

async function waitFor(condition: () => boolean | Promise<boolean>, diagnostics: () => string) {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    if (await condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Timed out waiting for launcher lifecycle: ${diagnostics()}`);
}

it("starts each app in its own directory and releases both ports when process-group signals are denied", async () => {
  const fixture = mkdtempSync(join(tmpdir(), "shape-app-launcher-"));
  const ready: Ready[] = [];
  let runner: ReturnType<typeof spawn> | undefined;
  let output = "";
  try {
    mkdirSync(join(fixture, "scripts"));
    copyFileSync(join(repository, "scripts/run-apps.mjs"), join(fixture, "scripts/run-apps.mjs"));
    writeFileSync(join(fixture, "package.json"), JSON.stringify({ type: "module" }));
    mkdirSync(join(fixture, "node_modules/@next"), { recursive: true });
    symlinkSync(realpathSync(join(repository, "node_modules/@next/env")), join(fixture, "node_modules/@next/env"), "dir");

    // Model the managed shell's restriction without changing the real launcher.
    const preload = join(fixture, "deny-process-groups.cjs");
    writeFileSync(preload, `
      const kill = process.kill;
      process.kill = function (pid, signal) {
        if (pid < 0) throw Object.assign(new Error("Process-group signals are denied"), { code: "EPERM" });
        return kill.call(process, pid, signal);
      };
    `);
    for (const app of apps) {
      const appDirectory = join(fixture, "apps", app);
      const binary = join(appDirectory, "node_modules/next/dist/bin/next.js");
      mkdirSync(dirname(binary), { recursive: true });
      writeFileSync(join(appDirectory, "package.json"), JSON.stringify({ name: `@shape/${app}`, type: "module" }));
      writeFileSync(join(appDirectory, "node_modules/next/package.json"), JSON.stringify({ name: "next", type: "module" }));
      writeFileSync(binary, `
        import { createServer } from "node:http";
        import { writeFileSync } from "node:fs";
        const args = process.argv.slice(2);
        const info = { ready: true, cwd: process.cwd(), pid: process.pid, mode: args[0] };
        writeFileSync("fixture.pid", String(process.pid));
        const server = createServer((request, response) => {
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify(info));
        });
        server.listen(Number(args[args.indexOf("--port") + 1]), args[args.indexOf("--hostname") + 1], () => {
          console.log(JSON.stringify(info));
        });
        process.once("SIGTERM", () => server.close(() => process.exit(0)));
      `);
    }
    const [webPort, spatialPort] = await freePorts();
    let exit: { code: number | null; signal: NodeJS.Signals | null } | undefined;
    runner = spawn(process.execPath, [join(fixture, "scripts/run-apps.mjs"), "start"], {
      cwd: fixture,
      env: { NODE_ENV: "test", PATH: process.env.PATH, PORT: String(webPort), SPATIAL_PORT: String(spatialPort), NODE_OPTIONS: `--require ${JSON.stringify(preload)}` },
      stdio: ["ignore", "pipe", "pipe"],
    });
    runner.once("exit", (code, signal) => { exit = { code, signal }; });
    runner.once("error", (error) => { output += error.message; });
    let pending = "";
    runner.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      pending += text;
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("{")) {
          const event = JSON.parse(line) as Ready;
          if (event.ready) ready.push(event);
        }
      }
    });
    runner.stderr?.on("data", (chunk: Buffer) => { output += chunk.toString(); });
    await waitFor(() => ready.length === 2 || exit !== undefined, () => output);
    expect(ready, output).toHaveLength(2);
    for (const [index, app] of apps.entries()) {
      const response = await fetch(`http://127.0.0.1:${[webPort, spatialPort][index]}`, { signal: AbortSignal.timeout(2000), headers: { Connection: "close" } });
      expect(response.status).toBe(200);
      const info = await response.json() as Ready;
      expect(info).toEqual({ ready: true, cwd: realpathSync(join(fixture, "apps", app)), pid: expect.any(Number), mode: "start" });
      expect(ready).toContainEqual(info);
    }

    runner.kill("SIGTERM");
    await waitFor(() => exit !== undefined, () => output);
    expect(exit, output).toEqual({ code: 0, signal: null });
    await waitFor(async () => !(await listening(webPort)) && !(await listening(spatialPort)), () => output);
  } finally {
    // Even a broken launcher must not leave fixture servers running after RED.
    runner?.kill("SIGKILL");
    for (const app of apps) {
      try { process.kill(Number(readFileSync(join(fixture, "apps", app, "fixture.pid"), "utf8")), "SIGKILL"); }
      catch (error) { if (!["ENOENT", "ESRCH"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error; }
    }
    rmSync(fixture, { recursive: true, force: true });
  }
}, 20_000);
