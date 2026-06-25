"use client";

import { useEffect, useRef } from "react";

export default function CreateAlbumModal() {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const createBtn = document.getElementById("createAlbumBtn");

    function close() {
      modal?.classList.remove("active");
      document.body.style.overflow = "";
    }

    const handleOverlay = (e: Event) => {
      if (e.target === modal) close();
    };

    const handleCreate = () => {
      const name = (document.getElementById("albumNameInput") as HTMLInputElement)?.value;
      if (!name) {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: "Error", message: "Please enter an album name", type: "error", duration: 2500 },
          })
        );
        return;
      }
      close();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Album Created", message: `${name} has been created`, type: "success", duration: 3000 },
        })
      );
      const nameInput = document.getElementById("albumNameInput") as HTMLInputElement;
      const descInput = document.getElementById("albumDescInput") as HTMLInputElement;
      if (nameInput) nameInput.value = "";
      if (descInput) descInput.value = "";
    };

    modal.addEventListener("click", handleOverlay);
    createBtn?.addEventListener("click", handleCreate);

    return () => {
      modal.removeEventListener("click", handleOverlay);
      createBtn?.removeEventListener("click", handleCreate);
    };
  }, []);

  return (
    <div className="modal-overlay" id="createAlbumModal" ref={modalRef}>
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div className="modal-header">
          <h2>Create New Album</h2>
          <p>Organize your photos into albums</p>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Album Name</label>
            <input type="text" className="form-input" placeholder="e.g., Youth Conference 2026" id="albumNameInput" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input type="text" className="form-input" placeholder="Optional description..." id="albumDescInput" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select className="form-select" id="albumCategory">
              <option value="worship">Worship</option>
              <option value="events">Events</option>
              <option value="baptism">Baptism</option>
              <option value="youth">Youth</option>
              <option value="outreach">Outreach</option>
              <option value="facility">Facility</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" id="createAlbumBtn">Create Album</button>
        </div>
      </div>
    </div>
  );
}
