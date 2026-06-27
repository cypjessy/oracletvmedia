"use client";

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

interface ToastContextValue {
  showToast: (
    title: string,
    message: string,
    type?: "success" | "error" | "info",
    duration?: number
  ) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback(
    (
      title: string,
      message: string,
      type: "success" | "error" | "info" = "info",
      duration = 4000
    ) => {
      const container = containerRef.current;
      if (!container) return;

      const toast = document.createElement("div");
      toast.className = "toast";

      const icons: Record<string, string> = {
        success: "fa-check",
        error: "fa-xmark",
        info: "fa-info",
      };

      const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
      toast.innerHTML = `
        <div class="toast-icon ${esc(type)}">
          <i class="fas ${icons[type] || "fa-info"}"></i>
        </div>
        <div class="toast-content">
          <div class="title">${esc(title)}</div>
          <div class="message">${esc(message)}</div>
        </div>
        <button class="toast-close"><i class="fas fa-xmark"></i></button>
      `;

      container.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add("show"));

      const closeToast = () => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 350);
      };

      toast.querySelector(".toast-close")?.addEventListener("click", closeToast);
      setTimeout(closeToast, duration);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" ref={containerRef} />
    </ToastContext.Provider>
  );
}
