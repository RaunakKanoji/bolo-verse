import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <section className="empty-state"><h1>This page isn’t available.</h1><p>Open your projects, explore the XR preview or test the recording lab from the home page.</p><Button asChild><Link href="/">Back to home</Link></Button></section>;
}
