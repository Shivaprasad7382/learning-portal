import React, { useState } from "react";
import { formatTime } from "../utils.js";

export default function BookmarkPanel({ bookmarks, onJump, onRename, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState("");

  function startEdit(b) {
    setEditingId(b.id);
    setDraftName(b.name || "");
  }

  function saveEdit(id) {
    onRename(id, draftName);
    setEditingId(null);
  }

  return (
    <div className="bookmark-panel">
      <h3 className="panel-heading">
        Bookmarks <span className="count-pill">{bookmarks.length}</span>
      </h3>

      {bookmarks.length === 0 && (
        <p className="empty-note">
          No bookmarks yet. Hit <strong>🔖 Bookmark</strong> under the player while watching to
          mark a moment you'll want to return to.
        </p>
      )}

      <ul className="bookmark-list scrollbar-thin">
        {bookmarks.map((b) => (
          <li key={b.id} className="bookmark-row">
            <button className="ribbon-chip" onClick={() => onJump(b)} title="Resume from here">
              <span className="ribbon-flag small" />
              {formatTime(b.timestamp)}
            </button>

            {editingId === b.id ? (
              <input
                autoFocus
                className="bookmark-name-input"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(b.id)}
                onBlur={() => saveEdit(b.id)}
                placeholder="Name this bookmark"
              />
            ) : (
              <button className="bookmark-name" onClick={() => startEdit(b)}>
                {b.name || <span className="text-muted-inline">Untitled — click to name</span>}
              </button>
            )}

            <button className="icon-btn danger" onClick={() => onDelete(b.id)} title="Delete bookmark">
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
