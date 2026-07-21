"use client";

import { useState, useEffect } from "react";
import { getSettings, updateSettings, type StationSettings as StationSettingsType } from "@/lib/azuracast";

interface Props {
  showToast: (title: string, message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

export default function Settings({ showToast }: Props) {
  const [settings, setSettings] = useState<StationSettingsType | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { getSettings().then(setSettings); }, []);

  if (!settings) return <div className="rs-empty"><i className="fas fa-gear"></i><h4>Loading settings...</h4></div>;

  const update = async (data: Partial<StationSettingsType>) => {
    const result = await updateSettings(data);
    setSettings(result);
    showToast("Settings Saved", "Station configuration updated", "success", 2500);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("Copied", `${label} copied to clipboard`, "success", 2000);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showToast("Error", "Failed to copy", "error");
    }
  };

  return (
    <>
      <style>{`
        .rs-set { display: flex; flex-direction: column; gap: 20px; }
        .rs-set-card { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); overflow: hidden; }
        .rs-set-card-title { padding: 14px 16px; border-bottom: 1px solid var(--rs-border); font-size: 15px; font-weight: 700; }
        .rs-set-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--rs-border); }
        .rs-set-item:last-child { border-bottom: none; }
        .rs-set-icon { width: 36px; height: 36px; border-radius: var(--rs-radius-sm); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .rs-set-icon.gold { background: rgba(112,72,232,0.12); color: var(--rs-primary); }
        .rs-set-icon.blue { background: rgba(59,130,246,0.12); color: var(--rs-grad-blue); }
        .rs-set-icon.purple { background: rgba(139,92,246,0.12); color: var(--rs-grad-purple); }
        .rs-set-icon.green { background: rgba(34,197,94,0.12); color: var(--rs-grad-green); }
        .rs-set-icon.gray { background: var(--rs-surface-elevated); color: var(--rs-text-secondary); }
        .rs-set-content { flex: 1; min-width: 0; }
        .rs-set-label { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
        .rs-set-desc { font-size: 12px; color: var(--rs-text-secondary); }

        .rs-set-copy-row { display: flex; align-items: center; gap: 8px; }
        .rs-set-copy-value { font-size: 12px; color: var(--rs-text-tertiary); font-family: monospace; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: var(--rs-surface); padding: 6px 10px; border-radius: 6px; }
        .rs-set-copy-btn { padding: 6px 12px; border-radius: 6px; background: var(--rs-surface-elevated); border: none; color: var(--rs-text-secondary); font-size: 12px; cursor: pointer; white-space: nowrap; display: flex; align-items: center; gap: 4px; }
        .rs-set-copy-btn:active { transform: scale(0.95); }
        .rs-set-copy-btn i { font-size: 11px; }

        .rs-set-danger { margin-top: 8px; background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.15); border-radius: var(--rs-radius-lg); overflow: hidden; }
        .rs-set-danger-title { padding: 12px 16px; font-size: 12px; font-weight: 700; color: var(--rs-error); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(239,68,68,0.1); }
        .rs-set-danger-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
        .rs-set-danger-info h4 { font-size: 14px; font-weight: 600; }
        .rs-set-danger-info p { font-size: 12px; color: var(--rs-text-tertiary); }
        .rs-set-danger-btn { padding: 6px 14px; border-radius: 8px; background: rgba(239,68,68,0.12); border: 1.5px solid rgba(239,68,68,0.2); color: var(--rs-error); font-size: 12px; font-weight: 700; cursor: pointer; }
        .rs-set-danger-btn:active { background: rgba(239,68,68,0.2); transform: scale(0.95); }
      `}</style>

      <div className="rs-set">
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>Station Settings</h3>

        {/* General */}
        <div className="rs-set-card">
          <div className="rs-set-card-title">General</div>
          <div className="rs-set-item">
            <div className="rs-set-icon gold"><i className="fas fa-church"></i></div>
            <div className="rs-set-content">
              <div className="rs-set-label">Station Name</div>
              <input className="rs-input" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} onBlur={() => update({ name: settings.name })} />
            </div>
          </div>
          <div className="rs-set-item">
            <div className="rs-set-icon blue"><i className="fas fa-tower-broadcast"></i></div>
            <div className="rs-set-content">
              <div className="rs-set-label">Stream URL</div>
              <div className="rs-set-copy-row">
                <span className="rs-set-copy-value">{settings.streamUrl}</span>
                <button className="rs-set-copy-btn" onClick={() => copyToClipboard(settings.streamUrl, "Stream URL")}>
                  <i className={`fas ${copied ? "fa-check" : "fa-copy"}`}></i> Copy
                </button>
              </div>
            </div>
          </div>
          <div className="rs-set-item">
            <div className="rs-set-icon purple"><i className="fas fa-globe"></i></div>
            <div className="rs-set-content">
              <div className="rs-set-label">Public Page URL</div>
              <div className="rs-set-copy-row">
                <span className="rs-set-copy-value">{settings.publicPageUrl}</span>
                <button className="rs-set-copy-btn" onClick={() => copyToClipboard(settings.publicPageUrl, "Public Page URL")}>
                  <i className="fas fa-copy"></i> Copy
                </button>
              </div>
            </div>
          </div>
          <div className="rs-set-item">
            <div className="rs-set-icon blue"><i className="fas fa-server"></i></div>
            <div className="rs-set-content">
              <div className="rs-set-label">Mount Point</div>
              <span className="rs-set-desc" style={{ fontFamily: "monospace" }}>{settings.mountPoint}</span>
            </div>
          </div>
        </div>

        {/* Streaming */}
        <div className="rs-set-card">
          <div className="rs-set-card-title">Streaming</div>
          <div className="rs-set-item">
            <div className="rs-set-icon green"><i className="fas fa-headphones"></i></div>
            <div className="rs-set-content">
              <div className="rs-set-label">AutoDJ</div>
              <div className="rs-set-desc">Automatically play music from playlists</div>
            </div>
            <button className={`rs-toggle ${settings.autoDJ ? "active" : ""}`} onClick={() => update({ autoDJ: !settings.autoDJ })}></button>
          </div>
          <div className="rs-set-item">
            <div className="rs-set-icon gold"><i className="fas fa-users"></i></div>
            <div className="rs-set-content">
              <div className="rs-set-label">Max Listeners</div>
              <input type="number" className="rs-input" value={settings.maxListeners} onChange={(e) => setSettings({ ...settings, maxListeners: parseInt(e.target.value) || 500 })} onBlur={() => update({ maxListeners: settings.maxListeners })} min={1} style={{ maxWidth: 120 }} />
            </div>
          </div>
          <div className="rs-set-item">
            <div className="rs-set-icon purple"><i className="fas fa-sliders"></i></div>
            <div className="rs-set-content">
              <div className="rs-set-label">Default Bitrate</div>
              <select className="rs-select" value={settings.defaultBitrate} onChange={(e) => { const v = parseInt(e.target.value); setSettings({ ...settings, defaultBitrate: v }); update({ defaultBitrate: v }); }} style={{ maxWidth: 160 }}>
                <option value={128}>128 kbps</option>
                <option value={192}>192 kbps</option>
                <option value={256}>256 kbps</option>
                <option value={320}>320 kbps</option>
              </select>
            </div>
          </div>
          <div className="rs-set-item">
            <div className="rs-set-icon green"><i className="fas fa-eye"></i></div>
            <div className="rs-set-content">
              <div className="rs-set-label">Public Page Visible</div>
              <div className="rs-set-desc">Allow unauthenticated access to the public radio page</div>
            </div>
            <button className={`rs-toggle ${settings.publicPageVisible ? "active" : ""}`} onClick={() => update({ publicPageVisible: !settings.publicPageVisible })}></button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rs-set-danger">
          <div className="rs-set-danger-title">Danger Zone</div>
          <div className="rs-set-danger-item">
            <div className="rs-set-danger-info">
              <h4>Reset Station</h4>
              <p>Clear all playlists, media, and settings</p>
            </div>
            <button className="rs-set-danger-btn" onClick={() => showToast("Reset Station", "This feature is not yet implemented", "info")}>Reset</button>
          </div>
          <div className="rs-set-danger-item">
            <div className="rs-set-danger-info">
              <h4>Delete Station</h4>
              <p>Permanently remove this radio station</p>
            </div>
            <button className="rs-set-danger-btn" onClick={() => showToast("Delete Station", "This feature is not yet implemented", "info")}>Delete</button>
          </div>
        </div>
      </div>
    </>
  );
}
