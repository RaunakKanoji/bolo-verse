import { useState } from "react";
import { createRoot } from "react-dom/client";
import AssistantPanel from "../../apps/web/src/xr/assistant/AssistantPanel";
import type { XRCommand } from "../../apps/web/src/lib/contracts/xr-assistant";

function Fixture() {
  const [visible, setVisible] = useState(true);
  const [context, setContext] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [actions, setActions] = useState<XRCommand[]>([]);
  return (
    <>
      <button onClick={() => setVisible((value) => !value)}>
        {visible ? "Unmount assistant" : "Mount assistant"}
      </button>
      <button onClick={() => setContext((value) => value + 1)}>Change local context</button>
      <button onClick={() => setDisabled((value) => !value)}>Toggle edit permission</button>
      <p data-testid="applied-count">{actions.length}</p>
      {visible && (
        <AssistantPanel
          sessionAware
          projectId="b4000000-0000-4000-8000-000000000001"
          contextKey={String(context)}
          workspaceVersion={1}
          disabled={disabled}
          onCommand={(command) => setActions((value) => [...value, command])}
        />
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
