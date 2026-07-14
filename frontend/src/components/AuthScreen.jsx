import React, { useState } from "react";
import { api, setToken } from "../api.js";

export default function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result =
        mode === "login"
          ? await api.login({ email, password })
          : await api.signup({ name, email, password });
      setToken(result.token);
      onAuthed(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand" style={{ marginBottom: 28 }}>
          <span className="brand-mark">🔖</span>
          <div>
            <div className="brand-name">Marginalia</div>
            <div className="brand-sub">Learning Portal</div>
          </div>
        </div>

        <h1 className="auth-title">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Log in to resume your prep and reach your bookmarks."
            : "Sign up to save bookmarks and track your progress across videos."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" && (
            <label className="field">
              <span>Full name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Shiva Prasad" />
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <button className="link-btn" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
}
