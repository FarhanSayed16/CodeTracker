# Lab PC image — CodeTrack Companion (Phase 2)

One-page guide for IT / lab admins. Students and professors use **different** Windows installers so the wrong role never appears.

## What goes where

| Machine | Install | User sees |
|---------|---------|-----------|
| Student lab PC | **CodeTrack Student** | Join → PIN → task status only |
| Professor laptop | **CodeTrack Lab Monitor** | Login → ACTIVE session live counts |
| Professor browser | Web dashboard (`:5173` or hosted) | Create class, roster, session, full grid |
| Phones | Browser `/join` | Fallback only |

Do **not** install the unlocked “Companion” dual-role build on lab images.

## Build installers

```bash
cd companion
npm install
npm run dist:all
```

Outputs (under `companion/release/`):

- `CodeTrack-Student-Setup-1.0.0.exe`
- `CodeTrack-LabMonitor-Setup-1.0.0.exe`

Copy them to the API host download folder for `/download`:

```bash
mkdir -p server/public/downloads
cp companion/release/CodeTrack-Student-Setup-*.exe server/public/downloads/CodeTrack-Student-Setup.exe
cp companion/release/CodeTrack-LabMonitor-Setup-*.exe server/public/downloads/CodeTrack-LabMonitor-Setup.exe
```

## Preconfigure API URL (lab image)

### A — Environment variables (MDM / image)

| Variable | Example |
|----------|---------|
| `CODETRACK_API_URL` | `https://codetrack.college.edu/api` |
| `CODETRACK_SOCKET_URL` | `https://codetrack.college.edu` |
| `CODETRACK_DASHBOARD_URL` | `https://dashboard.college.edu` |
| `CODETRACK_UPDATE_URL` | `https://codetrack.college.edu/companion-updates/student` |
| `CODETRACK_ROLE` | Optional: `student` or `professor` |

### B — `lab-config.json`

Shipped as an extra resource. After install, IT can replace the file next to the app resources (or rebuild with edited `companion/electron/lab-config.json`):

```json
{
  "apiUrl": "https://codetrack.college.edu/api",
  "socketUrl": "https://codetrack.college.edu",
  "dashboardUrl": "https://dashboard.college.edu",
  "updateUrl": "https://codetrack.college.edu/companion-updates/student"
}
```

Students should not need **Config** if A or B is set.

## Deep links

- App protocol: `codetrack://join?code=84XQ3U`
- HTTPS bridge: `https://your-api/open?code=84XQ3U` (tries app, then browser `/join`)
- Download: `https://your-api/download`

## Dev / QA role locks

```bash
cd companion
npm run dev:student      # Student-only UI
npm run dev:professor    # Lab Monitor-only UI
npm run dev              # Unlocked (role picker) — developers only
```

Browser QA without Electron: open `http://localhost:5174/?role=student` or `?role=professor`.

## First-run checklist (student PC)

1. Install Student setup → shortcut “CodeTrack Student”.
2. Open app → Join screen only (no professor login).
3. Enter session code → search name → PIN.
4. Collapse to ball; status updates while coding in VS Code.
5. Confirm `/join` is **not** bookmarked on the lab browser.

## First-run checklist (professor)

1. Install Lab Monitor → shortcut “CodeTrack Lab Monitor”.
2. Sign in with professor account (no student join).
3. Attach ACTIVE session (or “Attach latest”).
4. Keep web dashboard for creating sessions / roster / ending class.

## Soft policy on `/join`

Desktop browsers see a stronger banner pointing to `/download`. Mobile keeps thin join. Lab policy: Companion on PCs, `/join` for phones only.

## Related

- Full roadmap: [`Production_Ready_Quickball_Enhancement_Plan.md`](./Production_Ready_Quickball_Enhancement_Plan.md)
- Phase 1 QA: [`Phase1_QA_Checklist.md`](./Phase1_QA_Checklist.md)
- Companion README: [`../companion/README.md`](../companion/README.md)
