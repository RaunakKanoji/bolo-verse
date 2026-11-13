import Link from "next/link";
import type { Metadata } from "next";
import { demo as data, demoCounts as counts } from "@/features/demo/snapshot";
import styles from "@/features/demo/demo.module.css";
export const metadata: Metadata = {
  title: "BoloVerse demo workspace",
  robots: { index: false, follow: false },
};
const views = [
  "Brief",
  "Brainstorm",
  "Script & storyboard",
  "Content",
  "Review & voice",
  "Spatial",
] as const;
const href = (project: string, view: number) => `/demo?project=${project}&view=${view}`;
function Preview({ src, alt }: { src: string; alt: string }) {
  // Original local, public synthetic PNGs. No image optimizer or external request.
  return (
    <a href={src} target="_blank" rel="noreferrer" aria-label={`Open ${alt}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={640} height={400} />
    </a>
  );
}
export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const p = data.projects.find((p) => p.id === query.project) ?? data.projects[0];
  const view =
    typeof query.view === "string" && /^[0-5]$/.test(query.view) ? Number(query.view) : 0;
  const client = data.clients.find((c) => c.id === p.clientId)!;
  const creator = data.profiles.find((c) => c.id === p.creatorId)!;
  const outputs = data.content.filter((c) => c.projectId === p.id);
  const conversations = data.conversations.filter((c) => c.projectId === p.id);
  return (
    <div className={styles.root}>
      <div className={styles.notice}>
        <strong>Fictional demo workspace</strong>
        <span>
          Historical synthetic content. AI requests, voice execution and client decisions are
          simulated. No sign-in required.
        </span>
        <Link href="/workspace">Open live workspace</Link>
      </div>
      <header className={styles.header}>
        <div>
          <p className={styles.muted}>BoloVerse / Shape XR</p>
          <h1>Your creative production studio</h1>
          <p>From the first brief to a story worth sharing.</p>
        </div>
        <Link className={styles.primary} href={`/demo/xr?layout=${data.layouts[0].id}`}>
          Open ChaiCraft in spatial studio
        </Link>
      </header>
      <dl className={styles.metrics}>
        {(
          [
            ["Clients", counts.clients],
            ["Projects", counts.projects],
            ["Brainstorms", counts.conversations],
            ["Scripts", counts.scripts],
            ["Storyboards", counts.storyboards],
            ["Content records", counts.content],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.workspace}>
        <aside className={styles.sidebar}>
          <h2>Projects</h2>
          <p className={styles.muted}>Presentation date {data.referenceDate}</p>
          <nav aria-label="Demo projects">
            {data.projects.map((project) => (
              <Link
                prefetch={false}
                key={project.id}
                href={href(project.id, view)}
                aria-current={project.id === p.id ? "page" : undefined}
              >
                <strong>{project.title}</strong>
                <span>
                  {project.stage} · {project.priority === "normal" ? "Medium" : project.priority}{" "}
                  priority
                </span>
              </Link>
            ))}
          </nav>
          <details>
            <summary>Fictional creator team</summary>
            {data.profiles.map((profile) => (
              <p key={profile.id}>
                <strong>{profile.name}</strong>
                <br />
                {profile.role}
                <br />
                {profile.languages.join(" / ")}
              </p>
            ))}
          </details>
        </aside>
        <section className={styles.project} aria-label="Demo project detail">
          <div className={styles.projectHeading}>
            <div>
              <p className={styles.muted}>
                {client.name} / {client.industry}
              </p>
              <h2>{p.title}</h2>
              <p>{p.concept}</p>
            </div>
            <span className={styles.badge}>{p.stage}</span>
          </div>
          <p className={styles.muted}>
            Assigned to {creator.name} · Due {p.dueDate} ·{" "}
            {p.tasks.filter((t) => t.status === "done").length} of {p.tasks.length} production tasks
            done
          </p>
          <nav className={styles.tabs} aria-label="Demo workflow">
            {views.map((label, n) => (
              <Link
                key={label}
                prefetch={false}
                aria-current={view === n ? "page" : undefined}
                href={href(p.id, n)}
              >
                {label}
              </Link>
            ))}
          </nav>
          {view === 0 && (
            <div className={styles.columns}>
              <article>
                <h3>Submitted client brief</h3>
                <p>{p.brief.objective}</p>
                <dl className={styles.detailList}>
                  <dt>Audience</dt>
                  <dd>{p.brief.audience}</dd>
                  <dt>Key message</dt>
                  <dd>{p.brief.keyMessage}</dd>
                  <dt>Channels</dt>
                  <dd>{p.brief.channels?.join(", ")}</dd>
                  <dt>Tone</dt>
                  <dd>{p.brief.tone}</dd>
                  <dt>Brand guidelines</dt>
                  <dd>{p.brief.brandRequirements}</dd>
                </dl>
                <div className={styles.prose}>{p.brief.notes}</div>
                <h3>Production tasks</h3>
                <ul>
                  {p.tasks.map((t) => (
                    <li key={t.id}>
                      {t.title} — {t.status.replaceAll("_", " ")}
                    </li>
                  ))}
                </ul>
              </article>
              <aside>
                <h3>{client.name}</h3>
                <Preview src={client.logo} alt={`${client.name} synthetic brand study`} />
                <p>{client.description}</p>
                <p>
                  Fictional contact: {client.contact}
                  <br />
                  {client.email}
                  <br />
                  {client.language}
                </p>
                <div className={styles.swatches}>
                  {client.colors.map((color) => (
                    <span key={color} style={{ background: color }} title={color} />
                  ))}
                </div>
                <h3>Project history</h3>
                {data.projects
                  .filter((x) => x.clientId === client.id)
                  .map((x) => (
                    <p key={x.id}>
                      <Link href={href(x.id, 0)}>{x.title}</Link>
                      <br />
                      <span className={styles.muted}>{x.stage}</span>
                    </p>
                  ))}
                <h3>Preview assets</h3>
                <Preview
                  src={`/demo-assets/${client.key}-campaign.png`}
                  alt={`${client.name} campaign illustration`}
                />
                <p className={styles.muted}>
                  Locally bundled original illustration. No R2 upload is claimed.
                </p>
              </aside>
            </div>
          )}
          {view === 1 && (
            <div>
              <h3>Historical brainstorming sessions</h3>
              <p className={styles.muted}>
                These saved conversations are synthetic examples. For a new live prompt, use the
                authenticated Brainstorm tool with a configured provider.
              </p>
              {conversations.map((session) => (
                <details key={session.id} open={session === conversations[0]}>
                  <summary>{session.title}</summary>
                  {session.messages.map((m) => (
                    <article className={styles.message} key={m.id}>
                      <strong>Creator</strong>
                      <p>{m.prompt}</p>
                      <strong>AI response · synthetic history</strong>
                      <p>{m.content.reply}</p>
                    </article>
                  ))}
                </details>
              ))}
              <h3>Creative directions</h3>
              <div className={styles.cards}>
                {p.directions.map((d) => (
                  <article key={d.id}>
                    <span className={styles.badge}>
                      {d.selected ? "Selected concept" : "Alternative"}
                    </span>
                    <h4>{d.payload.title}</h4>
                    <p>{d.payload.hook}</p>
                    <p>{d.payload.concept}</p>
                    <p>{d.payload.visualTreatment}</p>
                    <p className={styles.muted}>{d.payload.rationale}</p>
                  </article>
                ))}
              </div>
              <h3>Prompt template</h3>
              <p>
                Develop three 30-second concepts for {client.name}, for{" "}
                {p.brief.audience.toLowerCase()}, using the supplied product facts and brand
                constraints. Compare hooks, platform cutdowns and voiceover choices.
              </p>
            </div>
          )}
          {view === 2 && (
            <div>
              <h3>Script versions</h3>
              {p.scripts.map((script) => (
                <details key={script.id} open={script.version === 1}>
                  <summary>
                    {script.title} · v{script.version} · {script.language}
                  </summary>
                  {script.payload.sections.map((section, n) => {
                    const start = script.payload.sections
                      .slice(0, n)
                      .reduce((sum, s) => sum + s.durationSeconds, 0);
                    return (
                      <article className={styles.message} key={section.id}>
                        <h4>
                          Scene {n + 1} · {start}–{start + section.durationSeconds}s
                        </h4>
                        <p>{section.spokenText || "No spoken line; closing brand card."}</p>
                        {section.onScreenText && (
                          <p className={styles.muted}>On-screen: {section.onScreenText}</p>
                        )}
                      </article>
                    );
                  })}
                  <p>Call to action: {script.payload.callToAction}</p>
                </details>
              ))}
              <h3>Storyboard</h3>
              {p.storyboard ? (
                <>
                  <p>
                    Ordered frames match the selected script. Images are original schematic
                    placeholders.
                  </p>
                  <div className={styles.cards}>
                    {p.storyboard.payload.shots.map((shot, n) => {
                      const start = p
                        .storyboard!.payload.shots.slice(0, n)
                        .reduce((sum, s) => sum + s.durationSeconds, 0);
                      return (
                        <article key={shot.id}>
                          <Preview
                            src={`/demo-assets/${client.key}-frame-${n}.png`}
                            alt={`Scene ${n + 1}: ${shot.description}`}
                          />
                          <h4>
                            Scene {n + 1} · {start}–{start + shot.durationSeconds}s
                          </h4>
                          <p>{shot.description}</p>
                          <p>
                            {shot.framing} · {shot.cameraMovement}
                          </p>
                          <p>{shot.narration}</p>
                          <p className={styles.muted}>{shot.shootingNotes}</p>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p>Storyboard is not yet prepared for this project.</p>
              )}
            </div>
          )}
          {view === 3 && (
            <div>
              <h3>Content library</h3>
              <p>
                Original synthetic previews and preparation records. Video and voiceover cards
                describe planned outputs; they contain no playable video or generated speech.
              </p>
              <div className={styles.cards}>
                {outputs.map((output) => (
                  <article key={output.id}>
                    <span className={styles.badge}>
                      {output.status === "complete"
                        ? "Synthetic preview"
                        : `Simulated ${output.status}`}
                    </span>
                    {output.preview && <Preview src={output.preview} alt={output.title} />}
                    <h4>{output.title}</h4>
                    <p>
                      Version {output.version} · {output.category}
                    </p>
                    <p>{output.source}</p>
                    {!output.preview && (
                      <p>Preview unavailable. No executable job or provider request was created.</p>
                    )}
                  </article>
                ))}
              </div>
              <p className={styles.muted}>
                Actual generated content: none. Provider job IDs and usage costs: none.
              </p>
            </div>
          )}
          {view === 4 && (
            <div className={styles.columns}>
              <article>
                <h3>Client feedback and revision history</h3>
                <p className={styles.muted}>
                  All comments and decisions below are historical synthetic examples.
                </p>
                {[
                  ...data.comments
                    .filter((c) => c.projectId === p.id)
                    .map((c) => ({
                      id: c.id,
                      time: c.createdAt,
                      title: `${c.author} · content v${c.contentVersion}`,
                      body: c.body,
                    })),
                  ...data.decisions
                    .filter((d) => d.projectId === p.id)
                    .map((d) => ({
                      id: d.id,
                      time: d.createdAt,
                      title: d.decision.replaceAll("_", " "),
                      body: d.reason,
                    })),
                ]
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((event) => (
                    <article className={styles.message} key={event.id}>
                      <strong>{event.title}</strong>
                      <p>{event.body}</p>
                      <time className={styles.muted}>
                        {event.time.slice(0, 16).replace("T", " ")} UTC
                      </time>
                    </article>
                  ))}
                <p>
                  {data.decisions.some((d) => d.projectId === p.id && d.decision === "approved")
                    ? "Synthetic approval cycle complete on the revised version."
                    : "Pending fictional client review. No final approval recorded."}
                </p>
              </article>
              <aside>
                <h3>Voice interaction history</h3>
                <p>Simulated transcript history. Commands never run automatically.</p>
                {data.voice
                  .filter((v) => v.projectId === p.id)
                  .map((v) => (
                    <article className={styles.message} key={v.id}>
                      <p>“{v.transcript}”</p>
                      <strong>{v.intent}</strong>
                      <p>{v.language}</p>
                      <p className={styles.muted}>{v.result}</p>
                    </article>
                  ))}
                <Link href="/xr/hud">Open live spatial tools</Link>
              </aside>
            </div>
          )}
          {view === 5 && (
            <div>
              <h3>Saved spatial studios</h3>
              <p>
                Supported A-Frame panels use the saved positions, rotations and scales. The public
                walkthrough loads only fictional project text; saving requires the live
                authenticated workspace.
              </p>
              <div className={styles.cards}>
                {data.layouts.map((layout) => (
                  <article key={layout.id}>
                    <h4>{layout.title}</h4>
                    <p>{data.projects.find((p) => p.id === layout.projectId)!.title}</p>
                    <p>{layout.layout.objects.length} saved panels</p>
                    <Link className={styles.primary} href={`/demo/xr?layout=${layout.id}`}>
                      Open {layout.title}
                    </Link>
                  </article>
                ))}
              </div>
              <p className={styles.muted}>
                Headset entry depends on browser WebXR support. Physical Vision Pro behavior remains
                unverified.
              </p>
            </div>
          )}
        </section>
      </div>
      <details className={styles.activity}>
        <summary>Activity timeline and dataset details</summary>
        <p>
          Counts are exported from the validated isolated seed database. The public presentation is
          a read-only snapshot; changes in live workspaces do not update this snapshot.
        </p>
        {data.projects.slice(0, 5).map((project) => (
          <p key={project.id}>
            <time>{project.createdAt.slice(0, 10)}</time> — Fictional client submitted{" "}
            {project.title}; assigned creator prepared brief, concepts and production tasks.
          </p>
        ))}
        <p>
          {counts.messages} persisted messages · {counts.voice} voice history records ·{" "}
          {counts.comments} comments · {counts.layouts} saved layouts
        </p>
      </details>
    </div>
  );
}
