# CodeTrack Classroom — Enhanced Project Plan

**Type:** Academic / College Project Plan
**Version:** 3.1 (Enhanced — System-First + Institutional Scaling)
**Date:** 22 September 2026
**Status:** Ready for development

---

## 1. One-Line Definition

CodeTrack Classroom is a real-time, lightweight task-distribution and status-tracking system: a professor pushes tasks during a practical session, students receive them instantly and report completion or issues from a minimal popup widget, and the professor sees a live per-student status grid — with no code inspection and no student monitoring.

---

## 2. The Problem

A professor gives a practical task. Students work independently. The professor has no fast way to know:

- How many students have finished the current task?
- Who is stuck and on what?
- Whether to move to the next task or wait longer?

The current methods — asking verbally, walking around — are slow, inaccurate, and disruptive.

CodeTrack answers three questions:

> 1. **How many students have completed each task?**
> 2. **Who is stuck and what is their problem?**
> 3. **Is the class ready for the next task?**

It does **not** try to answer whether the code is correct. That's a deliberate scope boundary — keep it that way. It's what keeps the project buildable and privacy-friendly.

---

## 3. What Changed From v2 → v3 (Why This Plan Is Different)

| Issue in v2 | Enhancement in v3 |
|---|---|
| Single task per session — professor creates a new session for each task | **Multi-task sessions**: professor clicks "Add New Task" anytime, students auto-notified |
| "I'm Stuck" is a binary flag with no context | **Issue reporting**: student can describe the problem (e.g., "flexbox alignment not working") |
| Student UI is a full React PWA — heavy, needs install | **Lightweight floating widget**: vanilla HTML/CSS/JS, occupies <15% of screen, collapses to tiny icon |
| QR scan is the primary join method — college PCs have no cameras | **Manual session code entry**: 6-character code typed by students. QR is optional/secondary |
| Students pick name from dropdown — anyone can pick any name | **Roll number verification**: student enters roll number, matched against uploaded roster |
| Tech stack is massively over-engineered (NestJS + PostgreSQL + Redis + MQTT + Docker + Nginx) | **Right-sized stack**: Express + SQLite for dev, PostgreSQL only for deploy. No Redis/MQTT until IoT phase |
| No consideration for screen real estate during coding | **Widget mode**: tiny draggable popup, doesn't cover the student's IDE/editor |
| No hardware flag system for visual classroom signals | **Phase 2 flag system**: visual indicator tied to "Issue" status — teacher can see flagged desks |
| Task distribution is not automated | **Auto-push**: new tasks pushed via Socket.IO, students get instant notification in their widget |

---

## 4. Core Design Principles (Non-Negotiable)

1. **Signalling, not verification.** Self-declared status — stated openly as a design choice, not a gap.
2. **Server is the single source of truth.** Dashboard, widget, and IoT hub are all just views.
3. **No behavioral surveillance.** No webcam, keystrokes, screen capture, ever — not even as a "future extension."
4. **Lightweight by default.** The student experience must never interfere with coding. Minimal footprint.
5. **Works on restricted machines.** No installs, no camera, no special browser features. Just a URL + a code.
6. **Build in layers.** Each phase must work and be demoable on its own before the next is added.

---

## 5. Phased Build Plan

### Phase 1A — Core System (Software Only, Zero Hardware)
**Duration: Weeks 1–6**
**Goal: Fully working multi-task session management + real-time status tracking**

**Scope:**
- Professor registers/logs in, creates classes, uploads student rosters (CSV).
- Professor creates a session → gets a **6-character session code** (e.g., `X7K2M9`).
- Students join by entering the session code + their roll number (matched against roster).
- Professor **adds tasks one-by-one** during the session (click "Add New Task" → enter title).
- Students are **automatically notified** of new tasks via WebSocket push — no refresh needed.
- Student sees each task in a **floating widget** with status buttons: **Not Started** → **In Progress** → **Done** | **Issue**.
- When marking "Issue", student can optionally type a short description of the problem.
- Professor dashboard shows a **live per-student × per-task status grid**:
  - Who is done, who is in progress, who is stuck.
  - For "Issue" students: roll number, name, and the issue description.
- Professor can end the session → all statuses frozen, summary saved.

**Explicitly out of scope for Phase 1A:** Login for students, hardware, analytics, history, QR codes.

**Exit criterion:** Professor runs a real 20–50 student practical session. Adds 3+ tasks. Can identify which students have issues and what those issues are — all from the dashboard, without walking the room.

---

### Phase 1B — Polish & Hardening
**Duration: Weeks 7–8**

**Scope:**
- Grace window for status changes (student can correct accidental "Done" within 2 minutes).
- QR code generation as a secondary join option (for those with cameras).
- Session summary export (CSV of all student × task statuses).
- Auto-reconnect on network drop (Socket.IO built-in + custom retry).
- Rate limiting on API endpoints.
- Input validation & sanitization on all endpoints.
- Proper error handling & structured logging.
- Confirm dialogs on destructive actions (end session, change status from Done).

**Exit criterion:** System handles flaky Wi-Fi, accidental submissions, and edge cases gracefully.

---

### Phase 2 — Hardware Flag System (IoT Integration)
**Duration: Weeks 9–10**

**Goal:** Add physical visibility to the software signals. Two sub-components:

**2A — Professor Desk Hub:**
- ESP32 + OLED on the professor's desk.
- Shows: `READY → SESSION ACTIVE → Task 3: 12/40 DONE, 3 ISSUES → ALL COMPLETE`.
- Shows explicit `SERVER OFFLINE` state if connection drops.
- Dashboard keeps working regardless — hub is a *view*, never the source of truth.

**2B — Student Flag System (Stretch / Optional):**
- When a student marks "Issue" in their widget, a visual/physical flag is triggered.
- **Option A (Software-only flag):** Professor dashboard highlights the student's desk number with a pulsing red indicator. Professor can identify the desk visually on a seating chart.
- **Option B (Hardware flag):** Small LED strip or physical flag actuated by an ESP32 per desk row. More dramatic but higher cost.
- Decision on Option A vs B deferred until Phase 1 is proven.

**Infrastructure additions for Phase 2:**
- MQTT broker (Mosquitto) for ESP32 communication.
- NestJS bridge module: Socket.IO events ↔ MQTT topics.

**Exit criterion:** Dashboard and hub update within ~1 second. Disconnecting the hub does not affect the web system. Professor can visually identify flagged students.

---

### Phase 3 — Accounts, History, Analytics
**Duration: Weeks 11–12**

**Scope:**
- Optional persistent login for students (replaces roll-number-only join).
- Historical session records: completion rate, duration, per-task trends over a term.
- Per-student view for the professor (past performance, frequent issues).
- Multi-class management for professors.
- PostgreSQL migration for production deployment.
- CSV/PDF export of session reports.

**Exit criterion:** A professor can look up any past session and see exactly how the class performed per task.

---

## 6. Explicit Security / Integrity Notes

- **Session-to-roster binding:** A status update can only be recorded for a roll number present in that class's roster for that session — prevents outsiders from joining.
- **One response per student per task:** Enforced at the database level (`UNIQUE(task_id, student_id)`), not just in the UI.
- **Roll number verification on join:** Student must enter a roll number that exists in the uploaded roster. No name-picking from a dropdown.
- **Confirm-before-submit** on "Done" to reduce accidental taps.
- **Status change grace window:** Student can change status within 2 minutes. After that, locked (professor can manually unlock if needed).
- **HTTPS in any deployment beyond a local classroom demo.**
- **Minimal data collection** — name, roll number, class, session, timestamp, status, issue text. Nothing else.

---

## 7. Key Feature: Multi-Task Sessions with Auto-Push

This is the core workflow enhancement. Instead of one task per session:

```
Professor creates Session "DOM Practical 05"
    │
    ├── Adds Task 1: "Create a basic HTML page"
    │       └── All students auto-notified → widget shows Task 1
    │
    ├── (waits for most students to finish)
    │
    ├── Adds Task 2: "Add CSS styling"
    │       └── All students auto-notified → widget shows Task 2
    │
    ├── Adds Task 3: "Make it responsive"
    │       └── All students auto-notified → widget shows Task 3
    │
    └── Ends Session → Summary saved with all task statuses
```

The professor never has to tell students verbally "OK, next task" — the widget handles it. The professor never has to create multiple sessions — one session, many tasks.

---

## 8. Key Feature: Issue Reporting with Context

The "I'm Stuck" button from v2 is replaced with a richer "Issue" flow:

```
Student taps "Issue" on Task 3
    │
    ├── Optional text field appears: "Describe your problem (optional)"
    │   Student types: "media queries not applying to the navbar"
    │
    ├── Submitted → Widget shows Task 3 status as "ISSUE 🔴"
    │
    └── Professor dashboard shows:
        ┌─────────────────────────────────────────────────────────┐
        │  ISSUES (3 students)                                     │
        │                                                           │
        │  🔴 Roll 15 - Aman Sharma                                │
        │     Task 3: "media queries not applying to the navbar"   │
        │                                                           │
        │  🔴 Roll 22 - Priya Desai                                │
        │     Task 3: "flexbox items not centering"                │
        │                                                           │
        │  🔴 Roll 38 - Raj Patel                                  │
        │     Task 2: (no description provided)                    │
        └─────────────────────────────────────────────────────────┘

Professor walks directly to Roll 15 knowing exactly what the issue is.
```

---

## 9. Technology Stack (Right-Sized for Classroom Scale)

### 9.1 Guiding Principle

> **Build for 40–60 concurrent students, not 10,000.** The stack should be simple enough that one developer can understand and debug every part. Scale complexity is added only in Phase 2 (IoT) and Phase 3 (production deployment).

### 9.2 Backend — Application Server

| Component | Choice | Why |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Stable, long-term support |
| Language | **TypeScript** | Type safety, shared interfaces with frontend |
| Framework | **Express.js** | Simple, fast to build, well-documented. ~10 API endpoints don't need NestJS's module system |
| Real-time engine | **Socket.IO** (single server) | One server handles 60 students trivially. No Redis adapter needed at this scale |
| Auth | **JWT** (access tokens) via `jsonwebtoken`, **Argon2** for password hashing | Industry-standard, lightweight |
| Validation | **Zod** | Type-safe schema validation, shared with frontend types |
| Roster upload | `multer` + `papaparse` | CSV class-list ingestion |
| Session codes | `nanoid` (custom alphabet, 6 chars) | Short, human-typeable, collision-resistant |
| QR generation | `qrcode` (Phase 1B) | Server-side QR generation, secondary join method |
| Logging | `pino` | Structured JSON logging |
| Security | `helmet`, `cors`, `express-rate-limit` | Headers, origin restriction, rate limiting |

### 9.3 Data Layer

| Component | Choice | Why |
|---|---|---|
| Development DB | **SQLite** via `better-sqlite3` | Zero setup, single file, runs anywhere. Perfect for Phase 1 |
| Production DB | **PostgreSQL** via **Prisma** | Migrate only when deploying for real repeated use (Phase 3) |
| ORM | **Prisma** | Type-safe queries, auto-generated types, easy migration between SQLite ↔ PostgreSQL |

### 9.4 Frontend — Professor Dashboard

| Component | Choice | Why |
|---|---|---|
| Framework | **React 18 + TypeScript**, bundled with **Vite** | Dashboard needs interactive grids, real-time charts — React justified here |
| Styling | **Vanilla CSS** with CSS custom properties | Clean, maintainable, no framework dependency |
| Real-time client | `socket.io-client` | Connects to backend Socket.IO |
| Charts | **Recharts** (Phase 3 only) | Completion-rate visualizations for history/analytics view |

### 9.5 Frontend — Student Widget

| Component | Choice | Why |
|---|---|---|
| Framework | **None — Vanilla HTML/CSS/JS** | The widget is ~4 UI elements. React would be 100x overkill. Loads instantly |
| Styling | **Vanilla CSS** | Ultra-light, no build step needed |
| Real-time client | `socket.io-client` (CDN or bundled) | Auto-reconnect, event-driven updates |
| UI pattern | **Floating draggable popup** | Sits in corner of screen. Collapsible to a 40×40px icon |

### 9.6 IoT Hub (Phase 2 Only)

| Component | Choice | Why |
|---|---|---|
| Microcontroller | ESP32-WROOM-32 | Wi-Fi built-in, dual-core, well-documented |
| Display | 0.96" OLED (SSD1306, I2C) | Standard, cheap, readable |
| Messaging | **PubSubClient** (MQTT) | Talks to Mosquitto broker |
| Broker | **Eclipse Mosquitto** | Lightweight MQTT broker, added to stack only in Phase 2 |
| Firmware | **PlatformIO** (VS Code) | Reproducible builds, dependency management |

### 9.7 Infrastructure & DevOps

| Component | Choice | When |
|---|---|---|
| Dev setup | `npm run dev` — single command | Phase 1 onward |
| Containerization | **Docker** (single container) | Phase 2+ (when adding MQTT/Mosquitto) |
| Docker Compose | Backend + Mosquitto + (optionally Postgres) | Phase 2+ |
| Reverse proxy | **Nginx** + Let's Encrypt | Phase 3 (production deployment only) |
| CI/CD | **GitHub Actions** | Phase 1B+ (lint + test on push) |
| Hosting | **Railway** or **VPS** | Phase 3 (public demo deployment) |

### 9.8 Testing

| Component | Choice | Why |
|---|---|---|
| Backend unit/integration | **Jest** + `supertest` | Standard Express testing |
| Frontend unit | **Vitest** + **React Testing Library** | Fast, integrates with Vite |
| End-to-end | **Playwright** | Simulates full student + professor flow |

---

## 10. Complete Feature List (Phase-Tagged)

### 10.1 Professor Features

| Feature | Phase | Notes |
|---|---|---|
| Professor registration & login | P1A | JWT-based, Argon2 hashed passwords |
| Class creation | P1A | Name + section (e.g., "TY-CS-A") |
| Roster upload (CSV) | P1A | Bulk-adds students with roll numbers |
| Session creation | P1A | Returns a 6-character join code |
| **Add tasks during session** | P1A | Click "Add New Task" → title → auto-pushed to students |
| **Live per-student × per-task status grid** | P1A | Matrix view: every student's status on every task |
| **Issue alert panel** | P1A | Shows students with "Issue" status + their issue description |
| End session | P1A | Freezes all statuses, saves summary |
| QR code for session | P1B | Secondary join method |
| Session summary CSV export | P1B | Download all statuses as spreadsheet |
| Sound/visual alert on new "Issue" | P2 | Browser notification or audio ping |
| Desk hub (OLED display) | P2 | Physical display on professor's desk |
| Session history & analytics | P3 | Past sessions, trends, completion rates |
| Multi-class management | P3 | Switch between classes |

### 10.2 Student Features

| Feature | Phase | Notes |
|---|---|---|
| **Join via session code + roll number** | P1A | No QR, no camera, no install needed |
| **Receive new tasks automatically** | P1A | Widget shows notification when professor adds a task |
| **Task list in floating widget** | P1A | See all tasks, current statuses |
| **Status buttons: Not Started → In Progress → Done** | P1A | Simple state transitions |
| **"Issue" button with optional description** | P1A | Student describes the problem |
| Status confirmation feedback | P1A | Clear visual feedback after submission |
| Status change grace window | P1B | Correct accidental "Done" within 2 minutes |
| Auto-reconnect on network drop | P1B | Socket.IO built-in + custom retry |
| Join via QR scan | P1B | For devices with cameras (optional) |
| Visual flag indicator | P2 | Physical/software flag for "I need help" |

### 10.3 System Features

| Feature | Phase | Notes |
|---|---|---|
| Session code generation & validation | P1A | 6-char alphanumeric, collision-checked |
| Roster-based roll number verification | P1A | Only roster students can join |
| One-response-per-student-per-task constraint | P1A | Database-level UNIQUE constraint |
| REST API (auth, classes, sessions, tasks, responses) | P1A | ~15 endpoints |
| WebSocket room-per-session broadcasting | P1A | Socket.IO rooms for scoped updates |
| Rate limiting | P1B | Prevents spam submissions |
| Input validation & sanitization | P1B | Zod schemas on all endpoints |
| Structured logging | P1B | Pino JSON logs |
| MQTT bridge for IoT hub | P2 | Socket.IO ↔ MQTT event bridge |
| PostgreSQL migration | P3 | From SQLite to production DB |

### 10.4 IoT Hub Features (Phase 2)

| Feature | Phase | Notes |
|---|---|---|
| Wi-Fi captive-portal setup | P2 | No hardcoded credentials |
| OLED display states: READY / ACTIVE / count / COMPLETE / OFFLINE | P2 | Matches session lifecycle |
| Live count sync with dashboard | P2 | MQTT-driven, not polling |
| RGB LED status indicator | P2 | Color-coded session state |
| Student flag system (software or hardware) | P2 | Visual "need help" signal |

---

## 11. Student Widget — UI Design

The student widget is designed to be **invisible until needed**:

### Collapsed State (Default)
```
                                              ┌────┐
  Student's coding workspace                  │ CT │ ← 40×40px floating icon
  (VS Code / Browser / IDE)                   │ 🔴 │    Red dot = new task
                                              └────┘
```

### Expanded State (Click to open)
```
                                    ┌──────────────────────┐
  Student's coding                  │ CodeTrack   ─  ×     │
  workspace                         │──────────────────────│
  (still fully                      │ Session: DOM Prac 05 │
  visible behind                    │                      │
  the widget)                       │ ✅ Task 1: HTML Page │
                                    │ 🔄 Task 2: CSS      │
                                    │ ⬜ Task 3: Responsive│
                                    │                      │
                                    │ ── Task 3 ──         │
                                    │ [Not Started]        │
                                    │ [In Progress]        │
                                    │ [  Done  ✓ ]         │
                                    │ [ Issue  ⚠ ]         │
                                    │                      │
                                    │ ┌──────────────────┐ │
                                    │ │ Describe issue...│ │
                                    │ └──────────────────┘ │
                                    │     [Submit Issue]    │
                                    └──────────────────────┘
```

### Key UI Behaviors
- **Draggable**: Student can move the widget to any screen corner.
- **Collapsible**: Click the icon to toggle expanded/collapsed.
- **Notification badge**: Red dot appears when a new task is pushed.
- **Auto-scroll**: Widget auto-scrolls to the newest task.
- **No full-page navigation**: Everything happens inside the widget.
- **Responsive**: Works on any screen size, from 13" laptops to lab monitors.

---

## 12. Database Schema

```sql
-- Professor accounts
PROFESSORS (
  professor_id    TEXT PRIMARY KEY,        -- UUID
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,           -- Argon2
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Classes (a professor's student group)
CLASSES (
  class_id        TEXT PRIMARY KEY,        -- UUID
  class_name      TEXT NOT NULL,           -- e.g., "TY-CS-A"
  professor_id    TEXT NOT NULL REFERENCES PROFESSORS,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Students (from roster upload)
STUDENTS (
  student_id      TEXT PRIMARY KEY,        -- UUID
  roll_no         TEXT NOT NULL,
  name            TEXT NOT NULL,
  class_id        TEXT NOT NULL REFERENCES CLASSES,
  UNIQUE(class_id, roll_no)                -- No duplicate roll numbers in a class
)

-- Sessions (a practical lab period — contains multiple tasks)
SESSIONS (
  session_id      TEXT PRIMARY KEY,        -- UUID
  class_id        TEXT NOT NULL REFERENCES CLASSES,
  session_code    TEXT UNIQUE NOT NULL,    -- 6-char join code (e.g., "X7K2M9")
  title           TEXT NOT NULL,           -- e.g., "DOM Practical 05"
  status          TEXT DEFAULT 'ACTIVE',   -- ACTIVE | ENDED
  started_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at        DATETIME
)

-- Tasks within a session (professor adds these one-by-one during the session)
TASKS (
  task_id         TEXT PRIMARY KEY,        -- UUID
  session_id      TEXT NOT NULL REFERENCES SESSIONS,
  task_number     INTEGER NOT NULL,        -- Auto-incrementing within session
  title           TEXT NOT NULL,           -- e.g., "Create a responsive navbar"
  description     TEXT,                    -- Optional longer description
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, task_number)
)

-- Student responses to tasks
TASK_RESPONSES (
  response_id     TEXT PRIMARY KEY,        -- UUID
  task_id         TEXT NOT NULL REFERENCES TASKS,
  student_id      TEXT NOT NULL REFERENCES STUDENTS,
  status          TEXT DEFAULT 'NOT_STARTED',  -- NOT_STARTED | IN_PROGRESS | DONE | ISSUE
  issue_text      TEXT,                         -- Optional: "my loop isn't working"
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, student_id)                   -- One response per student per task
)

-- Session participants (students who joined the session)
SESSION_PARTICIPANTS (
  session_id      TEXT NOT NULL REFERENCES SESSIONS,
  student_id      TEXT NOT NULL REFERENCES STUDENTS,
  joined_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (session_id, student_id)
)
```

### Key Schema Design Decisions

| Decision | Rationale |
|----------|-----------|
| `TASKS` table separate from `SESSIONS` | Supports multiple tasks per session — the core workflow change |
| `TASK_RESPONSES` instead of `COMPLETIONS` | 4-state status model (NOT_STARTED → IN_PROGRESS → DONE / ISSUE) instead of binary |
| `issue_text` field on responses | Students describe their problem, professor gets context without walking over |
| `session_code` on `SESSIONS` | 6-character human-typeable join code — works without cameras |
| `SESSION_PARTICIPANTS` | Tracks who has joined (separate from task responses) |
| `UNIQUE(task_id, student_id)` | Prevents duplicate responses — enforced at DB level |
| `UNIQUE(class_id, roll_no)` | No duplicate roll numbers within a class |

---

## 13. System Architecture

### 13.1 Phase 1 Architecture (Simple — One Server Does Everything)

```
┌─────────────────────────────────┐     ┌────────────────────────────────┐
│        PROFESSOR                │     │         STUDENTS (40-60)       │
│                                 │     │                                │
│   React Dashboard (Vite)        │     │   Lightweight Widget           │
│   - Session management          │     │   (Vanilla HTML/CSS/JS)        │
│   - Task creation               │     │   - Join via code + roll no    │
│   - Live status grid            │     │   - Status buttons             │
│   - Issue alerts                │     │   - Issue description           │
│                                 │     │   - Floating popup             │
└──────────────┬──────────────────┘     └──────────────┬─────────────────┘
               │ HTTPS + WSS                           │ HTTPS + WSS
               │                                       │
               └───────────────┬───────────────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │     Node.js + Express Server  │
               │                               │
               │  - REST API (~15 endpoints)   │
               │  - Socket.IO (single instance)│
               │  - Session room management    │
               │  - JWT auth                   │
               │  - Zod validation             │
               │                               │
               └───────────────┬───────────────┘
                               │
                               ▼
               ┌───────────────────────────────┐
               │         SQLite                │
               │   (single file, zero setup)   │
               │                               │
               │  - Professors, Classes        │
               │  - Students (roster)          │
               │  - Sessions, Tasks            │
               │  - Task Responses             │
               │  - Session Participants       │
               │                               │
               │   Source of truth for ALL data │
               └───────────────────────────────┘
```

**Why this is enough for Phase 1:**
- 40–60 concurrent WebSocket connections is trivial for a single Node.js process.
- SQLite handles the read/write volume of a classroom with zero contention.
- No Redis, no Nginx, no Docker — just `npm run dev`.

### 13.2 Phase 2 Architecture (Adding IoT Hub)

```
          Phase 1 system (unchanged)
               ┌───────────────────────────────┐
               │     Node.js + Express Server  │
               │  + MQTT Bridge Module         │ ◄── New: publishes events to MQTT
               └──────────┬────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
  ┌───────────────────┐   ┌─────────────────────────┐
  │      SQLite       │   │   MQTT Broker            │
  │   (unchanged)     │   │   (Mosquitto)            │
  └───────────────────┘   │                           │
                          │   Topics:                 │
                          │   session/{id}/tasks      │
                          │   session/{id}/status     │
                          │   session/{id}/control    │
                          └─────────────┬─────────────┘
                                        │ Wi-Fi (MQTT over TCP)
                                        ▼
                          ┌─────────────────────────┐
                          │      ESP32 IoT HUB      │
                          │  - OLED (live count)     │
                          │  - RGB LED (status)      │
                          │  - Optional: desk flags  │
                          └─────────────────────────┘
```

### 13.3 Phase 3 Architecture (Production-Grade)

```
               ┌───────────────────────────────┐
               │   Nginx (Reverse Proxy + TLS) │
               └──────────────┬────────────────┘
                              │
               ┌──────────────┴────────────────┐
               │     Node.js + Express Server  │
               │  + Socket.IO + MQTT Bridge    │
               └──────────┬───────┬────────────┘
                          │       │
              ┌───────────┘       └───────────┐
              ▼                               ▼
  ┌───────────────────┐           ┌───────────────────┐
  │    PostgreSQL     │           │  MQTT Broker       │
  │   (production DB) │           │  (Mosquitto)       │
  └───────────────────┘           └───────────────────┘
```

---

## 14. Request Flow — Core Scenarios

### 14.1 "Professor Adds a New Task"

```
1. Professor clicks "Add New Task" on dashboard
        │
2. POST /api/sessions/:id/tasks  { title: "Make it responsive" }
        │
3. Server creates row in TASKS table (auto-assigns task_number)
        │
4. Server emits Socket.IO event 'new-task' to session room:
   { taskId, title, taskNumber, description }
        │
5. ALL connected students' widgets instantly show:
   🔔 "New Task: Make it responsive"
   Status auto-set to NOT_STARTED
        │
6. Professor dashboard updates task list and status grid
```

### 14.2 "Student Reports an Issue"

```
1. Student taps "Issue" on Task 3 in widget
   Types: "media queries not applying to navbar"
        │
2. POST /api/tasks/:id/respond  { status: "ISSUE", issueText: "media queries..." }
        │
3. Server upserts TASK_RESPONSES (UNIQUE constraint: one per student per task)
        │
4. Server emits Socket.IO event 'status-update' to session room:
   { studentId, rollNo, name, taskId, status: "ISSUE", issueText: "media queries..." }
        │
5. Professor dashboard shows in Issue Alert Panel:
   🔴 Roll 15 - Aman Sharma
      Task 3: "media queries not applying to navbar"
        │
6. Professor walks directly to Roll 15, knowing exactly what the issue is.
```

### 14.3 "Student Joins a Session"

```
1. Student opens CodeTrack URL in browser
        │
2. Enters session code "X7K2M9" + roll number "15"
        │
3. POST /api/sessions/join  { sessionCode: "X7K2M9", rollNo: "15" }
        │
4. Server validates:
   - Session exists and is ACTIVE?
   - Roll number exists in that session's class roster?
   - Not already joined?
        │
5. Row inserted into SESSION_PARTICIPANTS
        │
6. Server returns: student info + all current tasks + their statuses
        │
7. Student widget populates with task list
        │
8. Socket.IO: student joins the session room
        │
9. Server emits 'student-joined' to professor:
   { studentId, rollNo: "15", name: "Aman Sharma" }
```

---

## 15. API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Professor registration | None |
| POST | `/api/auth/login` | Professor login → JWT | None |
| GET | `/api/auth/me` | Get current professor profile | JWT |

### Classes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/classes` | Create a class | JWT |
| GET | `/api/classes` | List professor's classes | JWT |
| GET | `/api/classes/:id` | Get class details | JWT |
| POST | `/api/classes/:id/roster` | Upload CSV roster | JWT |
| GET | `/api/classes/:id/students` | List students in class | JWT |

### Sessions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/sessions` | Create session → returns session code | JWT |
| GET | `/api/sessions` | List professor's sessions | JWT |
| GET | `/api/sessions/:id` | Get session details + tasks + statuses | JWT |
| PATCH | `/api/sessions/:id/end` | End session (freeze statuses) | JWT |
| POST | `/api/sessions/join` | Student joins (code + roll number) | None |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/sessions/:id/tasks` | Add a new task to session | JWT |
| GET | `/api/sessions/:id/tasks` | List tasks in session | JWT/Student |
| PATCH | `/api/tasks/:id` | Update task title/description | JWT |
| DELETE | `/api/tasks/:id` | Remove a task | JWT |

### Task Responses
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks/:id/respond` | Student submits/updates status | Student token |
| GET | `/api/sessions/:id/status` | Full student × task status grid | JWT |
| GET | `/api/sessions/:id/issues` | List all current issues | JWT |

### Socket.IO Events
| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `new-task` | Server → Students | `{ taskId, title, description, taskNumber }` | Professor added a new task |
| `status-update` | Server → Professor | `{ studentId, rollNo, name, taskId, status, issueText }` | Student changed status |
| `student-joined` | Server → Professor | `{ studentId, rollNo, name }` | New student joined |
| `session-ended` | Server → All | `{ sessionId }` | Professor ended the session |
| `task-removed` | Server → Students | `{ taskId }` | Professor removed a task |

---

## 16. Development Timeline

| Week(s) | Phase | Deliverable |
|---|---|---|
| **1–2** | P1A | Backend: Express + TypeScript + SQLite + Prisma schema. Auth (register/login). Class CRUD + CSV roster upload. Session creation with 6-char code. |
| **3–4** | P1A | Task CRUD within sessions. Student join (code + roll number). Task response API. Socket.IO: real-time task push + status updates. |
| **5–6** | P1A | Student widget (vanilla HTML/CSS/JS, floating popup). Professor dashboard (React + Vite, status grid, issue panel). Integration testing. |
| **7** | P1A | **Phase 1A exit test**: real classroom trial, 20+ students, 3+ tasks. Fix bugs discovered. |
| **8** | P1B | QR codes, CSV export, grace window, rate limiting, validation, logging, auto-reconnect. |
| **9–10** | P2 | ESP32 hub (OLED + MQTT). Mosquitto broker. Socket.IO ↔ MQTT bridge. Student flag system (software or hardware). |
| **11–12** | P3 | PostgreSQL migration. Session history & analytics. Multi-class management. Production deployment. Final demo prep. |

---

## 17. Success Criteria

### Phase 1A (Must pass ALL)
1. ✅ Professor can create a session and get a 6-character join code in under 5 seconds.
2. ✅ Student can join by typing the code + their roll number — no QR, no camera, no install.
3. ✅ Professor can add a new task with one click; all students are notified within 1 second.
4. ✅ Student can report status (Done / In Progress / Issue + description) in 2 taps.
5. ✅ Professor sees per-student issues with roll number, name, and issue description in real-time.
6. ✅ Student widget occupies < 200px width when expanded, collapses to a 40×40px icon.
7. ✅ System handles 50 concurrent students on a single server without perceivable lag.
8. ✅ No duplicate submissions — enforced at DB level.
9. ✅ Works on college lab PCs with restricted browsers.

### Phase 2 (Must pass ALL)
10. ✅ ESP32 hub mirrors task counts, updating within ~1 second of the dashboard.
11. ✅ Disconnecting the hub does not affect the web system.
12. ✅ Professor can visually identify students who have flagged an issue.

### Phase 3 (Must pass ALL)
13. ✅ Professor can look up any past session and see per-task completion data.
14. ✅ System runs on PostgreSQL in a production deployment.

---

## 18. Final Demo Script

1. Professor opens CodeTrack, creates session **"DOM Practical 05"** for class TY-CS-A.
2. Session code `X7K2M9` appears on the projector.
3. 5 students type the code + their roll number on their lab PCs — join confirmed in widget.
4. Professor clicks **"Add Task 1: Create a basic HTML page"** — all 5 students' widgets pop up the notification.
5. Students work. One by one, they mark **In Progress** → **Done**. Dashboard updates: `1/5 → 2/5 → 3/5`.
6. One student marks **Issue** and types: *"img tag not loading the file."*
7. Professor sees the issue alert: **Roll 22 - Priya Desai: "img tag not loading the file."** → walks directly to her.
8. Professor clicks **"Add Task 2: Add CSS styling"** — all students get the new task instantly.
9. Dashboard now shows two task rows with independent progress.
10. Session ends. Summary shows all 5 students' statuses across both tasks.
11. *(Phase 2 demo)* ESP32 hub on the professor's desk mirrors the live count throughout.

---

## 19. Guiding Principle

> Simple for the student. Useful for the professor beyond just a count. Lightweight enough to run alongside coding. Works on restricted lab machines. Reliable if the hardware fails. Privacy-conscious by default. Buildable in phases that each stand on their own.

---

## Appendix A: CSV Roster Format

```csv
roll_no,name
1,Aman Sharma
2,Priya Desai
3,Raj Patel
...
```

Uploaded once per class. Students are identified by roll number during session join.

## Appendix B: Session Code Format

- **Length:** 6 characters
- **Alphabet:** Uppercase letters + digits, excluding ambiguous characters (0/O, 1/I/L)
- **Example:** `X7K2M9`, `B4N8P3`
- **Collision check:** Verified unique against active sessions before assignment
- **Validity:** Active only while session is ACTIVE; expired codes cannot be reused

## Appendix C: Student Token

After joining a session, the student receives a lightweight JWT containing:
```json
{
  "sessionId": "...",
  "studentId": "...",
  "rollNo": "15",
  "name": "Aman Sharma",
  "exp": "..." // Expires when session ends
}
```
This token is used for all subsequent API calls (status updates) without requiring a full login system.

---

## 20. Phase 4 — Department / Institution-Wide Scaling

> **When does this apply?** Only when multiple professors across a department (or the entire college) want to use CodeTrack simultaneously. Phases 1–3 are fully self-contained for a single professor or a small pilot. Phase 4 is the "what if everyone wants it" plan.

### 20.1 What Already Works at Scale (No Changes Needed)

These parts of the Phase 1–3 design naturally support multiple professors without modification:

| Area | Why It Works |
|------|-------------|
| **Independent professor accounts** | Each professor registers, creates their own classes and sessions — no collisions |
| **Globally unique session codes** | `UNIQUE` constraint on `session_code` ensures no two active sessions share a code, even across professors |
| **Socket.IO room isolation** | Each session gets its own room — Professor A's students never see Professor B's events |
| **JWT-scoped auth** | Each professor's JWT only grants access to their own classes and sessions |
| **Stateless API** | Any request can be handled by any server instance — horizontal scaling is possible |

### 20.2 What Breaks at Department Scale (Must Be Fixed)

| Problem | Impact | Solution |
|---------|--------|----------|
| **No department/institution hierarchy** | Who manages the system? No admin can see across professors | Add `DEPARTMENTS` and `INSTITUTIONS` tables with admin roles |
| **Open professor registration** | Anyone with the URL can register as a professor — no approval | Add admin-approved registration workflow |
| **Student identity is per-class** | Same student in 3 professors' classes = 3 separate DB entries with no link between them | Unify students at the institution level — classes reference a shared student record |
| **SQLite under concurrent writes** | 10+ simultaneous sessions writing statuses = SQLite's single-writer lock causes contention | Migrate to PostgreSQL (already planned in Phase 3, but now becomes mandatory earlier) |
| **No cross-department analytics** | HOD can't see: "which classes have the most issues?" or "which professors are using the system?" | Admin dashboard with aggregate views |
| **Each professor uploads rosters separately** | If 5 professors teach the same class, 5 separate CSV uploads with potential inconsistencies | Centralized roster management at the department level |
| **Single server WebSocket limit** | 20 professors × 50 students = 1,000 concurrent WebSockets — still fine for one server, but approaches the threshold | Plan for Redis-backed Socket.IO adapter if growth continues |

### 20.3 Institutional Hierarchy

```
INSTITUTION (e.g., "ABC Engineering College")
    │
    ├── DEPARTMENT (e.g., "Computer Science")
    │       │
    │       ├── PROFESSOR (e.g., "Prof. Sharma")
    │       │       ├── CLASS: TY-CS-A
    │       │       ├── CLASS: TY-CS-B
    │       │       └── Sessions...
    │       │
    │       ├── PROFESSOR (e.g., "Prof. Patel")
    │       │       ├── CLASS: SY-CS-A
    │       │       └── Sessions...
    │       │
    │       └── DEPT ADMIN / HOD (e.g., "Dr. Kulkarni")
    │               └── Can view all professors, classes, analytics
    │
    ├── DEPARTMENT (e.g., "Information Technology")
    │       └── ...
    │
    └── INSTITUTION ADMIN
            └── Can manage departments, approve professors, view everything
```

### 20.4 Database Schema Additions (Phase 4)

These tables are **added** to the existing schema. Existing tables are modified minimally.

```sql
-- NEW: Institution (top-level entity)
INSTITUTIONS (
  institution_id   TEXT PRIMARY KEY,
  name             TEXT NOT NULL,          -- e.g., "ABC Engineering College"
  code             TEXT UNIQUE NOT NULL,   -- e.g., "ABCEC" — used for registration
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- NEW: Departments within an institution
DEPARTMENTS (
  department_id    TEXT PRIMARY KEY,
  institution_id   TEXT NOT NULL REFERENCES INSTITUTIONS,
  name             TEXT NOT NULL,          -- e.g., "Computer Science"
  code             TEXT NOT NULL,          -- e.g., "CS"
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institution_id, code)
)

-- MODIFIED: Professors now belong to a department + have a role
PROFESSORS (
  professor_id     TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  department_id    TEXT REFERENCES DEPARTMENTS,    -- NULL for standalone (Phase 1-3 mode)
  role             TEXT DEFAULT 'PROFESSOR',       -- PROFESSOR | DEPT_ADMIN | INST_ADMIN
  status           TEXT DEFAULT 'ACTIVE',          -- PENDING | ACTIVE | SUSPENDED
  approved_by      TEXT REFERENCES PROFESSORS,     -- Who approved this registration
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- MODIFIED: Classes now optionally belong to a department
CLASSES (
  class_id         TEXT PRIMARY KEY,
  class_name       TEXT NOT NULL,
  department_id    TEXT REFERENCES DEPARTMENTS,    -- NULL for standalone mode
  professor_id     TEXT NOT NULL REFERENCES PROFESSORS,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- NEW: Unified student identity at institution level
-- Replaces per-class student entries when in institutional mode
INSTITUTION_STUDENTS (
  student_id       TEXT PRIMARY KEY,
  institution_id   TEXT NOT NULL REFERENCES INSTITUTIONS,
  roll_no          TEXT NOT NULL,           -- Institution-wide roll number
  name             TEXT NOT NULL,
  email            TEXT,                     -- Optional
  department_id    TEXT REFERENCES DEPARTMENTS,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institution_id, roll_no)           -- Unique roll number within institution
)

-- NEW: Maps students to classes (many-to-many)
-- A student can be in multiple professors' classes
CLASS_ENROLLMENTS (
  class_id         TEXT NOT NULL REFERENCES CLASSES,
  student_id       TEXT NOT NULL REFERENCES INSTITUTION_STUDENTS,
  enrolled_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (class_id, student_id)
)
```

### 20.5 Backward Compatibility

> **Critical design rule:** Phase 4 schema changes are **additive and optional**. The system must work in two modes:

| Mode | When | How |
|------|------|-----|
| **Standalone mode** | Single professor, no institution setup | `department_id` and `institution_id` fields are NULL. System works exactly like Phase 1–3. No admin needed. |
| **Institutional mode** | Department/college adoption | Admin creates institution + departments. Professors register with a department code. Students are managed centrally. |

A professor who started in standalone mode can be migrated to institutional mode later without losing data.

### 20.6 Admin Dashboard Features

| Feature | Who Uses It | Description |
|---------|-------------|-------------|
| **Professor approval queue** | Dept Admin / Inst Admin | New professors register → status = PENDING → admin approves or rejects |
| **Department roster management** | Dept Admin | Upload one master roster per class. All professors teaching that class share the same student list |
| **Active sessions overview** | Dept Admin | See all currently running sessions across the department — which professor, which class, how many students joined |
| **Cross-class analytics** | Dept Admin | Completion rates across classes: "TY-CS-A averages 85% completion, TY-CS-B averages 62%" |
| **Professor activity report** | Dept Admin / Inst Admin | Which professors are actively using the system, session frequency, average session duration |
| **Institution overview** | Inst Admin | Aggregate stats across all departments |
| **Student performance view** | Dept Admin | A student's performance across all their classes (only visible to authorized admins) |
| **System health** | Inst Admin | Active WebSocket connections, active sessions, server load |

### 20.7 Professor Registration Workflow (Institutional Mode)

```
Professor visits CodeTrack registration page
    │
    ├── Enters: name, email, password, department code (e.g., "ABCEC-CS")
    │
    ├── Server validates: department code exists?
    │
    ├── Account created with status = PENDING
    │
    ├── Department admin sees new registration in approval queue
    │
    ├── Admin approves → status = ACTIVE → professor can log in
    │
    └── Admin rejects → professor is notified, account deleted
```

### 20.8 Shared Roster Workflow

```
Department admin uploads master roster for "TY-CS-A"
    │
    ├── 60 students added to INSTITUTION_STUDENTS
    │
    ├── CLASS_ENROLLMENTS created for class "TY-CS-A"
    │
    ├── Any professor who creates/teaches "TY-CS-A" automatically sees these students
    │
    └── No need for each professor to upload separately
    
Individual professors can STILL upload their own CSV in standalone mode.
```

### 20.9 Upgraded Architecture (Phase 4)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                     │
│                                                                     │
│   Student Widgets    Professor Dashboards    Admin Dashboard        │
│   (Vanilla HTML/JS)  (React + Vite)          (React + Vite)        │
│                                                                     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTPS + WSS
                              ▼
                ┌───────────────────────────────┐
                │   Nginx (Reverse Proxy + TLS) │
                │   - Routes /api → backend     │
                │   - Routes /socket.io → WS    │
                │   - Serves static frontend    │
                └──────────────┬────────────────┘
                               │
                ┌──────────────┴────────────────┐
                │     Node.js + Express Server  │
                │  + Socket.IO (Redis adapter)  │  ◄── Redis adapter added for
                │  + MQTT Bridge                │      multi-instance broadcasting
                └──────┬──────┬──────┬──────────┘
                       │      │      │
          ┌────────────┘      │      └────────────┐
          ▼                   ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   PostgreSQL     │ │     Redis        │ │  MQTT Broker     │
│   (mandatory at  │ │  - Socket.IO     │ │  (Mosquitto)     │
│    this scale)   │ │    adapter       │ │  - IoT hubs      │
│                  │ │  - Rate limiting │ │                  │
│  All data +      │ │  - Session cache │ │                  │
│  institution     │ │                  │ │                  │
│  hierarchy       │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

**What changed from Phase 3:**
- **PostgreSQL is now mandatory** (not optional) — SQLite can't handle concurrent writes from 10+ simultaneous sessions.
- **Redis is added** — backs Socket.IO adapter for reliable cross-session broadcasting and provides rate-limiting/session caching.
- **Nginx is required** — proper TLS, load balancing, and static file serving for an institution-wide deployment.
- **Admin dashboard** is a new frontend (could be a separate section within the existing React app).

### 20.10 Scaling Numbers

| Scenario | Users | WebSockets | Server Needs |
|----------|-------|------------|-------------|
| **1 professor, 1 session** | 50 | ~55 | Single process, SQLite ✅ |
| **5 professors, 5 sessions** | 250 | ~270 | Single process, PostgreSQL ✅ |
| **20 professors, 15 active sessions** | 800 | ~850 | Single process, PostgreSQL + Redis ✅ |
| **50 professors, 30 active sessions** | 1,800 | ~1,900 | Single process *still fine* — Node.js handles 10K+ WebSockets easily ✅ |
| **Entire college, 100+ active sessions** | 5,000+ | ~5,500 | Consider 2 server instances with Redis adapter + Nginx load balancing |

> **Reality check:** A single Node.js process with Socket.IO can handle **10,000+ concurrent WebSocket connections**. Even an entire college of 5,000 students wouldn't need more than one or two server instances. Don't over-engineer the scaling until you actually measure a real bottleneck.

### 20.11 Phase 4 API Additions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/institutions` | Create institution (first-time setup) | None (becomes inst admin) |
| POST | `/api/institutions/:id/departments` | Create department | Inst Admin |
| GET | `/api/institutions/:id/departments` | List departments | Inst Admin |
| GET | `/api/departments/:id/professors` | List professors in dept | Dept Admin |
| PATCH | `/api/professors/:id/approve` | Approve a pending professor | Dept/Inst Admin |
| PATCH | `/api/professors/:id/suspend` | Suspend a professor | Dept/Inst Admin |
| POST | `/api/departments/:id/roster` | Upload department-level roster | Dept Admin |
| GET | `/api/departments/:id/sessions` | All active sessions in department | Dept Admin |
| GET | `/api/departments/:id/analytics` | Cross-class analytics | Dept Admin |
| GET | `/api/institutions/:id/overview` | Institution-wide stats | Inst Admin |

### 20.12 Role-Based Access Control

| Role | Can Do |
|------|--------|
| **Student** | Join sessions, submit statuses — no login needed (session token) |
| **Professor** | Create classes, sessions, tasks. See own students' statuses. Upload own class rosters |
| **Department Admin (HOD)** | Everything a professor can do + approve professors + manage department rosters + view cross-class analytics |
| **Institution Admin** | Everything + create departments + manage all department admins + view institution-wide data |

### 20.13 Migration Path: Standalone → Institutional

If CodeTrack starts as a single-professor project and later gets adopted department-wide:

```
Step 1: Inst Admin creates Institution + Department
Step 2: Existing professor's account is linked to the department
        (department_id updated, role stays PROFESSOR)
Step 3: Existing per-class students are migrated to INSTITUTION_STUDENTS
        (automated migration script)
Step 4: CLASS_ENROLLMENTS created from existing STUDENTS → CLASSES relationships
Step 5: New professors register through the approval workflow
Step 6: Future rosters are uploaded at the department level
```

No data is lost. No sessions are disrupted. The migration is additive.

---

## 21. Updated Development Timeline (Full Scope)

| Week(s) | Phase | Deliverable |
|---|---|---|
| **1–2** | P1A | Backend: Express + TypeScript + SQLite + Prisma schema. Auth (register/login). Class CRUD + CSV roster upload. Session creation with 6-char code. |
| **3–4** | P1A | Task CRUD within sessions. Student join (code + roll number). Task response API. Socket.IO: real-time task push + status updates. |
| **5–6** | P1A | Student widget (vanilla HTML/CSS/JS, floating popup). Professor dashboard (React + Vite, status grid, issue panel). Integration testing. |
| **7** | P1A | **Phase 1A exit test**: real classroom trial, 20+ students, 3+ tasks. Fix bugs. |
| **8** | P1B | QR codes, CSV export, grace window, rate limiting, validation, logging, auto-reconnect. |
| **9–10** | P2 | ESP32 hub (OLED + MQTT). Mosquitto broker. Socket.IO ↔ MQTT bridge. Student flag system. |
| **11–12** | P3 | PostgreSQL migration. Session history & analytics. Multi-class management. Production deployment. |
| **13–14** | P4 | Institution/department hierarchy. Admin roles + approval workflow. Shared rosters. Department-level analytics. |
| **15–16** | P4 | Admin dashboard (React). Cross-department views. Redis adapter. Nginx + Docker Compose for production. |

> **Note:** Weeks 13–16 are only needed if the system is actually adopted beyond a single professor. Don't build Phase 4 speculatively — build it when real demand exists.

---

## 22. Updated Success Criteria

### Phase 1A (Must pass ALL)
1. ✅ Professor can create a session and get a 6-character join code in under 5 seconds.
2. ✅ Student can join by typing the code + their roll number — no QR, no camera, no install.
3. ✅ Professor can add a new task with one click; all students are notified within 1 second.
4. ✅ Student can report status (Done / In Progress / Issue + description) in 2 taps.
5. ✅ Professor sees per-student issues with roll number, name, and issue description in real-time.
6. ✅ Student widget occupies < 200px width when expanded, collapses to a 40×40px icon.
7. ✅ System handles 50 concurrent students on a single server without perceivable lag.
8. ✅ No duplicate submissions — enforced at DB level.
9. ✅ Works on college lab PCs with restricted browsers.

### Phase 2 (Must pass ALL)
10. ✅ ESP32 hub mirrors task counts, updating within ~1 second of the dashboard.
11. ✅ Disconnecting the hub does not affect the web system.
12. ✅ Professor can visually identify students who have flagged an issue.

### Phase 3 (Must pass ALL)
13. ✅ Professor can look up any past session and see per-task completion data.
14. ✅ System runs on PostgreSQL in a production deployment.

### Phase 4 (Must pass ALL — only if institutional adoption happens)
15. ✅ Multiple professors can run simultaneous sessions without interference.
16. ✅ Department admin can approve/reject professor registrations.
17. ✅ Department-level roster upload is shared across all professors teaching that class.
18. ✅ Admin dashboard shows live overview of all active sessions in the department.
19. ✅ Cross-class analytics show completion rates per class/professor.
20. ✅ System handles 500+ concurrent students across 10+ simultaneous sessions.
21. ✅ Standalone-mode professors can be migrated to institutional mode without data loss.

---

## 23. Final Demo Script (Institutional Version)

### Scene 1: Department Setup
1. Institution admin creates "ABC Engineering College" → gets institution code `ABCEC`.
2. Creates department "Computer Science" → department code `ABCEC-CS`.
3. Uploads master roster for TY-CS-A (60 students).

### Scene 2: Professor Onboarding
4. Prof. Sharma registers with department code `ABCEC-CS` → status = PENDING.
5. HOD (Dr. Kulkarni) sees the request in admin dashboard → approves.
6. Prof. Sharma logs in, sees TY-CS-A already available with 60 students.

### Scene 3: Live Session (Same as Phase 1 demo)
7. Prof. Sharma creates session "DOM Practical 05" → code `X7K2M9`.
8. Students join, tasks are pushed, statuses flow in real-time.
9. One student reports an issue → professor walks directly to them.

### Scene 4: Simultaneous Sessions
10. Meanwhile, Prof. Patel is running a session for SY-CS-A in another lab.
11. HOD's admin dashboard shows both active sessions simultaneously:
    - Prof. Sharma: TY-CS-A, 45/60 joined, Task 3 active, 2 issues
    - Prof. Patel: SY-CS-A, 38/55 joined, Task 1 active, 0 issues

### Scene 5: Analytics
12. HOD views department analytics: TY-CS-A averages 78% completion, SY-CS-A averages 85%.
13. Identifies that Task 3 in DOM practicals consistently has the most issues → suggests curriculum adjustment.

---

## 24. Guiding Principle

> Simple for the student. Useful for the professor beyond just a count. Lightweight enough to run alongside coding. Works on restricted lab machines. Reliable if the hardware fails. Privacy-conscious by default. Buildable in phases that each stand on their own. **Scales from one professor to an entire institution without rewriting the core.**

