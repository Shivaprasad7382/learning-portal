const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "gvcc-learning-portal-dev-secret";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or malformed Authorization header." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

module.exports = { requireAuth, JWT_SECRET };
