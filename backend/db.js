// db.js
// A tiny file-backed JSON "database". Chosen instead of a native SQL driver so the
// project runs anywhere with plain Node (no native build tools required).
// Swapping this module for a real MongoDB/PostgreSQL client is a drop-in change —
// every route only talks to the functions exported here, never to the file directly.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const DEFAULT_DATA = {
  users: [],
  videos: [
    {
      id: "v1",
      title: "Quantitative Aptitude — Simplification Shortcuts",
      subject: "Quant",
      description: "Fast-track techniques for simplification and approximation questions asked in Prelims.",
      // Public domain / royalty-free sample stream used as placeholder content.
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
      thumbnail: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4#t=1",
      duration: 596,
      category: "Quantitative Aptitude"
    },
    {
      id: "v2",
      title: "Reasoning — Puzzle & Seating Arrangement Basics",
      subject: "Reasoning",
      description: "Core framework for circular and linear seating arrangement puzzles.",
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
      thumbnail: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4#t=1",
      duration: 350,
      category: "Reasoning"
    },
    {
      id: "v3",
      title: "English — Reading Comprehension Strategy",
      subject: "English",
      description: "How to attempt long passages under time pressure without losing accuracy.",
      url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/small.mp4",
      thumbnail: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/small.mp4#t=1",
      duration: 30,
      category: "English"
    }
  ],
  bookmarks: [],
  progress: []
};

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function read() {
  ensureDb();
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    // Corrupt file safety net — reset rather than crash the server.
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function write(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = { read, write };
