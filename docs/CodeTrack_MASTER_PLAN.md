# CodeTrack Classroom — MASTER EXECUTION PLAN

**Document Type:** Final Checklist & Execution Guide
**Version:** 1.0
**Date:** 22 September 2026
**Status:** APPROVED — Ready for execution
**Total Phases:** 25
**Estimated Duration:** 16 weeks

> **How to use this document:** Work through each phase in order. Every sub-task is a checkbox. Mark `[x]` when complete, `[/]` when in progress. Do NOT skip phases. Each phase ends with a **✅ GATE CHECK** — all items in the gate must pass before moving to the next phase.

---

## MILESTONE 1: PROJECT FOUNDATION (Phases 1–3)

---

### PHASE 1 — Project Initialization & Tooling

**Goal:** Set up the complete project structure, install all dependencies, and verify the development environment works end-to-end.

- [ ] **1.1** Create the root project directory `CodeTracker/`
- [ ] **1.2** Create the `server/` directory for the backend
- [ ] **1.3** Initialize `server/package.json` with `npm init`
- [ ] **1.4** Install TypeScript and configure `tsconfig.json` (strict mode, ES2022 target, paths)
- [ ] **1.5** Install Express.js and its TypeScript types (`express`, `@types/express`)
- [ ] **1.6** Install development tools: `tsx` (TypeScript executor), `nodemon` or `tsx watch` for hot reload
- [ ] **1.7** Install Prisma CLI and initialize: `npx prisma init --datasource-provider sqlite`
- [ ] **1.8** Install Socket.IO server (`socket.io`)
- [ ] **1.9** Install authentication packages: `jsonwebtoken`, `argon2`, `@types/jsonwebtoken`
- [ ] **1.10** Install validation: `zod`
- [ ] **1.11** Install utilities: `nanoid`, `multer`, `papaparse`, `pino`, `pino-http`, `helmet`, `cors`, `express-rate-limit`, `uuid`
- [ ] **1.12** Install types: `@types/multer`, `@types/uuid`, `@types/cors`
- [ ] **1.13** Create `.env` file with all required variables (PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, GRACE_WINDOW_SECONDS)
- [ ] **1.14** Create `.env.example` with placeholder values (committed to git)
- [ ] **1.15** Create `.gitignore` (node_modules, .env, dist/, prisma/*.db, *.db-journal)
- [ ] **1.16** Initialize Git repository, create initial commit
- [ ] **1.17** Set up npm scripts in `package.json`:
  - `dev` → `tsx watch src/server.ts`
  - `build` → `tsc`
  - `start` → `node dist/server.js`
  - `db:migrate` → `prisma migrate dev`
  - `db:generate` → `prisma generate`
  - `db:seed` → `tsx prisma/seed.ts`
  - `db:studio` → `prisma studio`
  - `lint` → `eslint src/`
- [ ] **1.18** Create the complete `src/` directory structure:
  - `src/app.ts`
  - `src/server.ts`
  - `src/config/`
  - `src/middleware/`
  - `src/modules/auth/`
  - `src/modules/classes/`
  - `src/modules/sessions/`
  - `src/modules/tasks/`
  - `src/modules/responses/`
  - `src/socket/`
  - `src/utils/`
  - `src/types/`
- [ ] **1.19** Create `public/` directory for student widget static files
- [ ] **1.20** Create `tests/` directory structure: `tests/unit/`, `tests/integration/`, `tests/helpers/`
- [ ] **1.21** Verify: run `npm run dev` — server starts and logs to console without errors

**✅ GATE CHECK:**
- [ ] `npm run dev` starts the server successfully
- [ ] `npx prisma studio` opens without errors
- [ ] All directories exist and are properly structured
- [ ] `.env` is loaded and validated

---

### PHASE 2 — Database Schema & Prisma Models

**Goal:** Define the complete database schema in Prisma, generate the client, and verify all models and relations.

- [ ] **2.1** Define `Professor` model in `prisma/schema.prisma` (id, name, email, passwordHash, createdAt)
- [ ] **2.2** Define `Class` model (id, className, professorId → Professor relation, createdAt)
- [ ] **2.3** Define `Student` model (id, rollNo, name, classId → Class relation, unique constraint on [classId, rollNo])
- [ ] **2.4** Define `Session` model (id, classId → Class relation, sessionCode unique, title, status default ACTIVE, startedAt, endedAt nullable)
- [ ] **2.5** Define `Task` model (id, sessionId → Session relation, taskNumber, title, description nullable, createdAt, unique constraint on [sessionId, taskNumber])
- [ ] **2.6** Define `TaskResponse` model (id, taskId → Task relation, studentId → Student relation, status default NOT_STARTED, issueText nullable, updatedAt, unique constraint on [taskId, studentId])
- [ ] **2.7** Define `SessionParticipant` model (sessionId + studentId composite primary key, joinedAt, relations to Session and Student)
- [ ] **2.8** Define all reverse relations (Professor.classes, Class.students, Class.sessions, Session.tasks, Task.responses, etc.)
- [ ] **2.9** Run `npx prisma migrate dev --name init` — verify migration creates all tables
- [ ] **2.10** Run `npx prisma generate` — verify Prisma client is generated without errors
- [ ] **2.11** Open `npx prisma studio` — verify all tables appear with correct columns
- [ ] **2.12** Create `prisma/seed.ts` with sample data (1 professor, 2 classes, 10 students per class)
- [ ] **2.13** Run `npm run db:seed` — verify seed data appears in Prisma Studio

**✅ GATE CHECK:**
- [ ] All 7 models exist in schema.prisma with correct fields and relations
- [ ] Migration runs cleanly
- [ ] Prisma Studio shows all tables with correct columns
- [ ] Seed data is visible in Prisma Studio

---

### PHASE 3 — Backend Foundation (Config, Middleware, Entry Points)

**Goal:** Build the Express application skeleton with all middleware, configuration, utility modules, and entry points — no feature logic yet, but the server starts and responds.

#### 3A — Config Layer
- [ ] **3.1** Create `src/config/env.ts` — load .env, validate with Zod schema, export typed `env` object
- [ ] **3.2** Create `src/config/database.ts` — initialize PrismaClient singleton, export `prisma`, handle graceful disconnect
- [ ] **3.3** Create `src/config/constants.ts` — define session code alphabet, status enums (NOT_STARTED, IN_PROGRESS, DONE, ISSUE), session statuses (ACTIVE, ENDED), grace window duration, max issue text length

#### 3B — Types Layer
- [ ] **3.4** Create `src/types/express.d.ts` — augment Express Request with `professorId` and `student` properties
- [ ] **3.5** Create `src/types/enums.ts` — TaskStatus enum, SessionStatus enum
- [ ] **3.6** Create `src/types/models.ts` — API response interfaces (SessionResponse, TaskResponse, StatusGridResponse, etc.)
- [ ] **3.7** Create `src/types/socket.ts` — Socket.IO event type maps (ServerToClientEvents, ClientToServerEvents)

#### 3C — Utility Layer
- [ ] **3.8** Create `src/utils/logger.ts` — Pino logger instance (debug in dev, info in prod, pretty-print in dev)
- [ ] **3.9** Create `src/utils/apiResponse.ts` — `sendSuccess()`, `sendError()` helper functions for consistent JSON responses
- [ ] **3.10** Create `src/utils/asyncHandler.ts` — wrapper to catch async errors and pass to next()
- [ ] **3.11** Create `src/utils/sessionCode.ts` — generate 6-char code using nanoid with custom alphabet, uniqueness check callback, retry on collision
- [ ] **3.12** Create `src/utils/csvParser.ts` — parse CSV buffer with papaparse, validate headers (roll_no, name), return parsed rows + errors

#### 3D — Middleware Layer
- [ ] **3.13** Create `src/middleware/authMiddleware.ts` — extract JWT from Bearer header, verify, attach professorId to req, reject 401 if invalid
- [ ] **3.14** Create `src/middleware/studentAuthMiddleware.ts` — extract student token, verify, check session ACTIVE, attach student identity to req
- [ ] **3.15** Create `src/middleware/validateMiddleware.ts` — accept Zod schema, validate req.body/params/query, return 400 with errors if invalid
- [ ] **3.16** Create `src/middleware/errorHandler.ts` — global error handler, log with Pino, return consistent JSON, never leak stack traces
- [ ] **3.17** Create `src/middleware/notFoundHandler.ts` — catch unmatched routes, return 404 JSON
- [ ] **3.18** Create `src/middleware/rateLimiter.ts` — configure express-rate-limit with env-based values

#### 3E — App & Server Entry Points
- [ ] **3.19** Create `src/app.ts` — Express app assembly:
  1. helmet()
  2. cors()
  3. express.json()
  4. pino-http request logging
  5. Rate limiter
  6. Static file serving (public/)
  7. Route mounting placeholders (empty for now)
  8. notFoundHandler
  9. errorHandler (last)
- [ ] **3.20** Create `src/server.ts` — HTTP server creation, Socket.IO initialization, Prisma connect, listen on PORT, graceful shutdown handlers

#### 3F — Verification
- [ ] **3.21** Run `npm run dev` — server starts on configured port
- [ ] **3.22** Hit `GET /` — returns 404 JSON (not a crash)
- [ ] **3.23** Hit any random path — returns 404 JSON via notFoundHandler
- [ ] **3.24** Verify Pino logs request details in the console

**✅ GATE CHECK:**
- [ ] Server starts cleanly, connects to SQLite via Prisma
- [ ] Unknown routes return 404 JSON
- [ ] Request logging works
- [ ] All middleware is mounted in the correct order

---

## MILESTONE 2: CORE API MODULES (Phases 4–8)

---

### PHASE 4 — Auth Module

**Goal:** Professor can register, log in, and access protected routes with JWT.

- [ ] **4.1** Create `src/modules/auth/auth.schema.ts` — Zod schemas: registerSchema (name, email, password min 8), loginSchema (email, password)
- [ ] **4.2** Create `src/modules/auth/auth.service.ts`:
  - `register()`: check email uniqueness → hash password with Argon2 → create professor in DB → generate JWT → return token + professor data
  - `login()`: find professor by email → verify password → generate JWT → return token + professor data
  - `getProfile()`: fetch professor by ID → return professor data (no password hash)
  - `generateToken()`: create JWT with professorId, email, name, configurable expiry
- [ ] **4.3** Create `src/modules/auth/auth.controller.ts` — request handlers that call service, format response
- [ ] **4.4** Create `src/modules/auth/auth.routes.ts` — Express Router:
  - POST `/api/auth/register` → validate(registerSchema) → register controller
  - POST `/api/auth/login` → validate(loginSchema) → login controller
  - GET `/api/auth/me` → authMiddleware → getProfile controller
- [ ] **4.5** Mount auth routes in `src/app.ts`
- [ ] **4.6** Test: Register a new professor via curl/Postman → receive JWT
- [ ] **4.7** Test: Login with the same credentials → receive JWT
- [ ] **4.8** Test: Access GET `/api/auth/me` with JWT → returns professor profile
- [ ] **4.9** Test: Access GET `/api/auth/me` without JWT → returns 401
- [ ] **4.10** Test: Register with duplicate email → returns 409 Conflict
- [ ] **4.11** Test: Login with wrong password → returns 401

**✅ GATE CHECK:**
- [ ] Register → Login → Protected route flow works end-to-end
- [ ] Invalid credentials are properly rejected
- [ ] Duplicate email is properly rejected
- [ ] JWT contains correct payload (professorId, email, name)

---

### PHASE 5 — Classes Module

**Goal:** Professor can create classes and manage student rosters.

- [ ] **5.1** Create `src/modules/classes/classes.schema.ts` — Zod schemas: createClassSchema (className), classIdParam (id as UUID)
- [ ] **5.2** Create `src/modules/classes/classes.service.ts`:
  - `createClass()`: create class record owned by the authenticated professor
  - `listClasses()`: fetch all classes for the professor, include student count
  - `getClass()`: fetch class by ID, verify professor ownership, include students and session count
  - `uploadRoster()`: parse CSV → validate rows → upsert students → return added/skipped/error counts
  - `listStudents()`: fetch students in a class, sorted by roll number
- [ ] **5.3** Create `src/modules/classes/classes.controller.ts` — request handlers
- [ ] **5.4** Create `src/modules/classes/classes.routes.ts` — Express Router:
  - POST `/api/classes` → auth + validate → createClass
  - GET `/api/classes` → auth → listClasses
  - GET `/api/classes/:id` → auth + validate(params) → getClass
  - POST `/api/classes/:id/roster` → auth + multer(csv) + validate(params) → uploadRoster
  - GET `/api/classes/:id/students` → auth + validate(params) → listStudents
- [ ] **5.5** Mount classes routes in `src/app.ts`
- [ ] **5.6** Test: Create a class → returns class object with ID
- [ ] **5.7** Test: List classes → returns array of professor's classes
- [ ] **5.8** Test: Upload CSV roster (valid) → returns success with count
- [ ] **5.9** Test: Upload CSV roster (with errors) → returns partial success with error details
- [ ] **5.10** Test: Upload CSV roster (duplicate roll numbers) → handled gracefully
- [ ] **5.11** Test: Access another professor's class → returns 403 Forbidden
- [ ] **5.12** Test: List students → returns sorted by roll number

**✅ GATE CHECK:**
- [ ] Class CRUD works end-to-end
- [ ] CSV roster upload parses, validates, and inserts students correctly
- [ ] Duplicate roll numbers within a class are rejected
- [ ] Professor ownership is enforced on all class routes

---

### PHASE 6 — Sessions Module

**Goal:** Professor can create/end sessions, students can join via session code.

- [ ] **6.1** Create `src/modules/sessions/sessions.schema.ts` — Zod schemas: createSessionSchema (classId, title), sessionIdParam, joinSessionSchema (sessionCode 6-char, rollNo)
- [ ] **6.2** Create `src/modules/sessions/sessions.service.ts`:
  - `createSession()`: verify class ownership → generate unique 6-char code (collision check loop) → create session with status ACTIVE → return session with code
  - `listSessions()`: fetch professor's sessions, ordered by most recent, optional status filter
  - `getSession()`: fetch session with tasks, participants, status counts → verify ownership
  - `endSession()`: verify ACTIVE + ownership → set status ENDED, set ended_at → emit `session-ended` via Socket.IO → return summary
  - `joinSession()`: validate code + ACTIVE → validate roll number in class roster → check not already joined → create SESSION_PARTICIPANT → generate student JWT → emit `student-joined` → return student info + all current tasks
  - `generateSessionCode()`: use nanoid with safe alphabet, check uniqueness against active sessions, retry up to 10 times
- [ ] **6.3** Create `src/modules/sessions/sessions.controller.ts` — request handlers
- [ ] **6.4** Create `src/modules/sessions/sessions.routes.ts` — Express Router:
  - POST `/api/sessions` → auth + validate → createSession
  - GET `/api/sessions` → auth → listSessions
  - GET `/api/sessions/:id` → auth + validate(params) → getSession
  - PATCH `/api/sessions/:id/end` → auth + validate(params) → endSession
  - POST `/api/sessions/join` → validate(body) → joinSession (no auth — students don't have accounts)
- [ ] **6.5** Mount sessions routes in `src/app.ts`
- [ ] **6.6** Test: Create session → returns session with 6-char code
- [ ] **6.7** Test: Session code is unique and uses safe alphabet (no 0/O, 1/I/L)
- [ ] **6.8** Test: Student joins with valid code + valid roll number → returns student token + empty tasks list
- [ ] **6.9** Test: Student joins with invalid code → returns 404
- [ ] **6.10** Test: Student joins with invalid roll number → returns 403
- [ ] **6.11** Test: Student joins same session twice → returns 409 Conflict
- [ ] **6.12** Test: Student joins ended session → returns 403
- [ ] **6.13** Test: End session → status changes to ENDED, ended_at is set
- [ ] **6.14** Test: End already-ended session → returns 400

**✅ GATE CHECK:**
- [ ] Session creation generates unique, human-readable codes
- [ ] Student join validates code, roll number, and session status
- [ ] Student receives a JWT scoped to the session
- [ ] Session end freezes everything properly
- [ ] All edge cases (duplicate join, wrong code, wrong roll) handled

---

### PHASE 7 — Tasks Module

**Goal:** Professor can add/update/remove tasks during an active session. Tasks are stored and retrievable.

- [ ] **7.1** Create `src/modules/tasks/tasks.schema.ts` — Zod schemas: createTaskSchema (title, description optional), updateTaskSchema (title optional, description optional), taskIdParam
- [ ] **7.2** Create `src/modules/tasks/tasks.service.ts`:
  - `addTask()`: verify session ACTIVE + ownership → auto-assign next task_number → create task → create NOT_STARTED responses for all current participants → emit `new-task` via Socket.IO → return task
  - `listTasks()`: fetch all tasks in session, ordered by task_number, include per-task status counts (done, in_progress, issue, not_started)
  - `updateTask()`: verify ownership → update title/description → return updated task
  - `removeTask()`: verify ownership + session ACTIVE → delete task + cascade delete responses → emit `task-removed` → return success
- [ ] **7.3** Create `src/modules/tasks/tasks.controller.ts` — request handlers
- [ ] **7.4** Create `src/modules/tasks/tasks.routes.ts` — Express Router:
  - POST `/api/sessions/:id/tasks` → auth + validate → addTask
  - GET `/api/sessions/:id/tasks` → auth OR studentAuth → listTasks
  - PATCH `/api/tasks/:id` → auth + validate → updateTask
  - DELETE `/api/tasks/:id` → auth + validate(params) → removeTask
- [ ] **7.5** Mount task routes in `src/app.ts`
- [ ] **7.6** Test: Add task to active session → returns task with auto-assigned task_number
- [ ] **7.7** Test: Add task → NOT_STARTED responses created for all joined students
- [ ] **7.8** Test: List tasks → returns ordered by task_number with status counts
- [ ] **7.9** Test: Update task title → returns updated task
- [ ] **7.10** Test: Remove task → task and all its responses are deleted
- [ ] **7.11** Test: Add task to ended session → returns 403
- [ ] **7.12** Test: Add task to session professor doesn't own → returns 403

**✅ GATE CHECK:**
- [ ] Tasks are created with auto-incrementing task_number
- [ ] NOT_STARTED responses are auto-created for all participants
- [ ] Task CRUD respects session ownership and status
- [ ] List tasks returns correct per-task status aggregation

---

### PHASE 8 — Task Responses Module

**Goal:** Students can submit/update their status on tasks, professors can view the status grid and issue list.

- [ ] **8.1** Create `src/modules/responses/responses.schema.ts` — Zod schemas: respondSchema (status enum IN_PROGRESS/DONE/ISSUE, issueText optional — required when status is ISSUE, max 500 chars)
- [ ] **8.2** Create `src/modules/responses/responses.service.ts`:
  - `submitResponse()`: verify task in ACTIVE session → verify student is participant → check grace window if changing from DONE → upsert response (status + issueText) → emit `status-update` via Socket.IO → return updated response
  - `getStatusGrid()`: fetch all participants × all tasks for session → build matrix (rows = students sorted by roll, columns = tasks sorted by number, cells = status) → return structured grid
  - `getIssues()`: fetch all responses with status ISSUE → join with student name/rollNo and task title → return sorted by most recent
- [ ] **8.3** Implement **grace window logic** in submitResponse:
  - If student changes from DONE to another status, check `updated_at`
  - If within GRACE_WINDOW_SECONDS → allow the change
  - If expired → reject with 403
- [ ] **8.4** Create `src/modules/responses/responses.controller.ts` — request handlers
- [ ] **8.5** Create `src/modules/responses/responses.routes.ts` — Express Router:
  - POST `/api/tasks/:id/respond` → studentAuth + validate → submitResponse
  - GET `/api/sessions/:id/status` → auth → getStatusGrid
  - GET `/api/sessions/:id/issues` → auth → getIssues
- [ ] **8.6** Mount response routes in `src/app.ts`
- [ ] **8.7** Test: Student submits IN_PROGRESS → response created
- [ ] **8.8** Test: Student submits DONE → status updated
- [ ] **8.9** Test: Student submits ISSUE with text → status + issueText stored
- [ ] **8.10** Test: Student submits ISSUE without text → returns 400
- [ ] **8.11** Test: Status grid returns correct matrix structure
- [ ] **8.12** Test: Issues list returns only ISSUE responses with student + task info
- [ ] **8.13** Test: Grace window — change from DONE within 120s → allowed
- [ ] **8.14** Test: Grace window — change from DONE after 120s → rejected 403
- [ ] **8.15** Test: Duplicate response for same task/student → upserts, not duplicates (UNIQUE constraint)
- [ ] **8.16** Test: Response submission on ended session → returns 403

**✅ GATE CHECK:**
- [ ] All 4 status transitions work (NOT_STARTED → IN_PROGRESS → DONE / ISSUE)
- [ ] ISSUE requires issueText
- [ ] Grace window prevents late changes from DONE
- [ ] Status grid returns correct student × task matrix
- [ ] Issues endpoint returns rich data (student name, roll, task title, issue text)
- [ ] UNIQUE constraint prevents duplicates

---

## MILESTONE 3: REAL-TIME LAYER (Phases 9–10)

---

### PHASE 9 — Socket.IO Infrastructure

**Goal:** Set up the Socket.IO server, authentication, and room management system.

- [ ] **9.1** Create `src/socket/socketManager.ts`:
  - Initialize Socket.IO server attached to HTTP server
  - Apply CORS configuration
  - Handle `connection` event
  - Handle `disconnect` event
  - Export the `io` instance globally for use by services
- [ ] **9.2** Create `src/socket/socketAuth.ts`:
  - Socket.IO middleware for connection authentication
  - Verify JWT (professor) OR student token from handshake `auth` object
  - Determine user type (professor or student) and session context
  - Reject unauthorized connections with error
- [ ] **9.3** Create `src/socket/sessionRooms.ts`:
  - `joinSessionRoom(socket, sessionId)`: add socket to room `session:{sessionId}`
  - `emitToSession(sessionId, event, data)`: broadcast to all in room
  - `emitToProfessor(sessionId, event, data)`: emit only to professor sockets
  - `emitToStudents(sessionId, event, data)`: emit to student sockets only
- [ ] **9.4** Update `src/server.ts` to call socket initialization after HTTP server creation
- [ ] **9.5** Test: Socket.IO client connects with valid professor JWT → connection accepted, joined to appropriate room
- [ ] **9.6** Test: Socket.IO client connects with valid student token → connection accepted, joined to session room
- [ ] **9.7** Test: Socket.IO client connects with invalid token → connection rejected
- [ ] **9.8** Test: Client disconnects → cleaned up from room

**✅ GATE CHECK:**
- [ ] Socket.IO server initializes and accepts connections
- [ ] Authentication works for both professor and student tokens
- [ ] Room join/leave works correctly
- [ ] Emit helper functions target the correct recipients

---

### PHASE 10 — Real-Time Event Integration

**Goal:** Connect Socket.IO to the API modules so all CRUD operations emit real-time events.

- [ ] **10.1** Update `sessions.service.ts` — `endSession()` emits `session-ended` to all in session room
- [ ] **10.2** Update `sessions.service.ts` — `joinSession()` emits `student-joined` to professor
- [ ] **10.3** Update `tasks.service.ts` — `addTask()` emits `new-task` to all students in session
- [ ] **10.4** Update `tasks.service.ts` — `removeTask()` emits `task-removed` to all students in session
- [ ] **10.5** Update `responses.service.ts` — `submitResponse()` emits `status-update` to professor with full payload (studentId, rollNo, name, taskId, status, issueText)
- [ ] **10.6** Test full flow with two Socket.IO test clients (professor + student):
  - Professor creates session → student joins → professor gets `student-joined` event
  - Professor adds task → student gets `new-task` event
  - Student submits response → professor gets `status-update` event
  - Professor ends session → student gets `session-ended` event
- [ ] **10.7** Test: events only reach sockets in the correct session room (isolation)
- [ ] **10.8** Test: multiple concurrent sessions don't leak events to each other

**✅ GATE CHECK:**
- [ ] All 5 event types are emitted at the right time with correct payloads
- [ ] Events are scoped to the correct session room
- [ ] Two concurrent sessions are fully isolated

---

## MILESTONE 4: PROFESSOR DASHBOARD (Phases 11–16)

---

### PHASE 11 — Dashboard Project Setup & Design System

**Goal:** Initialize the React + Vite project for the professor dashboard, implement the complete design system as CSS.

- [ ] **11.1** Create `dashboard/` directory at project root
- [ ] **11.2** Initialize Vite + React + TypeScript project (`npx create-vite dashboard --template react-ts`)
- [ ] **11.3** Install dependencies: `socket.io-client`, `react-router-dom`, `lucide-react`
- [ ] **11.4** Create `src/styles/index.css` — CSS reset + all design tokens as custom properties:
  - Primary palette (indigo 50–900)
  - Neutral palette (slate 50–900)
  - Semantic colors (success, warning, danger, muted)
  - Typography scale (display, heading, subheading, body, small, mono)
  - Spacing scale (space-1 through space-12)
  - Border radius tokens (sm, md, lg, xl, full)
  - Shadow/elevation tokens (sm, md, lg, xl, glow-primary, glow-danger)
  - Transition tokens (fast, base, slow, spring)
- [ ] **11.5** Import Google Fonts: Inter (400, 500, 600, 700) + JetBrains Mono (400)
- [ ] **11.6** Create `src/styles/animations.css` — @keyframes definitions:
  - `pulse` (for status dots, notification badges)
  - `slideInUp` (for page transitions)
  - `slideInRight` (for issue alerts)
  - `shimmer` (for skeleton loading)
  - `springPop` (for notifications, badges)
  - `fadeIn` / `fadeOut`
  - `progressFill` (for progress bars)
  - `typewriter` (for session code display)
- [ ] **11.7** Create `src/styles/utilities.css` — utility classes for common patterns (flex, grid, spacing, text alignment)
- [ ] **11.8** Verify: `npm run dev` starts the Vite dev server, shows a blank page with correct fonts loaded

**✅ GATE CHECK:**
- [ ] Vite dev server runs on localhost:5173
- [ ] All CSS custom properties are defined and accessible
- [ ] Inter and JetBrains Mono fonts load correctly
- [ ] All keyframe animations are defined

---

### PHASE 12 — Reusable UI Components

**Goal:** Build all shared UI components that will be used across pages.

- [ ] **12.1** Create `Button` component — variants: primary, secondary, ghost, danger. Sizes: sm, md, lg. States: default, hover (lift + shadow), active (pressed), disabled, loading (spinner)
- [ ] **12.2** Create `Input` component — variants: default, error. With label, placeholder, error message, eye toggle for passwords
- [ ] **12.3** Create `Card` component — elevated container with padding, hover lift animation, optional header/footer slots
- [ ] **12.4** Create `Badge` component — status badges: Done (green), In Progress (amber), Issue (red), Not Started (gray). Sizes: sm, md
- [ ] **12.5** Create `Modal` component — centered overlay with backdrop blur, slide-in animation, close button, click-outside-to-close
- [ ] **12.6** Create `Tabs` component — tab headers with sliding underline indicator animation, content panels
- [ ] **12.7** Create `Table` component — styled table with header, body, hover rows, alternating row backgrounds
- [ ] **12.8** Create `ProgressBar` component — animated width transition, color based on percentage, label overlay
- [ ] **12.9** Create `Toast` component — notification toast with slide-in from top-right, auto-dismiss with progress bar, success/error/info variants
- [ ] **12.10** Create `Dropdown` component — trigger button + dropdown menu with animation
- [ ] **12.11** Create `Skeleton` component — loading placeholder with shimmer animation, variants for text/card/table row
- [ ] **12.12** Create `ConfirmDialog` component — modal with message + Cancel/Confirm buttons, destructive variant (red confirm button)
- [ ] **12.13** Create `EmptyState` component — centered illustration placeholder + title + description + action button
- [ ] **12.14** Create CSS file for each component (co-located: `Button.css` next to `Button.tsx`)
- [ ] **12.15** Verify: all components render correctly in isolation (create a temporary `/dev` page to preview them)

**✅ GATE CHECK:**
- [ ] All 13 UI components render correctly
- [ ] Hover, focus, active, disabled states all work
- [ ] Animations are smooth (no jank)
- [ ] Components use design tokens (no hardcoded colors/sizes)

---

### PHASE 13 — Services, Hooks, Context & Router

**Goal:** Build the data layer that connects the dashboard to the backend API and Socket.IO.

#### 13A — API Services
- [ ] **13.1** Create `src/services/api.ts` — fetch/axios instance with base URL, JWT interceptor (auto-attach token from localStorage), 401 interceptor (redirect to login)
- [ ] **13.2** Create `src/services/authService.ts` — `login()`, `register()`, `getProfile()`
- [ ] **13.3** Create `src/services/classService.ts` — `createClass()`, `getClasses()`, `getClass()`, `uploadRoster()`, `getStudents()`
- [ ] **13.4** Create `src/services/sessionService.ts` — `createSession()`, `getSessions()`, `getSession()`, `endSession()`, `getStatusGrid()`, `getIssues()`
- [ ] **13.5** Create `src/services/taskService.ts` — `addTask()`, `listTasks()`, `updateTask()`, `removeTask()`
- [ ] **13.6** Create `src/services/socketService.ts` — Socket.IO client initialization, connect with JWT, reconnection logic, event listener registration

#### 13B — React Context
- [ ] **13.7** Create `src/context/AuthContext.tsx` — professor auth state (user, token, isAuthenticated), login/logout functions, persist token in localStorage
- [ ] **13.8** Create `src/context/SocketContext.tsx` — Socket.IO instance, connection status (connected/connecting/disconnected), provide to children

#### 13C — Custom Hooks
- [ ] **13.9** Create `src/hooks/useAuth.ts` — consume AuthContext, expose login/logout/user
- [ ] **13.10** Create `src/hooks/useSocket.ts` — consume SocketContext, expose socket instance + connection status
- [ ] **13.11** Create `src/hooks/useSession.ts` — manage active session state, listen to Socket.IO events (new-task, status-update, student-joined, session-ended), update local state on events
- [ ] **13.12** Create `src/hooks/useClasses.ts` — fetch and cache class list
- [ ] **13.13** Create `src/hooks/useToast.ts` — toast notification queue, add/remove/auto-dismiss

#### 13D — Router
- [ ] **13.14** Create `src/router/ProtectedRoute.tsx` — check isAuthenticated, redirect to /login if not
- [ ] **13.15** Create `src/router/routes.tsx` — define all routes with lazy loading:
  - `/login` → LoginPage
  - `/register` → RegisterPage
  - `/` → HomePage (protected)
  - `/classes` → ClassesListPage (protected)
  - `/classes/:id` → ClassDetailPage (protected)
  - `/sessions/new` → CreateSessionPage (protected)
  - `/sessions/:id` → ActiveSessionPage (protected)
  - `/sessions/:id/summary` → SessionSummaryPage (protected)
- [ ] **13.16** Create `src/App.tsx` — wrap with AuthContext + SocketContext + Router

**✅ GATE CHECK:**
- [ ] All API services make correct HTTP requests with JWT
- [ ] Auth context persists login state across page refreshes
- [ ] Socket connection establishes and reports status
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Routes render correct page components

---

### PHASE 14 — Layout & Auth Pages

**Goal:** Build the page layouts (sidebar, top bar) and authentication pages.

#### 14A — Layouts
- [ ] **14.1** Create `AuthLayout` — centered card on gradient background, used for login/register
- [ ] **14.2** Create `DashboardLayout` — sidebar (240px) + top bar + scrollable content area
- [ ] **14.3** Build `Sidebar` component — logo at top, nav items with icons (Dashboard, Classes, History, Analytics, Settings), active state with left border indicator that slides to current item, profile area at bottom with name + logout
- [ ] **14.4** Build `TopBar` component — page title (dynamic), breadcrumb, connection indicator (green/amber/red dot), notification bell
- [ ] **14.5** Implement sidebar responsive behavior:
  - Desktop ≥1024px: expanded (240px)
  - Tablet 768–1023px: collapsed (64px icons only), expand on hover
  - Mobile <768px: hidden, hamburger menu opens slide-in overlay
- [ ] **14.6** Implement `ConnectionIndicator` — green dot (connected, one-time pulse on reconnect), amber pulse (connecting), red pulse (disconnected) with "Reconnecting..." text

#### 14B — Auth Pages
- [ ] **14.7** Build `LoginPage` — email input, password input (with eye toggle), "Sign In" button, link to register, error toast on failure, loading spinner on submit
- [ ] **14.8** Build `RegisterPage` — name, email, password (with strength indicator bar), confirm password, "Create Account" button, link to login
- [ ] **14.9** Implement password strength indicator: red (weak) → amber (medium) → green (strong), animated width bar
- [ ] **14.10** Implement form validation: red border + error text on invalid fields, disable submit until valid
- [ ] **14.11** On successful login/register → redirect to `/` (dashboard home)
- [ ] **14.12** On failed login → shake animation on the card + error toast

**✅ GATE CHECK:**
- [ ] Login → register flow works end-to-end against the real backend
- [ ] Sidebar navigation works on desktop, tablet, and mobile
- [ ] Connection indicator reflects real Socket.IO status
- [ ] Auth state persists across page refresh (localStorage token)

---

### PHASE 15 — Class & Session Management Pages

**Goal:** Build all class management, roster upload, and session creation pages.

- [ ] **15.1** Build `HomePage` (Dashboard):
  - 4 stat cards (active sessions, total students, total classes, total sessions) with animated number counter
  - Active sessions section with live cards (green pulse dot, key metrics, "Open Dashboard →" link)
  - Quick actions: "+ New Session", "+ New Class" buttons
  - Recent activity timeline
- [ ] **15.2** Build `ClassesListPage`:
  - Grid of class cards (2 columns desktop, 1 mobile)
  - Each card shows: class name, student count, session count, last session date
  - "+ Create Class" button → opens side panel with slide-in animation
  - Create class form: class name input, "Create" button
- [ ] **15.3** Build `ClassDetailPage`:
  - Back button with breadcrumb
  - Three tabs: Students, Sessions, Upload Roster (with sliding underline indicator)
  - Students tab: searchable table of students (roll no + name)
  - Sessions tab: list of past sessions for this class (clickable)
  - Upload Roster tab: drag-and-drop zone + CSV preview
- [ ] **15.4** Build `RosterUpload` component:
  - Drag-and-drop zone with dashed border (changes to primary-100 on drag-over)
  - File selected: show preview table with parsed rows and per-row validation status
  - Error rows highlighted in red-50
  - "Upload X Students" button with count
  - Success: animated checkmark → redirect to Students tab
- [ ] **15.5** Build `CreateSessionPage`:
  - Class dropdown selector
  - Session title input
  - "Create Session & Get Code" button
  - After creation: large session code display (monospace, typewriter animation)
  - "Copy Code" button (with "Copied ✓" tooltip), "Show QR" button
  - Live student join counter (updates via Socket.IO)
  - "Open Session Dashboard →" link to `/sessions/:id`
- [ ] **15.6** Build `SessionCodeDisplay` component:
  - Monospace font (JetBrains Mono), 40px, letter-spacing 8px
  - Typewriter animation: each character appears one-by-one with subtle scale
  - Copy-to-clipboard functionality
- [ ] **15.7** Build `QRCodeModal` — large QR code centered in modal, optimized for projector display (white background, large quiet zone)
- [ ] **15.8** Connect all pages to real API services, verify data flows correctly

**✅ GATE CHECK:**
- [ ] Dashboard home shows real stats from the backend
- [ ] Class creation works end-to-end
- [ ] CSV roster upload parses, previews, and uploads correctly
- [ ] Session creation returns code, typewriter animation plays, copy works
- [ ] Student join count updates live on the session creation page

---

### PHASE 16 — Active Session Page (THE CORE PAGE)

**Goal:** Build the most important page — the real-time session dashboard with three panels.

#### 16A — Task Panel
- [ ] **16.1** Build `TaskPanel` component — shows all tasks in vertical stack, "+ Add Task" button at top
- [ ] **16.2** Build `TaskCard` component — task title, animated progress bar (width transitions from old % to new %), mini stat row (✅ X Done, 🔄 Y Working, ⚠ Z Issues, ⬜ W N/S)
- [ ] **16.3** Build `AddTaskInput` — click "+ Add Task" → inline text field appears (smooth expand animation) → type title → Enter or "Add" button → field collapses back → new TaskCard slides in with spring animation
- [ ] **16.4** Progress bar colors: green portion (done), amber portion (in progress), red portion (issue), gray remainder (not started)
- [ ] **16.5** New task card entrance animation: slide down from 0 height + fade in (300ms spring)
- [ ] **16.6** Wire to Socket.IO: progress bars and stats update in real-time on every `status-update` event

#### 16B — Status Grid
- [ ] **16.7** Build `StatusGrid` component — table with students as rows, tasks as columns, status as cells
- [ ] **16.8** Build `StatusCell` component — colored background based on status, icon, hover tooltip showing full status text
- [ ] **16.9** Status cell colors: NOT_STARTED (neutral-100, gray circle), IN_PROGRESS (warning-50, amber loader), DONE (success-50, green check), ISSUE (danger-50, red alert)
- [ ] **16.10** Cell update animation: background color pulse — flash at 40% opacity, settle to 10% (600ms ease-out)
- [ ] **16.11** Search/filter bar above the grid (search by student name/roll)
- [ ] **16.12** "Export CSV" button — downloads current grid as spreadsheet
- [ ] **16.13** Wire to Socket.IO: cells update in real-time, new task columns appear automatically

#### 16C — Issue Alerts Panel
- [ ] **16.14** Build `IssueAlertPanel` — dedicated feed of all ISSUE responses
- [ ] **16.15** Build `IssueCard` — shows: red dot, roll number, student name, task title, issue text, timestamp, "Resolved ✓" button
- [ ] **16.16** New issue entrance animation: slide in from right + subtle scale from 0.95 (300ms spring)
- [ ] **16.17** "Resolved" button removes the issue from the prominent list (moves to a collapsed "resolved" section)
- [ ] **16.18** Optional: audio notification ping on new issue (browser Audio API)
- [ ] **16.19** Wire to Socket.IO: new issues appear immediately when a student reports one

#### 16D — Session Header & Controls
- [ ] **16.20** Session header: title, class name, session code (copyable), live join count ("32/45 joined"), green pulsing dot
- [ ] **16.21** "End Session" button (danger style) → opens ConfirmDialog → on confirm: calls endSession API → redirects to session summary
- [ ] **16.22** Student joined counter: animated number counter (old value → new value, 400ms)

#### 16E — Integration
- [ ] **16.23** Connect all three panels to `useSession` hook
- [ ] **16.24** Verify all Socket.IO events update the correct panel in real-time
- [ ] **16.25** Test with 2+ browser tabs: one as professor, one using the API to simulate student actions
- [ ] **16.26** Verify animations are smooth (no jank at 60fps)

**✅ GATE CHECK:**
- [ ] All three panels render with correct data
- [ ] Task panel: tasks appear, progress bars animate, new tasks can be added inline
- [ ] Status grid: matrix renders correctly, cells update in real-time with color pulse
- [ ] Issue panel: issues slide in on report, show full details, "Resolved" works
- [ ] Session can be ended with confirmation dialog
- [ ] All real-time updates work within 1 second of the triggering action

---

## MILESTONE 5: STUDENT WIDGET (Phases 17–18)

---

### PHASE 17 — Student Widget: Join Screen

**Goal:** Build the full-page join screen where students enter session code + roll number.

- [ ] **17.1** Create `public/index.html` — single HTML page with three `div` sections: join-screen, widget-collapsed, widget-expanded (last two hidden initially)
- [ ] **17.2** Include Socket.IO client via `<script src="/socket.io/socket.io.js">`
- [ ] **17.3** Create `public/style.css` — define all CSS variables for the widget (dark theme tokens)
- [ ] **17.4** Build join screen layout:
  - Centered card on dark gradient background
  - CodeTrack logo/wordmark at top
  - Session code input: 6 individual character boxes, auto-advance on type, auto-uppercase
  - Roll number input: simple text field
  - "Join Session →" primary button
  - Error message area below button
- [ ] **17.5** Style the 6-box session code input:
  - Each box: 48×56px, monospace font (JetBrains Mono), 24px, centered text
  - Auto-focus next box on character entry
  - Backspace moves to previous box
  - Subtle pop animation on each character entry (scale 0.9 → 1.0)
  - Paste support: if user pastes 6 chars, fill all boxes
- [ ] **17.6** Create `public/app.js` — join flow:
  - Collect session code (combine 6 boxes) + roll number
  - POST `/api/sessions/join` with `{ sessionCode, rollNo }`
  - On success: store student JWT, receive tasks list, transition to widget
  - On error: show error message ("Invalid code" / "Roll number not found" / "Session has ended")
- [ ] **17.7** Transition animation: join screen card shrinks and moves to corner, then transforms into the collapsed widget icon (smooth 500ms spring)
- [ ] **17.8** Test: valid code + valid roll → join succeeds, widget appears
- [ ] **17.9** Test: invalid code → error shown
- [ ] **17.10** Test: invalid roll number → error shown

**✅ GATE CHECK:**
- [ ] Join screen renders with correct dark theme
- [ ] 6-box code input works (auto-advance, backspace, paste)
- [ ] Successful join transitions smoothly to widget
- [ ] All error cases show appropriate messages

---

### PHASE 18 — Student Widget: Floating Widget

**Goal:** Build the collapsed + expanded states of the floating widget with full real-time functionality.

#### 18A — Collapsed State
- [ ] **18.1** Build collapsed widget: 48×48px rounded square, dark glassmorphic background (neutral-800 at 95% opacity), "CT" text, positioned bottom-right
- [ ] **18.2** Notification dot: 10px red circle, pulse animation when new task arrives
- [ ] **18.3** Hover state: scale(1.05) + shadow increase
- [ ] **18.4** Click handler: expand to full widget (spring animation, 400ms)

#### 18B — Expanded State
- [ ] **18.5** Build expanded widget: 260px wide, auto height (max 420px scrollable), dark glassmorphic background with backdrop blur
- [ ] **18.6** Title bar: "CodeTrack" text + minimize button (━) + collapse button (✕)
- [ ] **18.7** Session info: session title, session code
- [ ] **18.8** Task list: each task as a compact row with status icon (✅/🔄/⬜/⚠) + task number + truncated title
- [ ] **18.9** Click on task row → expands to show status radio buttons (slide-down animation):
  - ○ Not Started
  - ○ In Progress
  - ○ Done ✓
  - ○ Issue ⚠
- [ ] **18.10** Radio button styling: pill-shaped options with status-colored left border
- [ ] **18.11** When "Issue ⚠" is selected → text area slides open below:
  - Placeholder: "Describe your problem..."
  - "Submit Issue" button
  - Max 500 characters with character counter
- [ ] **18.12** Status submission: POST `/api/tasks/:id/respond` with student JWT → show brief success indicator (checkmark flash on the task row)
- [ ] **18.13** Connection status indicator at bottom: 🟢 "Connected" / 🟡 "Connecting..." / 🔴 "Disconnected"

#### 18C — Drag Functionality
- [ ] **18.14** Make widget draggable via mouse and touch events
- [ ] **18.15** Constrain within viewport bounds
- [ ] **18.16** Snap to nearest corner on drag release
- [ ] **18.17** Cursor: grab (default) → grabbing (during drag)
- [ ] **18.18** Prevent text selection during drag

#### 18D — Real-Time Events
- [ ] **18.19** Connect Socket.IO on successful join (using student JWT for auth)
- [ ] **18.20** Listen for `new-task`: add new task row with slide-in animation + 🆕 badge, show notification dot if collapsed
- [ ] **18.21** Listen for `session-ended`: disable all interactions, show "Session has ended" message, disconnect Socket.IO
- [ ] **18.22** Listen for `task-removed`: remove task row with fade-out animation
- [ ] **18.23** Auto-reconnect: on disconnection, attempt reconnect with exponential backoff, show connecting indicator

#### 18E — Verification
- [ ] **18.24** End-to-end test: student joins → professor adds task → widget shows notification → student submits status → professor dashboard updates
- [ ] **18.25** Test widget on Chrome, Firefox, Edge (lab browsers)
- [ ] **18.26** Test at different screen sizes (13" laptop, 24" monitor)
- [ ] **18.27** Verify total widget file size (HTML + CSS + JS) is under 50KB

**✅ GATE CHECK:**
- [ ] Widget loads instantly, occupies minimal screen space
- [ ] All 3 states (collapsed, expanded, join screen) work correctly
- [ ] Task list updates in real-time when professor adds/removes tasks
- [ ] Status submission works and professor dashboard updates in real-time
- [ ] Issue text area appears only when "Issue" is selected
- [ ] Drag works on mouse and touch
- [ ] Widget file size is under 50KB total
- [ ] Session end disables the widget gracefully

---

## MILESTONE 6: INTEGRATION & END-TO-END TESTING (Phase 19)

---

### PHASE 19 — Full System Integration Test

**Goal:** Run the complete system end-to-end, fix bugs, verify all flows work together.

- [ ] **19.1** Start backend server (`npm run dev` in `server/`)
- [ ] **19.2** Start professor dashboard (`npm run dev` in `dashboard/`)
- [ ] **19.3** Open student widget in a separate browser/tab
- [ ] **19.4** Execute the full demo script:
  1. Professor registers → logs in
  2. Creates class "TY-CS-A"
  3. Uploads CSV roster (10+ students)
  4. Creates session "DOM Practical 05" → gets code
  5. Student opens widget → enters code + roll number → joins
  6. Professor adds Task 1 → student widget shows notification
  7. Student marks "In Progress" → professor grid updates
  8. Student marks "Done" → professor grid updates
  9. Professor adds Task 2 → student widget shows new task
  10. Student marks "Issue" with description → professor sees in issue panel
  11. Professor adds Task 3 → student widget shows new task
  12. Professor ends session → student widget shows "Session ended"
  13. Professor views session summary
- [ ] **19.5** Test with 3+ simultaneous student tabs (simulate multiple students)
- [ ] **19.6** Test network disconnection: disable Wi-Fi briefly → verify reconnection + data consistency
- [ ] **19.7** Test edge cases:
  - Student joins after tasks are already added → sees all existing tasks
  - Two students submit status at the same time → no data corruption
  - Professor ends session while student is submitting → graceful handling
  - Browser refresh on student widget → re-establishes connection
  - Browser refresh on professor dashboard → re-fetches current state
- [ ] **19.8** Fix all bugs discovered during testing
- [ ] **19.9** Performance check: verify status grid renders at 60fps with 50 students × 5 tasks
- [ ] **19.10** Verify all animations are smooth across Chrome, Firefox, Edge

**✅ GATE CHECK:**
- [ ] Complete demo script runs without errors
- [ ] Multiple concurrent students work correctly
- [ ] Network disconnection/reconnection is graceful
- [ ] All edge cases handled
- [ ] No visual glitches or animation jank

---

## MILESTONE 7: POLISH & HARDENING (Phases 20–21)

---

### PHASE 20 — Phase 1B Features

**Goal:** Add all Phase 1B polish features.

- [ ] **20.1** Implement QR code generation (server-side via `qrcode` package)
- [ ] **20.2** Add QR code display to session creation page and active session header
- [ ] **20.3** Build `QRCodeModal` in professor dashboard — large QR optimized for projection
- [ ] **20.4** Implement CSV export of session status grid:
  - Download button on active session page and session summary
  - Generate CSV with columns: Roll No, Name, Task 1 Status, Task 2 Status, ...
  - Trigger browser download
- [ ] **20.5** Implement status change grace window in the student widget UI:
  - If student marked "Done" within the last 2 minutes, show "Change status" option
  - After 2 minutes, "Done" status is locked (show lock icon)
  - Visual countdown timer on the grace window
- [ ] **20.6** Implement Socket.IO auto-reconnect with UI feedback:
  - On disconnect: show "Reconnecting..." indicator
  - Exponential backoff: 1s, 2s, 4s, 8s, max 30s
  - On reconnect: re-fetch current state from API, show "Reconnected ✓" toast
- [ ] **20.7** Implement input validation on all frontend forms (match backend Zod schemas)
- [ ] **20.8** Add confirm dialogs on all destructive actions:
  - End session
  - Remove task
  - Change status from Done (within grace window)
- [ ] **20.9** Implement toast notification system for all user actions:
  - "Class created successfully"
  - "Task added"
  - "Session ended"
  - "Roster uploaded (43 students added)"
  - API errors
- [ ] **20.10** Add empty states for all list pages:
  - No classes yet → illustration + "Create your first class" button
  - No sessions → "Start a new session" button
  - No students in class → "Upload a roster" button

**✅ GATE CHECK:**
- [ ] QR codes generate and display correctly
- [ ] CSV export downloads with correct data
- [ ] Grace window works (allows change within 2 min, locks after)
- [ ] Auto-reconnect recovers gracefully
- [ ] All destructive actions have confirmation
- [ ] All user actions show toast feedback

---

### PHASE 21 — Testing Suite

**Goal:** Write automated tests for critical paths.

#### 21A — Backend Unit Tests
- [ ] **21.1** Set up Jest for the backend (`jest.config.ts`, test helpers)
- [ ] **21.2** Create `tests/helpers/testDb.ts` — fresh SQLite DB for each test
- [ ] **21.3** Create `tests/helpers/testAuth.ts` — create professor + get JWT helper
- [ ] **21.4** Create `tests/helpers/testFixtures.ts` — reusable test data
- [ ] **21.5** Write unit tests for `sessionCode.ts` — generation, alphabet, collision retry
- [ ] **21.6** Write unit tests for `csvParser.ts` — valid CSV, missing columns, empty rows, malformed data
- [ ] **21.7** Write unit tests for auth service — password hashing, token generation, duplicate email

#### 21B — Backend Integration Tests
- [ ] **21.8** Install `supertest`
- [ ] **21.9** Write integration tests for auth flow: register → login → protected route → invalid credentials
- [ ] **21.10** Write integration tests for classes: create → upload roster → list students → ownership check
- [ ] **21.11** Write integration tests for sessions: create → join → end → join-after-end
- [ ] **21.12** Write integration tests for tasks: add → list → update → remove → add-to-ended-session
- [ ] **21.13** Write integration tests for responses: submit → status grid → issues → grace window → duplicate
- [ ] **21.14** Write Socket.IO integration tests: connect → events emitted on actions → room isolation

#### 21C — Frontend Tests
- [ ] **21.15** Set up Vitest + React Testing Library for the dashboard
- [ ] **21.16** Write tests for auth context (login/logout/persist)
- [ ] **21.17** Write tests for UI components (Button, Badge, StatusCell, ProgressBar)
- [ ] **21.18** Write tests for API service modules (mock fetch, verify request/response handling)

#### 21D — E2E Tests
- [ ] **21.19** Install Playwright
- [ ] **21.20** Write E2E test: professor register → login → create class → upload roster → create session
- [ ] **21.21** Write E2E test: student joins → submits status → professor dashboard updates
- [ ] **21.22** Write E2E test: professor adds task → student widget receives notification

**✅ GATE CHECK:**
- [ ] All backend unit tests pass
- [ ] All backend integration tests pass
- [ ] Frontend component tests pass
- [ ] At least 3 E2E tests pass end-to-end
- [ ] `npm test` runs all tests and reports results

---

## MILESTONE 8: SESSION SUMMARY & HISTORY (Phase 22)

---

### PHASE 22 — Session Summary & History Pages

**Goal:** Build the post-session experience — summary reports and historical session browsing.

- [ ] **22.1** Build `SessionSummaryPage` (professor dashboard):
  - Session metadata: title, class, date, duration
  - 4 summary stat cards: total tasks, average completion %, total issues, student participation
  - Per-task breakdown table: task title, done count, issue count
  - Frozen status grid (same as active session, but read-only)
  - "Export CSV" button
- [ ] **22.2** Build `HistoryPage` (professor dashboard):
  - List of all past sessions, ordered by date (newest first)
  - Filterable by class (dropdown)
  - Searchable by session title
  - Each session row: title, class, date, completion %, student count
  - Click → navigates to `/sessions/:id/summary`
- [ ] **22.3** Add "Session History" API endpoints (if not already covered):
  - GET `/api/sessions?status=ENDED` — list ended sessions with summary stats
- [ ] **22.4** Connect history page to API, verify data loads correctly
- [ ] **22.5** Test: end a session → navigate to summary → verify all data is correct

**✅ GATE CHECK:**
- [ ] Session summary shows correct post-session data
- [ ] History page lists all past sessions
- [ ] Filters and search work
- [ ] CSV export works from summary page

---

## MILESTONE 9: CI/CD & DEPLOYMENT PREP (Phase 23)

---

### PHASE 23 — CI/CD, Linting, Production Build

**Goal:** Set up automated quality checks and prepare for deployment.

- [ ] **23.1** Configure ESLint for the backend (TypeScript rules)
- [ ] **23.2** Configure ESLint for the dashboard (React + TypeScript rules)
- [ ] **23.3** Fix all lint errors/warnings
- [ ] **23.4** Create GitHub Actions workflow (`.github/workflows/ci.yml`):
  - Trigger: push to `main`, pull requests
  - Steps: checkout → install deps → lint → run unit tests → run integration tests → build
- [ ] **23.5** Push to GitHub, verify CI pipeline passes
- [ ] **23.6** Build production dashboard: `npm run build` in `dashboard/` → verify `dist/` output
- [ ] **23.7** Configure Express to serve dashboard `dist/` in production mode
- [ ] **23.8** Build production backend: `npm run build` in `server/` → verify `dist/` output
- [ ] **23.9** Test production build locally: start with `NODE_ENV=production npm start` → verify everything works
- [ ] **23.10** Create `Dockerfile` for the backend (Node.js base image, copy built files, expose port)
- [ ] **23.11** Create `docker-compose.yml` (backend + SQLite volume mount)
- [ ] **23.12** Test Docker build and run locally

**✅ GATE CHECK:**
- [ ] `npm run lint` passes with zero errors
- [ ] GitHub Actions CI pipeline passes on push
- [ ] Production build runs correctly
- [ ] Docker container starts and serves the application

---

## MILESTONE 10: IoT HARDWARE (Phases 24–25) — Phase 2

---

### PHASE 24 — MQTT Bridge & Server-Side IoT Support

**Goal:** Add MQTT broker and bridge module so the backend can communicate with hardware devices.

- [ ] **24.1** Install and configure Eclipse Mosquitto (add to docker-compose.yml)
- [ ] **24.2** Install MQTT client for Node.js (`mqtt` npm package)
- [ ] **24.3** Create MQTT bridge module in the backend:
  - Subscribe to control topics: `codetrack/session/{id}/control`
  - Publish to display topics: `codetrack/session/{id}/status`
  - Bridge Socket.IO events ↔ MQTT messages
- [ ] **24.4** On `status-update` Socket.IO event → publish aggregated counts to MQTT topic
- [ ] **24.5** On `new-task` event → publish task info to MQTT topic
- [ ] **24.6** On `session-ended` → publish session end to MQTT topic
- [ ] **24.7** Test with MQTT client tool (e.g., MQTT Explorer): verify messages appear on correct topics
- [ ] **24.8** Update docker-compose.yml to include Mosquitto container

**✅ GATE CHECK:**
- [ ] Mosquitto broker runs alongside the backend
- [ ] MQTT messages are published when Socket.IO events fire
- [ ] Messages appear on correct topics with correct payloads

---

### PHASE 25 — ESP32 Hub Hardware & Firmware

**Goal:** Build and program the professor's desk hub that shows live session counts.

- [ ] **25.1** Set up PlatformIO project in VS Code
- [ ] **25.2** Wire hardware: ESP32 + SSD1306 OLED (I2C: SDA → GPIO21, SCL → GPIO22)
- [ ] **25.3** Wire RGB LED for status indication
- [ ] **25.4** Install libraries: `Adafruit_SSD1306`, `Adafruit_GFX`, `PubSubClient`, `ArduinoJson`, `WiFiManager`
- [ ] **25.5** Implement Wi-Fi provisioning via WiFiManager captive portal
- [ ] **25.6** Implement MQTT connection to Mosquitto broker
- [ ] **25.7** Implement OLED display states:
  - READY (waiting for session)
  - CONNECTING (Wi-Fi/MQTT connecting)
  - ACTIVE (showing live count: "Task 2: 28/45 Done")
  - COMPLETE (all tasks done for all students)
  - OFFLINE (lost connection to server)
- [ ] **25.8** Subscribe to MQTT topics: `codetrack/session/+/status`
- [ ] **25.9** Parse incoming JSON payloads with ArduinoJson
- [ ] **25.10** Update OLED display on every new message
- [ ] **25.11** Implement RGB LED states: blue (ready), amber (active), green (complete), red (offline)
- [ ] **25.12** Implement server-offline detection (MQTT keepalive timeout → show OFFLINE state)
- [ ] **25.13** Test: professor creates session → adds tasks → students submit → hub display updates in sync with dashboard
- [ ] **25.14** Test: disconnect hub → web system continues working unaffected
- [ ] **25.15** Test: reconnect hub → display resumes showing correct state

**✅ GATE CHECK:**
- [ ] Hub connects to Wi-Fi via captive portal (no hardcoded credentials)
- [ ] OLED shows correct state for each session phase
- [ ] Display updates within ~1 second of dashboard update
- [ ] Disconnecting hub does NOT affect web system
- [ ] Hub reconnects and resumes correctly after power cycle

---

## MILESTONE 11: INSTITUTIONAL SCALING (Phase 26 — Optional)

---

### PHASE 26 — Department/Institution Hierarchy (Phase 4)

> **Only execute this phase if the system is adopted beyond a single professor.**

- [ ] **26.1** Add `Institution` model to Prisma schema (id, name, code unique)
- [ ] **26.2** Add `Department` model (id, institutionId, name, code, unique [institutionId, code])
- [ ] **26.3** Modify `Professor` model: add departmentId (nullable), role (PROFESSOR/DEPT_ADMIN/INST_ADMIN), status (PENDING/ACTIVE/SUSPENDED), approvedBy
- [ ] **26.4** Modify `Class` model: add departmentId (nullable)
- [ ] **26.5** Add `InstitutionStudent` model (unified student identity)
- [ ] **26.6** Add `ClassEnrollment` model (many-to-many: student ↔ class)
- [ ] **26.7** Run Prisma migration
- [ ] **26.8** Implement institution API: create institution, create departments
- [ ] **26.9** Implement professor approval workflow: register with department code → PENDING → admin approves
- [ ] **26.10** Implement role-based access control middleware (RBAC)
- [ ] **26.11** Implement department-level roster upload (shared across professors)
- [ ] **26.12** Implement admin API: list professors, approve/suspend, department analytics, active sessions overview
- [ ] **26.13** Build Admin Dashboard section in the React app:
  - Professor approval queue
  - Department roster management
  - Active sessions overview across department
  - Cross-class analytics (completion rates per class/professor)
  - Professor activity reports
- [ ] **26.14** Migrate to PostgreSQL (update DATABASE_URL, run Prisma migrate)
- [ ] **26.15** Add Redis for Socket.IO adapter (multi-instance support)
- [ ] **26.16** Update docker-compose.yml with PostgreSQL + Redis containers
- [ ] **26.17** Update Nginx configuration for production deployment
- [ ] **26.18** Test standalone → institutional migration path
- [ ] **26.19** Test: multiple professors running simultaneous sessions without interference
- [ ] **26.20** Test: department admin can see all sessions and analytics

**✅ GATE CHECK:**
- [ ] Institution/department hierarchy works
- [ ] Professor approval workflow functions
- [ ] Shared rosters work across professors
- [ ] Admin dashboard shows cross-department data
- [ ] Multiple concurrent professors/sessions work correctly
- [ ] PostgreSQL + Redis deployment works
- [ ] Standalone-mode data can be migrated without loss

---

## FINAL VERIFICATION CHECKLIST

Before declaring the project complete, every item below must pass:

### Core Functionality
- [ ] Professor can register, login, and manage their account
- [ ] Professor can create classes and upload CSV rosters
- [ ] Professor can create sessions with unique 6-character codes
- [ ] Students can join sessions by typing code + roll number (no QR/camera needed)
- [ ] Professor can add tasks during a session — students are notified instantly
- [ ] Students can report status: Not Started → In Progress → Done / Issue
- [ ] Students can describe their issues with text
- [ ] Professor sees live per-student × per-task status grid
- [ ] Professor sees issue alerts with student name, roll number, and issue description
- [ ] Professor can end sessions — all statuses frozen
- [ ] Session summaries are viewable after the session ends

### Real-Time
- [ ] All status updates appear on the professor dashboard within 1 second
- [ ] New tasks appear in the student widget within 1 second
- [ ] Session end notification reaches all students immediately
- [ ] 50 concurrent students cause no perceptible lag

### Student Widget
- [ ] Widget loads in under 1 second
- [ ] Total file size under 50KB
- [ ] Works on Chrome, Firefox, Edge
- [ ] Floating widget occupies < 200px width, collapses to 48×48px icon
- [ ] Draggable to any screen corner
- [ ] Works on college lab PCs with restricted browsers

### Security
- [ ] No duplicate submissions (DB constraint enforced)
- [ ] Roll number verified against roster on join
- [ ] Session codes expire with the session
- [ ] JWT tokens are properly verified on all protected routes
- [ ] Input validation on all API endpoints

### Quality
- [ ] All tests pass
- [ ] Zero lint errors
- [ ] CI pipeline passes
- [ ] Production build works correctly

---

> **This is the final document. Execute phase by phase. Check off every item. Do not skip gate checks. Ship it.** 🚀
