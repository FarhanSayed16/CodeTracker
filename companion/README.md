# CodeTrack Companion

Always-on-top desktop quickball for **lab live status**. Reuses the existing CodeTrack Express + Socket.IO APIs — no second database.

> **One live surface:** use this companion during labs. Create sessions/rosters in the web dashboard. Student browser page is only at `/join` (phones / fallback) — do not open it alongside the companion on the same PC.

## Requirements

- Node.js 20+
- Windows 10/11 (primary target; Electron also runs on macOS/Linux)
- Running CodeTrack server (`server/`) reachable from lab PCs

## Quick start (dev)

```bash
cd companion
npm install
npm run dev              # unlocked — role picker (developers)
npm run dev:student      # Student-only UI (lab QA)
npm run dev:professor    # Lab Monitor-only UI (lab QA)
```

Browser without Electron: `http://localhost:5174/?role=student` or `?role=professor`.

1. Student build → Join → PIN → status  
2. Professor build → Login → attach ACTIVE session  
3. Open **Server config** only if API is not on `http://localhost:3000`

## Role-locked Windows installers (lab images)

```bash
npm run dist:student     # → release/CodeTrack-Student-Setup-*.exe
npm run dist:professor   # → release/CodeTrack-LabMonitor-Setup-*.exe
npm run dist:all         # both, then reset lock to unlocked
npm run dist:unlocked    # dual-role (dev / support only)
```

| Artifact | Role on machine |
|----------|-----------------|
| CodeTrack Student | Join / status only — **no** professor login |
| CodeTrack Lab Monitor | Professor monitor — **no** student join |
| CodeTrack Companion (unlocked) | Role picker — **not** for lab images |

IT guide: [`docs/Lab_Image_Install.md`](../docs/Lab_Image_Install.md). Download landing: `http://<api-host>/download`.

Env override (MDM): `CODETRACK_ROLE=student|professor` forces lock even on unlocked builds.

## Configuration

| Source | Keys |
|--------|------|
| OS / launch env | `CODETRACK_API_URL`, `CODETRACK_SOCKET_URL`, `CODETRACK_DASHBOARD_URL`, `CODETRACK_ROLE` |
| In-app Settings | Same URLs, stored in `localStorage` (overrides env) |
| Packaged lock | `electron/role.lock.json` written by `scripts/set-role.cjs` at build time |

Defaults (Electron):

- API: `http://localhost:3000/api`
- Socket: `http://localhost:3000`
- Dashboard: `http://localhost:5173`

Browser-dev: Vite proxies `/api` and `/socket.io` to `:3000`. Use **Reset to defaults** if Settings were saved incorrectly.

## Lab PC checklist

1. Install **Student** or **Lab Monitor** (not unlocked) on the right machines.
2. Set `CODETRACK_*_URL` or ship `lab-config.json` with your hosted API.
3. Students must not bookmark `/join` on lab browsers — use the Quickball.
4. Close (X) hides to **tray**; Quit from tray menu. Optional: **Start with Windows**.
5. Deep link: `codetrack://join?code=XXXX` or HTTPS `/open?code=XXXX`.
6. JWT restore works after reboot while the session is ACTIVE (~4h).
7. Signing: see [`docs/Windows_Code_Signing.md`](../docs/Windows_Code_Signing.md). E2E: [`docs/Phase3_E2E_Lab_Checklist.md`](../docs/Phase3_E2E_Lab_Checklist.md).

## Out of scope (Phase 4+)

- Mobile PWA / Android store wrapper
- VS Code / Chrome extensions
- Creating classes/sessions inside the ball
