"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getEvents } from "@/lib/churchAiData";
import type { EventItem } from "@/lib/churchAdminData";

/**
 * Auto-advancing event carousel that fetches real events from Firestore.
 * Shows event images as background with info overlay, or text-only fallback.
 */
export default function EventCarousel() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch events from Firestore on mount
  useEffect(() => {
    let mounted = true;
    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        if (mounted) {
          // Sort by date ascending (soonest first)
          const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setEvents(sorted);
        }
      } catch {
        // No events or offline
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchEvents();
    return () => { mounted = false; };
  }, []);

  // Auto-advance every 4 seconds (unless paused or only 1 event)
  useEffect(() => {
    if (events.length <= 1 || paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 4000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [events.length, paused]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return { day, month, time };
  };

  if (loading) {
    return (
      <section className="feed-section ev-section">
        <div className="ev-header">
          <h2 className="ev-title"><i className="fas fa-calendar-alt"></i> Upcoming Events</h2>
        </div>
        <div className="ev-skeleton">
          <div className="ev-skeleton-card"></div>
          <div className="ev-skeleton-card"></div>
          <div className="ev-skeleton-card"></div>
        </div>
        <style>{`.ev-skeleton { display: flex; gap: 10px; overflow: hidden; }
        .ev-skeleton-card { width: 240px; height: 180px; border-radius: 16px; background: var(--surface-elevated); flex-shrink: 0; animation: skeletonPulse 1.5s ease-in-out infinite; }
        @keyframes skeletonPulse { 0%,100% { opacity:0.5; } 50% { opacity:0.3; } }`}</style>
      </section>
    );
  }

  if (events.length === 0) return null;

  const current = events[currentIndex] || events[0];

  return (
    <section className="feed-section ev-section">
      <div className="ev-header">
        <h2 className="ev-title"><i className="fas fa-calendar-alt"></i> Upcoming Events</h2>
        <button className="ev-see-all" onClick={() => window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Events", message: "Opening events page...", type: "info", duration: 1500 } }))}>
          See All <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <div
        className="ev-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setTimeout(() => setPaused(false), 3000)}
      >
        <div className="ev-track" style={{ transform: `translateX(-${currentIndex * 260}px)` }}>
          {events.map((ev, i) => {
            const d = formatEventDate(ev.date);
            return (
              <div key={ev.id} className={`ev-card ${i === currentIndex ? "active" : ""}`}>
                {/* Background image when available */}
                {ev.imageUrl && (
                  <>
                    <div className="ev-card-bg" style={{ backgroundImage: `url(${ev.imageUrl})` }} />
                    <div className="ev-card-overlay" />
                  </>
                )}
                <div className="ev-card-top">
                  <div className="ev-date-badge">
                    <span className="ev-date-day">{d.day}</span>
                    <span className="ev-date-month">{d.month}</span>
                  </div>
                  <div className="ev-card-icon">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                </div>
                <div className="ev-card-body">
                  <h3 className="ev-card-title">{ev.name}</h3>
                  <div className="ev-card-detail">
                    <i className="fas fa-clock"></i> {d.time}
                  </div>
                  {ev.location && (
                    <div className="ev-card-detail">
                      <i className="fas fa-location-dot"></i> {ev.location}
                    </div>
                  )}
                  {ev.desc && (
                    <div className="ev-card-desc">{ev.desc}</div>
                  )}
                </div>
                {ev.isPaid && ev.fee > 0 && (
                  <div className="ev-card-fee">Ksh {ev.fee}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dots */}
      {events.length > 1 && (
        <div className="ev-dots">
          {events.map((_, i) => (
            <button
              key={i}
              className={`ev-dot ${i === currentIndex ? "active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to event ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style>{`
        .ev-section { margin-top: 2px; }
        .ev-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .ev-title {
          font-size: 15px; font-weight: 700;
          display: flex; align-items: center; gap: 8px;
        }
        .ev-title i { color: var(--primary); font-size: 14px; }
        .ev-see-all {
          font-size: 12px; color: var(--primary); font-weight: 600;
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 4px;
          padding: 4px 8px; border-radius: 8px;
          transition: all 0.15s ease;
        }
        .ev-see-all:active { background: rgba(232,168,56,0.1); }

        .ev-carousel {
          overflow: hidden;
          border-radius: var(--radius-lg);
          position: relative;
        }
        .ev-track {
          display: flex; gap: 12px;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 2px 0;
        }
        .ev-card {
          min-width: 248px;
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 14px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .ev-card.active {
          border-color: rgba(232,168,56,0.25);
          box-shadow: 0 4px 20px rgba(232,168,56,0.06);
        }
        .ev-card:active { transform: scale(0.97); }
        .ev-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 3;
        }
        .ev-card.active::before { opacity: 1; }

        /* Background image for events that have one */
        .ev-card-bg {
          position: absolute; inset: 0;
          background-size: cover;
          background-position: center;
          z-index: 0;
        }
        .ev-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.2) 100%);
          z-index: 1;
        }

        /* Ensure content sits above background */
        .ev-card-top, .ev-card-body, .ev-card-fee {
          position: relative;
          z-index: 2;
        }

        .ev-card-top {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 10px;
        }
        .ev-date-badge {
          display: flex; flex-direction: column; align-items: center;
          background: rgba(232,168,56,0.08);
          border: 1px solid rgba(232,168,56,0.15);
          border-radius: 10px;
          padding: 4px 10px;
          min-width: 44px;
        }
        /* White text on image cards */
        .ev-card .ev-card-bg ~ .ev-card-top .ev-date-badge {
          background: rgba(0,0,0,0.5);
          border-color: rgba(255,255,255,0.15);
        }
        .ev-card .ev-card-bg ~ .ev-card-top .ev-date-badge .ev-date-month {
          color: rgba(255,255,255,0.7);
        }
        .ev-date-day {
          font-size: 18px; font-weight: 800; line-height: 1.2;
        }
        .ev-date-month {
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: var(--text-secondary);
        }
        .ev-card-icon {
          width: 32px; height: 32px; border-radius: 8px;
          background: rgba(232,168,56,0.1);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary); font-size: 14px;
          flex-shrink: 0;
        }
        .ev-card .ev-card-bg ~ .ev-card-top .ev-card-icon {
          background: rgba(232,168,56,0.3);
        }

        .ev-card-body { }
        .ev-card-title {
          font-size: 14px; font-weight: 700;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ev-card .ev-card-bg ~ .ev-card-body .ev-card-title {
          color: #fff;
        }
        .ev-card-detail {
          font-size: 12px; color: var(--text-secondary);
          display: flex; align-items: center; gap: 5px;
          margin-top: 3px;
        }
        .ev-card .ev-card-bg ~ .ev-card-body .ev-card-detail {
          color: rgba(255,255,255,0.8);
        }
        .ev-card-detail i { font-size: 10px; color: var(--text-tertiary); width: 14px; text-align: center; }
        .ev-card .ev-card-bg ~ .ev-card-body .ev-card-detail i {
          color: rgba(255,255,255,0.6);
        }
        .ev-card-desc {
          font-size: 11px; color: var(--text-tertiary);
          margin-top: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ev-card .ev-card-bg ~ .ev-card-body .ev-card-desc {
          color: rgba(255,255,255,0.6);
        }
        .ev-card-fee {
          position: absolute; top: 10px; right: 10px;
          font-size: 10px; font-weight: 700; color: var(--primary);
          background: rgba(232,168,56,0.1);
          padding: 2px 8px; border-radius: 6px;
        }
        .ev-card .ev-card-bg ~ .ev-card-fee {
          background: rgba(232,168,56,0.3);
          z-index: 2;
        }

        .ev-dots {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 10px;
        }
        .ev-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--border);
          border: none; cursor: pointer; padding: 0;
          transition: all 0.3s ease;
        }
        .ev-dot.active {
          width: 20px; border-radius: 4px;
          background: var(--primary);
        }
        .ev-dot:active { transform: scale(0.8); }
      `}</style>
    </section>
  );
}
