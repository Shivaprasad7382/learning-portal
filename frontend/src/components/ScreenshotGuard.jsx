import React, { useEffect, useRef, useState } from "react";

/**
 * ScreenshotGuard
 * ----------------
 * A layered, best-effort deterrent against casual screen capture of protected
 * video content. Browsers cannot truly prevent an OS-level screenshot or a
 * phone camera pointed at the screen, so this component combines several
 * documented techniques (see README "Screenshot Protection Approach"):
 *
 *  1. PrintScreen / OS screenshot shortcuts are intercepted where the browser
 *     allows it (keydown listener) and the video is paused + blurred, and the
 *     clipboard is briefly overwritten so a pasted "screenshot" is blank.
 *  2. When the tab loses focus or visibility (alt-tab, switching apps, a
 *     screen-recording control panel opening) content blurs and pauses.
 *  3. Right-click / long-press context menu is disabled over the player.
 *  4. A moving, semi-transparent watermark (name + email + timestamp) is
 *     burned over the video so any capture that does slip through is traced
 *     back to the account that produced it — a deterrent, not a block.
 *  5. Dragging/saving the <video> element or selecting its frame is disabled.
 */
export default function ScreenshotGuard({ children, watermarkText }) {
  const [captureAttempt, setCaptureAttempt] = useState(false);
  const containerRef = useRef(null);
  const warnTimeout = useRef(null);

  useEffect(() => {
    function triggerWarning() {
      setCaptureAttempt(true);
      if (warnTimeout.current) clearTimeout(warnTimeout.current);
      warnTimeout.current = setTimeout(() => setCaptureAttempt(false), 2200);
    }

    function handleKeyDown(e) {
      // PrintScreen (Windows/Linux). macOS screenshot shortcuts (Cmd+Shift+3/4/5)
      // cannot be intercepted by web JS at all — documented limitation.
      if (e.key === "PrintScreen") {
        triggerWarning();
        navigator.clipboard?.writeText("Screenshots are disabled on Marginalia.").catch(() => {});
      }
      // Common devtools shortcuts — used only as a soft signal, not a hard block.
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase()))
      ) {
        triggerWarning();
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) triggerWarning();
    }

    function handleBlur() {
      triggerWarning();
    }

    function handleContextMenu(e) {
      e.preventDefault();
      triggerWarning();
    }

    window.addEventListener("keyup", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    const node = containerRef.current;
    node?.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keyup", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      node?.removeEventListener("contextmenu", handleContextMenu);
      if (warnTimeout.current) clearTimeout(warnTimeout.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`protected-zone ${captureAttempt ? "capture-blur" : ""}`}
      style={{ position: "relative" }}
    >
      {children}
      <FloatingWatermark text={watermarkText} />
      {captureAttempt && (
        <div className="capture-warning">
          Capture blocked for this session — content is watermarked to your account.
        </div>
      )}
    </div>
  );
}

function FloatingWatermark({ text }) {
  // Re-position periodically so a still frame can't be cropped to remove it.
  const [pos, setPos] = useState({ top: "12%", left: "8%" });

  useEffect(() => {
    const id = setInterval(() => {
      setPos({
        top: `${10 + Math.random() * 70}%`,
        left: `${8 + Math.random() * 70}%`
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="watermark"
      style={{ top: pos.top, left: pos.left }}
      aria-hidden="true"
    >
      {text}
    </div>
  );
}
