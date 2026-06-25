"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface NavTab {
  tab: string;
  icon: string;
  label: string;
  showBadge?: boolean;
}

const tabs: NavTab[] = [
  { tab: "dashboard", icon: "fa-chart-line", label: "Dashboard" },
  { tab: "content", icon: "fa-photo-film", label: "Content" },
  { tab: "members", icon: "fa-users", label: "Members", showBadge: true },
  { tab: "accounts", icon: "fa-user-shield", label: "Accounts" },
  { tab: "radio", icon: "fa-tower-broadcast", label: "Radio" },
  { tab: "video", icon: "fa-video", label: "Video" },
];

const tabRoutes: Record<string, string> = {
  dashboard: "/admin",
  content: "/admin/content",
  members: "/admin/members",
  accounts: "/admin/accounts",
  radio: "/admin/radio",
  video: "/admin/video",
};

export default function AdminBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const cleanupRef = useRef<(() => void) | null>(null);

  const activeTab = Object.entries(tabRoutes).find(
    ([, route]) => pathname === route
  )?.[0] || "dashboard";

  useEffect(() => {
    const navItems = document.querySelectorAll<HTMLElement>(".admin-nav-item");
    const handlers: (() => void)[] = [];

    navItems.forEach((item) => {
      const handler = () => {
        const tab = item.dataset.tab;
        const route = tabRoutes[tab || ""];
        if (route) router.push(route);
      };
      item.addEventListener("click", handler);
      handlers.push(() => item.removeEventListener("click", handler));
    });

    cleanupRef.current = () => handlers.forEach((h) => h());
    return () => cleanupRef.current?.();
  }, [router]);

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.tab}
          className={`admin-nav-item nav-item${tab.tab === activeTab ? " active" : ""}`}
          data-tab={tab.tab}
        >
          <i className={`fas ${tab.icon}`}></i>
          <span>{tab.label}</span>
          {tab.showBadge && <span className="nav-badge"></span>}
        </button>
      ))}
    </nav>
  );
}
