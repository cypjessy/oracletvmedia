"use client";

import { useEffect, useRef } from "react";

export default function SearchFilter() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const searchInput = document.getElementById("searchInput");
    const filterBtn = document.getElementById("filterBtn");

    // Live search filter
    const handleSearch = (e: Event) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      document.querySelectorAll<HTMLElement>(".member-item").forEach((item) => {
        const name = (item.dataset.name || "").toLowerCase();
        const email = (item.dataset.email || "").toLowerCase();
        item.style.display =
          name.includes(query) || email.includes(query) ? "flex" : "none";
      });
    };

    // Filter button -> open filter modal
    const handleFilter = () => {
      document.getElementById("filterModal")?.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    searchInput?.addEventListener("input", handleSearch);
    filterBtn?.addEventListener("click", handleFilter);

    cleanupRef.current = () => {
      searchInput?.removeEventListener("input", handleSearch);
      filterBtn?.removeEventListener("click", handleFilter);
    };

    return () => cleanupRef.current?.();
  }, []);

  return (
    <div className="search-filter">
      <div className="search-input-wrapper">
        <i className="fas fa-magnifying-glass"></i>
        <input type="text" placeholder="Search members by name or email..." id="searchInput" />
      </div>
      <button className="filter-btn" id="filterBtn"><i className="fas fa-sliders"></i></button>
    </div>
  );
}
