// Isolated browser-fixture router; production imports Next's real App Router.
export function useRouter() {
  return { push: (path: string) => window.location.assign(path) };
}
