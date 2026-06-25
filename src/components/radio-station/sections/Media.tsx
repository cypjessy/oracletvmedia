"use client";

import { useState, useEffect } from "react";
import { getStationFiles, MOCK_PLAYLISTS, deleteStationFiles, addSongsToPlaylist, type StationFile } from "@/lib/azuracast";

interface Props {
  showToast: (title: string, message: string, type?: "success" | "error" | "info", duration?: number) => void;
}

export default function Media({ showToast }: Props) {
  const [files, setFiles] = useState<StationFile[]>([]);
  const [search, setSearch] = useState("");
  const [filterPlaylist, setFilterPlaylist] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editAlbum, setEditAlbum] = useState("");
  const [showActions, setShowActions] = useState<string | null>(null);
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ id: string; name: string; pct: number }[]>([]);

  useEffect(() => { getStationFiles().then(setFiles); }, []);

  const filtered = files.filter((f) => {
    const s = search.toLowerCase();
    const matchSearch = !search || f.title.toLowerCase().includes(s) || f.artist.toLowerCase().includes(s) || f.album.toLowerCase().includes(s);
    const matchPlaylist = !filterPlaylist || f.playlists.includes(filterPlaylist);
    return matchSearch && matchPlaylist;
  });

  const allSelected = filtered.length > 0 && filtered.every((f) => selectedIds.has(f.id));

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const simulateUpload = () => {
    const id = "up_" + Date.now();
    setUploadProgress((p) => [...p, { id, name: "Sermon_2024_06_23.mp3", pct: 0 }]);
    const interval = setInterval(() => {
      setUploadProgress((p) => p.map((u) => u.id === id ? { ...u, pct: Math.min(100, u.pct + Math.random() * 15 + 3) } : u));
    }, 300);
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress((p) => p.filter((u) => u.id !== id));
      showToast("Upload Complete", "File added to media library", "success", 3000);
    }, 3000);
  };

  const addToPlaylist = (plId: string) => {
    const pl = MOCK_PLAYLISTS.find((p) => p.id === plId);
    showToast("Added to Playlist", `${selectedIds.size} tracks added to "${pl?.name}"`, "success", 2500);
    setPlaylistPickerOpen(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    showToast("Files Deleted", `${selectedIds.size} tracks removed`, "success", 2500);
    setSelectedIds(new Set());
  };

  return (
    <>
      <style>{`
        .rs-media { display: flex; flex-direction: column; gap: 14px; }
        .rs-media-zone { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 28px 20px; background: var(--rs-surface-card); border: 2px dashed var(--rs-border); border-radius: var(--rs-radius-lg); cursor: pointer; transition: all 0.25s ease; text-align: center; }
        .rs-media-zone:active { border-color: var(--rs-primary); background: var(--rs-surface-elevated); }
        .rs-media-zone i { font-size: 36px; color: var(--rs-text-tertiary); }
        .rs-media-zone h4 { font-size: 15px; font-weight: 600; }
        .rs-media-zone p { font-size: 13px; color: var(--rs-text-tertiary); }

        .rs-media-progress { display: flex; flex-direction: column; gap: 8px; }
        .rs-media-progress-item { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-md); padding: 10px 14px; animation: rsFadeUp 0.2s ease; }
        .rs-media-progress-info { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .rs-media-progress-name { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .rs-media-progress-name i { color: var(--rs-primary); }
        .rs-media-progress-pct { font-size: 12px; font-weight: 700; color: var(--rs-primary); }
        .rs-media-progress-bar { width: 100%; height: 4px; background: var(--rs-surface-elevated); border-radius: 2px; overflow: hidden; }
        .rs-media-progress-fill { height: 100%; background: linear-gradient(90deg, var(--rs-grad-start), var(--rs-grad-end)); border-radius: 2px; transition: width 0.3s ease; }

        .rs-media-toolbar { display: flex; flex-direction: column; gap: 10px; }
        .rs-media-search { position: relative; }
        .rs-media-search i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--rs-text-tertiary); font-size: 15px; }
        .rs-media-search input { width: 100%; padding: 12px 14px 12px 42px; background: var(--rs-surface-card); border: 1.5px solid var(--rs-border); border-radius: var(--rs-radius-md); color: var(--rs-text); font-size: 14px; font-weight: 500; outline: none; }
        .rs-media-search input:focus { border-color: var(--rs-primary); }
        .rs-media-search input::placeholder { color: var(--rs-text-tertiary); }
        .rs-media-count { font-size: 12px; color: var(--rs-text-tertiary); text-align: right; }

        .rs-media-bulk { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: rgba(232,168,56,0.08); border: 1px solid rgba(232,168,56,0.15); border-radius: var(--rs-radius-md); animation: rsFadeUp 0.2s ease; }
        .rs-media-bulk-count { font-size: 13px; font-weight: 700; color: var(--rs-primary); }
        .rs-media-bulk-actions { display: flex; gap: 8px; flex: 1; justify-content: flex-end; }
        .rs-media-bulk-btn { padding: 6px 12px; border-radius: var(--rs-radius-sm); font-size: 12px; font-weight: 600; cursor: pointer; border: none; background: var(--rs-surface-elevated); color: var(--rs-text); display: flex; align-items: center; gap: 4px; }
        .rs-media-bulk-btn:active { transform: scale(0.95); }
        .rs-media-bulk-btn.danger { background: rgba(239,68,68,0.12); color: var(--rs-error); }

        .rs-media-list { background: var(--rs-surface-card); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); overflow: hidden; }
        .rs-media-item { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-bottom: 1px solid var(--rs-border); transition: all 0.15s ease; position: relative; }
        .rs-media-item:last-child { border-bottom: none; }
        .rs-media-item.selected { background: rgba(232,168,56,0.04); }
        .rs-media-cb { width: 20px; height: 20px; border-radius: 6px; border: 2px solid var(--rs-border); flex-shrink: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
        .rs-media-cb.checked { background: var(--rs-primary); border-color: var(--rs-primary); }
        .rs-media-cb i { font-size: 10px; color: #fff; }
        .rs-media-art { width: 40px; height: 40px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--rs-surface-elevated); display: flex; align-items: center; justify-content: center; }
        .rs-media-art img { width: 100%; height: 100%; object-fit: cover; }
        .rs-media-art i { font-size: 16px; color: var(--rs-text-tertiary); }
        .rs-media-info { flex: 1; min-width: 0; }
        .rs-media-title { font-size: 14px; font-weight: 600; }
        .rs-media-artist { font-size: 12px; color: var(--rs-text-secondary); }
        .rs-media-tags { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
        .rs-media-tag { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; background: var(--rs-surface-elevated); color: var(--rs-text-tertiary); }
        .rs-media-menu { width: 30px; height: 30px; border-radius: 50%; background: none; border: none; color: var(--rs-text-tertiary); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .rs-media-menu:hover { background: var(--rs-surface); }

        .rs-media-sheet { position: absolute; z-index: 100; background: var(--rs-surface-elevated); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-md); padding: 6px; box-shadow: var(--rs-shadow-elevated); min-width: 200px; }
        .rs-media-sheet-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; background: none; border: none; color: var(--rs-text); width: 100%; text-align: left; cursor: pointer; font-size: 13px; }
        .rs-media-sheet-item:active { background: var(--rs-surface-hover); }
        .rs-media-sheet-item i { width: 20px; }

        .rs-media-modal-overlay { position: fixed; inset: 0; background: var(--rs-overlay); z-index: 9000; }
        .rs-media-modal { position: fixed; bottom: 0; left: 0; right: 0; z-index: 9001; max-width: 480px; margin: 0 auto; background: var(--rs-surface); border-radius: 28px 28px 0 0; animation: rsFadeUp 0.35s ease; max-height: 70vh; display: flex; flex-direction: column; }
        .rs-media-modal-handle { width: 40px; height: 5px; background: var(--rs-text-tertiary); border-radius: 3px; margin: 12px auto 8px; opacity: 0.5; }
        .rs-media-modal-header { padding: 8px 24px 16px; text-align: center; }
        .rs-media-modal-header h2 { font-size: 18px; font-weight: 700; }
        .rs-media-modal-body { flex: 1; overflow-y: auto; padding: 0 24px 20px; }
        .rs-media-pl-item { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--rs-border); cursor: pointer; }
        .rs-media-pl-item:last-child { border-bottom: none; }
        .rs-media-pl-item:active { opacity: 0.6; }
        .rs-media-pl-icon { width: 36px; height: 36px; border-radius: var(--rs-radius-sm); background: rgba(232,168,56,0.1); color: var(--rs-primary); display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .rs-media-pl-name { font-size: 15px; font-weight: 600; }
        .rs-media-pl-arrow { color: var(--rs-text-tertiary); font-size: 12px; margin-left: auto; }

        .rs-media-edit { display: flex; flex-direction: column; gap: 4px; }
        .rs-media-edit input { padding: 6px 8px; border-radius: 6px; background: var(--rs-surface-elevated); border: 1.5px solid var(--rs-border); color: var(--rs-text); font-size: 13px; outline: none; }
        .rs-media-edit input:focus { border-color: var(--rs-primary); }
        .rs-media-edit-actions { display: flex; gap: 6px; }
        .rs-media-edit-save { padding: 4px 10px; border-radius: 6px; background: linear-gradient(135deg, var(--rs-grad-start), var(--rs-grad-end)); color: #fff; font-size: 11px; font-weight: 600; border: none; cursor: pointer; }
        .rs-media-edit-cancel { padding: 4px 10px; border-radius: 6px; background: var(--rs-surface-elevated); color: var(--rs-text-secondary); font-size: 11px; font-weight: 600; border: none; cursor: pointer; }
      `}</style>

      <div className="rs-media">
        {/* Upload Zone */}
        <div className="rs-media-zone" onClick={simulateUpload}>
          <i className="fas fa-cloud-arrow-up"></i>
          <h4>Tap to Upload or Drag & Drop</h4>
          <p>MP3, AAC, OGG, FLAC — up to 50MB</p>
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="rs-media-progress">
            {uploadProgress.map((u) => (
              <div className="rs-media-progress-item" key={u.id}>
                <div className="rs-media-progress-info">
                  <span className="rs-media-progress-name"><i className="fas fa-file-audio"></i> {u.name}</span>
                  <span className="rs-media-progress-pct">{Math.round(u.pct)}%</span>
                </div>
                <div className="rs-media-progress-bar">
                  <div className="rs-media-progress-fill" style={{ width: `${u.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filter */}
        <div className="rs-media-toolbar">
          <div className="rs-media-search">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search by title, artist, album..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="rs-select" value={filterPlaylist} onChange={(e) => setFilterPlaylist(e.target.value)}>
            <option value="">All Playlists</option>
            {MOCK_PLAYLISTS.map((pl) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="rs-media-bulk">
            <span className="rs-media-bulk-count">{selectedIds.size} selected</span>
            <div className="rs-media-bulk-actions">
              <button className="rs-media-bulk-btn" onClick={() => setPlaylistPickerOpen(true)}>
                <i className="fas fa-list"></i> Add to Playlist
              </button>
              <button className="rs-media-bulk-btn danger" onClick={handleBulkDelete}>
                <i className="fas fa-trash-can"></i> Delete
              </button>
            </div>
          </div>
        )}

        <div className="rs-media-count">{filtered.length} of {files.length} files</div>

        {/* File List */}
        <div className="rs-media-list">
          {filtered.length === 0 ? (
            <div className="rs-empty">
              <i className="fas fa-music"></i>
              <h4>No files found</h4>
              <p>Try adjusting your search or filter</p>
            </div>
          ) : (
            filtered.map((file) => {
              const isEditing = editingFile === file.id;
              return (
                <div className={`rs-media-item ${selectedIds.has(file.id) ? "selected" : ""}`} key={file.id}>
                  <div className={`rs-media-cb ${selectedIds.has(file.id) ? "checked" : ""}`} onClick={() => toggleSelect(file.id)}>
                    {selectedIds.has(file.id) && <i className="fas fa-check"></i>}
                  </div>
                  <div className="rs-media-art">
                    {file.albumArt ? <img src={file.albumArt} alt="" /> : <i className="fas fa-music"></i>}
                  </div>
                  <div className="rs-media-info">
                    {isEditing ? (
                      <div className="rs-media-edit">
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                        <input value={editArtist} onChange={(e) => setEditArtist(e.target.value)} placeholder="Artist" />
                        <input value={editAlbum} onChange={(e) => setEditAlbum(e.target.value)} placeholder="Album" />
                        <div className="rs-media-edit-actions">
                          <button className="rs-media-edit-save" onClick={() => { showToast("Saved", "Metadata updated", "success", 2000); setEditingFile(null); }}>Save</button>
                          <button className="rs-media-edit-cancel" onClick={() => setEditingFile(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rs-media-title">{file.title}</div>
                        <div className="rs-media-artist">{file.artist} · {file.album}</div>
                        <div className="rs-media-tags">
                          <span className="rs-media-tag">{file.genre}</span>
                          <span className="rs-media-tag">{file.duration}</span>
                          <span className="rs-media-tag">{file.size}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <button className="rs-media-menu" onClick={() => setShowActions(showActions === file.id ? null : file.id)}>
                    <i className="fas fa-ellipsis-vertical"></i>
                  </button>
                  {showActions === file.id && (
                    <div className="rs-media-sheet" style={{ position: "absolute", right: 0, top: "100%", zIndex: 100 }}>
                      <button className="rs-media-sheet-item" onClick={() => { setEditingFile(file.id); setEditTitle(file.title); setEditArtist(file.artist); setEditAlbum(file.album); setShowActions(null); }}>
                        <i className="fas fa-pen"></i> Edit Metadata
                      </button>
                      <button className="rs-media-sheet-item" onClick={() => { setShowActions(null); setPlaylistPickerOpen(true); }}>
                        <i className="fas fa-list"></i> Add to Playlist
                      </button>
                      <button className="rs-media-sheet-item" onClick={() => { setShowActions(null); showToast("Deleted", "File removed", "success", 2000); }}>
                        <i className="fas fa-trash-can"></i> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Playlist Picker Modal */}
        {playlistPickerOpen && (
          <>
            <div className="rs-media-modal-overlay" onClick={() => setPlaylistPickerOpen(false)}></div>
            <div className="rs-media-modal">
              <div className="rs-media-modal-handle"></div>
              <div className="rs-media-modal-header">
                <h2>Add to Playlist</h2>
              </div>
              <div className="rs-media-modal-body">
                {MOCK_PLAYLISTS.length === 0 ? (
                  <div className="rs-empty"><h4>No playlists</h4><p>Create a playlist first</p></div>
                ) : (
                  MOCK_PLAYLISTS.map((pl) => (
                    <div className="rs-media-pl-item" key={pl.id} onClick={() => addToPlaylist(pl.id)}>
                      <div className="rs-media-pl-icon"><i className="fas fa-list"></i></div>
                      <div className="rs-media-pl-name">{pl.name}</div>
                      <i className="fas fa-chevron-right rs-media-pl-arrow"></i>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
