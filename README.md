# Marginalia — Learning Portal

A learning portal built for the GVCC assignment. Students log in, watch prep videos, and drop
**bookmarks** at exact timestamps — shown as ribbon markers pinned directly onto the video
scrubber — so they can jump straight back to that moment later.

Stack: **React (Vite) frontend** + **Node/Express backend**, JSON-file persistence (see
[Database choice](#database-choice) below for why, and how to swap in MongoDB/Postgres).

---

## Features

| Requirement | Status |
|---|---|
| Video library / learning portal | ✅ |
| Screenshot protection (layered deterrent) | ✅ documented in detail below |
| Multiple bookmarks per video | ✅ |
| Bookmark: name (optional), timestamp, video ID | ✅ |
| View all bookmarks for a video | ✅ |
| Click bookmark → resume at that exact timestamp | ✅ |
| Persistent storage (backend API) | ✅ |
| Student-friendly UI | ✅ |
| **Bonus:** Edit/delete bookmarks | ✅ |
| **Bonus:** Bookmark titles/notes | ✅ (rename inline) |
| **Bonus:** Continue Watching | ✅ |
| **Bonus:** Watch progress indicator | ✅ |
| **Bonus:** Recently watched | ✅ (backs Continue Watching) |
| **Bonus:** Authentication (login/signup) | ✅ JWT + bcrypt |
| **Bonus:** Responsive UI | ✅ (collapses to a stacked layout under 860px) |

---

## Project structure

```
learning-portal/
├── backend/                 # Express API
│   ├── server.js            # App entrypoint
│   ├── db.js                # File-backed persistence layer
│   ├── middleware/auth.js   # JWT verification
│   ├── routes/
│   │   ├── auth.js          # signup / login
│   │   ├── videos.js        # video catalogue + continue-watching
│   │   ├── bookmarks.js     # bookmark CRUD (the core feature)
│   │   └── progress.js      # watch progress tracking
│   └── data/db.json         # generated at first run — not committed
└── frontend/                 # React (Vite) client
    └── src/
        ├── api.js                       # fetch wrapper for the backend
        ├── App.jsx                      # top-level state & routing
        └── components/
            ├── AuthScreen.jsx
            ├── Sidebar.jsx               # library + continue watching
            ├── VideoPlayer.jsx           # custom player, ribbon markers on scrubber
            ├── BookmarkPanel.jsx         # list, rename, delete, jump
            └── ScreenshotGuard.jsx       # capture-deterrence wrapper
```

---

## Setup instructions

### Prerequisites
- Node.js 18+ and npm

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # optional — defaults work out of the box
npm start
```

Runs at `http://localhost:5050`. On first run it creates `backend/data/db.json` seeded with
three sample prep videos (Quant, Reasoning, English) using royalty-free sample video files —
swap in your own hosted video URLs in `db.js`'s `DEFAULT_DATA.videos` or via a future
"upload video" admin route.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env       # points VITE_API_URL at the backend above
npm run dev
```

Runs at `http://localhost:5173`. Sign up with any name/email/password (min 6 characters) —
accounts are stored locally in `backend/data/db.json`, hashed with bcrypt.

### 3. Production build

```bash
cd frontend
npm run build      # outputs static files to frontend/dist
npm run preview    # serve the build locally to sanity-check
```

Deploy `frontend/dist` to any static host (Vercel/Netlify/GitHub Pages) and the `backend/`
folder to any Node host (Render/Railway/Fly.io), pointing `VITE_API_URL` at the deployed API.

---

## How the bookmark feature works

1. While a video plays, the student clicks **🔖 Bookmark** under the player. This calls
   `POST /api/bookmarks` with `{ videoId, timestamp }` (name is added later).
2. Every bookmark for the current video renders as a small ribbon flag pinned onto the
   scrubber at `(timestamp / duration) * 100%`, and also as a row in the **Bookmarks** panel
   below the player.
3. Clicking a ribbon (on the scrubber or in the list) sets `video.currentTime = bookmark.timestamp`
   and resumes playback from there — not from `00:00`.
4. Bookmarks can be renamed inline (click the name) or removed (✕), calling
   `PATCH /api/bookmarks/:id` / `DELETE /api/bookmarks/:id` respectively.
5. Bookmarks are scoped per user and per video (`userId`, `videoId` on every record), so two
   students bookmarking the same video never see each other's marks.

Separately, watch **progress** (`PUT /api/progress`) is auto-saved every ~4 seconds of playback
and is what powers "Continue Watching" and resuming a video where you left off when you simply
reopen it (as distinct from a manually placed bookmark).

---

## Screenshot Protection Approach

**Important limitation up front:** no web application can fully prevent an operating system
from taking a screenshot, and none can stop someone from pointing a second device's camera at
the screen. Any product claiming otherwise is overstating what the browser platform allows.
What follows is a *layered deterrent*, matching what the assignment brief itself expects
("discourage or prevent... implement the best possible solution supported by your stack").

Implemented in `ScreenshotGuard.jsx`, wrapping the video player:

1. **PrintScreen interception (Windows/Linux).** A `keyup` listener watches for the
   `PrintScreen` key. On Windows/Linux browsers this key does reach the page, so we
   immediately blur/pause the video, show an on-screen notice, and overwrite the clipboard
   with a plain-text message so a pasted "screenshot" comes back empty instead of the frame.
   *(macOS's screenshot shortcuts — Cmd+Shift+3/4/5 — are handled entirely by the OS before
   any browser tab receives the event, so this specific technique cannot reach them at all;
   this is disclosed rather than glossed over.)*
2. **Focus / visibility loss.** `visibilitychange` and `window blur` listeners catch tab
   switches, alt-tabbing to a screenshot tool, or a screen-recording control panel opening,
   and blur + pause the content until focus returns.
3. **Right-click / long-press disabled** over the player, so "Save video frame as..." and
   similar context-menu paths are removed.
4. **Dynamic watermark.** A semi-transparent, randomly-repositioning watermark
   (`account email + date`) is rendered over the video at all times. It doesn't block a
   capture, but it means any screenshot or recording that does get taken is traceable back to
   the account — the same principle streaming platforms (Netflix, Coursera) use, since true
   prevention isn't possible on the open web.
5. **No download affordance.** `controlsList="nodownload noremoteplayback"` and
   `disablePictureInPicture` remove the built-in "download"/cast escape hatches Chrome/Edge
   otherwise add to `<video>` elements.
6. **DevTools soft-signal.** Common inspector shortcuts (F12, Ctrl+Shift+I/J/C) trigger the
   same blur-and-warn response, though a determined user can always open DevTools through the
   browser menu — this is a nudge, not a wall.

### What a native app could add (documented for completeness, not implemented here)
Since the brief allows choosing "the technology stack of your choice" and different platforms
have different capabilities: a **Flutter or native Android** app can call
`FLAG_SECURE` on the window, which makes the OS itself refuse to include that window in any
screenshot or screen recording, system-wide — a real block, not a deterrent. iOS has no fully
equivalent public API; the closest is detecting a screenshot after the fact
(`UIApplication.userDidTakeScreenshotNotification`) and reacting (e.g., logging it or briefly
blacking out sensitive content), which is the same "detect and deter" pattern used above for
the web, just OS-assisted. This project targets the web so it can be graded without installing
an app, hence the layered-deterrent approach rather than `FLAG_SECURE`.

---

## API design

All bookmark/progress routes require `Authorization: Bearer <jwt>` (returned from
`/api/auth/login` or `/api/auth/signup`). Video catalogue browsing is public.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create account, returns JWT |
| POST | `/api/auth/login` | Authenticate, returns JWT |
| GET | `/api/videos` | List all videos |
| GET | `/api/videos/:id` | Single video details |
| GET | `/api/videos/meta/continue-watching` | Videos with partial progress, most recent first |
| GET | `/api/bookmarks?videoId=` | Bookmarks for a video (current user only) |
| POST | `/api/bookmarks` | Create `{ videoId, timestamp, name? }` |
| PATCH | `/api/bookmarks/:id` | Update name and/or timestamp |
| DELETE | `/api/bookmarks/:id` | Remove a bookmark |
| PUT | `/api/progress` | Upsert watch position `{ videoId, position }` |
| GET | `/api/progress/:videoId` | Resume position for one video |
| GET | `/api/progress` | Recently watched, most recent first |

### Data model

```
User      { id, name, email, passwordHash, createdAt }
Video     { id, title, subject, description, url, thumbnail, duration, category }
Bookmark  { id, userId, videoId, timestamp, name, createdAt }
Progress  { userId, videoId, position, updatedAt }
```

### Database choice
`backend/db.js` uses a small JSON-file store instead of a native SQL driver, specifically so the
project runs on **any machine with plain Node — no native build toolchain, no external
database service to provision** for grading. Every route talks only to the four functions
`db.js` exports (`read`/`write`), so swapping in MongoDB (Mongoose) or PostgreSQL (Prisma) is a
localized change to that one file and does not touch any route logic.

---

## Known limitations / next steps
- Sample videos are placeholder royalty-free clips — replace `url` values in
  `backend/db.js` with real lecture recordings.
- No admin UI yet for uploading new videos (would be a natural next route:
  `POST /api/videos` guarded by an `isAdmin` flag on the user).
- Screenshot protection is web-native and therefore a deterrent, not an absolute block — see
  the dedicated section above.
