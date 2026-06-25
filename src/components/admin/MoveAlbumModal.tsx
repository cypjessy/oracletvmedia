"use client";

import { useEffect, useRef } from "react";

export default function MoveAlbumModal() {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const confirmBtn = document.getElementById("confirmMove");

    function close() {
      modal?.classList.remove("active");
      document.body.style.overflow = "";
    }

    function resetSelection() {
      // Clear selected items and reset UI
      window.dispatchEvent(new CustomEvent("clear-selection"));
    }

    const handleOverlay = (e: Event) => {
      if (e.target === modal) close();
    };

    const handleConfirm = () => {
      close();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            title: "Moved",
            message: "Items moved successfully",
            type: "success",
            duration: 3000,
          },
        })
      );
      resetSelection();
    };

    modal.addEventListener("click", handleOverlay);
    confirmBtn?.addEventListener("click", handleConfirm);

    return () => {
      modal.removeEventListener("click", handleOverlay);
      confirmBtn?.removeEventListener("click", handleConfirm);
    };
  }, []);

  return (
    <div className="modal-overlay" id="moveModal" ref={modalRef}>
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div className="modal-header">
          <h2>Move to Album</h2>
          <p>Select destination album</p>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Choose Album</label>
            <select className="form-select" id="moveAlbumSelect">
              <option value="worship">Worship</option>
              <option value="events">Events</option>
              <option value="baptism">Baptism</option>
              <option value="youth">Youth</option>
              <option value="outreach">Outreach</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" id="confirmMove">Move Selected</button>
        </div>
      </div>
    </div>
  );
}
