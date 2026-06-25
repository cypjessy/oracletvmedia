"use client";

import { useEffect, useRef } from "react";

interface QuickAction {
  action: string;
  icon: string;
  iconColor: string;
  label: string;
}

const actions: QuickAction[] = [
  { action: "upload-video", icon: "fa-video", iconColor: "blue", label: "Upload Video" },
  { action: "upload-sermon", icon: "fa-book-bible", iconColor: "purple", label: "Add Sermon" },
  { action: "upload-photo", icon: "fa-images", iconColor: "gold", label: "Add Photos" },
  { action: "create-event", icon: "fa-calendar-plus", iconColor: "green", label: "New Event" },
  { action: "send-notification", icon: "fa-bell", iconColor: "red", label: "Notify All" },
  { action: "view-reports", icon: "fa-chart-pie", iconColor: "gray", label: "Reports" },
];

const actionLabels: Record<string, string> = {
  "upload-video": "Upload Video",
  "upload-sermon": "Add Sermon",
  "upload-photo": "Add Photos",
  "create-event": "New Event",
  "send-notification": "Send Notification",
  "view-reports": "View Reports",
};

export default function QuickActionsGrid() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>(".quick-action-admin");
    const handlers: (() => void)[] = [];

    items.forEach((item) => {
      const handler = () => {
        const actionType = item.dataset.action || "";
        const label = actionLabels[actionType] || actionType;
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: label, message: `Opening ${label.toLowerCase()}...`, type: "info", duration: 2500 },
          })
        );
      };
      item.addEventListener("click", handler);
      handlers.push(() => item.removeEventListener("click", handler));
    });

    cleanupRef.current = () => handlers.forEach((h) => h());
    return () => cleanupRef.current?.();
  }, []);

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">Quick Actions</h2>
      </div>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <div key={action.action} className="quick-action-admin" data-action={action.action}>
            <div className={`icon ${action.iconColor}`}><i className={`fas ${action.icon}`}></i></div>
            <span>{action.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
