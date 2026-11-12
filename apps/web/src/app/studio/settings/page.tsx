import StudioShell from "@/features/workspace/StudioShell";
import { AppearanceControl } from "@/features/workspace/Appearance";

export default function SettingsPage() {
  return <StudioShell title="Settings">
    <div className="page-heading"><h1>Make space for your work.</h1><p>Choose how Shape Studio looks on this browser.</p></div>
    <section className="setup-panel"><h2>Appearance</h2><AppearanceControl /><p>Only this preference is stored on your device. Creative prompts and uploaded files are not saved in browser storage.</p></section>
    <section className="setup-panel"><h2>Keyboard navigation</h2><p>Use Alt + 1 for Workspace, Alt + 2 for Create, Alt + 3 for Brainstorm, and Alt + 4 for Projects. Shortcuts pause while you type in a field.</p></section>
  </StudioShell>;
}
