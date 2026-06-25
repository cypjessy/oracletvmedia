"use client";

export default function GalleryGrid() {
  return (
    <>
      <div className="section-header">
        <h2 className="section-title">Recent Moments</h2>
        <button className="section-see-all">
          See All <i className="fas fa-chevron-right" style={{ fontSize: "10px" }}></i>
        </button>
      </div>
      <div className="gallery-grid">
        <div className="gallery-item"><img src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop" alt="Gallery" /></div>
        <div className="gallery-item"><img src="https://images.unsplash.com/photo-1507692049790-de58290a4334?w=200&h=200&fit=crop" alt="Gallery" /></div>
        <div className="gallery-item"><img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop" alt="Gallery" /></div>
        <div className="gallery-item"><img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" alt="Gallery" /></div>
        <div className="gallery-item"><img src="https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=200&h=200&fit=crop" alt="Gallery" /></div>
        <div className="gallery-item more"><span>+48</span><small>more</small></div>
      </div>
    </>
  );
}
