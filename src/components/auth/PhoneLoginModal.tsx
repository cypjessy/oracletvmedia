"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";

export default function PhoneLoginModal() {
  const { showToast } = useToast();

  useEffect(() => {
    // ========== OPEN PHONE MODAL ==========
    const phoneBtn = document.getElementById("phoneBtn");
    const openHandler = () => {
      document.getElementById("phoneModal")?.classList.add("active");
      document.body.style.overflow = "hidden";
    };
    phoneBtn?.addEventListener("click", openHandler);

    // ========== OPEN COUNTRY PICKER ==========
    const countrySelector = document.getElementById("countrySelector");
    const countryHandler = () => {
      document.getElementById("countryModal")?.classList.add("active");
      document.body.style.overflow = "hidden";
    };
    countrySelector?.addEventListener("click", countryHandler);

    // ========== SUBMIT ==========
    const nextBtn = document.getElementById("phoneNextBtn");
    const nextHandler = () => {
      const phone = (
        document.getElementById("phoneInput") as HTMLInputElement
      )?.value.trim();
      const wrapper = document.getElementById("phoneWrapper");
      const error = document.getElementById("phoneError");
      const btn = document.getElementById("phoneNextBtn");

      if (!phone || phone.length < 9) {
        wrapper?.classList.add("error", "shake");
        error?.classList.add("show");
        setTimeout(() => wrapper?.classList.remove("shake"), 400);
        return;
      }

      wrapper?.classList.remove("error");
      error?.classList.remove("show");

      btn?.classList.add("loading");
      setTimeout(() => {
        btn?.classList.remove("loading");
        document.getElementById("phoneModal")?.classList.remove("active");
        document.body.style.overflow = "";
        showToast(
          "Code Sent",
          "Verification code sent to your phone",
          "success"
        );
      }, 1500);
    };
    nextBtn?.addEventListener("click", nextHandler);

    // ========== MODAL OVERLAY CLOSE ==========
    const modal = document.getElementById("phoneModal");
    const overlayHandler = (e: MouseEvent) => {
      if (e.target === e.currentTarget) {
        modal?.classList.remove("active");
        document.body.style.overflow = "";
      }
    };
    modal?.addEventListener("click", overlayHandler);

    return () => {
      phoneBtn?.removeEventListener("click", openHandler);
      countrySelector?.removeEventListener("click", countryHandler);
      nextBtn?.removeEventListener("click", nextHandler);
      modal?.removeEventListener("click", overlayHandler);
    };
  }, [showToast]);

  return (
    <div className="modal-overlay" id="phoneModal">
      <div className="modal-sheet">
        <div className="modal-handle"></div>
        <div className="modal-header">
          <h2>Phone Sign In</h2>
          <p>We&apos;ll send you a one-time verification code</p>
        </div>
        <div className="modal-body">
          <div className="country-selector" id="countrySelector">
            <span className="country-flag" id="selectedFlag">
              🇰🇪
            </span>
            <div className="country-info">
              <div className="name" id="selectedCountry">
                Kenya
              </div>
              <div className="code" id="selectedCode">
                +254
              </div>
            </div>
            <i className="fas fa-chevron-right"></i>
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <div className="phone-input-row">
              <div className="input-wrapper phone-prefix">
                <input type="text" id="phonePrefix" value="+254" readOnly />
              </div>
              <div className="input-wrapper" style={{ flex: 1 }} id="phoneWrapper">
                <input
                  type="tel"
                  id="phoneInput"
                  placeholder="712 345 678"
                  inputMode="tel"
                />
              </div>
            </div>
            <div className="error-message" id="phoneError">
              <i className="fas fa-circle-exclamation"></i>
              <span>Please enter a valid phone number</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" id="phoneNextBtn">
            <span className="btn-text">Continue</span>
            <span className="btn-loader"></span>
          </button>
        </div>
      </div>
    </div>
  );
}
