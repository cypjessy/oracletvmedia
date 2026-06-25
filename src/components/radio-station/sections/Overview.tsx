"use client";

import { useState, useEffect } from "react";
import { getNowPlaying, toggleStationLive, toggleAutoDJ, getAnalytics, type NowPlayingData, type AnalyticsReport } from "@/lib/azuracast";

interface Props {
  showToast: (title: string, message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

export default function Overview({ showToast }: Props) {
  const [npData, setNpData] = useState<NowPlayingData | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [autoDJ, setAutoDJ] = useState(true);
  const [progress, setProgress] = useState(35);
  const [analytics, setAnalytics] = useState<AnalyticsReport | null>(null);

  useEffect(() => {
    getNowPlaying("1").then(setNpData);
    getAnalytics().then(setAnalytics);

    const interval = setInterval(() => {
      getNowPlaying("1").then(setNpData);
    }, 5000);

    const progInterval = setInterval(() => {
      setProgress((p) => (p >= 100 ? 0 : p + 1));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(progInterval);
    };
  }, []);

  const handleToggleLive = async () => {
    const result = await toggleStationLive();
    setIsLive(result.isLive);
    showToast(result.isLive ? "Broadcast Started" : "Broadcast Ended", `Station is now ${result.isLive ? "live" : "offline"}`, result.isLive ? "success" : "info");
  };

  const handleToggleAutoDJ = async () => {
    const result = await toggleAutoDJ();
    setAutoDJ(result.running);
    showToast(result.running ? "AutoDJ Started" : "AutoDJ Stopped", result.running ? "AutoDJ is running" : "AutoDJ paused", "info");
  };

  const recentHistory = npData?.songHistory || [];
  const nowPlaying = npData?.nowPlaying;
  const maxListeners = Math.max(...(analytics?.listenersOverTime?.map((d) => d.count) || [1]));

  return (
    <>
      <style>{`
        .rs-ov-cards { display: flex; gap: 12px; }
        .rs-ov-card { flex: 1; background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .rs-ov-card-header { display: flex; align-items: center; justify-content: space-between; }
        .rs-ov-card-label { font-size: 11px; font-weight: 600; color: var(--rs-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
        .rs-ov-card-stat { font-size: 28px; font-weight: 800; line-height: 1; }
        .rs-ov-card-sub { font-size: 12px; color: var(--rs-text-tertiary); margin-top: 2px; }
        .rs-ov-btn { width: 100%; padding: 10px; border-radius: var(--rs-radius-sm); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center; gap: 6px; border: none; }
        .rs-ov-btn.red { background: rgba(239,68,68,0.12); color: var(--rs-error); }
        .rs-ov-btn.gold { background: linear-gradient(135deg, var(--rs-grad-start), var(--rs-grad-end)); color: #fff; box-shadow: var(--rs-shadow-soft); }
        .rs-ov-btn.green { background: rgba(34,197,94,0.12); color: var(--rs-success); }
        .rs-ov-btn:active { transform: scale(0.97); }

        .rs-ov-np { background: linear-gradient(135deg, rgba(232,168,56,0.08), rgba(139,92,246,0.04)); border: 1px solid rgba(232,168,56,0.1); border-radius: var(--rs-radius-lg); padding: 16px; display: flex; align-items: center; gap: 14px; }
        .rs-ov-np-cover { width: 64px; height: 64px; border-radius: var(--rs-radius-md); overflow: hidden; flex-shrink: 0; border: 1px solid var(--rs-border); background: linear-gradient(135deg, var(--rs-surface-elevated), var(--rs-surface-hover)); display: flex; align-items: center; justify-content: center; }
        .rs-ov-np-cover img { width: 100%; height: 100%; object-fit: cover; }
        .rs-ov-np-cover i { font-size: 24px; color: var(--rs-text-tertiary); }
        .rs-ov-np-info { flex: 1; min-width: 0; }
        .rs-ov-np-title { font-size: 16px; font-weight: 700; }
        .rs-ov-np-artist { font-size: 14px; color: var(--rs-text-secondary); margin-bottom: 8px; }
        .rs-ov-np-progress { width: 100%; height: 4px; background: var(--rs-surface-elevated); border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
        .rs-ov-np-fill { height: 100%; background: linear-gradient(90deg, var(--rs-grad-start), var(--rs-grad-end)); border-radius: 2px; transition: width 0.3s ease; }
        .rs-ov-np-times { display: flex; justify-content: space-between; font-size: 11px; color: var(--rs-text-tertiary); }

        .rs-ov-history { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); overflow: hidden; }
        .rs-ov-history-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-bottom: 1px solid var(--rs-border); }
        .rs-ov-history-item:last-child { border-bottom: none; }
        .rs-ov-history-cover { width: 32px; height: 32px; border-radius: 6px; overflow: hidden; flex-shrink: 0; }
        .rs-ov-history-cover img { width: 100%; height: 100%; object-fit: cover; }
        .rs-ov-history-info { flex: 1; min-width: 0; }
        .rs-ov-history-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rs-ov-history-artist { font-size: 11px; color: var(--rs-text-secondary); }
        .rs-ov-history-time { font-size: 11px; color: var(--rs-text-tertiary); flex-shrink: 0; }

        .rs-ov-actions { display: flex; gap: 10px; }
        .rs-ov-action-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 16px 8px; background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-md); cursor: pointer; transition: all 0.2s ease; }
        .rs-ov-action-btn:active { background: var(--rs-surface-elevated); transform: scale(0.96); }
        .rs-ov-action-btn span { font-size: 11px; font-weight: 600; color: var(--rs-text-secondary); text-align: center; }
        .rs-ov-action-icon { width: 44px; height: 44px; border-radius: var(--rs-radius-sm); display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .rs-ov-action-icon.gold { background: rgba(232,168,56,0.12); color: var(--rs-primary); }
        .rs-ov-action-icon.blue { background: rgba(59,130,246,0.12); color: var(--rs-grad-blue); }
        .rs-ov-action-icon.purple { background: rgba(139,92,246,0.12); color: var(--rs-grad-purple); }

        .rs-ov-chart { display: flex; align-items: flex-end; gap: 4px; height: 100px; background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); padding: 12px; }
        .rs-ov-chart-bar { flex: 1; display: flex; align-items: flex-end; height: 100%; }
        .rs-ov-chart-fill { width: 100%; border-radius: 3px 3px 0 0; background: linear-gradient(to top, rgba(232,168,56,0.3), var(--rs-primary)); transition: height 0.3s ease; min-height: 2px; }
        .rs-ov-chart-labels { display: flex; justify-content: space-between; padding: 4px 12px 0; }
        .rs-ov-chart-labels span { font-size: 10px; color: var(--rs-text-tertiary); }

        @media (max-width: 480px) {
          .rs-ov-cards { flex-direction: column; }
          .rs-ov-actions { flex-direction: column; }
        }
      `}</style>

      {/* Status Cards */}
      <div className="rs-ov-cards">
        <div className="rs-ov-card">
          <div className="rs-ov-card-header">
            <span className="rs-ov-card-label">Station</span>
            <span className={`rs-badge ${isLive ? "green" : "gray"}`}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLive ? "var(--rs-success)" : "var(--rs-text-tertiary)", animation: isLive ? "rsPulse 1.5s ease-in-out infinite" : "none" }}></span>
              {isLive ? "Online" : "Offline"}
            </span>
          </div>
          <div className="rs-ov-card-stat">{npData?.listeners?.current || 0}</div>
          <div className="rs-ov-card-sub">Listeners</div>
          <button className={`rs-ov-btn ${isLive ? "red" : "gold"}`} onClick={handleToggleLive}>
            <i className={`fas ${isLive ? "fa-stop" : "fa-play"}`}></i>
            {isLive ? "Stop Broadcast" : "Start Broadcast"}
          </button>
        </div>
        <div className="rs-ov-card">
          <div className="rs-ov-card-header">
            <span className="rs-ov-card-label">AutoDJ</span>
            <span className={`rs-badge ${autoDJ ? "green" : "gray"}`}>
              {autoDJ ? "Running" : "Stopped"}
            </span>
          </div>
          <div className="rs-ov-card-stat">{autoDJ ? "128" : "—"}</div>
          <div className="rs-ov-card-sub">Songs Queued</div>
          <button className={`rs-ov-btn ${autoDJ ? "red" : "green"}`} onClick={handleToggleAutoDJ}>
            <i className={`fas ${autoDJ ? "fa-pause" : "fa-play"}`}></i>
            {autoDJ ? "Pause AutoDJ" : "Start AutoDJ"}
          </button>
        </div>
      </div>

      {/* Now Playing */}
      <div className="rs-ov-np">
        <div className="rs-ov-np-cover">
          {nowPlaying?.song?.albumArt ? (
            <img src={nowPlaying.song.albumArt} alt="" />
          ) : (
            <i className="fas fa-music"></i>
          )}
        </div>
        <div className="rs-ov-np-info">
          <div className="rs-ov-np-title">{nowPlaying?.song?.title || "Nothing Playing"}</div>
          <div className="rs-ov-np-artist">{nowPlaying?.song?.artist || ""}</div>
          <div className="rs-ov-np-progress">
            <div className="rs-ov-np-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="rs-ov-np-times">
            <span>{Math.floor((progress / 100) * ((nowPlaying?.duration || 270) / 60))}:{String(Math.floor((progress / 100) * ((nowPlaying?.duration || 270) % 60))).padStart(2, "0")}</span>
            <span>{Math.floor((nowPlaying?.duration || 270) / 60)}:{String((nowPlaying?.duration || 270) % 60).padStart(2, "0")}</span>
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="rs-section-header">
        <h3 className="rs-section-title" style={{ fontSize: 16 }}>Recent History</h3>
        <span className="rs-section-subtitle">Last {recentHistory.length} songs</span>
      </div>
      <div className="rs-ov-history">
        {recentHistory.length === 0 ? (
          <div className="rs-ov-history-item">
            <div className="rs-ov-history-info">
              <div className="rs-ov-history-title">No history yet</div>
            </div>
          </div>
        ) : (
          recentHistory.map((item, i) => (
            <div className="rs-ov-history-item" key={i}>
              <div className="rs-ov-history-cover">
                {item.song?.albumArt ? <img src={item.song.albumArt} alt="" /> : <i className="fas fa-music" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--rs-text-tertiary)", fontSize: 12 }}></i>}
              </div>
              <div className="rs-ov-history-info">
                <div className="rs-ov-history-title">{item.song?.title || "Unknown"}</div>
                <div className="rs-ov-history-artist">{item.song?.artist || ""}</div>
              </div>
              <span className="rs-ov-history-time">{item.playedAt || ""}</span>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="rs-section-header">
        <h3 className="rs-section-title" style={{ fontSize: 16 }}>Quick Actions</h3>
      </div>
      <div className="rs-ov-actions">
        <button className="rs-ov-action-btn" onClick={() => {
          window.dispatchEvent(new CustomEvent("rs-navigate", { detail: { tab: "go-live" } }));
        }}>
          <div className="rs-ov-action-icon gold"><i className="fas fa-microphone"></i></div>
          <span>Go Live</span>
        </button>
        <button className="rs-ov-action-btn" onClick={() => window.dispatchEvent(new CustomEvent("rs-navigate", { detail: { tab: "media" } }))}>
          <div className="rs-ov-action-icon blue"><i className="fas fa-cloud-arrow-up"></i></div>
          <span>Upload Media</span>
        </button>
        <button className="rs-ov-action-btn" onClick={() => window.dispatchEvent(new CustomEvent("rs-navigate", { detail: { tab: "playlists" } }))}>
          <div className="rs-ov-action-icon purple"><i className="fas fa-list"></i></div>
          <span>New Playlist</span>
        </button>
      </div>

      {/* Listener Chart */}
      {analytics && (
        <>
          <div className="rs-section-header">
            <h3 className="rs-section-title" style={{ fontSize: 16 }}>Listeners (Last 24h)</h3>
            <span className="rs-section-subtitle">Peak: <strong>{analytics.peakConcurrent}</strong></span>
          </div>
          <div className="rs-ov-chart">
            {analytics.listenersOverTime.map((d, i) => (
              <div className="rs-ov-chart-bar" key={i}>
                <div className="rs-ov-chart-fill" style={{ height: `${(d.count / maxListeners) * 100}%` }}></div>
              </div>
            ))}
          </div>
          <div className="rs-ov-chart-labels">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>Now</span>
          </div>
        </>
      )}
    </>
  );
}
