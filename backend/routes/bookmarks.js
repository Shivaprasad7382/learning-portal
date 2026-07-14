const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// All bookmark routes require a logged-in user, since bookmarks are personal.
router.use(requireAuth);

// GET /api/bookmarks?videoId=v1 - list bookmarks for a video (for current user)
router.get("/", (req, res) => {
  const { videoId } = req.query;
  const data = db.read();

  let results = data.bookmarks.filter((b) => b.userId === req.user.id);
  if (videoId) results = results.filter((b) => b.videoId === videoId);

  results.sort((a, b) => a.timestamp - b.timestamp);
  res.json(results);
});

// POST /api/bookmarks - create a bookmark { videoId, timestamp, name }
router.post("/", (req, res) => {
  const { videoId, timestamp, name } = req.body;

  if (!videoId || typeof timestamp !== "number" || timestamp < 0) {
    return res.status(400).json({ error: "videoId and a non-negative numeric timestamp are required." });
  }

  const data = db.read();
  const video = data.videos.find((v) => v.id === videoId);
  if (!video) return res.status(404).json({ error: "Video not found." });

  const bookmark = {
    id: uuidv4(),
    userId: req.user.id,
    videoId,
    timestamp,
    name: (name || "").trim() || null,
    createdAt: new Date().toISOString()
  };

  data.bookmarks.push(bookmark);
  db.write(data);
  res.status(201).json(bookmark);
});

// PATCH /api/bookmarks/:id - edit a bookmark's name and/or timestamp
router.patch("/:id", (req, res) => {
  const data = db.read();
  const bookmark = data.bookmarks.find((b) => b.id === req.params.id && b.userId === req.user.id);
  if (!bookmark) return res.status(404).json({ error: "Bookmark not found." });

  const { name, timestamp } = req.body;
  if (name !== undefined) bookmark.name = (name || "").trim() || null;
  if (timestamp !== undefined) {
    if (typeof timestamp !== "number" || timestamp < 0) {
      return res.status(400).json({ error: "timestamp must be a non-negative number." });
    }
    bookmark.timestamp = timestamp;
  }

  db.write(data);
  res.json(bookmark);
});

// DELETE /api/bookmarks/:id
router.delete("/:id", (req, res) => {
  const data = db.read();
  const idx = data.bookmarks.findIndex((b) => b.id === req.params.id && b.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "Bookmark not found." });

  data.bookmarks.splice(idx, 1);
  db.write(data);
  res.status(204).send();
});

module.exports = router;
