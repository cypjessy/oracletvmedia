"use client";

import { useState, useEffect } from "react";
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook, toggleWebhook, type Webhook } from "@/lib/azuracast";

interface Props {
  showToast: (title: string, message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

const ALL_EVENTS = [
  { id: "song_changed", label: "Song Changed" },
  { id: "dj_connected", label: "DJ Connected" },
  { id: "dj_disconnected", label: "DJ Disconnected" },
  { id: "station_online", label: "Station Online" },
  { id: "station_offline", label: "Station Offline" },
  { id: "listener_milestone", label: "Listener Milestone" },
];

export default function Webhooks({ showToast }: Props) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [addSecret, setAddSecret] = useState("");
  const [addEvents, setAddEvents] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { getWebhooks().then(setWebhooks); }, []);

  const toggleEvent = (id: string) => {
    setAddEvents((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (!addUrl.trim()) { showToast("Error", "Please enter an endpoint URL", "error"); return; }
    if (addEvents.length === 0) { showToast("Error", "Select at least one event", "error"); return; }
    const wh = await createWebhook({ url: addUrl, events: addEvents, secret: addSecret });
    setWebhooks((prev) => [...prev, wh]);
    setShowAdd(false);
    setAddUrl(""); setAddSecret(""); setAddEvents([]);
    showToast("Webhook Created", "Webhook has been added", "success", 2500);
  };

  const handleToggle = async (wh: Webhook) => {
    const updated = await toggleWebhook(wh.id);
    setWebhooks((prev) => prev.map((w) => w.id === wh.id ? { ...w, enabled: !w.enabled } : w));
    showToast(!wh.enabled ? "Webhook Enabled" : "Webhook Disabled", `Endpoint ${!wh.enabled ? "activated" : "deactivated"}`, "info", 2000);
  };

  const handleTest = async (wh: Webhook) => {
    const result = await testWebhook(wh.id);
    showToast(result.success ? "Test Sent" : "Test Failed", result.success ? `Test ping sent to ${wh.url}` : "Could not reach endpoint", result.success ? "success" : "error", 3000);
  };

  const handleDelete = async (wh: Webhook) => {
    await deleteWebhook(wh.id);
    setWebhooks((prev) => prev.filter((w) => w.id !== wh.id));
    if (expandedId === wh.id) setExpandedId(null);
    showToast("Webhook Deleted", "Endpoint has been removed", "success", 2500);
  };

  return (
    <>
      <style>{`
        .rs-wh { display: flex; flex-direction: column; gap: 12px; }
        .rs-wh-card { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); overflow: hidden; }
        .rs-wh-card-header { display: flex; align-items: center; gap: 14px; padding: 14px; cursor: pointer; transition: all 0.15s ease; }
        .rs-wh-card-header:active { background: var(--rs-surface-elevated); }
        .rs-wh-icon { width: 36px; height: 36px; border-radius: var(--rs-radius-sm); background: rgba(59,130,246,0.12); color: var(--rs-grad-blue); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .rs-wh-info { flex: 1; min-width: 0; }
        .rs-wh-url { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace; }
        .rs-wh-events { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
        .rs-wh-event-tag { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: var(--rs-surface-elevated); color: var(--rs-text-tertiary); }
        .rs-wh-card-body { border-top: 1px solid var(--rs-border); padding: 12px 14px; background: var(--rs-bg); animation: rsFadeUp 0.2s ease; }
        .rs-wh-actions { display: flex; gap: 8px; margin-bottom: 10px; }
        .rs-wh-secret { font-size: 12px; color: var(--rs-text-secondary); padding: 6px 8px; background: var(--rs-surface-elevated); border-radius: 6px; font-family: monospace; word-break: break-all; }

        .rs-wh-form { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); padding: 18px; display: flex; flex-direction: column; gap: 14px; animation: rsFadeUp 0.25s ease; }
        .rs-wh-form-title { font-size: 16px; font-weight: 700; }
        .rs-wh-events-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .rs-wh-event-btn { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--rs-radius-sm); border: 1.5px solid var(--rs-border); background: var(--rs-surface); color: var(--rs-text-secondary); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .rs-wh-event-btn:active { transform: scale(0.97); }
        .rs-wh-event-btn.selected { border-color: var(--rs-primary); background: rgba(232,168,56,0.08); color: var(--rs-primary); }
        .rs-wh-event-btn i { font-size: 12px; }
        .rs-wh-form-actions { display: flex; gap: 10px; justify-content: flex-end; }
      `}</style>

      <div className="rs-wh">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>Webhooks</h3>
          <button className="rs-btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <i className="fas fa-plus"></i> {showAdd ? "Cancel" : "Add Webhook"}
          </button>
        </div>

        {showAdd && (
          <div className="rs-wh-form">
            <div className="rs-wh-form-title">New Webhook</div>
            <input className="rs-input" placeholder="https://hooks.example.com/notify" value={addUrl} onChange={(e) => setAddUrl(e.target.value)} />
            <div>
              <div className="rs-gl-label" style={{ marginBottom: 8 }}>Events</div>
              <div className="rs-wh-events-grid">
                {ALL_EVENTS.map((ev) => (
                  <button key={ev.id} className={`rs-wh-event-btn ${addEvents.includes(ev.id) ? "selected" : ""}`} onClick={() => toggleEvent(ev.id)}>
                    <i className={`fas ${addEvents.includes(ev.id) ? "fa-square-check" : "fa-square"}`}></i>
                    {ev.label}
                  </button>
                ))}
              </div>
            </div>
            <input className="rs-input" placeholder="Secret key (optional)" value={addSecret} onChange={(e) => setAddSecret(e.target.value)} />
            <div className="rs-wh-form-actions">
              <button className="rs-btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="rs-btn-primary" onClick={handleCreate}>Create Webhook</button>
            </div>
          </div>
        )}

        {webhooks.length === 0 ? (
          <div className="rs-empty">
            <i className="fas fa-link"></i>
            <h4>No webhooks configured</h4>
            <p>Add webhooks to integrate with Slack, Discord, Telegram, and more</p>
          </div>
        ) : (
          webhooks.map((wh) => {
            const isExpanded = expandedId === wh.id;
            return (
              <div className="rs-wh-card" key={wh.id}>
                <div className="rs-wh-card-header" onClick={() => setExpandedId(isExpanded ? null : wh.id)}>
                  <div className="rs-wh-icon"><i className="fas fa-link"></i></div>
                  <div className="rs-wh-info">
                    <div className="rs-wh-url">{wh.url}</div>
                    <div className="rs-wh-events">
                      {wh.events.map((ev) => (
                        <span className="rs-wh-event-tag" key={ev}>{ALL_EVENTS.find((e) => e.id === ev)?.label || ev}</span>
                      ))}
                    </div>
                  </div>
                  <span className={`rs-badge ${wh.enabled ? "green" : "gray"}`}>{wh.enabled ? "Active" : "Disabled"}</span>
                </div>
                {isExpanded && (
                  <div className="rs-wh-card-body">
                    <div className="rs-wh-actions">
                      <button className="rs-btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleTest(wh)}>
                        <i className="fas fa-flask"></i> Test
                      </button>
                      <button className={`rs-btn-${wh.enabled ? "danger" : "primary"}`} style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleToggle(wh)}>
                        <i className={`fas ${wh.enabled ? "fa-pause" : "fa-play"}`}></i>
                        {wh.enabled ? "Disable" : "Enable"}
                      </button>
                      <button className="rs-btn-danger" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => handleDelete(wh)}>
                        <i className="fas fa-trash-can"></i> Delete
                      </button>
                    </div>
                    {wh.secret && (
                      <div className="rs-wh-secret">Secret: {wh.secret}</div>
                    )}
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                      {ALL_EVENTS.map((ev) => (
                        <span key={ev.id} className={`rs-wh-event-tag ${wh.events.includes(ev.id) ? "rs-badge green" : "rs-badge gray"}`} style={{ fontSize: 11 }}>
                          <i className={`fas ${wh.events.includes(ev.id) ? "fa-check" : "fa-xmark"}`} style={{ fontSize: 9, marginRight: 4 }}></i>
                          {ev.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
