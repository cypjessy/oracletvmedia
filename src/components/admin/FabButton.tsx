"use client";

import { useEffect, useRef } from "react";

export default function FabButton() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const fab = document.getElementById("fabBtn");
    const handleClick = () => {
      document.getElementById("createAlbumModal")?.classList.add("active");
      document.body.style.overflow = "hidden";
    };
    fab?.addEventListener("click", handleClick);
    cleanupRef.current = () => fab?.removeEventListener("click", handleClick);
    return () => cleanupRef.current?.();
  }, []);

  return (
    <button className="fab" id="fabBtn"><i className="fas fa-plus"></i></button>
  );
}
