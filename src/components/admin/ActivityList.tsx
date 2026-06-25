"use client";

import { useEffect, useRef } from "react";

const activities = [
  { icon: "fa-user-plus", color: "gold", title: "New Member Registered", desc: "Sarah Wanjiku joined the church", time: "12 min ago", badge: "New", badgeClass: "new" },
  { icon: "fa-hand-holding-heart", color: "green", title: "Donation Received", desc: "KSh 25,000 tithe from John Mwangi", time: "1 hour ago", badge: "", badgeClass: "" },
  { icon: "fa-video", color: "purple", title: "Sermon Uploaded", desc: "\"Walking in Faith\" — 42 min", time: "3 hours ago", badge: "", badgeClass: "" },
  { icon: "fa-calendar-check", color: "blue", title: "Event Created", desc: "Youth Conference — June 28-30", time: "5 hours ago", badge: "", badgeClass: "" },
  { icon: "fa-tower-broadcast", color: "gold", title: "Radio Broadcast Ended", desc: "Morning Devotion — 2h 24m duration", time: "6 hours ago", badge: "", badgeClass: "" },
  { icon: "fa-triangle-exclamation", color: "red", title: "Stream Quality Alert", desc: "Bitrate dropped to 96kbps (resolved)", time: "8 hours ago", badge: "", badgeClass: "" },
];

export default function ActivityList() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".activity-item");
    const handlers: (() => void)[] = [];

    items.forEach((item) => {
      const handleClick = () => {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: "Activity", message: "Viewing activity details...", type: "info", duration: 2000 },
          })
        );
      };
      handlers.push(handleClick);
      item.addEventListener("click", handleClick);
    });

    cleanupRef.current = () => {
      items.forEach((item, i) => {
        item.removeEventListener("click", handlers[i]);
      });
    };

    return () => cleanupRef.current?.();
  }, []);

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">Recent Activity</h2>
        <button className="section-see-all">See All <i className="fas fa-chevron-right" style={{ fontSize: "10px" }}></i></button>
      </div>
      <div className="activity-list">
        {activities.map((act, i) => (
          <div className="activity-item" key={i}>
            <div className={`activity-icon ${act.color}`}><i className={`fas ${act.icon}`}></i></div>
            <div className="activity-content">
              <div className="activity-title">{act.title}</div>
              <div className="activity-desc">{act.desc}</div>
              <div className="activity-time">{act.time}</div>
            </div>
            {act.badge && (
              <div className={`activity-badge ${act.badgeClass}`}>{act.badge}</div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
