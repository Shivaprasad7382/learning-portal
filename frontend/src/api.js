const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

function getToken() {
  return localStorage.getItem("mgn_token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  signup: (payload) => request("/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  getVideos: () => request("/videos"),
  getVideo: (id) => request(`/videos/${id}`),
  getContinueWatching: () => request("/videos/meta/continue-watching", { auth: true }),

  getBookmarks: (videoId) => request(`/bookmarks?videoId=${videoId}`, { auth: true }),
  createBookmark: (payload) => request("/bookmarks", { method: "POST", body: payload, auth: true }),
  updateBookmark: (id, payload) => request(`/bookmarks/${id}`, { method: "PATCH", body: payload, auth: true }),
  deleteBookmark: (id) => request(`/bookmarks/${id}`, { method: "DELETE", auth: true }),

  getProgress: (videoId) => request(`/progress/${videoId}`, { auth: true }),
  getRecentlyWatched: () => request("/progress", { auth: true }),
  saveProgress: (payload) => request("/progress", { method: "PUT", body: payload, auth: true })
};

export function setToken(token) {
  if (token) localStorage.setItem("mgn_token", token);
  else localStorage.removeItem("mgn_token");
}

export function getStoredToken() {
  return getToken();
}
