import Link from "next/link";
import { ArrowUpRight, Check, Film, Glasses, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return <div className="home">
    <section className="welcome">
      <div className="welcome-copy">
        <span className="status-pill"><span /> A studio taking shape</span>
        <h1>Give your next<br />story a space.</h1>
        <p className="lead">From a small business brief to a story worth sharing. Open your project and explore a creative studio in your browser or a supported VR headset.</p>
        <div className="actions">
          <Button asChild size="lg"><Link href="/xr/preview">Explore the XR studio <ArrowUpRight aria-hidden="true" /></Link></Button>
          <Button asChild variant="outline" size="lg"><Link href="/app/projects">Open projects</Link></Button>
        </div>
        <p className="small-note">The public preview contains sample content. Sign in to create and open private projects.</p>
      </div>
      <div className="sample-art" role="img" aria-label="Illustrated magenta and gold textile card, fictional Ilkal saree campaign">
        <div className="sample-top"><span>Sample campaign</span><Film size={20} aria-hidden="true" /></div>
        <div className="textile"><div className="textile-band" /><div className="textile-fringe" /></div>
        <div className="sample-bottom"><span>Ilkal, in every thread.</span><small>Fictional product study · 2.5D card</small></div>
      </div>
    </section>

    <section className="workspace-section" aria-labelledby="available-heading">
      <div className="section-heading"><h2 id="available-heading">Start with the essentials</h2><span className="muted">Available in this preview</span></div>
      <div className="feature-grid">
        <article className="feature"><div className="feature-icon"><Film aria-hidden="true" /></div><h3>A real recording</h3><p>Capture a portrait scene with your microphone. Play it back and download the actual file from this browser.</p><Link href="/studio/feasibility">Open recording lab <ArrowUpRight size={15} aria-hidden="true" /></Link></article>
        <article className="feature"><div className="feature-icon green"><ShieldCheck aria-hidden="true" /></div><h3>A private project</h3><p>Create a campaign and save its objective in your workspace. Project access is checked on the server. Clerk and Neon configuration is required.</p><Link href="/app/projects">Open your workspace <ArrowUpRight size={15} aria-hidden="true" /></Link></article>
        <article className="feature"><div className="feature-icon rose"><Glasses aria-hidden="true" /></div><h3>A spatial foundation</h3><p>Inspect the studio in desktop mode. Enter immersive VR when supported. Scene editing, assets, AI and review are planned for later phases.</p><Link href="/xr/preview">Explore the public preview <ArrowUpRight size={15} aria-hidden="true" /></Link></article>
      </div>
    </section>
    <aside className="privacy-note"><Check size={18} aria-hidden="true" /><p>The recording lab keeps your audio in this browser. Nothing is uploaded; download a take before leaving the page.</p></aside>
  </div>;
}
