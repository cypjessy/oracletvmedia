"use client";

import { useEffect, useRef } from "react";

export default function GivingSummary() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const periodSelect = document.querySelector(".giving-period-select");
    const seeAll = document.getElementById("givingDetailsBtn");

    const handlePeriod = () => {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Period", message: "Switching between monthly, weekly, yearly views...", type: "info", duration: 2500 },
        })
      );
    };

    const handleSeeAll = () => {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { title: "Giving Details", message: "Opening all giving details...", type: "info", duration: 2000 },
        })
      );
    };

    periodSelect?.addEventListener("click", handlePeriod);
    seeAll?.addEventListener("click", handleSeeAll);

    cleanupRef.current = () => {
      periodSelect?.removeEventListener("click", handlePeriod);
      seeAll?.removeEventListener("click", handleSeeAll);
    };

    return () => cleanupRef.current?.();
  }, []);

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">Giving Summary</h2>
        <button className="section-see-all" id="givingDetailsBtn">
          Details <i className="fas fa-chevron-right" style={{ fontSize: "10px" }}></i>
        </button>
      </div>
      <div className="giving-summary">
        <div className="giving-card-admin">
          <div className="giving-header">
            <h3>Total Giving — June 2026</h3>
            <div className="giving-period-select">
              <span>This Month</span>
              <i className="fas fa-chevron-down" style={{ fontSize: "10px" }}></i>
            </div>
          </div>
          <div className="giving-amount-admin">KSh 245,000</div>
          <div className="giving-meta-admin">From 187 givers · 234 transactions</div>
          <div className="giving-bar">
            <div className="giving-bar-segment tithe"></div>
            <div className="giving-bar-segment offering"></div>
            <div className="giving-bar-segment special"></div>
          </div>
          <div className="giving-legend">
            <div className="giving-legend-item"><div className="giving-legend-dot tithe"></div>Tithe 60%</div>
            <div className="giving-legend-item"><div className="giving-legend-dot offering"></div>Offering 30%</div>
            <div className="giving-legend-item"><div className="giving-legend-dot special"></div>Special 10%</div>
          </div>
        </div>
      </div>
    </>
  );
}
