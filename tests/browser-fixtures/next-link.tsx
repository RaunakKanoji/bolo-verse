import type { ComponentProps } from "react";

/** Test-only router boundary. Production still imports the real Next Link. */
export default function HarnessLink(props: ComponentProps<"a">) {
  return <a {...props} />;
}
