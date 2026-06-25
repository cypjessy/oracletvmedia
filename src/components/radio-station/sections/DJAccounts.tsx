"use client";

import { useState, useEffect } from "react";
import { getStreamers, createStreamer, updateStreamer, deleteStreamer, type Streamer } from "@/lib/azuracast";

interface Props {
  showToast: (title: string, message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

export default function DJAccounts({ showToast }: Props) {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { getStreamers().then(setStreamers); }, []);

  const handleAdd = async () => {
    if (!addName.trim() || !addUsername.trim() || !addPassword.trim()) {
      showToast("Error", "Please fill all fields", "error"); return;
    }
    const newDj = await createStreamer({ displayName: addName, username: addUsername, password: addPassword });
    setStreamers((prev) => [...prev, newDj]);
    setShowAdd(false);
    setAddName(""); setAddUsername(""); setAddPassword("");
    showToast("DJ Added", `${addName} can now go live`, "success", 2500);
  };

  const handleEdit = async (dj: Streamer) => {
    await updateStreamer(dj.id, { displayName: editName, username: editUsername });
    setStreamers((prev) => prev.map((s) => s.id === dj.id ? { ...s, displayName: editName, username: editUsername } : s));
    setEditingId(null);
    showToast("DJ Updated", `${editName}'s credentials saved`, "success", 2000);
  };

  const handleDelete = async (dj: Streamer) => {
    await deleteStreamer(dj.id);
    setStreamers((prev) => prev.filter((s) => s.id !== dj.id));
    if (expandedId === dj.id) setExpandedId(null);
    showToast("DJ Removed", `${dj.displayName} has been deleted`, "success", 2500);
  };

  const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase();

  const colors = [
    "linear-gradient(135deg, #E8A838, #D4762A)",
    "linear-gradient(135deg, #8B5CF6, #A78BFA)",
    "linear-gradient(135deg, #3B82F6, #60A5FA)",
    "linear-gradient(135deg, #22C55E, #4ADE80)",
  ];

  return (
    <>
      <style>{`
        .rs-dj { display: flex; flex-direction: column; gap: 12px; }
        .rs-dj-card { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); overflow: hidden; }
        .rs-dj-card-header { display: flex; align-items: center; gap: 14px; padding: 14px; cursor: pointer; transition: all 0.15s ease; }
        .rs-dj-card-header:active { background: var(--rs-surface-elevated); }
        .rs-dj-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: #fff; flex-shrink: 0; position: relative; }
        .rs-dj-live-dot { position: absolute; bottom: 1px; right: 1px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--rs-bg); }
        .rs-dj-live-dot.online { background: var(--rs-success); animation: rsPulse 1.5s ease-in-out infinite; }
        .rs-dj-live-dot.offline { background: var(--rs-text-tertiary); }
        .rs-dj-info { flex: 1; min-width: 0; }
        .rs-dj-name { font-size: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .rs-dj-username { font-size: 12px; color: var(--rs-text-tertiary); margin-top: 2px; }
        .rs-dj-meta { font-size: 12px; color: var(--rs-text-secondary); margin-top: 2px; }
        .rs-dj-card-body { border-top: 1px solid var(--rs-border); padding: 12px 14px; background: var(--rs-bg); }
        .rs-dj-history-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--rs-border); font-size: 13px; }
        .rs-dj-history-item:last-child { border-bottom: none; }
        .rs-dj-history-date { color: var(--rs-text-tertiary); min-width: 70px; }
        .rs-dj-history-dur { color: var(--rs-text-secondary); }
        .rs-dj-history-time { color: var(--rs-text-tertiary); margin-left: auto; }
        .rs-dj-edit-form { display: flex; flex-direction: column; gap: 8px; padding: 12px 0; }
        .rs-dj-edit-actions { display: flex; gap: 8px; }
      `}</style>

      <div className="rs-dj">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>DJ Accounts</h3>
          <button className="rs-btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <i className="fas fa-plus"></i> {showAdd ? "Cancel" : "Add DJ"}
          </button>
        </div>

        {showAdd && (
          <div className="rs-card">
            <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>New DJ</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="rs-input" placeholder="Display Name" value={addName} onChange={(e) => setAddName(e.target.value)} />
              <div style={{ display: "flex", gap: 12 }}>
                <input className="rs-input" placeholder="Username" value={addUsername} onChange={(e) => setAddUsername(e.target.value)} />
                <input className="rs-input" type="password" placeholder="Password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="rs-btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="rs-btn-primary" onClick={handleAdd}>Add DJ</button>
              </div>
            </div>
          </div>
        )}

        {streamers.length === 0 ? (
          <div className="rs-empty">
            <i className="fas fa-user"></i>
            <h4>No DJs yet</h4>
            <p>Add DJ accounts so they can go live</p>
          </div>
        ) : (
          streamers.map((dj, idx) => {
            const isExpanded = expandedId === dj.id;
            const isEditing = editingId === dj.id;
            return (
              <div className="rs-dj-card" key={dj.id}>
                <div className="rs-dj-card-header" onClick={() => setExpandedId(isExpanded ? null : dj.id)}>
                  <div className="rs-dj-avatar" style={{ background: colors[idx % colors.length] }}>
                    {initials(dj.displayName)}
                    <span className={`rs-dj-live-dot ${dj.isLive ? "online" : "offline"}`}></span>
                  </div>
                  <div className="rs-dj-info">
                    <div className="rs-dj-name">
                      {dj.displayName}
                      {dj.isLive && <span className="rs-badge green" style={{ fontSize: 10 }}>LIVE</span>}
                    </div>
                    <div className="rs-dj-username">@{dj.username}</div>
                    <div className="rs-dj-meta">Last broadcast: {dj.lastBroadcast || "Never"}</div>
                  </div>
                  <span className="rs-section-subtitle">{dj.broadcastHistory.length} broadcasts</span>
                </div>
                {isExpanded && (
                  <div className="rs-dj-card-body">
                    {isEditing ? (
                      <div className="rs-dj-edit-form">
                        <input className="rs-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display Name" />
                        <input className="rs-input" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Username" />
                        <div className="rs-dj-edit-actions">
                          <button className="rs-btn-primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => handleEdit(dj)}>Save</button>
                          <button className="rs-btn-secondary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => setEditingId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <button className="rs-btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}
                            onClick={() => { setEditingId(dj.id); setEditName(dj.displayName); setEditUsername(dj.username); }}>
                            <i className="fas fa-pen"></i> Edit
                          </button>
                          <button className="rs-btn-danger" style={{ padding: "6px 12px", fontSize: 12 }}
                            onClick={() => handleDelete(dj)}>
                            <i className="fas fa-trash-can"></i> Delete
                          </button>
                        </div>
                        {dj.broadcastHistory.length > 0 && (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--rs-text-secondary)" }}>Broadcast History</div>
                            {dj.broadcastHistory.map((b, i) => (
                              <div className="rs-dj-history-item" key={i}>
                                <span className="rs-dj-history-date">{b.date}</span>
                                <span className="rs-dj-history-dur">{b.duration}</span>
                                <span className="rs-dj-history-time">{b.startTime}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </>
                    )}
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
