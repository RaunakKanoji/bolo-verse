import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ClerkProvider } from "@clerk/nextjs";
import { Clapperboard, FlaskConical, FolderOpen, Glasses, House } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BoloVerse — Creator studio", template: "%s | BoloVerse" },
  description: "A creator workspace with a desktop and immersive XR studio foundation.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#4f46a5" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="topbar">
      <Link href="/" className="brand"><span className="brand-mark"><Clapperboard size={20} aria-hidden="true" /></span>BoloVerse</Link>
      <span className="preview-label">Foundation preview</span>
      <nav aria-label="Main navigation">
        <Link href="/" aria-label="Home"><House size={17} aria-hidden="true" /><span>Home</span></Link>
        <Link href="/app/projects" aria-label="Projects"><FolderOpen size={17} aria-hidden="true" /><span>Projects</span></Link>
        <Link href="/xr/preview" aria-label="XR preview"><Glasses size={17} aria-hidden="true" /><span>XR preview</span></Link>
        <Link href="/studio/feasibility" aria-label="Recording lab"><FlaskConical size={17} aria-hidden="true" /><span>Recording lab</span></Link>
      </nav>
    </header>
    <main id="main" className="main-shell">{children}</main>
    <footer className="footer"><span>Made for the stories behind small businesses.</span><span>XR Phase 1 · Studio foundation</span></footer>
  </>;
  const authConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
  return <html lang="en"><body>{authConfigured ? <ClerkProvider>{content}</ClerkProvider> : content}</body></html>;
}
