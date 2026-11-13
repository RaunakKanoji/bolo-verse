import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import { setFixtureSession, useAuth } from "./creation-auth";
import ClientReview from "../../apps/web/src/features/reviews/ClientReview";
import ReviewFeedback from "../../apps/web/src/features/projects/ReviewFeedback";
import "../../packages/design-tokens/generated/tokens.css";
const versionId = "33333333-3333-4333-8333-333333333333";
function Fixture() {
  const [mode, setMode] = useState<"inbox" | "review" | "creator" | "denied">("inbox");
  const { sessionId } = useAuth();
  const denied = useCallback(() => setMode("denied"), []);
  return (
    <>
      <button onClick={() => setMode("review")}>Open fixture review</button>
      <button onClick={() => setMode("creator")}>Show fixture creator feedback</button>
      <button onClick={() => setFixtureSession(null)}>Sign out fixture session</button>
      <button onClick={() => setFixtureSession("fixture-session-other")}>
        Switch fixture session
      </button>
      <div key={sessionId}>
        {!sessionId ? (
          <p>Sign in to view reviews.</p>
        ) : mode === "creator" ? (
          <ReviewFeedback
            projectId="11111111-1111-4111-8111-111111111111"
            versionId={versionId}
            onAccessLost={denied}
          />
        ) : mode === "denied" ? (
          <p>Creator access unavailable</p>
        ) : (
          <ClientReview versionId={mode === "review" ? versionId : undefined} />
        )}
      </div>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Fixture />
  </StrictMode>,
);
