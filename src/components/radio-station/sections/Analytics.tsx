"use client";

import { useState, useEffect } from "react";
import { getAnalytics, type AnalyticsReport } from "@/lib/azuracast";

interface Props {
  showToast: (title: string, message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

type Period = "today" | "7days" | "30days";

export default function Analytics({ showToast }: Props) {
  const [data, setData] = useState<AnalyticsReport | null>(null);
  const [period, setPeriod] = useState<Period>("today");

  useEffect(() => { getAnalytics().then(setData); }, []);

  if (!data) return <div className="rs-empty"><i className="fas fa-chart-line"></i><h4>Loading analytics...</h4></div>;

  const maxBar = Math.max(...data.topSongs.map((s) => s.plays), 1);
  const maxListeners = Math.max(...data.listenersOverTime.map((d) => d.count), 1);

  return (
    <>
      <style>{`
        .rs-an { display: flex; flex-direction: column; gap: 20px; }
        .rs-an-period { display: flex; gap: 8px; background: var(--rs-surface); border-radius: var(--rs-radius-md); padding: 4px; width: fit-content; }
        .rs-an-period-btn { padding: 8px 16px; border-radius: var(--rs-radius-sm); border: none; background: transparent; color: var(--rs-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .rs-an-period-btn.active { background: var(--rs-surface-elevated); color: var(--rs-text); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
        .rs-an-period-btn:active { transform: scale(0.95); }

        .rs-an-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .rs-an-stat { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); padding: 16px; }
        .rs-an-stat-label { font-size: 11px; font-weight: 600; color: var(--rs-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .rs-an-stat-value { font-size: 24px; font-weight: 800; letter-spacing: -0.3px; }
        .rs-an-stat-sub { font-size: 12px; color: var(--rs-text-tertiary); margin-top: 2px; }

        .rs-an-chart { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); padding: 18px; }
        .rs-an-chart-title { font-size: 15px; font-weight: 700; margin-bottom: 14px; }
        .rs-an-chart-bars { display: flex; align-items: flex-end; gap: 4px; height: 140px; }
        .rs-an-chart-bar { flex: 1; display: flex; align-items: flex-end; height: 100%; }
        .rs-an-chart-fill { width: 100%; border-radius: 3px 3px 0 0; background: linear-gradient(to top, rgba(232,168,56,0.3), var(--rs-primary)); transition: height 0.3s ease; min-height: 2px; cursor: pointer; position: relative; }
        .rs-an-chart-fill:hover { opacity: 0.8; }
        .rs-an-chart-labels { display: flex; justify-content: space-between; padding: 6px 2px 0; }
        .rs-an-chart-labels span { font-size: 10px; color: var(--rs-text-tertiary); }

        .rs-an-top { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); overflow: hidden; }
        .rs-an-top-header { padding: 14px 16px; border-bottom: 1px solid var(--rs-border); font-size: 15px; font-weight: 700; }
        .rs-an-top-item { display: flex; align-items: center; gap: 14px; padding: 10px 16px; border-bottom: 1px solid var(--rs-border); }
        .rs-an-top-item:last-child { border-bottom: none; }
        .rs-an-top-rank { width: 24px; font-size: 13px; font-weight: 700; color: var(--rs-text-tertiary); text-align: center; flex-shrink: 0; }
        .rs-an-top-rank.gold { color: var(--rs-primary); }
        .rs-an-top-info { flex: 1; min-width: 0; }
        .rs-an-top-title { font-size: 14px; font-weight: 600; }
        .rs-an-top-artist { font-size: 12px; color: var(--rs-text-secondary); }
        .rs-an-top-bar { width: 80px; height: 6px; background: var(--rs-surface-elevated); border-radius: 3px; overflow: hidden; }
        .rs-an-top-fill { height: 100%; background: linear-gradient(90deg, var(--rs-grad-start), var(--rs-grad-end)); border-radius: 3px; }
        .rs-an-top-plays { font-size: 13px; font-weight: 600; color: var(--rs-text-secondary); min-width: 40px; text-align: right; }

        .rs-an-history { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); overflow: hidden; }
        .rs-an-history-header { padding: 14px 16px; border-bottom: 1px solid var(--rs-border); font-size: 15px; font-weight: 700; }
        .rs-an-history-item { display: flex; align-items: center; gap: 14px; padding: 10px 16px; border-bottom: 1px solid var(--rs-border); font-size: 13px; }
        .rs-an-history-item:last-child { border-bottom: none; }
        .rs-an-history-date { color: var(--rs-text-tertiary); min-width: 70px; }
        .rs-an-history-dj { flex: 1; font-weight: 600; }
        .rs-an-history-dur { color: var(--rs-text-secondary); }

        @media (max-width: 480px) {
          .rs-an-stats { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="rs-an">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Analytics</h3>
          <div className="rs-an-period">
            {(["today", "7days", "30days"] as Period[]).map((p) => (
              <button key={p} className={`rs-an-period-btn ${period === p ? "active" : ""}`} onClick={() => setPeriod(p)}>
                {p === "today" ? "Today" : p === "7days" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="rs-an-stats">
          <div className="rs-an-stat">
            <div className="rs-an-stat-label">Listeners Today</div>
            <div className="rs-an-stat-value">{data.totalListeners.today}</div>
            <div className="rs-an-stat-sub">Current session</div>
          </div>
          <div className="rs-an-stat">
            <div className="rs-an-stat-label">This Week</div>
            <div className="rs-an-stat-value">{data.totalListeners.week}</div>
            <div className="rs-an-stat-sub">Unique listeners</div>
          </div>
          <div className="rs-an-stat">
            <div className="rs-an-stat-label">This Month</div>
            <div className="rs-an-stat-value">{data.totalListeners.month}</div>
            <div className="rs-an-stat-sub">Total reach</div>
          </div>
          <div className="rs-an-stat">
            <div className="rs-an-stat-label">Peak Concurrent</div>
            <div className="rs-an-stat-value">{data.peakConcurrent}</div>
            <div className="rs-an-stat-sub"><i className="fas fa-arrow-up" style={{ color: "var(--rs-success)", fontSize: 10 }}></i> All time high</div>
          </div>
        </div>

        {/* Listeners Over Time */}
        <div className="rs-an-chart">
          <div className="rs-an-chart-title">Listeners Over Time</div>
          <div className="rs-an-chart-bars">
            {data.listenersOverTime.map((d, i) => (
              <div className="rs-an-chart-bar" key={i}>
                <div
                  className="rs-an-chart-fill"
                  style={{ height: `${(d.count / maxListeners) * 100}%` }}
                  onClick={() => showToast(`${d.time}:00`, `${d.count} listeners`, "info", 2000)}
                ></div>
              </div>
            ))}
          </div>
          <div className="rs-an-chart-labels">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>Now</span>
          </div>
        </div>

        {/* Top 10 Songs */}
        <div className="rs-an-top">
          <div className="rs-an-top-header">Top Songs Played</div>
          {data.topSongs.map((song, i) => (
            <div className="rs-an-top-item" key={i}>
              <div className={`rs-an-top-rank ${i < 3 ? "gold" : ""}`}>#{i + 1}</div>
              <div className="rs-an-top-info">
                <div className="rs-an-top-title">{song.title}</div>
                <div className="rs-an-top-artist">{song.artist}</div>
              </div>
              <div className="rs-an-top-bar">
                <div className="rs-an-top-fill" style={{ width: `${(song.plays / maxBar) * 100}%` }}></div>
              </div>
              <div className="rs-an-top-plays">{song.plays}</div>
            </div>
          ))}
        </div>

        {/* Broadcast History */}
        <div className="rs-an-history">
          <div className="rs-an-history-header">Recent Broadcasts</div>
          {data.broadcastHistory.map((b, i) => (
            <div className="rs-an-history-item" key={i}>
              <span className="rs-an-history-date">{b.date}</span>
              <span className="rs-an-history-dj">{b.dj}</span>
              <span className="rs-an-history-dur">{b.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
