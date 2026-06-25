"use client";

export default function QuickActions() {
  return (
    <>
      <div className="section-header">
        <h2 className="section-title">Quick Access</h2>
      </div>
      <div className="quick-actions">
        <div className="quick-action" data-page="radio">
          <div className="quick-action-icon gold"><i className="fas fa-radio"></i></div>
          <span>Radio</span>
        </div>
        <div className="quick-action" data-page="watch">
          <div className="quick-action-icon blue"><i className="fas fa-video"></i></div>
          <span>Videos</span>
        </div>
        <div className="quick-action" data-page="sermons">
          <div className="quick-action-icon purple"><i className="fas fa-book-bible"></i></div>
          <span>Sermons</span>
        </div>
        <div className="quick-action" data-page="gallery">
          <div className="quick-action-icon green"><i className="fas fa-images"></i></div>
          <span>Gallery</span>
        </div>
      </div>
    </>
  );
}
