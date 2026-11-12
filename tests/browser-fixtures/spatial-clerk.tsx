// The isolated esbuild harness has no Next/Clerk runtime. Session tests invoke
// the real SessionWorkspace with an explicit lifecycle; accidentally invoking
// the SDK wrapper must fail instead of silently fabricating authentication.
export function useSession(): never {
  throw new Error("The fixture must inject its explicit session lifecycle.");
}
export function ClerkProvider(): never {
  throw new Error("The fixture must not initialize the live Clerk provider.");
}
