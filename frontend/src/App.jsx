import React, { useEffect, useRef, useState } from "react";
import { api, setToken, getStoredToken } from "./api.js";
import AuthScreen from "./components/AuthScreen.jsx";
import Sidebar from "./components/Sidebar.jsx";
import VideoPlayer from "./components/VideoPlayer.jsx";
import BookmarkPanel from "./components/BookmarkPanel.jsx";
import ScreenshotGuard from "./components/ScreenshotGuard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [videos, setVideos] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [seekToken, setSeekToken] = useState(null);
  const [toast, setToastMsg] = useState("");

  const lastSavedPosition = useRef(0);
  const saveTimer = useRef(null);

  // Restore session on load: a stored token is optimistically treated as a
  // logged-in user (name recovered from JWT payload client-side for display).
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setCheckingSession(false);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) throw new Error("expired");
      setUser({ id: payload.id, name: payload.name, email: payload.email });
    } catch {
      setToken(null);
    } finally {
      setCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadLibrary();
  }, [user]);

  async function loadLibrary() {
    const [videoList, cw] = await Promise.all([api.getVideos(), api.getContinueWatching()]);
    setVideos(videoList);
    setContinueWatching(cw);
    if (!activeVideo && videoList.length) selectVideo(videoList[0].id, videoList);
  }

  async function selectVideo(id, list = videos) {
    const video = list.find((v) => v.id === id) || (await api.getVideo(id));
    setActiveVideo(video);
    const [bms, progress] = await Promise.all([api.getBookmarks(id), api.getProgress(id)]);
    setBookmarks(bms);
    if (progress.position > 3) {
      setSeekToken({ time: progress.position, nonce: Date.now() });
    } else {
      setSeekToken({ time: 0, nonce: Date.now() });
    }
  }

  function handleTimeUpdate(time) {
    lastSavedPosition.current = time;
    if (saveTimer.current) return;
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      if (activeVideo) {
        api.saveProgress({ videoId: activeVideo.id, position: lastSavedPosition.current }).catch(() => {});
      }
    }, 4000);
  }

  async function handleAddBookmark(time) {
    if (!activeVideo) return;
    const bookmark = await api.createBookmark({ videoId: activeVideo.id, timestamp: time });
    setBookmarks((prev) => [...prev, bookmark].sort((a, b) => a.timestamp - b.timestamp));
    showToast(`Bookmarked at ${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")}`);
  }

  async function handleRename(id, name) {
    const updated = await api.updateBookmark(id, { name });
    setBookmarks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  }

  async function handleDelete(id) {
    await api.deleteBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  function handleJump(bookmark) {
    setSeekToken({ time: bookmark.timestamp, nonce: Date.now() });
  }

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2200);
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
    setActiveVideo(null);
    setVideos([]);
    setBookmarks([]);
  }

  if (checkingSession) return null;
  if (!user) return <AuthScreen onAuthed={setUser} />;
  if (!activeVideo) return <div className="loading-screen">Loading your library…</div>;

  return (
    <div className="app-shell">
      <Sidebar
        videos={videos}
        continueWatching={continueWatching}
        activeId={activeVideo.id}
        onSelect={(id) => selectVideo(id)}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-stage">
        <header className="stage-header">
          <span className="eyebrow">{activeVideo.category}</span>
          <h1 className="stage-title">{activeVideo.title}</h1>
          <p className="stage-desc">{activeVideo.description}</p>
        </header>

        <ScreenshotGuard watermarkText={`${user.email} · ${new Date().toLocaleDateString()}`}>
          <VideoPlayer
            key={activeVideo.id}
            video={activeVideo}
            bookmarks={bookmarks}
            seekToken={seekToken}
            onTimeUpdate={handleTimeUpdate}
            onAddBookmark={handleAddBookmark}
          />
        </ScreenshotGuard>

        <BookmarkPanel
          bookmarks={bookmarks}
          onJump={handleJump}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
