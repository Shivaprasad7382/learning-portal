const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/videos - list all videos (public catalogue)
router.get("/", (req, res) => {
  const data = db.read();
  res.json(data.videos);
});

// GET /api/videos/:id
router.get("/:id", (req, res) => {
  const data = db.read();
  const video = data.videos.find((v) => v.id === req.params.id);
  if (!video) return res.status(404).json({ error: "Video not found." });
  res.json(video);
});

// GET /api/videos/meta/continue-watching - videos the user has partial progress on
router.get("/meta/continue-watching", requireAuth, (req, res) => {
  const data = db.read();
  const userProgress = data.progress
    .filter((p) => p.userId === req.user.id && p.position > 5)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const result = userProgress
    .map((p) => {
      const video = data.videos.find((v) => v.id === p.videoId);
      if (!video) return null;
      return { ...video, lastPosition: p.position, updatedAt: p.updatedAt, percent: Math.min(100, Math.round((p.position / video.duration) * 100)) };
    })
    .filter(Boolean);

  res.json(result);
});

module.exports = router;
