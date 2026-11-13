/** Fixed upstream and exact owned prefixes; never derive routing from caller hosts. */
export function spatialTarget(origin: string, pathname: string, search: string): URL | null {
  if (!(pathname.startsWith("/workspace/") || pathname.startsWith("/spatial-static/"))) return null;
  let target: URL;
  try { target = new URL(origin); } catch { throw new Error("Configure an exact HTTP(S) spatial origin."); }
  if (!/^https?:$/.test(target.protocol) || target.username || target.password || target.pathname !== "/" || target.search || target.hash) {
    throw new Error("Configure an exact HTTP(S) spatial origin.");
  }
  target.pathname = pathname;
  target.search = search;
  return target;
}
