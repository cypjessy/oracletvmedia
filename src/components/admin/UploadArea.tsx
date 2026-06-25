"use client";

import { useEffect, useRef } from "react";

export default function UploadArea() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const uploadCard = document.getElementById("uploadCard");
    const uploadProgress = document.getElementById("uploadProgress");
    const progressFill = document.getElementById("progressFill");
    const progressPercent = document.getElementById("progressPercent");
    const progressStatus = document.getElementById("progressStatus");
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const handleUpload = () => {
      if (!uploadCard || !uploadProgress) return;
      uploadCard.style.display = "none";
      uploadProgress.classList.add("active");

      let progress = 0;
      intervalId = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          if (intervalId) clearInterval(intervalId);
          if (progressStatus) progressStatus.textContent = "Complete!";
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: { title: "Upload Complete", message: "Photo uploaded successfully", type: "success", duration: 3000 },
            })
          );
          setTimeout(() => {
            uploadProgress.classList.remove("active");
            uploadCard.style.display = "block";
            if (progressFill) progressFill.style.width = "0%";
            if (progressPercent) progressPercent.textContent = "0%";
            if (progressStatus) progressStatus.textContent = "Uploading...";
          }, 2000);
        }
        if (progressFill) progressFill.style.width = progress + "%";
        if (progressPercent) progressPercent.textContent = Math.round(progress) + "%";
      }, 300);
    };

    uploadCard?.addEventListener("click", handleUpload);

    cleanupRef.current = () => {
      uploadCard?.removeEventListener("click", handleUpload);
      if (intervalId) clearInterval(intervalId);
    };

    return () => cleanupRef.current?.();
  }, []);

  return (
    <>
      <div className="upload-section">
        <div className="upload-card" id="uploadCard">
          <div className="upload-icon"><i className="fas fa-cloud-arrow-up"></i></div>
          <div className="upload-title">Upload Photos</div>
          <div className="upload-subtitle">Tap to select photos or drag and drop here</div>
          <div className="upload-formats">JPG, PNG, WEBP up to 10MB each</div>
        </div>
      </div>
      <div className="upload-progress" id="uploadProgress">
        <div className="upload-progress-item">
          <div className="upload-progress-header">
            <span className="upload-progress-name"><i className="fas fa-image"></i> youth_conference_01.jpg</span>
            <span className="upload-progress-percent" id="progressPercent">0%</span>
          </div>
          <div className="upload-progress-bar">
            <div className="upload-progress-fill" id="progressFill"></div>
          </div>
          <div className="upload-progress-meta">
            <span>2.4 MB</span>
            <span id="progressStatus">Uploading...</span>
          </div>
        </div>
      </div>
    </>
  );
}
