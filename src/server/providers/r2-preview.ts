import "server-only";
import { MAX_PREVIEW_BYTES } from "@/lib/contracts/xr-assets";
import { R2BoundedReader } from "./r2-bounded";

/** Existing browser previews retain their independent 20 MiB limit. */
export class R2PreviewReader extends R2BoundedReader {
  constructor() { super(MAX_PREVIEW_BYTES); }
}
