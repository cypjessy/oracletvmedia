"use client";

import { useEffect, useRef } from "react";

export default function MemberDetailModal() {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const detailMessage = document.getElementById("detailMessage");
    const detailEdit = document.getElementById("detailEdit");
    const detailRemove = document.getElementById("detailRemove");

    function close() {
      modal?.classList.remove("active");
      document.body.style.overflow = "";
    }

    const handleOverlay = (e: Event) => {
      if (e.target === modal) close();
    };

    const handleMessage = () => {
      close();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Message", message: "Opening chat...", type: "info", duration: 2000 },
        })
      );
    };

    const handleEdit = () => {
      close();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Edit Member", message: "Opening member editor...", type: "info", duration: 2000 },
        })
      );
    };

    const handleRemove = () => {
      close();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Member Removed", message: "This member has been removed from the church", type: "error", duration: 3000 },
        })
      );
    };

    modal.addEventListener("click", handleOverlay);
    detailMessage?.addEventListener("click", handleMessage);
    detailEdit?.addEventListener("click", handleEdit);
    detailRemove?.addEventListener("click", handleRemove);

    return () => {
      modal.removeEventListener("click", handleOverlay);
      detailMessage?.removeEventListener("click", handleMessage);
      detailEdit?.removeEventListener("click", handleEdit);
      detailRemove?.removeEventListener("click", handleRemove);
    };
  }, []);

  return (
    <div className="modal-overlay" id="memberModal" ref={modalRef}>
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div className="member-detail-header">
          <div className="member-detail-avatar" id="detailAvatar" style={{ background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))" }}>
            <span id="detailInitials">JM</span>
          </div>
          <div className="member-detail-name" id="detailName">John Mwangi</div>
          <div className="member-detail-email" id="detailEmail">john.mwangi@email.com</div>
          <div className="member-detail-role admin" id="detailRole">Admin</div>
        </div>
        <div className="member-detail-body">
          <div className="detail-section">
            <div className="detail-section-title">Contact Information</div>
            <div className="detail-row">
              <div className="detail-icon"><i className="fas fa-phone"></i></div>
              <div className="detail-content">
                <div className="detail-label">Phone</div>
                <div className="detail-value">+254 712 345 678</div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-icon"><i className="fas fa-envelope"></i></div>
              <div className="detail-content">
                <div className="detail-label">Email</div>
                <div className="detail-value" id="detailEmailRow">john.mwangi@email.com</div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-icon"><i className="fas fa-location-dot"></i></div>
              <div className="detail-content">
                <div className="detail-label">Location</div>
                <div className="detail-value">Nairobi, Kenya</div>
              </div>
            </div>
          </div>
          <div className="detail-section">
            <div className="detail-section-title">Activity</div>
            <div className="detail-row">
              <div className="detail-icon"><i className="fas fa-calendar"></i></div>
              <div className="detail-content">
                <div className="detail-label">Joined</div>
                <div className="detail-value">March 15, 2025</div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-icon"><i className="fas fa-clock"></i></div>
              <div className="detail-content">
                <div className="detail-label">Last Active</div>
                <div className="detail-value">2 hours ago</div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-icon"><i className="fas fa-circle"></i></div>
              <div className="detail-content">
                <div className="detail-label">Status</div>
                <div className="detail-value status-online">Online</div>
              </div>
            </div>
          </div>
          <div className="detail-section">
            <div className="detail-section-title">Engagement</div>
            <div className="detail-row">
              <div className="detail-icon"><i className="fas fa-video"></i></div>
              <div className="detail-content">
                <div className="detail-label">Videos Watched</div>
                <div className="detail-value">156 sermons</div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-icon"><i className="fas fa-radio"></i></div>
              <div className="detail-content">
                <div className="detail-label">Radio Hours</div>
                <div className="detail-value">42 hours this month</div>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-icon"><i className="fas fa-hand-holding-heart"></i></div>
              <div className="detail-content">
                <div className="detail-label">Total Given</div>
                <div className="detail-value">KSh 24,500</div>
              </div>
            </div>
          </div>
        </div>
        <div className="member-detail-actions">
          <button className="detail-action-btn secondary" id="detailMessage"><i className="fas fa-message"></i> Message</button>
          <button className="detail-action-btn primary" id="detailEdit"><i className="fas fa-pen"></i> Edit</button>
          <button className="detail-action-btn danger" id="detailRemove"><i className="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  );
}
