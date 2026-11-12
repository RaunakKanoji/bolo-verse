"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  browserCapabilityEnvironment,
  detectCapabilities,
  type XRCapabilities,
} from "./capabilities";

export function useXRCapabilities() {
  const [capabilities, setCapabilities] = useState<XRCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lifetime = useRef({ generation: 0 });
  const probe = useCallback(async () => {
    const state = lifetime.current;
    const request = ++state.generation;
    const result = await detectCapabilities(browserCapabilityEnvironment());
    if (request !== state.generation) return;
    setCapabilities(result.capabilities);
    setError(result.error);
    setLoading(false);
  }, []);
  const refresh = useCallback(() => {
    setLoading(true);
    return probe();
  }, [probe]);
  useEffect(() => {
    const state = lifetime.current;
    void probe();
    const changed = () => {
      void refresh();
    };
    navigator.xr?.addEventListener("devicechange", changed);
    return () => {
      state.generation++;
      navigator.xr?.removeEventListener("devicechange", changed);
    };
  }, [probe, refresh]);
  return { capabilities, loading, error, refresh };
}
