import type { AFrameRuntime } from "./aframe-types";
import { registerStudioComponents } from "../components/register-components";
import type { RuntimeScope } from "./scope";

type RuntimeWindow = Window & typeof globalThis & { AFRAME: AFrameRuntime };
export type XRRealm = { window: RuntimeWindow; document: Document; frame: HTMLIFrameElement };

/** A disposable realm contains A-Frame's styles, custom elements and globals. */
export async function loadAFrame(
  host: HTMLDivElement,
  scope: RuntimeScope,
): Promise<XRRealm | undefined> {
  if (scope.signal.aborted) return undefined;
  const frame = document.createElement("iframe");
  frame.title = "XR studio canvas";
  frame.allow = "xr-spatial-tracking; fullscreen";
  frame.allowFullscreen = true;
  frame.style.cssText = "border:0;width:100%;height:100%;display:block;background:#f5f7fb;";
  // Only static markup enters this scaffold. Project text is passed through
  // typed component attributes after initialization, never HTML interpolation.
  frame.srcdoc = `<!doctype html><html lang="en"><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self' blob: data:; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f5f7fb}canvas:focus-visible{outline:2px solid #3478f6;outline-offset:-4px}</style></head><body></body></html>`;
  scope.own(() => frame.remove());

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error("The XR runtime did not load. Reload the workspace to retry.")),
      20_000,
    );
    const finish = () => window.clearTimeout(timeout);
    scope.own(finish);
    scope.signal.addEventListener(
      "abort",
      () => {
        finish();
        resolve(undefined);
      },
      { once: true },
    );
    frame.addEventListener(
      "load",
      () => {
        if (scope.signal.aborted) return;
        const childWindow = frame.contentWindow as RuntimeWindow | null;
        const childDocument = frame.contentDocument;
        if (!childWindow || !childDocument) {
          finish();
          reject(new Error("The isolated XR workspace could not open."));
          return;
        }
        const script = childDocument.createElement("script");
        script.src = "/vendor/aframe/aframe-1.8.0.min.js";
        script.addEventListener(
          "error",
          () => {
            finish();
            reject(
              new Error("The local XR runtime could not load. Reload the workspace to retry."),
            );
          },
          { once: true },
        );
        script.addEventListener(
          "load",
          () => {
            finish();
            if (scope.signal.aborted) return;
            if (!childWindow.AFRAME) {
              reject(new Error("The XR runtime did not initialize."));
              return;
            }
            registerStudioComponents(childWindow.AFRAME, childDocument);
            resolve({ window: childWindow, document: childDocument, frame });
          },
          { once: true },
        );
        childDocument.head.append(script);
      },
      { once: true },
    );
    host.append(frame);
  });
}
