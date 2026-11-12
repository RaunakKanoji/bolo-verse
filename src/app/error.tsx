"use client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="empty-state" role="alert"><h1>This page could not load.</h1><p>Check the application configuration or retry. No recording or project save has been confirmed.</p><Button onClick={reset}>Try again</Button></section>;
}
