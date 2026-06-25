"use client";

import { useEffect } from "react";

interface CountryData {
  name: string;
  code: string;
  flag: string;
}

const COUNTRIES: CountryData[] = [
  { name: "Kenya", code: "+254", flag: "🇰🇪" },
  { name: "Uganda", code: "+256", flag: "🇺🇬" },
  { name: "Tanzania", code: "+255", flag: "🇹🇿" },
  { name: "Nigeria", code: "+234", flag: "🇳🇬" },
  { name: "South Africa", code: "+27", flag: "🇿🇦" },
  { name: "Ghana", code: "+233", flag: "🇬🇭" },
  { name: "Ethiopia", code: "+251", flag: "🇪🇹" },
  { name: "Rwanda", code: "+250", flag: "🇷🇼" },
  { name: "Zambia", code: "+260", flag: "🇿🇲" },
  { name: "Zimbabwe", code: "+263", flag: "🇿🇼" },
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
];

export default function CountryPickerModal() {
  useEffect(() => {
    const countryList = document.getElementById("countryList");

    function renderCountries(filter = "") {
      const filtered = COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(filter.toLowerCase()) ||
          c.code.includes(filter)
      );

      if (countryList) {
        countryList.innerHTML = filtered
          .map(
            (c) => `
          <div class="country-item" data-name="${c.name}" data-code="${c.code}" data-flag="${c.flag}">
            <span class="flag">${c.flag}</span>
            <span class="name">${c.name}</span>
            <span class="dial">${c.code}</span>
          </div>
        `
          )
          .join("");

        countryList.querySelectorAll(".country-item").forEach((item) => {
          item.addEventListener("click", () => {
            const flag = document.getElementById("selectedFlag");
            const country = document.getElementById("selectedCountry");
            const code = document.getElementById("selectedCode");
            const prefix = document.getElementById(
              "phonePrefix"
            ) as HTMLInputElement | null;
            if (flag)
              flag.textContent = (item as HTMLElement).dataset.flag || "";
            if (country)
              country.textContent = (item as HTMLElement).dataset.name || "";
            if (code)
              code.textContent = (item as HTMLElement).dataset.code || "";
            if (prefix)
              prefix.value = (item as HTMLElement).dataset.code || "";
            document.getElementById("countryModal")?.classList.remove("active");
            document.body.style.overflow = "";
          });
        });
      }
    }

    renderCountries();

    const searchInput = document.getElementById("countrySearch");
    const searchHandler = (e: Event) => {
      renderCountries((e.target as HTMLInputElement).value);
    };
    searchInput?.addEventListener("input", searchHandler);

    // Overlay close
    const modal = document.getElementById("countryModal");
    const overlayHandler = (e: MouseEvent) => {
      if (e.target === e.currentTarget) {
        modal?.classList.remove("active");
        document.body.style.overflow = "";
      }
    };
    modal?.addEventListener("click", overlayHandler);

    return () => {
      searchInput?.removeEventListener("input", searchHandler);
      modal?.removeEventListener("click", overlayHandler);
    };
  }, []);

  return (
    <div className="modal-overlay" id="countryModal">
      <div className="modal-sheet" style={{ maxHeight: "75vh" }}>
        <div className="modal-handle"></div>
        <div className="modal-header">
          <h2>Select Country</h2>
          <p>Choose your country code</p>
        </div>
        <div className="modal-body">
          <div className="country-search">
            <i className="fas fa-search"></i>
            <input type="text" id="countrySearch" placeholder="Search country..." />
          </div>
          <div className="country-list" id="countryList"></div>
        </div>
      </div>
    </div>
  );
}
