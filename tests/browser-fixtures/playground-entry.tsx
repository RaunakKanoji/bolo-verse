import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStore } from "zustand";
import {
  createPlaygroundStore,
  type PlaygroundStore,
} from "../../src/features/playground/playground-state";
import {
  useCreativeCapabilities,
  useCreativeDraft,
} from "../../src/features/playground/use-creative-services";
import { PromptPanel } from "../../src/features/playground/PromptPanel";
import "../../packages/design-tokens/generated/tokens.css";

function Prompt({ projectId, store }: { projectId: string; store: PlaygroundStore }) {
  const document = useStore(store, (state) => state.document);
  const draft = useCreativeDraft(projectId, store, JSON.stringify(document));
  const catalog = useCreativeCapabilities();
  return (
    <PromptPanel
      document={document}
      projectId={projectId}
      capabilities={catalog.data}
      capabilityError={catalog.isError}
      draft={draft}
      sourceDescription="Test fixture only."
      setMode={store.getState().setMode}
      setPrompt={store.getState().setPrompt}
      upload={() => {
        throw new Error("This prompt-only test does not accept image uploads.");
      }}
    />
  );
}
function Fixture({ projectId }: { projectId: string }) {
  const [store] = useState(createPlaygroundStore);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0 },
          mutations: { retry: false, gcTime: 0 },
        },
      }),
  );
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  return (
    <QueryClientProvider client={client}>
      <Prompt projectId={projectId} store={store} />
    </QueryClientProvider>
  );
}
function App() {
  const [projectId, setProjectId] = useState("e67ea056-e196-445c-8c9b-55b2058a5d58");
  return (
    <>
      <button onClick={() => setProjectId("6b6632c9-ff53-4113-9a62-2a55254f0bfd")}>
        Open other fixture project
      </button>
      <Fixture key={projectId} projectId={projectId} />
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
