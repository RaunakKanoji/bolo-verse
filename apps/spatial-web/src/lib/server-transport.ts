/** Pure helpers kept separate so the forwarding allowlist can be tested without Next runtime. */
export function internalOrigin(input: string | undefined): string {
  if (!input) throw new Error("Web origin is not configured.");
  const url = new URL(input);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Web origin must be an HTTP origin.");
  return url.origin;
}
export function sessionHeaders(incoming: Pick<Headers, "get">): Headers {
  const headers = new Headers();
  for (const name of ["cookie", "authorization"]) {
    const value = incoming.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}
