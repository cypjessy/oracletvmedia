"use client";

import { useEffect, useRef } from "react";

export default function BulkActionsBar() {
  const cleanupRef = useRef<(() => void) | null>(null);
  const selectedRef = useRef<string[]>([]);

  useEffect(() => {
    const selectBtn = document.getElementById("selectBtn");
    const bulkBar = document.getElementById("bulkBar");
    const bulkCountEl = document.getElementById("bulkCount");
    const bulkMove = document.getElementById("bulkMove");
    const bulkDelete = document.getElementById("bulkDelete");
    let selectMode = false;

    function updateBulkBar() {
      if (selectedRef.current.length > 0) {
        bulkBar?.classList.add("active");
        if (bulkCountEl) bulkCountEl.textContent = `${selectedRef.current.length} selected`;
      } else {
        bulkBar?.classList.remove("active");
      }
    }

    function clearSelection() {
      selectedRef.current = [];
      updateBulkBar();
      selectMode = false;
      if (selectBtn) {
        selectBtn.innerHTML = '<i class="fas fa-check-square"></i>';
        selectBtn.style.color = "";
      }
      document.querySelectorAll<HTMLElement>(".album-select, .photo-select").forEach((el) => {
        el.style.display = "none";
        el.classList.remove("selected");
      });
    }

    // Select mode toggle
    const handleSelectToggle = () => {
      selectMode = !selectMode;
      if (selectBtn) {
        selectBtn.innerHTML = selectMode
          ? '<i class="fas fa-xmark"></i>'
          : '<i class="fas fa-check-square"></i>';
        selectBtn.style.color = selectMode ? "var(--primary)" : "";
      }

      document.querySelectorAll<HTMLElement>(".album-select, .photo-select").forEach((el) => {
        el.style.display = selectMode ? "flex" : "none";
        if (!selectMode) {
          el.classList.remove("selected");
        }
      });

      if (!selectMode) {
        selectedRef.current = [];
        updateBulkBar();
      }

      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: {
            title: selectMode ? "Select Mode" : "Selection Cleared",
            message: selectMode ? "Tap items to select" : "All selections cleared",
            type: "info",
            duration: 2000,
          },
        })
      );
    };

    // Track item selections via custom event
    const handleItemSelected = (e: Event) => {
      const { id, selected } = (e as CustomEvent).detail;
      if (selected) {
        if (!selectedRef.current.includes(id)) selectedRef.current.push(id);
      } else {
        selectedRef.current = selectedRef.current.filter((i) => i !== id);
      }
      updateBulkBar();
    };

    // Bulk move
    const handleBulkMove = () => {
      document.getElementById("moveModal")?.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    // Bulk delete
    const handleBulkDelete = () => {
      const deleteCount = document.getElementById("deleteCount");
      if (deleteCount) deleteCount.textContent = `${selectedRef.current.length} photos`;
      document.getElementById("deleteModal")?.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    // Listen for clear-selection event from move/delete modals
    const handleClearSelection = () => {
      selectedRef.current = [];
      selectMode = false;
      updateBulkBar();
      if (selectBtn) {
        selectBtn.innerHTML = '<i class="fas fa-check-square"></i>';
        selectBtn.style.color = "";
      }
    };

    selectBtn?.addEventListener("click", handleSelectToggle);
    window.addEventListener("item-selected", handleItemSelected);
    window.addEventListener("clear-selection", handleClearSelection);
    bulkMove?.addEventListener("click", handleBulkMove);
    bulkDelete?.addEventListener("click", handleBulkDelete);

    cleanupRef.current = () => {
      selectBtn?.removeEventListener("click", handleSelectToggle);
      window.removeEventListener("item-selected", handleItemSelected);
      window.removeEventListener("clear-selection", handleClearSelection);
      bulkMove?.removeEventListener("click", handleBulkMove);
      bulkDelete?.removeEventListener("click", handleBulkDelete);
    };

    return () => cleanupRef.current?.();
  }, []);

  return (
    <div className="bulk-bar" id="bulkBar">
      <span className="bulk-count" id="bulkCount">0 selected</span>
      <div className="bulk-actions">
        <button className="bulk-btn move" id="bulkMove"><i className="fas fa-folder"></i> Move</button>
        <button className="bulk-btn delete" id="bulkDelete"><i className="fas fa-trash"></i> Delete</button>
      </div>
    </div>
  );
}
