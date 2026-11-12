"use client";

import { useXRCapabilities } from "./useXRCapabilities";
import { XR_FALLBACK_MESSAGE } from "./capabilities";

export default function CapabilityPanel() {
  const { capabilities, loading, error, refresh } = useXRCapabilities();
  return (
    <section className="setup-panel" aria-label="Browser capabilities">
      <h2>Choose how you work</h2>
      {loading && <p role="status">Checking this browser’s capabilities…</p>}
      {capabilities && (
        <>
          <p>
            {capabilities.immersiveVRSupported
              ? "Immersive VR is available. You can enter from your project workspace."
              : XR_FALLBACK_MESSAGE}
          </p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Desktop 3D</dt>
              <dd>
                {capabilities.webglAvailable
                  ? "Available"
                  : "WebGL2 unavailable; project tools remain accessible"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Immersive AR</dt>
              <dd>
                {capabilities.immersiveARSupported
                  ? "Browser supports AR; scene entry is not enabled"
                  : "Not available"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Input</dt>
              <dd>
                {[
                  capabilities.pointerSupported && "Pointer",
                  capabilities.touchSupported && "Touch",
                  "Keyboard",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Microphone</dt>
              <dd>
                {capabilities.microphoneAvailable
                  ? "Available only after you activate voice"
                  : "Unavailable"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Secure context</dt>
              <dd>
                {capabilities.secureContext
                  ? "Yes"
                  : "HTTPS is required for immersive sessions and voice"}
              </dd>
            </div>
          </dl>
        </>
      )}
      {error && <p role="status">{error}</p>}
      <button
        type="button"
        className="mt-4 text-sm font-semibold underline"
        disabled={loading}
        onClick={() => void refresh()}
      >
        Refresh capabilities
      </button>
    </section>
  );
}
