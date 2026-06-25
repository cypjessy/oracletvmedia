"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

export default function RadioHeader() {
  const { showToast } = useToast();

  useEffect(() => {
    const backBtn = document.getElementById("radioBackBtn");
    const timerBtn = document.getElementById("radioTimerBtn");

    const handleBack = () => showToast("Navigation", "Going back...", "info", 2000);
    const handleTimer = () => {
      document.getElementById("timerModal")?.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    backBtn?.addEventListener("click", handleBack);
    timerBtn?.addEventListener("click", handleTimer);

    return () => {
      backBtn?.removeEventListener("click", handleBack);
      timerBtn?.removeEventListener("click", handleTimer);
    };
  }, [showToast]);

  return (
    <header className="header">
      <button className="header-back" id="radioBackBtn">
        <i className="fas fa-arrow-left"></i>
      </button>
      <h1 className="header-title">Live Radio</h1>
      <button className="header-action" id="radioTimerBtn">
        <i className="fas fa-clock"></i>
      </button>
    </header>
  );
}
