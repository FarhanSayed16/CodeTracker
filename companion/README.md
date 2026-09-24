# CodeTrack Companion

Always-on-top desktop quickball for professors and students. Reuses the existing CodeTrack Express + Socket.IO APIs — no second database.

## Requirements

- Node.js 20+
- Windows 10/11 (primary target; Electron also runs on macOS/Linux)
- Running CodeTrack server (`server/`) reachable from lab PCs

## Quick start (dev)

```bash
cd companion
npm install
npm run dev
```

This starts Vite on port `5174` and opens the Electron window (frameless, always on top).

1. Click the ball (or leave expanded) → pick **Professor** or **Student**
2. Open **Server config** if the API is not on `http://localhost:3000`
3. Student: session code → search name/roll → PIN → status clicks  
4. Professor: login → attach ACTIVE session → live counts + issues

Create sessions and import rosters in the **web dashboard** (`dashboard/`). The companion is for live monitoring and status only.

## Configuration

| Source | Keys |
|--------|------|
| OS / launch env | `CODETRACK_API_URL`, `CODETRACK_SOCKET_URL`, `CODETRACK_DASHBOARD_URL` |
| In-app Settings | Same URLs, stored in `localStorage` (overrides env) |

Defaults:

- API: `http://localhost:3000/api`
- Socket: `http://localhost:3000`
- Dashboard: `http://localhost:5173`

For lab installs, point all machines at your hosted server, e.g.:

```
CODETRACK_API_URL=https://your-host.example/api
CODETRACK_SOCKET_URL=https://your-host.example
CODETRACK_DASHBOARD_URL=https://dashboard.your-host.example
```

## Windows installer

```bash
cd companion
npm install
npm run dist
```

Output: `companion/release/CodeTrack-Companion-Setup-1.0.0.exe` (NSIS).

### Lab PC install checklist

1. Install the `.exe` on each lab machine (or copy the portable `win-unpacked` folder from `npm run dist:dir`).
2. Ensure lab PCs can reach the CodeTrack API (firewall / LAN).
3. Optionally set system environment variables for the three URLs above, or ask users to open **Config** once.
4. Optional: pin the app to the taskbar; the window stays always-on-top over VS Code.
5. Students join once per lab (JWT ~4h); restore works after reboot while the session is ACTIVE.

## Roles

**Student** — join/PIN/status UI + socket restore (same flows as `server/public`).

**Professor** — JWT login, attach ACTIVE session, live joined/done/working/issue counts, issue strip, mute, copy code, open full dashboard, end session.

## Out of scope (v1)

- Creating classes/sessions inside the ball
- VS Code / Chrome extensions (possible later add-ons)
