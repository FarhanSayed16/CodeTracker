# CodeTrack Production Readiness Plan  
## One Quickball · One Live Session · Lab-Ready for Teachers & Students

**Status:** Planning document (do not confuse with the earlier Desktop Companion scaffold plan)  
**Date:** 2026-09-24  
**Goal:** Ship a **production-credit** experience where professors and students use **one always-connected Quickball** for live labs, the **web dashboard stays admin-only**, and mobile/lab installs are clear and non-conflicting.

---

## 0. What you are seeing today (root cause)

You currently have **three separate live clients**, not one system:

| Surface | Where | What it is | Storage |
|---------|--------|------------|---------|
| **A. Student web widget** | `http://localhost:3000/` (`server/public/`) | Floating bubble on the API host | `codetrack_student_session` |
| **B. Companion app (Vite/Electron)** | `http://localhost:5174` / Windows `.exe` (`companion/`) | Dual-role Quickball (Professor **or** Student) | `ct_*` keys |
| **C. Professor dashboard** | `http://localhost:5173` (`dashboard/`) | Full admin + live grid | `token` |

**Why it feels like “two extensions fighting”:**

1. The **companion** and the **student page on :3000** are **two different apps**. Joining in one does **not** log you into the other (different `localStorage`, different origins).
2. Role picker shows **both** Professor and Student on every machine — wrong for lab PCs and confusing in development.
3. Dashboard is for **creating sessions / roster / full grid**. The Quickball is for **live status**. Using both as “join screens” creates the feeling of “another session.”
4. There is **no Chrome/VS Code extension yet**. What you open at `:5174` is the companion UI in a browser (dev). The real product target is the **Windows installer** (`companion/release/CodeTrack-Companion-Setup-*.exe`).

**Product rule going forward (non-negotiable):**

> **One live-lab surface = CodeTrack Quickball (desktop companion).**  
> **Dashboard = professors only for class/session/roster/admin.**  
> **Web join page (`/join`) = phones / fallback only — not lab PCs.**

---

## 1. Target end-state (production)

### For professors
- Install **CodeTrack Lab Monitor** (Quickball) on their laptop.
- Sign in once with professor credentials (no “Student” option on that build / that PC).
- Auto-attach **ACTIVE** session → live counts + issues while coding in VS Code.
- Create sessions, import roster, full grid → **web dashboard only**.
- “Open dashboard” from the ball when needed.

### For students (lab PCs)
- Install **CodeTrack Student** (Quickball) — **Student-only** (no professor login on the UI).
- Join once: code → name/roll → PIN → stay connected for the lab (~4h JWT + restore).
- Status clicks only: Not started / Working / Done / Need help.
- **Do not** use `localhost:3000` widget on lab machines once companion is installed.

### For students (phones / no install)
- Open QR / link → **`/join?code=XXXX`** (thin mobile web page).
- Same backend session; optional later: PWA “Add to Home Screen.”

### For IT / lab admins
- One Windows installer (or two branded builds) + pre-set API URL.
- Optional auto-start on login.
- Clear “which app for whom” one-pager.

```text
                    ┌─────────────────────┐
                    │  Supabase + API     │
                    │  Socket.IO (truth)  │
                    └─────────┬───────────┘
           ┌──────────────────┼──────────────────┐
           ▼                  ▼                  ▼
   Professor Dashboard   Quickball Monitor   Quickball Student
   (admin / create)      (live counts)       (status only)
           │                  │                  │
           └──────── mobile /join (fallback) ────┘
```

---

## 2. Issues inventory (must fix before “give to users”)

### P0 — Blocking / confusing (fix first)

| ID | Issue | Impact |
|----|--------|--------|
| P0-1 | **Dual student UIs** (companion + `:3000` widget) join independently | “Joined another session” / conflicting widgets |
| P0-2 | **Role picker shows both roles** to everyone | Students see professor login; professors see student join |
| P0-3 | **Dev browser companion** (`:5174`) looks like a third product | Confusion with dashboard + widget |
| P0-4 | **CORS / API URL / Config** easy to mis-point in Settings | Login/search “Failed to fetch” |
| P0-5 | Socket / event **parity gaps** (e.g. `new-task` field names, student calling `join-session`, missing `task-removed` / `status-resolved` in companion) | Live counts/tasks drift between clients |
| P0-6 | **Production static routing** risk: `server/public` vs dashboard SPA both want `/` | Broken join or broken dashboard when hosted |

### P1 — Required for lab rollout

| ID | Issue | Impact |
|----|--------|--------|
| P1-1 | No **role-locked installers** / env (`CODETRACK_ROLE=student\|professor`) | Shared lab image shows wrong UI |
| P1-2 | No **auto-start**, tray, single-instance lock | Ball closes; students reopen wrong app |
| P1-3 | No **signed Windows installer** + update channel | SmartScreen blocks; no safe upgrades |
| P1-4 | QR / links open **web widget**, not companion deep link | Phones OK; lab PCs pull wrong client |
| P1-5 | Docs do not say “**install Quickball; don’t use :3000 on lab PCs**” | Recurring support load |
| P1-6 | Branding (icon, name per role) still default Electron | Looks unfinished |

### P2 — Production polish

| ID | Issue | Impact |
|----|--------|--------|
| P2-1 | No **Android native** app (only mobile web/PWA path) | “Download for Android” expectation unmet |
| P2-2 | No macOS/Linux companion targets | Non-Windows labs blocked |
| P2-3 | No **device / single-session lock** (two clients same student) | Racey status updates |
| P2-4 | Dashboard + companion both toast on same professor session | Noise, feels “duplicated” |
| P2-5 | Accessibility, offline banner, reconnect UX incomplete | Fragile on weak lab Wi‑Fi |

### P3 — Later / nice-to-have

| ID | Item |
|----|------|
| P3-1 | VS Code extension (panel inside editor) — **after** desktop Quickball is stable |
| P3-2 | Chrome side panel — only for browser-only labs |
| P3-3 | SSO / institutional login |
| P3-4 | Analytics / crash reporting |

---

## 3. Phase plan (work in order)

### Phase 1 — One truth, stop the conflict *(~3–5 days)*  
**Outcome:** Nobody is confused about which UI to use; live data matches across clients.

| # | Work item | Detail |
|---|-----------|--------|
| 1.1 | **Product messaging in-app** | Companion splash: “Lab live status.” Dashboard banner on student widget: “Lab PCs: use CodeTrack Companion.” |
| 1.2 | **Split routes on API host** | Serve student join at `/join` (and `/?code=` → redirect to `/join`). Keep dashboard on its own host/port or `/app`. Fix `server/src/app.ts` production static clash. |
| 1.3 | **Socket parity** | Align companion with server events: `new-task` (`id` vs `taskId`), handle `task-removed`, `status-resolved`, `session-ended`. Professors: ensure `join-session` + professor-room events; students: **do not** emit professor-only `join-session`. |
| 1.4 | **Align validation** | Issue text max length, grace window, status enum — same as server + `server/public`. |
| 1.5 | **Config defaults** | Companion Settings: Electron → `http://<api-host>:3000/api`; browser-dev → Vite proxy. “Reset to defaults” clears bad `localStorage`. Document CORS includes `5173` + `5174`. |
| 1.6 | **Single active student client warning** | If companion detects student JWT restore while documenting “close the browser widget,” show one-line warning. Optional later: server kicks older socket on new join. |
| 1.7 | **QA checklist** | One ACTIVE session → student Quickball status changes appear on professor Quickball **and** dashboard grid within 1–2s; no second join on `:3000` during that test. |

**Exit criteria:** With companion + dashboard only (widget closed), login/search/status work; no CORS; counts match.

**Phase 1 implementation status (2026-09-24):**
- [x] 1.1 Messaging (companion splash + `/join` lab banner)
- [x] 1.2 `/join` canonical route; `/?code=` → `/join?code=`; public static no longer owns `/`
- [x] 1.3 Socket parity (`id`+`taskId`, professor `new-task`/`task-removed`, companion handlers; students do not emit `join-session`)
- [x] 1.4 Issue max 500 + 2min grace aligned
- [x] 1.5 Config/docs + Reset defaults
- [x] 1.6 Single-client warning on student tasks
- [ ] 1.7 Manual QA on a live ACTIVE session (operator)

---

### Phase 2 — Role-correct UX & lab install model *(~3–5 days)*  
**Outcome:** Students never see professor login; professors never see student join on lab builds.

| # | Work item | Detail |
|---|-----------|--------|
| 2.1 | **Role-locked builds** | Two NSIS artifacts from same codebase: `CodeTrack-Student-Setup.exe` and `CodeTrack-LabMonitor-Setup.exe` (or one installer + `CODETRACK_ROLE` set by IT). Hide RolePicker when role is locked. |
| 2.2 | **First-run UX** | Student build → Join screen only. Professor build → Login only. “Switch role” hidden unless unlocked (dev) build. |
| 2.3 | **Professor attach flow** | Prefer auto-attach latest ACTIVE; if multiple, picker of **active sessions only**. End session / create session remains dashboard-first (confirm dialogs). |
| 2.4 | **Student join polish** | Full code entry, live search, clear errors, restore after reboot, collapsed ball = connection + open issues shortcut. |
| 2.5 | **Lab image docs** | One page: install Student build on student PCs; Lab Monitor on teacher laptop; set `CODETRACK_API_URL` / Socket / Dashboard once. |
| 2.6 | **Deprecate widget on lab path** | Soft banner on `/join` for desktop User-Agents: “Download Companion for Windows.” Keep `/join` for mobile. |

**Exit criteria:** Student build has zero professor UI; professor build has zero student join; IT can image a lab from docs alone.

---

### Phase 3 — Ship Windows Quickball as the product *(~5–7 days)*  
**Outcome:** Teachers/students can download and stay connected without opening three browsers.

| # | Work item | Detail |
|---|-----------|--------|
| 3.1 | **Installer polish** | Custom icon, product name per role, Start Menu + Desktop shortcut, optional “Start with Windows.” |
| 3.2 | **Always-on-top + tray** | Minimize to tray; single-instance; don’t steal focus from VS Code (already partially done). |
| 3.3 | **Preconfigure server URL** | NSIS / `.env` / MDM: `CODETRACK_API_URL`, `CODETRACK_SOCKET_URL`, `CODETRACK_DASHBOARD_URL` so students never touch Settings. |
| 3.4 | **Deep links** | Register `codetrack://join?code=XXXX`. QR can encode HTTPS landing that opens protocol or downloads installer. |
| 3.5 | **Auto-update** | `electron-updater` + GitHub Releases (or your host) for Student + Lab Monitor channels. |
| 3.6 | **Code signing** | Windows Authenticode so SmartScreen doesn’t scare labs. |
| 3.7 | **Download page** | Simple `https://your-host/download` with Student / Professor Windows buttons + mobile “Open join in browser.” |
| 3.8 | **E2E lab rehearsal** | 1 professor + N students on image PCs; 3h session; reconnect Wi‑Fi; restore after reboot. |

**Exit criteria:** Fresh Windows PC → install → connect to hosted API → full lab without opening `:3000` or `:5174` in a browser.

---

### Phase 4 — Mobile, harden, production credit *(~1–2 weeks)*  
**Outcome:** Safe to hand to a whole class + phones; sync guarantees; optional Android path.

| # | Work item | Detail |
|---|-----------|--------|
| 4.1 | **Mobile web `/join` PWA** | Manifest, installable, large touch targets, same JWT restore. **This is the Android v1** (no Play Store required). |
| 4.2 | **Optional Android wrapper** | Capacitor/TWA wrapping `/join` only if Play Store needed — **after** PWA works. |
| 4.3 | **Session binding (optional)** | On new student join from another device, expire previous student socket or show “joined elsewhere.” |
| 4.4 | **Professor single monitor preference** | If dashboard live page open, companion can mute or “dashboard is primary”; or document “use ball OR full grid, not both for alerts.” |
| 4.5 | **Observability** | Health endpoint already exists; add client version header; basic error logging for failed status posts. |
| 4.6 | **Security pass** | Rate limits, PIN lockout (already), HTTPS only in prod, no secrets in installer, CORS locked to real domains (not open `*`). |
| 4.7 | **User-facing manuals** | 1-page Student, 1-page Professor, 1-page Lab IT — PDF or Markdown in `docs/`. |
| 4.8 | **Acceptance / “production credit” gate** | See §5 checklist — all must pass. |

**Exit criteria:** Checklist §5 green; class can run without developer present.

---

## 4. Distribution matrix (what users download)

| User | Platform | What they get | Phase |
|------|----------|---------------|-------|
| Student | Windows lab PC | **CodeTrack Student** `.exe` (Quickball) | 2–3 |
| Professor | Windows laptop | **CodeTrack Lab Monitor** `.exe` (Quickball) + browser dashboard | 2–3 |
| Student | Android / iPhone | **Browser / PWA** at `/join?code=` (v1); optional store app later | 4 |
| Student | Chromebook / locked browser | `/join` web only | 4 |
| Professor | macOS / Linux | Companion builds when added; until then dashboard + browser | 4+ |
| IT | Server | Hosted API + Supabase + static download page | 3 |

**Already available today (dev):**  
`companion/release/CodeTrack-Companion-Setup-1.0.0.exe` via `cd companion && npm run dist` — **not** yet role-split, signed, or auto-updating.

---

## 5. Production-credit acceptance checklist

Use this before giving credentials to a real class.

### Sync & correctness
- [ ] One ACTIVE session; student status on Quickball updates professor Quickball counts ≤ 2s  
- [ ] Same update appears on dashboard grid  
- [ ] New task from dashboard appears on student Quickball without refresh  
- [ ] Session end disables student controls and clears professor live attach  
- [ ] Student restore after PC reboot mid-lab works while session ACTIVE  
- [ ] PIN wrong / lockout messages clear; no double-join needed  

### UX / roles
- [ ] Student installer: **no** professor login, **no** role picker  
- [ ] Professor installer: **no** student join flow  
- [ ] Lab docs never tell students to open `:3000` widget if companion is installed  
- [ ] Settings hidden or pre-filled on lab images  

### Install & ops
- [ ] Windows installer runs on clean Win10/11 lab image  
- [ ] API URL points at production host (HTTPS)  
- [ ] Auto-start optional works  
- [ ] Update path documented (or auto-update works)  
- [ ] Download page links correct builds  

### Security / hosting
- [ ] HTTPS everywhere in production  
- [ ] CORS limited to real dashboard + companion origins  
- [ ] `/join` vs dashboard routes do not clash  
- [ ] Seed/demo passwords not used in production  

---

## 6. Explicit non-goals (until Phase 4+)

- Full Chrome extension as primary lab client  
- VS Code extension as primary lab client  
- Creating classes/sessions **inside** the student Quickball  
- Native Android professor app  
- Replacing the web dashboard with the ball  

---

## 7. Suggested ownership & order of execution

1. **Phase 1** — Engineering: sync + routing + kill confusion (widget vs companion).  
2. **Phase 2** — Product + eng: role-locked UX + lab docs.  
3. **Phase 3** — Release: signed Windows installers, download page, deep links, updates.  
4. **Phase 4** — Scale: PWA/mobile, hardening, manuals, acceptance gate.

After Phase 3, you can run a **pilot lab** (one class). After Phase 4 checklist, treat as **production-credit ready**.

---

## 8. Immediate actions (this week)

1. **Stop testing three UIs at once.** For any live test:  
   - Professor: dashboard **or** companion Lab Monitor — prefer companion for “while coding.”  
   - Student: **only** companion Student (close `localhost:3000` widget).  
2. **Restart API** after CORS changes; use Config → Reset if Settings show `5174/api` accidentally saved as API host.  
3. Start **Phase 1.2–1.3** (routes + socket parity) before more UI polish.  
4. Decide naming:  
   - `CodeTrack Student` vs `CodeTrack Lab Monitor`  
   - Keep generic “Companion” only for unlocked **dev** builds.

---

## 9. Traceability (code areas)

| Area | Paths |
|------|--------|
| Companion shell / roles | `companion/src/App.tsx`, `views/RolePicker.tsx`, `views/StudentView.tsx`, `views/ProfessorView.tsx`, `electron/main.cjs` |
| Student web widget | `server/public/app.js`, `index.html` |
| Dashboard | `dashboard/src/` (auth, session, socket) |
| API + sockets | `server/src/app.ts`, `socket/`, `modules/sessions/`, `modules/responses/` |
| Installer | `companion/package.json` (`build` / `dist`), `companion/release/` |
| This plan | `docs/Production_Ready_Quickball_Enhancement_Plan.md` |

---

## 10. One-sentence summary

**Today you have three overlapping clients; production means one role-locked Quickball for live labs, dashboard for admin only, `/join` for phones, Windows installers students/teachers can trust, and a four-phase path to get there without session conflicts.**
