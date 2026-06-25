"use client";

import { useEffect, useRef } from "react";

export default function RadioStatus() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stopBtn = document.getElementById("stopRadioBtn");
    const scheduleBtn = document.getElementById("scheduleRadioBtn");

    const handleStop = (e: Event) => {
      e.stopPropagation();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Radio Stopped", message: "Live broadcast has been stopped", type: "error", duration: 3000 },
        })
      );
    };

    const handleSchedule = (e: Event) => {
      e.stopPropagation();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Schedule", message: "Opening radio programming schedule...", type: "info", duration: 2500 },
        })
      );
    };

    stopBtn?.addEventListener("click", handleStop);
    scheduleBtn?.addEventListener("click", handleSchedule);

    cleanupRef.current = () => {
      stopBtn?.removeEventListener("click", handleStop);
      scheduleBtn?.removeEventListener("click", handleSchedule);
    };

    return () => cleanupRef.current?.();
  }, []);

  return (
    <div className="radio-status-section">
      <div className="radio-status-card">
        <div className="radio-status-header">
          <div className="radio-status-title">
            <div className="radio-status-dot"></div>
            <span>Live Radio</span>
          </div>
          <span className="radio-status-badge">On Air</span>
        </div>
        <div className="radio-status-body">
          <div className="radio-stat">
            <span className="radio-stat-value">342</span>
            <span className="radio-stat-label">Listeners</span>
          </div>
          <div className="radio-stat">
            <span className="radio-stat-value">1:24:30</span>
            <span className="radio-stat-label">Duration</span>
          </div>
          <div className="radio-stat">
            <span className="radio-stat-value">Morning Devotion</span>
            <span className="radio-stat-label">Current Show</span>
          </div>
          <div className="radio-controls">
            <button className="radio-ctrl-btn stop" id="stopRadioBtn"><i className="fas fa-stop"></i> Stop</button>
            <button className="radio-ctrl-btn schedule" id="scheduleRadioBtn"><i className="fas fa-calendar"></i> Schedule</button>
          </div>
        </div>
      </div>
    </div>
  );
}
