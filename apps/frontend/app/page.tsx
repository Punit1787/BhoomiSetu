const stages = [
  "Notification",
  "Verification",
  "Objection",
  "Award",
  "Compensation",
  "Possession",
];

export default function HomePage() {
  return (
    <main>
      <nav className="nav" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="BhoomiSetu home">
          <span className="brandMark">भू</span>
          <span>BhoomiSetu</span>
        </a>
        <span className="prototype">Prototype foundation</span>
      </nav>

      <section className="hero" id="top">
        <div className="eyebrow">SIH26016 · Project foundation ready</div>
        <h1>Every land-acquisition case should have a clear next step.</h1>
        <p className="intro">
          BhoomiSetu will help citizens and officers follow one accountable case timeline—from
          notification to possession.
        </p>

        <div className="statusCard">
          <div>
            <span className="statusDot" aria-hidden="true" />
            <strong>Setup complete</strong>
          </div>
          <p>The application shell is ready. Case data and login come next.</p>
        </div>
      </section>

      <section className="journey" aria-labelledby="journey-title">
        <p className="sectionLabel">Planned case journey</p>
        <h2 id="journey-title">One timeline, visible to everyone responsible.</h2>
        <ol className="stageList">
          {stages.map((stage, index) => (
            <li key={stage}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {stage}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

