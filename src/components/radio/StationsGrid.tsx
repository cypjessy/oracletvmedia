"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

export default function StationsGrid() {
  const { showToast } = useToast();

  useEffect(() => {
    const cards = document.querySelectorAll(".station-card");
    const handler = (e: Event) => {
      const card = e.currentTarget as HTMLElement;
      document.querySelectorAll(".station-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      const name = card.querySelector(".station-name")?.textContent || "";
      showToast("Station Changed", `Switched to ${name}`, "success", 2500);
    };
    cards.forEach((c) => c.addEventListener("click", handler));
    return () => cards.forEach((c) => c.removeEventListener("click", handler));
  }, [showToast]);

  return (
    <div className="tab-content" id="stationsTab" style={{ display: "none" }}>
      <div className="stations-grid">
        <div className="station-card active">
          <div className="station-icon gold"><i className="fas fa-church"></i></div>
          <div className="station-name">Main Worship</div>
          <div className="station-desc">Live services &amp; sermons</div>
          <div className="station-live"><span></span>Live</div>
        </div>
        <div className="station-card">
          <div className="station-icon blue"><i className="fas fa-music"></i></div>
          <div className="station-name">Praise &amp; Worship</div>
          <div className="station-desc">Gospel music 24/7</div>
        </div>
        <div className="station-card">
          <div className="station-icon purple"><i className="fas fa-book-open"></i></div>
          <div className="station-name">Bible Study</div>
          <div className="station-desc">Teaching &amp; discipleship</div>
        </div>
        <div className="station-card">
          <div className="station-icon green"><i className="fas fa-child"></i></div>
          <div className="station-name">Youth Radio</div>
          <div className="station-desc">Youth programs &amp; music</div>
        </div>
        <div className="station-card">
          <div className="station-icon gold"><i className="fas fa-hands-praying"></i></div>
          <div className="station-name">Prayer Line</div>
          <div className="station-desc">Intercession &amp; prayers</div>
        </div>
        <div className="station-card">
          <div className="station-icon blue"><i className="fas fa-microphone-lines"></i></div>
          <div className="station-name">Talk Radio</div>
          <div className="station-desc">Discussions &amp; interviews</div>
        </div>
      </div>
    </div>
  );
}
