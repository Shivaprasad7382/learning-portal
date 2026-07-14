const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const { JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are all required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const data = db.read();
  const existing = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), name, email, passwordHash, createdAt: new Date().toISOString() };
  data.users.push(user);
  db.write(data);

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const data = db.read();
  const user = data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "No account found with this email." });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

module.exports = router;
