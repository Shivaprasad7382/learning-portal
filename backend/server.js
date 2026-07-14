const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const videoRoutes = require("./routes/videos");
const bookmarkRoutes = require("./routes/bookmarks");
const progressRoutes = require("./routes/progress");

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/progress", progressRoutes);

// Fallback 404 for unknown API routes
app.use("/api", (req, res) => res.status(404).json({ error: "Route not found." }));

app.listen(PORT, () => {
  console.log(`Learning Portal API running on http://localhost:${PORT}`);
});
