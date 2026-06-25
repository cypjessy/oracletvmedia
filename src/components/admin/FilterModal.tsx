"use client";

import { useEffect, useRef } from "react";

export default function FilterModal() {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const applyBtn = document.getElementById("applyFilter");

    function close() {
      modal?.classList.remove("active");
      document.body.style.overflow = "";
    }

    const handleOverlay = (e: Event) => {
      if (e.target === modal) close();
    };

    const handleApply = () => {
      close();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Filters Applied", message: "Member list updated", type: "success", duration: 2500 },
        })
      );
    };

    modal.addEventListener("click", handleOverlay);
    applyBtn?.addEventListener("click", handleApply);

    return () => {
      modal.removeEventListener("click", handleOverlay);
      applyBtn?.removeEventListener("click", handleApply);
    };
  }, []);

  // Handle filter chip clicks via event delegation on the opened modal
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      const chip = target.closest(".filter-chip");
      if (chip) {
        const chips = chip.closest(".filter-chips");
        if (chips) {
          chips.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
        }
        chip.classList.add("active");
      }
    };

    modal.addEventListener("click", handler);
    return () => modal.removeEventListener("click", handler);
  }, []);

  return (
    <div className="modal-overlay" id="filterModal" ref={modalRef}>
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div className="modal-header" style={{ padding: "8px 24px 16px", textAlign: "center" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Filter Members</h2>
        </div>
        <div className="modal-body">
          <div className="filter-options">
            <div className="filter-group">
              <div className="filter-group-title">Role</div>
              <div className="filter-chips">
                <div className="filter-chip active">All Roles</div>
                <div className="filter-chip">Admin</div>
                <div className="filter-chip">Pastor</div>
                <div className="filter-chip">Usher</div>
                <div className="filter-chip">Member</div>
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-group-title">Status</div>
              <div className="filter-chips">
                <div className="filter-chip active">All Status</div>
                <div className="filter-chip">Online</div>
                <div className="filter-chip">Offline</div>
                <div className="filter-chip">Pending</div>
              </div>
            </div>
            <div className="filter-group">
              <div className="filter-group-title">Joined</div>
              <div className="filter-chips">
                <div className="filter-chip active">All Time</div>
                <div className="filter-chip">This Week</div>
                <div className="filter-chip">This Month</div>
                <div className="filter-chip">This Year</div>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="detail-action-btn primary" id="applyFilter">Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
