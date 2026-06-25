"use client";

import { useEffect, useRef } from "react";

interface ModItem {
  title: string;
  uploadedBy: string;
  time: string;
  image: string;
}

const items: ModItem[] = [
  { title: "Youth Camp Group Photo", uploadedBy: "Jane Muthoni", time: "2 hours ago", image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&h=200&fit=crop" },
  { title: "Community Outreach Day", uploadedBy: "Peter Ochieng", time: "5 hours ago", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop" },
  { title: "Bible Study Session", uploadedBy: "Sarah Wanjiku", time: "1 day ago", image: "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=200&h=200&fit=crop" },
  { title: "Sunday Worship Crowd", uploadedBy: "James Mwangi", time: "1 day ago", image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=200&h=200&fit=crop" },
  { title: "Choir Practice Session", uploadedBy: "Michael Kimani", time: "2 days ago", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" },
  { title: "Children's Ministry Activity", uploadedBy: "Grace Team", time: "2 days ago", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop" },
];

export default function ModerationList() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const modBtns = document.querySelectorAll<HTMLElement>(".mod-btn");
    const handlers: (() => void)[] = [];

    modBtns.forEach((btn) => {
      const handler = (e: Event) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const item = btn.closest(".mod-item") as HTMLElement | null;
        const title = item?.querySelector(".mod-title")?.textContent || "";

        if (action === "approve") {
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: { title: "Approved", message: `${title} has been published`, type: "success", duration: 3000 },
            })
          );
        } else {
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: { title: "Rejected", message: `${title} has been rejected`, type: "error", duration: 3000 },
            })
          );
        }

        if (item) {
          item.style.opacity = "0.3";
          setTimeout(() => item.remove(), 500);
        }
      };
      btn.addEventListener("click", handler);
      handlers.push(() => btn.removeEventListener("click", handler));
    });

    cleanupRef.current = () => handlers.forEach((h) => h());
    return () => cleanupRef.current?.();
  }, []);

  return (
    <div className="moderation-list">
      {items.map((item, idx) => (
        <div className="mod-item" key={idx}>
          <div className="mod-thumb"><img src={item.image} alt="Pending" /></div>
          <div className="mod-info">
            <div className="mod-title">{item.title}</div>
            <div className="mod-meta">Uploaded by {item.uploadedBy} · {item.time}</div>
            <div className="mod-actions">
              <button className="mod-btn approve" data-action="approve"><i className="fas fa-check"></i> Approve</button>
              <button className="mod-btn reject" data-action="reject"><i className="fas fa-xmark"></i> Reject</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
