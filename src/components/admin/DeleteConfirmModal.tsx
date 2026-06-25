"use client";

import { useEffect, useRef } from "react";

export default function DeleteConfirmModal() {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const confirmBtn = document.getElementById("confirmDelete");
    const cancelBtn = document.getElementById("cancelDelete");

    function close() {
      modal?.classList.remove("active");
      document.body.style.overflow = "";
    }

    function resetSelection() {
      window.dispatchEvent(new CustomEvent("clear-selection"));
    }

    const handleOverlay = (e: Event) => {
      if (e.target === modal) close();
    };

    const handleConfirm = () => {
      const deleteCount = document.getElementById("deleteCount");
      const count = deleteCount?.textContent || "0 photos";
      close();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            title: "Deleted",
            message: `${count} deleted permanently`,
            type: "success",
            duration: 3000,
          },
        })
      );
      resetSelection();
    };

    const handleCancel = () => {
      close();
    };

    modal.addEventListener("click", handleOverlay);
    confirmBtn?.addEventListener("click", handleConfirm);
    cancelBtn?.addEventListener("click", handleCancel);

    return () => {
      modal.removeEventListener("click", handleOverlay);
      confirmBtn?.removeEventListener("click", handleConfirm);
      cancelBtn?.removeEventListener("click", handleCancel);
    };
  }, []);

  return (
    <div className="modal-overlay" id="deleteModal" ref={modalRef}>
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div className="modal-header">
          <h2>Delete Photos</h2>
          <p>This action cannot be undone</p>
        </div>
        <div className="modal-body">
          <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "15px", lineHeight: "1.6" }}>
            Are you sure you want to delete <strong id="deleteCount" style={{ color: "var(--text-primary)" }}>0 photos</strong>? This will permanently remove them from the gallery.
          </p>
        </div>
        <div className="modal-footer" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button className="btn-danger" id="confirmDelete">Delete Permanently</button>
          <button className="btn-outline" id="cancelDelete">Cancel</button>
        </div>
      </div>
    </div>
  );
}
