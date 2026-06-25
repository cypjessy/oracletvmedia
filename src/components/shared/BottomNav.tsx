"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface BottomNavProps {
  activeTab: "home" | "radio" | "watch" | "gallery";
  showWatchBadge?: boolean;
  showLiveBadge?: boolean;
}

export default function BottomNav({ activeTab, showWatchBadge = false, showLiveBadge = false }: BottomNavProps) {
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const items = document.querySelectorAll(".nav-item");
    const handler = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      const tab = target.dataset.tab;
      if (tab === activeTab) return;
      if (tab === "home") router.push("/dashboard");
      else if (tab === "radio") router.push("/radio");
      else if (tab === "watch") router.push("/watch");
      else if (tab === "gallery") router.push("/gallery");

      else {
        showToast(
          "Coming Soon",
          `${(tab || "").charAt(0).toUpperCase() + (tab || "").slice(1)} page is under development`,
          "info",
          2500
        );
      }
    };
    items.forEach((item) => item.addEventListener("click", handler));
    return () => items.forEach((item) => item.removeEventListener("click", handler));
  }, [router, showToast, activeTab]);

  return (
    <>
      <style>{`
        .nav-live-dot { position: absolute; top: 1px; right: 8px; width: 8px; height: 8px; background: #EF4444; border-radius: 50%; border: 2px solid var(--bg,#0F0F0F); animation: navLivePulse 1.5s ease-in-out infinite; }
        @keyframes navLivePulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.3); opacity: 0.6; } }
      `}</style>
    <nav className="bottom-nav">
      <button className={`nav-item${activeTab === "home" ? " active" : ""}`} data-tab="home">
        <i className="fas fa-house"></i>
        <span>Home</span>
      </button>
      <button className={`nav-item${activeTab === "radio" ? " active" : ""}`} data-tab="radio">
        <i className="fas fa-radio"></i>
        <span>Radio</span>
      </button>
      <button className={`nav-item${activeTab === "watch" ? " active" : ""}`} data-tab="watch">
        <i className="fas fa-video"></i>
        <span>Watch</span>
        {showWatchBadge && <span className="nav-badge"></span>}
        {showLiveBadge && <span className="nav-live-dot"></span>}
      </button>
      <button className={`nav-item${activeTab === "gallery" ? " active" : ""}`} data-tab="gallery">
        <i className="fas fa-images"></i>
        <span>Gallery</span>
      </button>

    </nav>
    </>
  );
}
