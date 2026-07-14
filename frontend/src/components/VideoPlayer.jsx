import React, { useEffect, useRef, useState } from "react";
import { formatTime } from "../utils.js";

export default function VideoPlayer({ video, bookmarks, seekToken, onTimeUpdate, onAddBookmark }) {
  const videoRef = useRef(null);
  const barRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(video.duration || 0);
  const [hoverRibbon, setHoverRibbon] = useState(null);

  // External "jump to timestamp" requests (from bookmark clicks) come in as a
  // { time, nonce } token so the same timestamp can be clicked twice in a row.
  useEffect(() => {
    if (!seekToken || !videoRef.current) return;
    videoRef.current.currentTime = seekToken.time;
    setCurrent(seekToken.time);
    videoRef.current.play().catch(() => {});
    setPlaying(true);
  }, [seekToken]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrent(v.currentTime);
      onTimeUpdate?.(v.currentTime);
    };
    const onMeta = () => setDuration(v.duration || video.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [video.id]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }

  function handleScrub(e) {
    const bar = barRef.current;
    if (!bar || !videoRef.current) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const time = ratio * duration;
    videoRef.current.currentTime = time;
    setCurrent(time);
  }

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="player-shell">
      <video
        ref={videoRef}
        className="player-video"
        src={video.url}
        controls={false}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      <div className="player-controls">
        <button className="btn-play" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "❚❚" : "►"}
        </button>

        <span className="time-readout">{formatTime(current)}</span>

        <div className="scrub-track" ref={barRef} onClick={handleScrub}>
          <div className="scrub-fill" style={{ width: `${pct}%` }} />
          <div className="scrub-thumb" style={{ left: `${pct}%` }} />

          {/* Signature element: bookmark ribbons pinned to the scrubber at their timestamp */}
          {bookmarks.map((b) => {
            const left = duration ? (b.timestamp / duration) * 100 : 0;
            return (
              <div
                key={b.id}
                className="ribbon-marker"
                style={{ left: `${left}%` }}
                onMouseEnter={() => setHoverRibbon(b.id)}
                onMouseLeave={() => setHoverRibbon(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  videoRef.current.currentTime = b.timestamp;
                  setCurrent(b.timestamp);
                }}
              >
                <span className="ribbon-flag" />
                {hoverRibbon === b.id && (
                  <div className="ribbon-tooltip">
                    {b.name || "Bookmark"} · {formatTime(b.timestamp)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <span className="time-readout">{formatTime(duration)}</span>

        <button
          className="btn-bookmark"
          onClick={() => onAddBookmark(current)}
          title="Bookmark this moment"
        >
          🔖 Bookmark
        </button>
      </div>
    </div>
  );
}
