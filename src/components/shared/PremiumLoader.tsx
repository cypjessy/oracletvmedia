"use client";

export default function PremiumLoader() {
  return (
    <>
      <style>{`
        .pl-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg, #0F0F0F);
        }
        .pl-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 3px solid rgba(112,72,232,0.08);
          border-top-color: var(--primary);
          border-right-color: var(--primary-dark);
          animation: pl-spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .pl-ring-inner {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid rgba(112,72,232,0.06);
          border-bottom-color: var(--primary);
          border-left-color: var(--primary-dark);
          animation: pl-spin 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse;
        }
        .pl-icon {
          position: absolute;
          font-size: 20px;
          color: var(--primary);
          animation: pl-pulse 1.6s ease-in-out infinite;
        }
        .pl-brand {
          margin-top: 24px;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: var(--primary);
          animation: pl-fade 1.6s ease-in-out infinite;
        }
        .pl-dots {
          margin-top: 10px;
          display: flex;
          gap: 6px;
        }
        .pl-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--primary);
          animation: pl-bounce 1.2s ease-in-out infinite;
        }
        .pl-dot:nth-child(2) { animation-delay: 0.2s; }
        .pl-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pl-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pl-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes pl-fade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes pl-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
      <div className="pl-overlay">
        <div className="pl-ring">
          <div className="pl-ring-inner"></div>
          <i className="fas fa-cross pl-icon"></i>
        </div>
        <div className="pl-brand">ORACLE TV MEDIA</div>
        <div className="pl-dots">
          <div className="pl-dot"></div>
          <div className="pl-dot"></div>
          <div className="pl-dot"></div>
        </div>
      </div>
    </>
  );
}
