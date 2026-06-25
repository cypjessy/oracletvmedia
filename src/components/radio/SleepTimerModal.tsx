"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import { scheduleLocalNotification, cancelLocalNotification } from "@/lib/notifications";

const activeTimerRef: { current: string | null } = { current: null };

export { activeTimerRef };

export default function SleepTimerModal() {
  const { showToast } = useToast();
  const currentIdRef = useRef<string | null>(null);

  useEffect(() => {
    const modal = document.getElementById("timerModal");
    const confirmBtn = document.getElementById("timerConfirm");
    const options = document.querySelectorAll(".timer-option");

    const overlayHandler = (e: MouseEvent) => {
      if (e.target === modal) {
        modal?.classList.remove("active");
        document.body.style.overflow = "";
      }
    };
    modal?.addEventListener("click", overlayHandler);

    options.forEach((opt) => {
      opt.addEventListener("click", () => {
        options.forEach((o) => o.classList.remove("selected"));
        opt.classList.add("selected");
      });
    });

    const confirmHandler = async () => {
      const selected = document.querySelector(".timer-option.selected");
      const time = (selected as HTMLElement)?.dataset.time;
      modal?.classList.remove("active");
      document.body.style.overflow = "";

      // Cancel any existing timer
      if (activeTimerRef.current) {
        await cancelLocalNotification(activeTimerRef.current);
      }

      if (time === "off") {
        showToast("Sleep Timer", "Sleep timer turned off", "info", 2500);
        activeTimerRef.current = null;
      } else {
        const minutes = parseInt(time || "30");
        const id = await scheduleLocalNotification(
          "Sleep Timer Ended",
          "The radio sleep timer has ended. Tap to restart.",
          { in: minutes * 60 },
          { type: "sleep_timer" }
        );
        if (id) {
          currentIdRef.current = id;
          activeTimerRef.current = id;
          showToast("Sleep Timer Set", `Radio will stop in ${minutes} minutes`, "success", 2500);
        } else {
          showToast("Timer Error", "Could not set sleep timer", "error", 2500);
        }
      }
    };
    confirmBtn?.addEventListener("click", confirmHandler);

    return () => {
      modal?.removeEventListener("click", overlayHandler);
      confirmBtn?.removeEventListener("click", confirmHandler);
    };
  }, [showToast]);

  return (
    <div className="modal-overlay" id="timerModal">
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div className="modal-header">
          <h2>Sleep Timer</h2>
        </div>
        <div className="timer-options">
          <div className="timer-option" data-time="15"><span>15 minutes</span><i className="fas fa-check"></i></div>
          <div className="timer-option" data-time="30"><span>30 minutes</span><i className="fas fa-check"></i></div>
          <div className="timer-option selected" data-time="45"><span>45 minutes</span><i className="fas fa-check"></i></div>
          <div className="timer-option" data-time="60"><span>1 hour</span><i className="fas fa-check"></i></div>
          <div className="timer-option" data-time="off"><span>Off</span><i className="fas fa-check"></i></div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" id="timerConfirm">Set Timer</button>
        </div>
      </div>
    </div>
  );
}
