"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function ContentTopBar() {
  const router = useRouter();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const backBtn = document.getElementById("contentBackBtn");
    const moreBtn = document.getElementById("contentMoreBtn");

    const handleBack = () => {
      router.push("/admin");
    };

    const handleMore = () => {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Options", message: "Sort, Filter, Export...", type: "info", duration: 2000 },
        })
      );
    };

    backBtn?.addEventListener("click", handleBack);
    moreBtn?.addEventListener("click", handleMore);

    cleanupRef.current = () => {
      backBtn?.removeEventListener("click", handleBack);
      moreBtn?.removeEventListener("click", handleMore);
    };

    return () => cleanupRef.current?.();
  }, [router]);

  return (
    <header className="header">
      <button className="header-back" id="contentBackBtn"><i className="fas fa-arrow-left"></i></button>
      <h1 className="header-title">Gallery Manager</h1>
      <div className="header-actions">
        <button className="header-btn" id="selectBtn"><i className="fas fa-check-square"></i></button>
        <button className="header-btn" id="contentMoreBtn"><i className="fas fa-ellipsis-vertical"></i></button>
      </div>
    </header>
  );
}
