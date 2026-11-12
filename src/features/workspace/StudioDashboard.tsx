"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Clapperboard,
  FolderOpen,
  ImageIcon,
  Layers3,
  Search,
  Sparkles,
} from "lucide-react";
import StudioShell from "./StudioShell";
import type { AccessState } from "@/features/projects/ProjectAccessNotice";
import styles from "./dashboard.module.css";

export type DashboardProject = { id: string; name: string; objective: string; sample: boolean };
const studies = [
  { title: "Botanical essentials", body: "Product & lifestyle", art: 0 },
  { title: "The everyday ritual", body: "Brand & social content", art: 1 },
  { title: "Made by hand", body: "Craft & campaign concepts", art: 2 },
];

export default function StudioDashboard({
  projects,
  access,
}: {
  projects: DashboardProject[];
  access: AccessState | null;
}) {
  const [query, setQuery] = useState("");
  const filtered = projects.filter((p) =>
    `${p.name} ${p.objective}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <StudioShell title="">
      <div className={styles.searchRow}>
        <label className={styles.search}>
          <Search size={19} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={!projects.length}
            placeholder={
              projects.length ? "Search your projects" : "Connect your workspace to search projects"
            }
            aria-label="Search your projects"
          />
          <kbd>⌕</kbd>
        </label>
        <span className={styles.mode}>{access ? "Explore the studio" : "Private workspace"}</span>
      </div>
      <div className={styles.grid}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>
              Good things
              <br />
              start with an idea.
            </h1>
            <p>
              Create, collaborate, and deliver
              <br />
              content with a little more space.
            </p>
            <Link href="/app/projects" className={styles.primary}>
              <Sparkles size={17} />
              Create new project
            </Link>
          </div>
          <div className={styles.ribbon} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </section>
        <div className={styles.metrics}>
          <div>
            <FolderOpen />
            <strong>{access ? "—" : projects.length}</strong>
            <span>Your projects</span>
          </div>
          <div>
            <Box />
            <strong>3D</strong>
            <span>Spatial workspace</span>
          </div>
          <div>
            <CheckCircle2 />
            <strong>{access ? "Connect" : "Private"}</strong>
            <span>{access ? "Open your workspace" : "Authorized access"}</span>
          </div>
        </div>
        <section className={`${styles.panel} ${styles.campaigns}`}>
          <div className={styles.panelHeading}>
            <h2>
              <Box size={22} />
              {projects.length ? "Your campaigns" : "Explore what’s possible"}
            </h2>
            <Link href="/app/projects">
              Open projects <ArrowRight size={16} />
            </Link>
          </div>
          {projects.length ? (
            <>
              <div className={styles.projectGrid}>
                {filtered.slice(0, 6).map((project) => (
                  <Link
                    className={styles.project}
                    key={project.id}
                    href={`/app/projects/${project.id}`}
                  >
                    <div className={styles.projectCover}>
                      <Layers3 size={42} />
                      <span>{project.sample ? "Sample project" : "Project"}</span>
                    </div>
                    <h3>{project.name}</h3>
                    <p>{project.objective}</p>
                    <span className={styles.openProject}>
                      Open workspace <ArrowRight size={15} />
                    </span>
                  </Link>
                ))}
              </div>
              {!filtered.length && (
                <p className={styles.empty} role="status">
                  No projects match “{query}”. Try another name.
                </p>
              )}
            </>
          ) : (
            <>
              <p className={styles.sampleLabel}>
                Illustrative campaign studies · these are not saved projects.
              </p>
              <div className={styles.projectGrid}>
                {studies.map((study) => (
                  <Link href="/studio/create" className={styles.project} key={study.title}>
                    <div
                      className={`${styles.studyArt} ${styles[`art${study.art}`]}`}
                      role="img"
                      aria-label={`${study.title} illustrative product study`}
                    />
                    <h3>{study.title}</h3>
                    <p>{study.body}</p>
                    <span className={styles.openProject}>
                      Explore creative canvas <ArrowRight size={15} />
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
        <section className={`${styles.panel} ${styles.next}`}>
          <div className={styles.panelHeading}>
            <h2>
              <Sparkles size={22} />
              Pick up an idea
            </h2>
          </div>
          <Link href="/studio/create" className={styles.nextItem}>
            <span className={styles.nextIcon}>
              <ImageIcon />
            </span>
            <div>
              <strong>Make room to create</strong>
              <p>Try the image canvas and local adjustments.</p>
            </div>
            <ArrowRight size={18} />
          </Link>
          <Link href="/xr/preview" className={styles.nextItem}>
            <span className={styles.nextIcon}>
              <Box />
            </span>
            <div>
              <strong>Step into Spatial Studio</strong>
              <p>Arrange cards in a real 3D workspace.</p>
            </div>
            <ArrowRight size={18} />
          </Link>
          <Link href="/studio/feasibility" className={styles.nextItem}>
            <span className={styles.nextIcon}>
              <Clapperboard />
            </span>
            <div>
              <strong>Capture a quick take</strong>
              <p>Record and download a local video.</p>
            </div>
            <ArrowRight size={18} />
          </Link>
        </section>
        <section className={`${styles.panel} ${styles.assets}`}>
          <div className={styles.panelHeading}>
            <h2>
              <ImageIcon size={22} />
              Creative canvas
            </h2>
            <Link href="/studio/create">
              Open canvas <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.assetStrip}>
            {[0, 1, 2, 0, 1].map((art, index) => (
              <Link
                key={index}
                href="/studio/create"
                aria-label={`Explore illustrative study ${index + 1}`}
                className={`${styles.studyArt} ${styles[`art${art}`]}`}
              />
            ))}
          </div>
          <p className={styles.sampleLabel}>
            Original illustrative studies. Open a project to work with private assets.
          </p>
        </section>
        <section className={`${styles.panel} ${styles.access}`}>
          <h2>
            <Layers3 size={22} />
            {access ? "Your workspace, connected" : "Ready for your next project"}
          </h2>
          <p>
            {access === "sign-in"
              ? "Sign in to see your projects and creative work."
              : access === "unconfigured"
                ? "Connect Clerk and Neon to create private projects. You can explore the public studio now."
                : access
                  ? "Projects could not be loaded. Open your workspace to retry."
                  : "Open a project to inspect assets, brainstorm with the assistant, and save your spatial layout."}
          </p>
          <Link href="/app/projects" className={styles.primary}>
            {access ? "Connect your workspace" : "Open your projects"}
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </StudioShell>
  );
}
