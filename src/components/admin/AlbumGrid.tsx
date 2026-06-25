"use client";

import { useEffect, useRef } from "react";

interface Album {
  name: string;
  album: string;
  count: number;
  updated: string;
  image: string;
}

const albums: Album[] = [
  { name: "Worship", album: "worship", count: 86, updated: "2 days ago", image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&h=400&fit=crop" },
  { name: "Events", album: "events", count: 64, updated: "5 days ago", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=400&fit=crop" },
  { name: "Baptisms", album: "baptism", count: 32, updated: "1 week ago", image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=400&fit=crop" },
  { name: "Youth", album: "youth", count: 42, updated: "3 days ago", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop" },
  { name: "Outreach", album: "outreach", count: 24, updated: "2 weeks ago", image: "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400&h=400&fit=crop" },
  { name: "Facility", album: "facility", count: 18, updated: "1 month ago", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop" },
];

export default function AlbumGrid() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".album-card");
    const selects = document.querySelectorAll<HTMLElement>(".album-select");
    const handlers: (() => void)[] = [];

    // Album card clicks (open album)
    cards.forEach((card) => {
      const handler = () => {
        const selectMode = document.querySelectorAll<HTMLElement>(".album-select").length > 0 &&
          document.querySelector<HTMLElement>(".album-select")?.style.display === "flex";
        if (selectMode) return;
        const name = card.querySelector(".album-name")?.textContent || "";
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: "Opening Album", message: name, type: "info", duration: 2000 },
          })
        );
      };
      card.addEventListener("click", handler);
      handlers.push(() => card.removeEventListener("click", handler));
    });

    // Album selection checkboxes
    selects.forEach((el) => {
      const handler = (e: Event) => {
        e.stopPropagation();
        const isVisible = el.style.display !== "none";
        if (!isVisible) return;
        el.classList.toggle("selected");
        const album = el.closest(".album-card")?.getAttribute("data-album") || "";
        // Dispatch custom event for bulk bar to track
        const isSelected = el.classList.contains("selected");
        window.dispatchEvent(
          new CustomEvent("item-selected", {
            detail: { id: album, selected: isSelected, type: "album" },
          })
        );
      };
      el.addEventListener("click", handler);
      handlers.push(() => el.removeEventListener("click", handler));
    });

    cleanupRef.current = () => handlers.forEach((h) => h());
    return () => cleanupRef.current?.();
  }, []);

  return (
    <div className="albums-grid">
      {albums.map((album) => (
        <div className="album-card" key={album.album} data-album={album.album}>
          <div className="album-cover">
            <img src={album.image} alt={album.name} />
            <span className="album-count">{album.count}</span>
            <div className="album-select" style={{ display: "none" }}></div>
          </div>
          <div className="album-info">
            <div className="album-name">{album.name}</div>
            <div className="album-meta">Last updated {album.updated}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
