export default function WorkspaceLanding() {
  return (
    <main className="workspace-landing">
      <header className="landing-nav">
        <a className="shape-wordmark" href="/">
          shape
          <span className="brand-dot" />
        </a>
        <a href="/app/projects">Your projects</a>
      </header>
      <section className="landing-content">
        <div>
          <h1>
            Give your ideas
            <br />a little more space.
          </h1>
          <p>
            Arrange your project’s models and images in a shared scene. Refine a composition on
            desktop, then open the saved scene in your spatial workspace.
          </p>
          <a className="primary button-link" href="/app/projects">
            Choose a project
          </a>
          <p className="landing-note">
            Open a project and choose Spatial workspace. Your project permissions apply here too.
          </p>
        </div>
        <div className="landing-sculpture" aria-hidden="true">
          <div className="sculpture-grid" />
          <div className="sculpture-cube" />
          <div className="sculpture-sphere" />
          <div className="sculpture-ring" />
          <span>Your next dimension</span>
        </div>
      </section>
      <footer className="landing-footer">
        <span>Shape Studio</span>
        <span>One project. More room to create.</span>
      </footer>
    </main>
  );
}
