import type { Metadata, Viewport } from "next";
import Link from "next/link";
import AuthControls from "@/features/auth/AuthControls";
import { clerkWebConfigured } from "@/lib/auth/configured";
import { ClerkProvider } from "@clerk/nextjs";
import { Clapperboard, FlaskConical, FolderOpen, Glasses, House } from "lucide-react";
import { AppearanceSync } from "@/features/workspace/Appearance";
import { WorkspaceSessionProvider } from "@/features/platform/WorkspaceSession";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Shape Studio — Creator studio", template: "%s | Shape Studio" },
  description: "An AI creative workspace for projects, image editing, and spatial production.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#4f46a5" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = <>
    <AppearanceSync />
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="topbar">
      <Link href="/" className="brand"><span className="brand-mark"><Clapperboard size={20} aria-hidden="true" /></span>Shape Studio</Link>
      <span className="preview-label">Creative workspace</span>
      <nav aria-label="Main navigation">
        <Link href="/" aria-label="Home"><House size={17} aria-hidden="true" /><span>Home</span></Link>
        <Link href="/app/projects" aria-label="Projects"><FolderOpen size={17} aria-hidden="true" /><span>Projects</span></Link>
        <Link href="/reviews" aria-label="Reviews"><FolderOpen size={17} aria-hidden="true" /><span>Reviews</span></Link>
        <a href="/workspace" aria-label="3D workspace"><Glasses size={17} aria-hidden="true" /><span>3D workspace</span></a>
        <Link href="/xr/hud" aria-label="Spatial workspace"><Glasses size={17} aria-hidden="true" /><span>Spatial workspace</span></Link>
        <Link href="/studio/feasibility" aria-label="Recording lab"><FlaskConical size={17} aria-hidden="true" /><span>Recording lab</span></Link>
      </nav>
      <AuthControls />
    </header>
    <main id="main" className="main-shell">{children}</main>
    <footer className="footer"><span>Made for the stories behind small businesses.</span><span>Browser-based Spatial Studio</span></footer>
  </>;
  const authConfigured = clerkWebConfigured(process.env);
  return <html lang="en" data-shape-theme="dark"><body>{authConfigured ? <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/workspace" signUpFallbackRedirectUrl="/workspace"><WorkspaceSessionProvider configured>{content}</WorkspaceSessionProvider></ClerkProvider> : <WorkspaceSessionProvider configured={false}>{content}</WorkspaceSessionProvider>}</body></html>;
}
