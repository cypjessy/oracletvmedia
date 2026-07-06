"use client";

import { useEffect, useState } from "react";
import { getGalleryPhotos } from "@/lib/content";
import type { GalleryPhoto } from "@/lib/content";

const STYLES = {
  wrap: {
    position: "relative" as const,
    width: "100%" as const,
    aspectRatio: "4/3" as const,
    overflow: "hidden" as const,
    background: "var(--surface, #1A1A1A)",
    borderRadius: "var(--radius-lg, 20px)",
    border: "1px solid var(--border, #2A2A2A)",
  },
  img: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%" as const,
    height: "100%" as const,
    objectFit: "cover" as const,
    transition: "opacity 0.8s ease",
  },
  dots: {
    position: "absolute" as const,
    bottom: 10,
    left: "50%" as const,
    transform: "translateX(-50%)",
    display: "flex" as const,
    gap: 6,
    zIndex: 2,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    background: "rgba(255,255,255,0.4)",
    transition: "all 0.3s",
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    background: "#fff",
    transition: "all 0.3s",
  },
  skel: {
    width: "100%" as const,
    aspectRatio: "4/3" as const,
    borderRadius: "var(--radius-lg, 20px)",
    background: "var(--surface, #1A1A1A)",
    overflow: "hidden" as const,
    border: "1px solid var(--border, #2A2A2A)",
  },
  empty: {
    width: "100%" as const,
    aspectRatio: "4/3" as const,
    borderRadius: "var(--radius-lg, 20px)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    background: "var(--surface, #1A1A1A)",
    color: "var(--text-tertiary, #6B6B6B)",
    fontSize: 42,
    border: "1px solid var(--border, #2A2A2A)",
  },
};

function AlbumCarousel() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGalleryPhotos()
      .then((data) => {
        setPhotos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const display = photos.slice(0, 10);

  useEffect(() => {
    if (display.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % display.length), 3000);
    return () => clearInterval(id);
  }, [display.length]);

  if (loading) {
    return (
      <div style={STYLES.skel}>
        <div className="skel" style={{ width: "100%", height: "100%" }} />
      </div>
    );
  }

  if (display.length === 0) {
    return (
      <div style={STYLES.empty}>
        <i className="fas fa-image"></i>
      </div>
    );
  }

  return (
    <div style={STYLES.wrap}>
      {display.map((p, i) => (
        <img
          key={p.id}
          src={p.cdnUrl}
          alt=""
          style={{ ...STYLES.img, opacity: i === idx ? 1 : 0 }}
          loading="lazy"
        />
      ))}
      {display.length > 1 && (
        <div style={STYLES.dots}>
          {display.map((_, i) => (
            <div
              key={i}
              style={i === idx ? STYLES.dotActive : { ...STYLES.dot, width: 6 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AlbumCarousel;
