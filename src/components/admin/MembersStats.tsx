"use client";

import { useEffect, useRef } from "react";

interface StatPill {
  icon: string;
  iconClass: string;
  value: string;
  label: string;
  active?: boolean;
}

const stats: StatPill[] = [
  { icon: "fa-users", iconClass: "all", value: "248", label: "All", active: true },
  { icon: "fa-clock", iconClass: "pending", value: "12", label: "Pending" },
  { icon: "fa-circle-check", iconClass: "active", value: "186", label: "Active" },
  { icon: "fa-user-plus", iconClass: "new", value: "8", label: "New" },
];

export default function MembersStats() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const pills = document.querySelectorAll<HTMLElement>(".stat-pill");
    const handlers: (() => void)[] = [];

    pills.forEach((pill) => {
      const handler = function (this: HTMLElement) {
        pills.forEach((p) => p.classList.remove("active"));
        this.classList.add("active");
        const label = this.querySelector(".stat-pill-label")?.textContent || "";
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: "Filter", message: `Showing ${label} members`, type: "info", duration: 2000 },
          })
        );
      };
      pill.addEventListener("click", handler as EventListener);
      handlers.push(() => pill.removeEventListener("click", handler as EventListener));
    });

    cleanupRef.current = () => handlers.forEach((h) => h());
    return () => cleanupRef.current?.();
  }, []);

  return (
    <div className="stats-bar">
      {stats.map((stat) => (
        <div key={stat.label} className={`stat-pill${stat.active ? " active" : ""}`}>
          <div className={`stat-pill-icon ${stat.iconClass}`}><i className={`fas ${stat.icon}`}></i></div>
          <div className="stat-pill-info">
            <span className="stat-pill-value">{stat.value}</span>
            <span className="stat-pill-label">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
