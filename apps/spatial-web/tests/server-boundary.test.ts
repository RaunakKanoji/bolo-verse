import { describe, expect, it } from "vitest";
import { internalOrigin, sessionHeaders } from "../src/lib/server-transport";

describe("private server transport", () => {
  it("accepts only an explicitly configured origin without paths or credentials", () => {
    expect(internalOrigin("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
    for (const value of [undefined, "https://user:pass@example.com", "https://example.com/private", "file:///etc/passwd", "https://example.com?target=x"]) expect(() => internalOrigin(value)).toThrow();
  });
  it("forwards session transport only, never caller-selected destinations or identity headers", () => {
    const headers = sessionHeaders(new Headers({ cookie: "session=abc", authorization: "Bearer def", host: "attacker.test", "x-user-id": "fake", "x-forwarded-host": "attacker.test", origin: "https://attacker.test" }));
    expect(Object.fromEntries(headers)).toEqual({ authorization: "Bearer def", cookie: "session=abc" });
  });
});
