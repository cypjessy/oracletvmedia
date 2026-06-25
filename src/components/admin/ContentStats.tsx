"use client";

import { useEffect, useRef } from "react";

interface StatPill {
  value: string;
  label: string;
}

const stats: StatPill[] = [
  { value: "248", label: "Total Photos" },
  { value: "12", label: "Albums" },
  { value: "6", label: "Pending" },
];

export default function ContentStats() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const pills = document.querySelectorAll<HTMLElement>(".stat-pill");
    const handlers: (() => void)[] = [];

    pills.forEach((pill) => {
      const handler = () => {
        const label = pill.querySelector(".stat-pill-label")?.textContent || "";
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: label, message: `Opening ${label.toLowerCase()}...`, type: "info", duration: 2000 },
          })
        );
      };
      pill.addEventListener("click", handler);
      handlers.push(() => pill.removeEventListener("click", handler));
    });

    cleanupRef.current = () => handlers.forEach((h) => h());
    return () => cleanupRef.current?.();
  }, []);

  return (
    <div className="stats-bar">
      {stats.map((stat) => (
        <div className="stat-pill" key={stat.label}>
          <div className="stat-pill-value">{stat.value}</div>
          <div className="stat-pill-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
