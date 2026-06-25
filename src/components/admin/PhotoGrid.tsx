"use client";

import { useEffect, useRef } from "react";

interface PhotoItem {
  id: string;
  src: string;
  status: "approved" | "pending";
}

const photos: PhotoItem[] = [
  { id: "1", src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop", status: "approved" },
  { id: "2", src: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=300&h=300&fit=crop", status: "approved" },
  { id: "3", src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop", status: "approved" },
  { id: "4", src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&h=300&fit=crop", status: "approved" },
  { id: "5", src: "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=300&h=300&fit=crop", status: "approved" },
  { id: "6", src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=300&h=300&fit=crop", status: "pending" },
  { id: "7", src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=300&fit=crop", status: "approved" },
  { id: "8", src: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=300&h=300&fit=crop", status: "approved" },
  { id: "9", src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop", status: "pending" },
];

export default function PhotoGrid() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".photo-item");
    const selects = document.querySelectorAll<HTMLElement>(".photo-select");
    const handlers: (() => void)[] = [];

    // Photo item clicks (open editor)
    items.forEach((item) => {
      const handler = () => {
        const firstSelect = item.querySelector(".photo-select");
        const isSelectVisible = firstSelect && firstSelect instanceof HTMLElement && firstSelect.style.display === "flex";
        if (isSelectVisible) return;
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: "Photo", message: "Opening photo editor...", type: "info", duration: 2000 },
          })
        );
      };
      item.addEventListener("click", handler);
      handlers.push(() => item.removeEventListener("click", handler));
    });

    // Photo selection checkboxes
    selects.forEach((el) => {
      const handler = (e: Event) => {
        e.stopPropagation();
        const isVisible = (el as HTMLElement).style.display !== "none";
        if (!isVisible) return;
        el.classList.toggle("selected");
        const photo = el.closest(".photo-item")?.getAttribute("data-photo") || "";
        const isSelected = el.classList.contains("selected");
        window.dispatchEvent(
          new CustomEvent("item-selected", {
            detail: { id: photo, selected: isSelected, type: "photo" },
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
    <div className="photos-grid">
      {photos.map((photo) => (
        <div className="photo-item" key={photo.id} data-photo={photo.id}>
          <img src={photo.src} alt="Photo" />
          <div className="photo-select" style={{ display: "none" }}></div>
          <div className={`photo-status ${photo.status}`}></div>
        </div>
      ))}
    </div>
  );
}
