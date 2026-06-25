"use client";

import { useState, useEffect, useRef } from "react";

interface Props {
  showToast: (title: string, message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

export default function GoLive({ showToast }: Props) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [selectedMic, setSelectedMic] = useState("default");
  const [streamQuality, setStreamQuality] = useState("128");
  const [djName, setDjName] = useState("DJ Pastor Sarah");
  const [micLevel, setMicLevel] = useState(0);
  const micLevelRef = useRef(0);
  const liveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulated audio level
  useEffect(() => {
    if (!isBroadcasting) {
      setMicLevel(0);
      micLevelRef.current = 0;
      return;
    }
    let frame: number;
    const animate = () => {
      const target = 10 + Math.sin(Date.now() / 300) * 35 + Math.random() * 10;
      micLevelRef.current += (target - micLevelRef.current) * 0.08;
      setMicLevel(micLevelRef.current);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isBroadcasting]);

  // Live timer
  useEffect(() => {
    if (isBroadcasting) {
      liveTimerRef.current = setInterval(() => setLiveSeconds((p) => p + 1), 1000);
    } else {
      if (liveTimerRef.current) { clearInterval(liveTimerRef.current); liveTimerRef.current = null; }
    }
    return () => { if (liveTimerRef.current) clearInterval(liveTimerRef.current); };
  }, [isBroadcasting]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <style>{`
        .rs-gl { display: flex; flex-direction: column; gap: 16px; }
        .rs-gl-banner { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-radius: var(--rs-radius-lg); border: 1px solid var(--rs-border); }
        .rs-gl-banner.live { background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04)); border-color: rgba(239,68,68,0.2); }
        .rs-gl-banner.idle { background: var(--rs-surface-card); }
        .rs-gl-status { display: flex; align-items: center; gap: 10px; }
        .rs-gl-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--rs-text-tertiary); }
        .rs-gl-dot.live { background: var(--rs-error); animation: rsPulse 1.5s ease-in-out infinite; box-shadow: 0 0 12px rgba(239,68,68,0.4); }
        .rs-gl-text { font-size: 15px; font-weight: 700; }
        .rs-gl-timer { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--rs-error); }
        .rs-gl-timer i { font-size: 12px; }

        .rs-gl-field { display: flex; flex-direction: column; gap: 8px; }
        .rs-gl-label { font-size: 12px; font-weight: 600; color: var(--rs-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px; }
        .rs-gl-label i { font-size: 11px; color: var(--rs-text-tertiary); }

        .rs-gl-level { display: flex; align-items: flex-end; gap: 3px; height: 48px; background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-md); padding: 6px 10px; }
        .rs-gl-level-bar { flex: 1; height: 4px; border-radius: 2px; background: var(--rs-surface-elevated); transition: all 0.08s ease; align-self: flex-end; }
        .rs-gl-level-bar.low { background: var(--rs-grad-green); }
        .rs-gl-level-bar.mid { background: var(--rs-grad-start); }
        .rs-gl-level-bar.high { background: var(--rs-error); }
        .rs-gl-level-value { text-align: center; font-size: 13px; font-weight: 700; color: var(--rs-text-secondary); font-variant-numeric: tabular-nums; }

        .rs-gl-broadcast-btn { width: 100%; padding: 20px; border-radius: var(--rs-radius-xl); font-size: 20px; font-weight: 800; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 12px; border: none; letter-spacing: 1px; }
        .rs-gl-broadcast-btn.start { background: linear-gradient(135deg, var(--rs-grad-start), var(--rs-grad-end)); color: #fff; box-shadow: var(--rs-shadow-soft), 0 0 40px rgba(232,168,56,0.2); }
        .rs-gl-broadcast-btn.end { background: linear-gradient(135deg, var(--rs-grad-red), #DC2626); color: #fff; box-shadow: 0 4px 24px rgba(239,68,68,0.35); animation: rsGlowPulse 2s ease-in-out infinite; }
        .rs-gl-broadcast-btn:active { transform: scale(0.97); }
        .rs-gl-broadcast-btn i { font-size: 22px; }

        @keyframes rsGlowPulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(239,68,68,0.35); }
          50% { box-shadow: 0 4px 40px rgba(239,68,68,0.55); }
        }

        .rs-gl-quality { display: flex; gap: 10px; }
        .rs-gl-quality-btn { flex: 1; padding: 12px; border-radius: var(--rs-radius-md); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; border: 1.5px solid var(--rs-border); background: var(--rs-surface-card); color: var(--rs-text-secondary); text-align: center; }
        .rs-gl-quality-btn.active { background: linear-gradient(135deg, var(--rs-grad-start), var(--rs-grad-end)); border-color: transparent; color: #fff; box-shadow: var(--rs-shadow-soft); }
        .rs-gl-quality-btn:disabled { opacity: 0.5; }

        .rs-gl-tech { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .rs-gl-tech-row { display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
        .rs-gl-tech-row span:first-child { color: var(--rs-text-tertiary); }
        .rs-gl-tech-val { font-weight: 600; font-size: 12px; color: var(--rs-text-secondary); font-family: monospace; max-width: 60%; text-align: right; word-break: break-all; }
      `}</style>

      <div className="rs-gl">
        {/* Status Banner */}
        <div className={`rs-gl-banner ${isBroadcasting ? "live" : "idle"}`}>
          <div className="rs-gl-status">
            <span className={`rs-gl-dot ${isBroadcasting ? "live" : ""}`}></span>
            <span className="rs-gl-text">{isBroadcasting ? "You are On Air" : "Ready to Broadcast"}</span>
          </div>
          {isBroadcasting && (
            <div className="rs-gl-timer">
              <i className="fas fa-clock"></i>
              {formatTime(liveSeconds)}
            </div>
          )}
        </div>

        {/* Microphone */}
        <div className="rs-gl-field">
          <div className="rs-gl-label"><i className="fas fa-microphone"></i> Microphone</div>
          <select className="rs-select" value={selectedMic} onChange={(e) => setSelectedMic(e.target.value)} disabled={isBroadcasting}>
            <option value="default">Default Microphone</option>
            <option value="headset">Headset (Logitech H390)</option>
            <option value="studio">Studio Mic (Blue Yeti)</option>
            <option value="airpods">AirPods Pro</option>
          </select>
        </div>

        {/* Audio Level */}
        <div className="rs-gl-field">
          <div className="rs-gl-label"><i className="fas fa-waveform"></i> Audio Level</div>
          <div className="rs-gl-level">
            {Array.from({ length: 20 }).map((_, i) => {
              const threshold = (i + 1) * 5;
              const active = micLevel >= threshold;
              let cls = "";
              if (active) cls = threshold > 70 ? "high" : threshold > 45 ? "mid" : "low";
              return <div key={i} className={`rs-gl-level-bar ${cls}`}></div>;
            })}
          </div>
          <div className="rs-gl-level-value">{Math.round(micLevel)}%</div>
        </div>

        {/* GO LIVE Button */}
        <button
          className={`rs-gl-broadcast-btn ${isBroadcasting ? "end" : "start"}`}
          onClick={() => {
            const newState = !isBroadcasting;
            setIsBroadcasting(newState);
            if (newState) {
              setLiveSeconds(0);
              showToast("Live Broadcast Started", `You are on air as "${djName}"`, "success", 3000);
            } else {
              showToast("Broadcast Ended", "Live stream disconnected", "info", 3000);
            }
          }}
        >
          <i className={`fas ${isBroadcasting ? "fa-stop-circle" : "fa-circle"}`}></i>
          {isBroadcasting ? "END BROADCAST" : "GO LIVE"}
        </button>

        {/* DJ Name */}
        <div className="rs-gl-field">
          <div className="rs-gl-label"><i className="fas fa-user"></i> DJ Display Name</div>
          <input type="text" className="rs-input" value={djName} onChange={(e) => setDjName(e.target.value)} placeholder="Your DJ name..." disabled={isBroadcasting} />
        </div>

        {/* Stream Quality */}
        <div className="rs-gl-field">
          <div className="rs-gl-label"><i className="fas fa-sliders"></i> Stream Quality</div>
          <div className="rs-gl-quality">
            {["128", "192", "320"].map((q) => (
              <button key={q} className={`rs-gl-quality-btn ${streamQuality === q ? "active" : ""}`} onClick={() => setStreamQuality(q)} disabled={isBroadcasting}>
                {q} kbps
              </button>
            ))}
          </div>
        </div>

        {/* Technical Info */}
        {isBroadcasting && (
          <div className="rs-gl-tech">
            <div className="rs-gl-tech-row"><span>Stream URL</span><span className="rs-gl-tech-val">https://azuracast.histoview.co.ke/radio/8000/kingdom_seekers.mp3</span></div>
            <div className="rs-gl-tech-row"><span>Mount</span><span className="rs-gl-tech-val">/grace_live</span></div>
            <div className="rs-gl-tech-row"><span>Quality</span><span className="rs-gl-tech-val">{streamQuality} kbps</span></div>
          </div>
        )}
      </div>
    </>
  );
}
