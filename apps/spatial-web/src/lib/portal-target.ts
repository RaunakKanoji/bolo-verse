import { internalOrigin } from "./server-transport";

/** Recover page navigation only; the spatial app never becomes a second backend. */
export function portalTarget(
  origin: string | undefined,
  pathname: string,
  search: string,
): URL | null {
  if (!(
    pathname === "/" ||
    pathname === "/workspace" ||
    /^\/(?:app|studio|reviews|review|projects|brainstorm|assets|clients|analytics|settings|profile|spatial-studio|recording-lab|xr|create)(?:\/|$)/.test(
      pathname,
    )
  ))
    return null;
  let target: URL;
  try {
    target = new URL(internalOrigin(origin));
  } catch {
    return null;
  }
  target.pathname = pathname;
  target.search = search;
  return target;
}
