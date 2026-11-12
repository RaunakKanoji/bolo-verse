/** One owner for asynchronous initialization and all scene-owned resources. */
export class RuntimeScope {
  private readonly controller = new AbortController();
  private cleanups: (() => void)[] = [];

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  own(cleanup: () => void): void {
    if (this.signal.aborted) cleanup();
    else this.cleanups.push(cleanup);
  }

  dispose(): void {
    if (this.signal.aborted) return;
    this.controller.abort();
    for (const cleanup of this.cleanups.reverse()) {
      try {
        cleanup();
      } catch {
        /* Release remaining resources even after a browser cleanup failure. */
      }
    }
    this.cleanups = [];
  }
}
