"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

export default class XRErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <section className="setup-panel" role="alert">
          <h2>The spatial view could not open</h2>
          <p>Your saved project remains available. Reload the page to retry.</p>
          <Link href="/app/projects">Return to projects</Link>
        </section>
      );
    return this.props.children;
  }
}
