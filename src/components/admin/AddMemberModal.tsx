"use client";

import { useEffect, useRef } from "react";

export default function AddMemberModal() {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const saveBtn = document.getElementById("saveMember");

    function close() {
      modal?.classList.remove("active");
      document.body.style.overflow = "";
    }

    const handleOverlay = (e: Event) => {
      if (e.target === modal) close();
    };

    const handleSave = () => {
      const name = (document.getElementById("addName") as HTMLInputElement)?.value;
      if (!name) {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: { title: "Error", message: "Please enter a name", type: "error", duration: 2500 },
          })
        );
        return;
      }
      close();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Member Added", message: `${name} has been added successfully`, type: "success", duration: 3000 },
        })
      );
      const nameInput = document.getElementById("addName") as HTMLInputElement;
      const emailInput = document.getElementById("addEmail") as HTMLInputElement;
      const phoneInput = document.getElementById("addPhone") as HTMLInputElement;
      if (nameInput) nameInput.value = "";
      if (emailInput) emailInput.value = "";
      if (phoneInput) phoneInput.value = "";
    };

    modal.addEventListener("click", handleOverlay);
    saveBtn?.addEventListener("click", handleSave);

    return () => {
      modal.removeEventListener("click", handleOverlay);
      saveBtn?.removeEventListener("click", handleSave);
    };
  }, []);

  return (
    <div className="modal-overlay" id="addModal" ref={modalRef}>
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div className="modal-header" style={{ padding: "8px 24px 16px", textAlign: "center" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Add New Member</h2>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" className="form-input" placeholder="Enter full name" id="addName" />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-input" placeholder="email@example.com" id="addEmail" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" className="form-input" placeholder="+254 7XX XXX XXX" id="addPhone" />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select className="form-select" id="addRole">
              <option value="member">Member</option>
              <option value="usher">Usher</option>
              <option value="pastor">Pastor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="detail-action-btn primary" id="saveMember">Add Member</button>
        </div>
      </div>
    </div>
  );
}
