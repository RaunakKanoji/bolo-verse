"use client";
import { useLayoutEffect } from "react";
export function useVideoDirty(dirty: boolean) {
  useLayoutEffect(() => {
    let approved = false;
    const confirm = () => {
      if (!dirty || approved) return true;
      if (!window.confirm("Your video edit is unsaved. Leave and discard these changes?"))
        return false;
      approved = true;
      queueMicrotask(() => {
        approved = false;
      });
      return true;
    };
    const planned = (event: Event) => {
      if (!confirm()) event.preventDefault();
    };
    const click = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.hasAttribute("download") || anchor.target === "_blank") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;
      if (!confirm()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (dirty && !approved) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("shape-before-navigate", planned);
    document.addEventListener("click", click, true);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("shape-before-navigate", planned);
      document.removeEventListener("click", click, true);
      window.removeEventListener("beforeunload", unload);
    };
  }, [dirty]);
}
