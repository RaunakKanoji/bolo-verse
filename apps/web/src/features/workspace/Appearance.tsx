"use client";

import { useEffect, useSyncExternalStore } from "react";

const key = "shape-studio-appearance";
const event = "shape-appearance-change";
type Appearance = "system" | "light" | "dark";
let memoryPreference: Appearance = "dark";
function read(): Appearance {
  try {
    const value = localStorage.getItem(key);
    return value === "light" || value === "dark" || value === "system" ? value : "dark";
  } catch {
    return memoryPreference;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(event, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(event, callback);
  };
}
function useAppearance() {
  return useSyncExternalStore(subscribe, read, () => "dark" as const);
}
export function AppearanceSync() {
  const appearance = useAppearance();
  useEffect(() => {
    document.documentElement.dataset.shapeTheme = appearance;
  }, [appearance]);
  return null;
}
export function AppearanceControl() {
  const appearance = useAppearance();
  return (
    <label className="appearance-control">
      Appearance
      <select
        aria-label="Appearance"
        value={appearance}
        onChange={(e) => {
          const value = e.target.value as Appearance;
          memoryPreference = value;
          try {
            localStorage.setItem(key, value);
          } catch {
            /* Storage may be unavailable. */
          }
          document.documentElement.dataset.shapeTheme = value;
          window.dispatchEvent(new Event(event));
        }}
      >
        <option value="system">Use system appearance</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
