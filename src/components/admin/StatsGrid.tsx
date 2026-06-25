"use client";

import { useEffect, useRef } from "react";

interface StatCard {
  id: string;
  color: "gold" | "blue" | "purple" | "green";
  icon: string;
  value: string;
  label: string;
  change: string;
  changeIcon: string;
  changeDirection: "up" | "down";
}

const stats: StatCard[] = [
  { id: "membersCard", color: "gold", icon: "fa-users", value: "1,247", label: "Total Members", change: "12% this month", changeIcon: "fa-arrow-up", changeDirection: "up" },
  { id: "listenersCard", color: "blue", icon: "fa-headphones", value: "342", label: "Live Listeners", change: "28% now", changeIcon: "fa-arrow-up", changeDirection: "up" },
  { id: "viewsCard", color: "purple", icon: "fa-eye", value: "8.5K", label: "Video Views", change: "5% this week", changeIcon: "fa-arrow-up", changeDirection: "up" },
  { id: "givingCard", color: "green", icon: "fa-hand-holding-heart", value: "KSh 245K", label: "Giving This Month", change: "18% vs last", changeIcon: "fa-arrow-up", changeDirection: "up" },
];

export default function StatsGrid() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>(".stat-card");
    const handlers: (() => void)[] = [];

    cards.forEach((card) => {
      const handler = () => {
        const label = card.querySelector(".stat-label")?.textContent || "";
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: label, message: `Opening ${label.toLowerCase()} details...`, type: "info", duration: 2500 },
          })
        );
      };
      card.addEventListener("click", handler);
      handlers.push(() => card.removeEventListener("click", handler));
    });

    cleanupRef.current = () => handlers.forEach((h) => h());
    return () => cleanupRef.current?.();
  }, []);

  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div key={stat.id} className={`stat-card ${stat.color}`} id={stat.id}>
          <div className={`stat-icon ${stat.color}`}><i className={`fas ${stat.icon}`}></i></div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
          <span className={`stat-change ${stat.changeDirection}`}>
            <i className={`fas ${stat.changeIcon}`} style={{ fontSize: "10px" }}></i> {stat.change}
          </span>
        </div>
      ))}
    </div>
  );
}
