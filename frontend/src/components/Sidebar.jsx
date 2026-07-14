import React from "react";
import { formatTime } from "../utils.js";

export default function Sidebar({ videos, continueWatching, activeId, onSelect, user, onLogout }) {
  return (
    <aside className="sidebar scrollbar-thin">
      <div className="brand">
        <span className="brand-mark">🔖</span>
        <div>
          <div className="brand-name">Marginalia</div>
          <div className="brand-sub">Learning Portal</div>
        </div>
      </div>

      {continueWatching.length > 0 && (
        <section className="side-section">
          <h4 className="side-heading">Continue watching</h4>
          {continueWatching.map((v) => (
            <button
              key={v.id}
              className={`video-row ${v.id === activeId ? "active" : ""}`}
              onClick={() => onSelect(v.id)}
            >
              <div className="video-row-title">{v.title}</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${v.percent}%` }} />
              </div>
              <div className="video-row-meta">{formatTime(v.lastPosition)} left off</div>
            </button>
          ))}
        </section>
      )}

      <section className="side-section">
        <h4 className="side-heading">Video library</h4>
        {videos.map((v) => (
          <button
            key={v.id}
            className={`video-row ${v.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(v.id)}
          >
            <div className="video-row-title">{v.title}</div>
            <div className="video-row-meta">
              {v.category} · {formatTime(v.duration)}
            </div>
          </button>
        ))}
      </section>

      <div className="sidebar-footer">
        <div className="user-chip">
          <span className="user-avatar">{user.name?.[0]?.toUpperCase() || "S"}</span>
          <span className="user-name">{user.name}</span>
        </div>
        <button className="link-btn" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
