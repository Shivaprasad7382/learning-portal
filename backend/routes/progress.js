const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// PUT /api/progress - upsert progress { videoId, position }
router.put("/", (req, res) => {
  const { videoId, position } = req.body;
  if (!videoId || typeof position !== "number" || position < 0) {
    return res.status(400).json({ error: "videoId and a non-negative numeric position are required." });
  }

  const data = db.read();
  let record = data.progress.find((p) => p.userId === req.user.id && p.videoId === videoId);
  if (record) {
    record.position = position;
    record.updatedAt = new Date().toISOString();
  } else {
    record = { userId: req.user.id, videoId, position, updatedAt: new Date().toISOString() };
    data.progress.push(record);
  }

  db.write(data);
  res.json(record);
});

// GET /api/progress/:videoId - resume position for a single video
router.get("/:videoId", (req, res) => {
  const data = db.read();
  const record = data.progress.find((p) => p.userId === req.user.id && p.videoId === req.params.videoId);
  res.json(record || { videoId: req.params.videoId, position: 0 });
});

// GET /api/progress - recently watched, most recent first
router.get("/", (req, res) => {
  const data = db.read();
  const records = data.progress
    .filter((p) => p.userId === req.user.id)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  res.json(records);
});

module.exports = router;
