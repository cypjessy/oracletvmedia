"use client";

import { useEffect, useRef } from "react";

interface PendingMember {
  name: string;
  email: string;
  initials: string;
  color: string;
  time: string;
}

const pendingMembers: PendingMember[] = [
  { name: "Grace Wanjiku", email: "grace.w@email.com", initials: "GW", color: "#8B5CF6", time: "Requested 2h ago" },
  { name: "Peter Ochieng", email: "peter.o@email.com", initials: "PO", color: "#3B82F6", time: "Requested 5h ago" },
  { name: "Mary Njeri", email: "mary.n@email.com", initials: "MN", color: "#22C55E", time: "Requested 1d ago" },
];

export default function PendingApprovals() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const approveBtns = document.querySelectorAll<HTMLElement>(".member-action-btn.approve");
    const rejectBtns = document.querySelectorAll<HTMLElement>(".member-action-btn.reject");
    const handlers: (() => void)[] = [];

    approveBtns.forEach((btn) => {
      const handler = (e: Event) => {
        e.stopPropagation();
        const item = btn.closest<HTMLElement>(".member-item");
        const name = item?.dataset.name || "";
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: "Approved", message: `${name} has been approved`, type: "success", duration: 3000 },
          })
        );
        if (item) item.style.opacity = "0.5";
      };
      btn.addEventListener("click", handler);
      handlers.push(() => btn.removeEventListener("click", handler));
    });

    rejectBtns.forEach((btn) => {
      const handler = (e: Event) => {
        e.stopPropagation();
        const item = btn.closest<HTMLElement>(".member-item");
        const name = item?.dataset.name || "";
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: "Rejected", message: `${name}'s request has been declined`, type: "error", duration: 3000 },
          })
        );
        if (item) item.style.opacity = "0.3";
      };
      btn.addEventListener("click", handler);
      handlers.push(() => btn.removeEventListener("click", handler));
    });

    cleanupRef.current = () => handlers.forEach((h) => h());
    return () => cleanupRef.current?.();
  }, []);

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">Pending Approval</h2>
        <span className="section-count">3 requests</span>
      </div>
      <div className="member-list">
        {pendingMembers.map((member) => (
          <div
            key={member.email}
            className="member-item"
            data-name={member.name}
            data-email={member.email}
            data-role="pending"
            data-status="pending"
            data-initials={member.initials}
            data-color="purple"
          >
            <div className="member-avatar" style={{ background: member.color }}>
              <span>{member.initials}</span>
              <span className="member-status-dot pending"></span>
            </div>
            <div className="member-info">
              <div className="member-name">
                {member.name}
                <span className="member-role pending">Pending</span>
              </div>
              <div className="member-meta">
                <span>{member.email}</span>
                <span className="dot"></span>
                <span>{member.time}</span>
              </div>
            </div>
            <div className="member-actions">
              <button className="member-action-btn approve"><i className="fas fa-check"></i></button>
              <button className="member-action-btn reject"><i className="fas fa-xmark"></i></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
