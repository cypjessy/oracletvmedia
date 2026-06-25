"use client";

export default function VerseOfTheDay() {
  return (
    <>
      <div className="section-header">
        <h2 className="section-title">Verse of the Day</h2>
      </div>
      <section className="verse-section">
        <div className="verse-card">
          <div className="verse-text">
            For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.
          </div>
          <div className="verse-ref">Jeremiah 29:11</div>
          <div className="verse-actions">
            <button className="verse-btn"><i className="fas fa-share-nodes"></i> Share</button>
            <button className="verse-btn"><i className="fas fa-copy"></i> Copy</button>
            <button className="verse-btn"><i className="fas fa-bookmark"></i> Save</button>
          </div>
        </div>
      </section>
    </>
  );
}
