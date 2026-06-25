"use client";

export default function SermonCarousel() {
  return (
    <>
      <div className="section-header-inline" style={{ padding: "0 16px 12px" }}>
        <h2 className="section-title">Latest Sermons</h2>
        <button className="section-link">
          See All <i className="fas fa-chevron-right"></i>
        </button>
      </div>
      <div className="h-scroll">
        <div className="sermon-card">
          <div className="sermon-thumb">
            <img src="https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=225&fit=crop" alt="Sermon" />
            <span className="sermon-duration">42:15</span>
            <div className="sermon-play-hover"><i className="fas fa-play"></i></div>
          </div>
          <div className="sermon-body">
            <div className="sermon-title">Walking in Faith Through the Storm</div>
            <div className="sermon-meta">
              <span>Pastor James Mwangi</span>
              <span className="dot">·</span>
              <span>Jun 22</span>
            </div>
          </div>
        </div>
        <div className="sermon-card">
          <div className="sermon-thumb">
            <img src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=225&fit=crop" alt="Sermon" />
            <span className="sermon-duration">38:42</span>
            <div className="sermon-play-hover"><i className="fas fa-play"></i></div>
          </div>
          <div className="sermon-body">
            <div className="sermon-title">The Power of Community</div>
            <div className="sermon-meta">
              <span>Pastor Sarah Wanjiku</span>
              <span className="dot">·</span>
              <span>Jun 15</span>
            </div>
          </div>
        </div>
        <div className="sermon-card">
          <div className="sermon-thumb">
            <img src="https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400&h=225&fit=crop" alt="Sermon" />
            <span className="sermon-duration">55:08</span>
            <div className="sermon-play-hover"><i className="fas fa-play"></i></div>
          </div>
          <div className="sermon-body">
            <div className="sermon-title">Building a Legacy of Faith</div>
            <div className="sermon-meta">
              <span>Bishop Peter Ochieng</span>
              <span className="dot">·</span>
              <span>Jun 8</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
