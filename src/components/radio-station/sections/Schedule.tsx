"use client";

import React, { useState } from "react";
import { MOCK_PLAYLISTS, type Playlist } from "@/lib/azuracast";

interface Props {
  showToast: (title: string, message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SCHEDULE_COLORS = [
  "linear-gradient(135deg, #E8A838, #D4762A)",
  "linear-gradient(135deg, #3B82F6, #60A5FA)",
  "linear-gradient(135deg, #8B5CF6, #A78BFA)",
  "linear-gradient(135deg, #22C55E, #4ADE80)",
  "linear-gradient(135deg, #EF4444, #F87171)",
];

interface ScheduledItem {
  day: number;
  startHour: number;
  endHour: number;
  playlistId: string;
}

function buildSchedule(playlists: Playlist[]): ScheduledItem[] {
  const items: ScheduledItem[] = [];
  playlists.forEach((pl) => {
    if (pl.type === "scheduled" && pl.schedule) {
      const startHour = parseInt(pl.schedule.startTime.split(":")[0]);
      const endHour = parseInt(pl.schedule.endTime.split(":")[0]) || startHour + 2;
      pl.schedule.days.forEach((day) => {
        items.push({ day, startHour, endHour, playlistId: pl.id });
      });
    }
  });
  return items;
}

export default function Schedule({ showToast }: Props) {
  const [playlists] = useState(MOCK_PLAYLISTS);
  const scheduledItems = buildSchedule(playlists);
  const todayIdx = new Date().getDay();

  const getPlaylist = (id: string) => playlists.find((p) => p.id === id);
  const getColor = (id: string) => SCHEDULE_COLORS[playlists.findIndex((p) => p.id === id) % SCHEDULE_COLORS.length];

  return (
    <>
      <style>{`
        .rs-sched { display: flex; flex-direction: column; gap: 12px; }
        .rs-sched-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .rs-sched-legend { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .rs-sched-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--rs-text-secondary); }
        .rs-sched-legend-dot { width: 10px; height: 10px; border-radius: 3px; }

        .rs-sched-grid-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .rs-sched-grid-wrapper::-webkit-scrollbar { display: none; }
        .rs-sched-grid { display: grid; grid-template-columns: 60px repeat(7, minmax(100px, 1fr)); min-width: 760px; border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); overflow: hidden; background: var(--rs-surface-card); }
        .rs-sched-header-cell { padding: 10px 6px; text-align: center; font-size: 12px; font-weight: 700; color: var(--rs-text-secondary); border-bottom: 1px solid var(--rs-border); border-right: 1px solid var(--rs-border); text-transform: uppercase; letter-spacing: 0.5px; }
        .rs-sched-header-cell:last-child { border-right: none; }
        .rs-sched-header-cell.today { color: var(--rs-primary); background: rgba(232,168,56,0.08); }
        .rs-sched-time-cell { padding: 8px 6px; text-align: center; font-size: 10px; color: var(--rs-text-tertiary); border-bottom: 1px solid var(--rs-border); border-right: 1px solid var(--rs-border); font-weight: 500; font-variant-numeric: tabular-nums; }
        .rs-sched-cell { position: relative; min-height: 32px; border-bottom: 1px solid var(--rs-border); border-right: 1px solid var(--rs-border); cursor: pointer; transition: all 0.15s ease; }
        .rs-sched-cell:last-child { border-right: none; }
        .rs-sched-cell:active { background: var(--rs-surface-elevated); }
        .rs-sched-cell.today-col { background: rgba(232,168,56,0.03); }
        .rs-sched-block { position: absolute; left: 2px; right: 2px; border-radius: 6px; padding: 3px 6px; color: #fff; font-size: 10px; font-weight: 600; overflow: hidden; cursor: pointer; transition: all 0.15s ease; z-index: 2; min-height: 22px; display: flex; align-items: center; gap: 4px; }
        .rs-sched-block:active { transform: scale(0.97); opacity: 0.9; }
        .rs-sched-block i { font-size: 8px; }
        .rs-sched-empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 9px; color: var(--rs-text-tertiary); opacity: 0; transition: opacity 0.2s ease; }
        .rs-sched-cell:hover .rs-sched-empty { opacity: 1; }
        .rs-sched-now-line { position: absolute; left: 0; right: 0; height: 2px; background: var(--rs-error); z-index: 3; display: flex; align-items: center; }
        .rs-sched-now-line::before { content: ''; width: 8px; height: 8px; background: var(--rs-error); border-radius: 50%; margin-left: -3px; }

        .rs-sched-info { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .rs-sched-info-title { font-size: 15px; font-weight: 700; }
        .rs-sched-info-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--rs-border); font-size: 13px; }
        .rs-sched-info-item:last-child { border-bottom: none; }
        .rs-sched-info-dot { width: 12px; height: 12px; border-radius: 4px; flex-shrink: 0; }
      `}</style>

      <div className="rs-sched">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Weekly Schedule</h3>
          <span className="rs-section-subtitle">AutoDJ fallback shown where nothing is scheduled</span>
        </div>

        {/* Legend */}
        <div className="rs-sched-header">
          <div className="rs-sched-legend">
            {playlists.filter((p) => p.type === "scheduled").map((pl) => (
              <div className="rs-sched-legend-item" key={pl.id}>
                <div className="rs-sched-legend-dot" style={{ background: getColor(pl.id) }}></div>
                {pl.name}
              </div>
            ))}
            <div className="rs-sched-legend-item">
              <div className="rs-sched-legend-dot" style={{ background: "var(--rs-surface-elevated)" }}></div>
              AutoDJ / Unscheduled
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="rs-sched-grid-wrapper">
          <div className="rs-sched-grid">
            {/* Header */}
            <div className="rs-sched-header-cell">Time</div>
            {DAYS.map((d, i) => (
              <div key={d} className={`rs-sched-header-cell ${i === todayIdx ? "today" : ""}`}>
                {d}
                <div style={{ fontSize: 10, fontWeight: 400, color: "var(--rs-text-tertiary)", marginTop: 1 }}>
                  {["Jun 24", "Jun 25", "Jun 26", "Jun 27", "Jun 28", "Jun 29", "Jun 30"][i]}
                </div>
              </div>
            ))}

            {/* Rows */}
            {HOURS.map((hour, h) => (
              <React.Fragment key={`hr-${h}`}>
                <div className="rs-sched-time-cell">{hour}</div>
                {DAYS.map((_, d) => {
                  const block = scheduledItems.find((s) => s.day === d && h >= s.startHour && h < s.endHour);
                  const isFirst = block && h === block.startHour;
                  const isToday = d === todayIdx;
                  const isCurrentHour = isToday && h === new Date().getHours();
                  return (
                    <div
                      key={`c-${d}-${h}`}
                      className={`rs-sched-cell ${isToday ? "today-col" : ""}`}
                      onClick={() => showToast("Create Event", "Click an empty slot to schedule a playlist", "info", 2000)}
                    >
                      {block && isFirst ? (
                        <div
                          className="rs-sched-block"
                          style={{
                            background: getColor(block.playlistId),
                            top: 0,
                            height: `${(block.endHour - block.startHour) * 32 + (block.endHour - block.startHour - 1) * 1}px`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const pl = getPlaylist(block.playlistId);
                            showToast(pl?.name || "Playlist", `Scheduled: ${block.startHour}:00 - ${block.endHour}:00`, "info", 3000);
                          }}
                        >
                          <i className="fas fa-list"></i>
                          {getPlaylist(block.playlistId)?.name || ""}
                        </div>
                      ) : block ? null : (
                        <div className="rs-sched-empty"><i className="fas fa-plus"></i></div>
                      )}
                      {isCurrentHour && <div className="rs-sched-now-line"></div>}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Currently Scheduled */}
        <div className="rs-sched-info">
          <div className="rs-sched-info-title">Scheduled Playlists</div>
          {playlists.filter((p) => p.type === "scheduled").length === 0 ? (
            <div className="rs-empty" style={{ padding: "20px 0" }}>
              <h4>No scheduled playlists</h4>
              <p>Create a scheduled playlist to see it on the calendar</p>
            </div>
          ) : (
            playlists.filter((p) => p.type === "scheduled").map((pl) => (
              <div className="rs-sched-info-item" key={pl.id}>
                <div className="rs-sched-info-dot" style={{ background: getColor(pl.id) }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{pl.name}</div>
                  <div style={{ fontSize: 12, color: "var(--rs-text-tertiary)" }}>
                    {pl.schedule?.days.map((d) => DAYS[d]).join(", ")} · {pl.schedule?.startTime} - {pl.schedule?.endTime}
                  </div>
                </div>
                <span className="rs-badge green">{pl.order}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
