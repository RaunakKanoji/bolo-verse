import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <section className="empty-state"><h1>This page isn’t available.</h1><p>The foundation preview includes the home page, workspace status and recording lab.</p><Button asChild><Link href="/">Back to home</Link></Button></section>;
}
