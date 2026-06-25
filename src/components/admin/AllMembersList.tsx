"use client";

import type { UserProfile } from "@/lib/users";
import type { Timestamp } from "firebase/firestore";

interface Props {
  users: UserProfile[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelectUser: (user: UserProfile) => void;
}

const AVATAR_COLORS = [
  "linear-gradient(135deg, #E8A838, #D4762A)",
  "linear-gradient(135deg, #8B5CF6, #A78BFA)",
  "linear-gradient(135deg, #3B82F6, #60A5FA)",
  "linear-gradient(135deg, #22C55E, #4ADE80)",
  "linear-gradient(135deg, #EF4444, #F87171)",
  "linear-gradient(135deg, #EC4899, #F472B6)",
  "linear-gradient(135deg, #14B8A6, #2DD4BF)",
  "linear-gradient(135deg, #F59E0B, #FBBF24)",
];

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function getColor(uid: string): string {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(t: number | Timestamp | undefined): string {
  if (!t) return "Unknown";
  const ts = typeof t === "number" ? t : t.seconds * 1000;
  const diff = Date.now() - ts;
  if (diff < 60000) return "Active now";
  if (diff < 3600000) return `Active ${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `Active ${Math.floor(diff / 3600000)}h ago`;
  return `Last seen ${Math.floor(diff / 86400000)}d ago`;
}

export default function AllMembersList({ users, loading, hasMore, onLoadMore, onSelectUser }: Props) {
  const roleBadge = (role: string) => {
    const cls = role === "admin" ? "admin" : role === "member" ? "member" : "member";
    return <span className={`member-role ${cls}`}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>;
  };

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">All Members</h2>
        <span className="section-count">{users.length} loaded</span>
      </div>

      {loading && users.length === 0 ? (
        <div className="member-list">
          {[1,2,3,4,5].map((i) => (
            <div className="member-item" key={i} style={{ cursor: "default", border: "none" }}>
              <div className="skel" style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0 }} />
              <div className="member-info" style={{ flex: 1 }}>
                <div className="skel skel-line w60" />
                <div className="skel skel-line w40" style={{ marginBottom: 0 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="member-list">
          {users.map((user) => (
            <div
              key={user.uid}
              className="member-item"
              onClick={() => onSelectUser(user)}
            >
              <div className="member-avatar" style={{ background: getColor(user.uid) }}>
                {user.photo_url ? (
                  <img src={user.photo_url} alt={user.display_name} loading="lazy" decoding="async" />
                ) : (
                  <span>{getInitials(user.display_name)}</span>
                )}
              </div>
              <div className="member-info">
                <div className="member-name">
                  {user.display_name}
                  {roleBadge(user.role)}
                </div>
                <div className="member-meta">
                  <span>{user.email}</span>
                  <span className="dot"></span>
                  <span>{formatTime(user.last_seen)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
          <button
            className="sync-btn"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-chevron-down"></i>}
            {" "}Load More
          </button>
        </div>
      )}
    </>
  );
}
