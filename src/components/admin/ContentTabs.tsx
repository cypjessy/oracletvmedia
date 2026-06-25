"use client";

import { useEffect, useRef } from "react";

export default function ContentTabs() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const tabs = document.querySelectorAll<HTMLElement>(".tab");
    const tabContents: Record<string, HTMLElement | null> = {
      albums: document.getElementById("albumsTab"),
      photos: document.getElementById("photosTab"),
      moderation: document.getElementById("moderationTab"),
    };
    const handlers: (() => void)[] = [];

    tabs.forEach((tab) => {
      const handler = () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        Object.values(tabContents).forEach((c) => {
          if (c) c.style.display = "none";
        });
        const key = tab.dataset.tab || "";
        const target = tabContents[key];
        if (target) target.style.display = "block";
        const contentScroll = document.getElementById("contentScroll");
        if (contentScroll) contentScroll.scrollTop = 0;
      };
      tab.addEventListener("click", handler);
      handlers.push(() => tab.removeEventListener("click", handler));
    });

    cleanupRef.current = () => handlers.forEach((h) => h());
    return () => cleanupRef.current?.();
  }, []);

  return (
    <div className="tabs-container">
      <div className="tabs">
        <button className="tab active" data-tab="albums"><i className="fas fa-folder"></i> Albums</button>
        <button className="tab" data-tab="photos"><i className="fas fa-images"></i> All Photos</button>
        <button className="tab" data-tab="moderation"><i className="fas fa-shield-halved"></i> Moderation <span className="badge">6</span></button>
      </div>
    </div>
  );
}
