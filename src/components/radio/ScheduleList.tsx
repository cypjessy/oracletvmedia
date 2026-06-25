"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

export default function ScheduleList() {
  const { showToast } = useToast();

  useEffect(() => {
    const items = document.querySelectorAll(".schedule-item");
    const handler = (e: Event) => {
      const title = (e.currentTarget as HTMLElement).querySelector(".schedule-title")?.textContent || "";
      showToast("Schedule", `${title} — Set reminder`, "info", 2500);
    };
    items.forEach((i) => i.addEventListener("click", handler));
    return () => items.forEach((i) => i.removeEventListener("click", handler));
  }, [showToast]);

  return (
    <div className="tab-content" id="scheduleTab">
      <div className="schedule-list">
        <div className="schedule-item">
          <div className="schedule-time"><span className="time">6:00</span><span className="ampm">AM</span></div>
          <div className="schedule-line active"></div>
          <div className="schedule-info">
            <div className="schedule-title">Morning Devotion</div>
            <div className="schedule-host">Pastor James Mwangi</div>
          </div>
          <span className="schedule-status live">Live</span>
        </div>
        <div className="schedule-item">
          <div className="schedule-time"><span className="time">8:00</span><span className="ampm">AM</span></div>
          <div className="schedule-line"></div>
          <div className="schedule-info">
            <div className="schedule-title">Sunday Worship Service</div>
            <div className="schedule-host">Worship Team &amp; Bishop Ochieng</div>
          </div>
          <span className="schedule-status upcoming">Upcoming</span>
        </div>
        <div className="schedule-item">
          <div className="schedule-time"><span className="time">10:30</span><span className="ampm">AM</span></div>
          <div className="schedule-line"></div>
          <div className="schedule-info">
            <div className="schedule-title">Youth Hour</div>
            <div className="schedule-host">Pastor Sarah Wanjiku</div>
          </div>
          <span className="schedule-status upcoming">Upcoming</span>
        </div>
        <div className="schedule-item">
          <div className="schedule-time"><span className="time">12:00</span><span className="ampm">PM</span></div>
          <div className="schedule-line"></div>
          <div className="schedule-info">
            <div className="schedule-title">Gospel Mix Hour</div>
            <div className="schedule-host">DJ Faith &amp; Team</div>
          </div>
          <span className="schedule-status upcoming">Upcoming</span>
        </div>
        <div className="schedule-item">
          <div className="schedule-time"><span className="time">3:00</span><span className="ampm">PM</span></div>
          <div className="schedule-line"></div>
          <div className="schedule-info">
            <div className="schedule-title">Bible Study Live</div>
            <div className="schedule-host">Elder Michael Kimani</div>
          </div>
          <span className="schedule-status upcoming">Upcoming</span>
        </div>
        <div className="schedule-item">
          <div className="schedule-time"><span className="time">6:00</span><span className="ampm">PM</span></div>
          <div className="schedule-line"></div>
          <div className="schedule-info">
            <div className="schedule-title">Evening Prayer &amp; Worship</div>
            <div className="schedule-host">Worship Team</div>
          </div>
          <span className="schedule-status upcoming">Upcoming</span>
        </div>
        <div className="schedule-item">
          <div className="schedule-time"><span className="time">9:00</span><span className="ampm">PM</span></div>
          <div className="schedule-line"></div>
          <div className="schedule-info">
            <div className="schedule-title">Night Prayers</div>
            <div className="schedule-host">Intercessory Team</div>
          </div>
          <span className="schedule-status upcoming">Upcoming</span>
        </div>
      </div>
    </div>
  );
}
