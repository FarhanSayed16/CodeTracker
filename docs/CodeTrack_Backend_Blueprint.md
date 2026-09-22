# CodeTrack Classroom — Backend Implementation Blueprint

**Scope:** Complete backend architecture — file structure, modules, services, middleware, routes, real-time events, and database layer. No code, only structure and responsibilities.

---

## 1. Project Root Structure

```
server/
├── prisma/
│   ├── schema.prisma                  ← Prisma schema (all models + relations)
│   ├── migrations/                    ← Auto-generated migration files
│   └── seed.ts                        ← Optional: seed data for development/testing
│
├── src/
│   ├── app.ts                         ← Express app setup (middleware chain, route mounting)
│   ├── server.ts                      ← Entry point (starts HTTP server + Socket.IO)
│   ├── config/
│   ├── middleware/
│   ├── modules/
│   │   ├── auth/
│   │   ├── classes/
│   │   ├── sessions/
│   │   ├── tasks/
│   │   └── responses/
│   ├── socket/
│   ├── utils/
│   └── types/
│
├── public/                            ← Student widget static files (HTML/CSS/JS)
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── helpers/
│
├── package.json
├── tsconfig.json
├── .env
├── .env.example
└── nodemon.json
```

---

## 2. Config Layer (`src/config/`)

Centralized configuration — no magic strings scattered across files.

```
src/config/
├── env.ts                             ← Loads and validates environment variables via Zod
├── database.ts                        ← Prisma client initialization (singleton)
└── constants.ts                       ← App-wide constants (session code length, status enums, grace window duration, etc.)
```

### `env.ts` — Responsibilities
- Load `.env` file
- Validate all environment variables against a Zod schema (fail fast on startup if missing)
- Export a typed `env` object used everywhere

### `database.ts` — Responsibilities
- Create and export a single `PrismaClient` instance
- Handle graceful disconnect on process exit

### `constants.ts` — Responsibilities
- Session code alphabet and length (`6 chars, A-Z + 2-9, no ambiguous characters`)
- Status enums: `NOT_STARTED | IN_PROGRESS | DONE | ISSUE`
- Session statuses: `ACTIVE | ENDED`
- Grace window duration (e.g., 120 seconds)
- Max issue text length (e.g., 500 chars)

---

## 3. Middleware Layer (`src/middleware/`)

All cross-cutting concerns — auth, validation, error handling, rate limiting.

```
src/middleware/
├── authMiddleware.ts                  ← JWT verification for professor routes
├── studentAuthMiddleware.ts           ← Student token verification for response routes
├── validateMiddleware.ts              ← Generic Zod schema validation (body, params, query)
├── errorHandler.ts                    ← Global error handler (catches all thrown errors, returns consistent JSON)
├── notFoundHandler.ts                 ← 404 handler for unmatched routes
└── rateLimiter.ts                     ← Rate limiting configuration (per-route or global)
```

### `authMiddleware.ts` — Responsibilities
- Extract JWT from `Authorization: Bearer <token>` header
- Verify signature and expiration
- Attach `professorId` to `req` object
- Reject with `401 Unauthorized` if invalid

### `studentAuthMiddleware.ts` — Responsibilities
- Extract student session token from header
- Verify the token contains valid `sessionId`, `studentId`, `rollNo`
- Check that the session is still `ACTIVE`
- Attach student identity to `req` object
- Reject with `401` if invalid or session has ended

### `validateMiddleware.ts` — Responsibilities
- Accept a Zod schema as parameter
- Validate `req.body`, `req.params`, or `req.query` against the schema
- Return `400 Bad Request` with detailed validation errors if invalid
- Strip unknown fields (prevent injection of unexpected data)

### `errorHandler.ts` — Responsibilities
- Catch all errors thrown by routes/services
- Distinguish between known errors (validation, auth, not-found) and unexpected errors
- Log unexpected errors with full stack trace via Pino
- Return consistent JSON error response: `{ error: string, message: string, statusCode: number }`
- Never leak stack traces or internal details to the client

### `rateLimiter.ts` — Responsibilities
- Configure `express-rate-limit` with sensible defaults
- Different limits for different route groups:
  - Auth routes: stricter (prevent brute force)
  - Student response routes: moderate (prevent spam)
  - General API: standard

---

## 4. Module Architecture

Each feature is a self-contained module with the same internal structure:

```
src/modules/<module>/
├── <module>.routes.ts                 ← Route definitions (Express Router)
├── <module>.controller.ts             ← Request handlers (parse req, call service, send res)
├── <module>.service.ts                ← Business logic (DB queries, validation rules, event emission)
└── <module>.schema.ts                 ← Zod schemas for request validation
```

**The flow for every request:**

```
Request → Router → Middleware (auth + validate) → Controller → Service → Database
                                                       │
                                                       └→ Socket.IO emit (if real-time event needed)
```

---

## 5. Auth Module (`src/modules/auth/`)

```
src/modules/auth/
├── auth.routes.ts
├── auth.controller.ts
├── auth.service.ts
└── auth.schema.ts
```

### Routes
| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| POST | `/api/auth/register` | validate(registerSchema) | `register` |
| POST | `/api/auth/login` | validate(loginSchema) | `login` |
| GET | `/api/auth/me` | authMiddleware | `getProfile` |

### Service Responsibilities
- **register**: Check email uniqueness → hash password with Argon2 → create professor record → return JWT
- **login**: Find professor by email → verify password with Argon2 → return JWT
- **getProfile**: Fetch professor by ID from token → return professor data (without password hash)
- **generateToken**: Create a JWT containing `professorId`, `email`, `name` with configurable expiry
- **hashPassword / verifyPassword**: Wrappers around Argon2 hash/verify

### Schemas
- `registerSchema`: name (string, min 2), email (valid email), password (string, min 8)
- `loginSchema`: email (valid email), password (string)

---

## 6. Classes Module (`src/modules/classes/`)

```
src/modules/classes/
├── classes.routes.ts
├── classes.controller.ts
├── classes.service.ts
└── classes.schema.ts
```

### Routes
| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| POST | `/api/classes` | auth, validate(createClassSchema) | `createClass` |
| GET | `/api/classes` | auth | `listClasses` |
| GET | `/api/classes/:id` | auth, validate(classIdParam) | `getClass` |
| POST | `/api/classes/:id/roster` | auth, multer(csv), validate(classIdParam) | `uploadRoster` |
| GET | `/api/classes/:id/students` | auth, validate(classIdParam) | `listStudents` |

### Service Responsibilities
- **createClass**: Validate professor ownership → create class record → return class
- **listClasses**: Fetch all classes belonging to the authenticated professor
- **getClass**: Fetch class by ID → verify professor ownership → return class with student count
- **uploadRoster**: Parse CSV file with `papaparse` → validate each row (roll_no + name required) → upsert students into the class → return count of added/updated students → handle duplicates gracefully
- **listStudents**: Fetch all students in a class → return sorted by roll number

### Schemas
- `createClassSchema`: class_name (string, min 2)
- `classIdParam`: id (UUID string)

### CSV Parsing Logic (within service)
- Accept `.csv` file via `multer`
- Parse with `papaparse`
- Expect columns: `roll_no`, `name`
- Skip empty rows, trim whitespace
- Report: `{ added: number, duplicatesSkipped: number, errors: string[] }`

---

## 7. Sessions Module (`src/modules/sessions/`)

```
src/modules/sessions/
├── sessions.routes.ts
├── sessions.controller.ts
├── sessions.service.ts
└── sessions.schema.ts
```

### Routes
| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| POST | `/api/sessions` | auth, validate(createSessionSchema) | `createSession` |
| GET | `/api/sessions` | auth | `listSessions` |
| GET | `/api/sessions/:id` | auth, validate(sessionIdParam) | `getSession` |
| PATCH | `/api/sessions/:id/end` | auth, validate(sessionIdParam) | `endSession` |
| POST | `/api/sessions/join` | validate(joinSessionSchema) | `joinSession` |

### Service Responsibilities
- **createSession**: Verify class exists + professor owns it → generate unique 6-char session code (via `nanoid`, collision-check loop) → create session record with status `ACTIVE` → return session with code
- **listSessions**: Fetch all sessions for the professor (across all their classes), ordered by most recent. Optional filter by status (ACTIVE / ENDED)
- **getSession**: Fetch session + all tasks + all participant statuses → verify professor ownership → return full session data with aggregated counts
- **endSession**: Verify session is ACTIVE + professor owns it → set status to `ENDED`, set `ended_at` timestamp → emit `session-ended` Socket.IO event to the session room → return summary (total tasks, completion stats)
- **joinSession**: Validate session code exists + session is ACTIVE → validate roll number exists in the session's class roster → check student hasn't already joined → create `SESSION_PARTICIPANTS` record → generate student JWT token → emit `student-joined` to professor → return student info + all current tasks + any existing responses
- **generateSessionCode**: Generate 6-char code from safe alphabet → check against active sessions for uniqueness → retry if collision

### Schemas
- `createSessionSchema`: classId (UUID), title (string, min 2)
- `sessionIdParam`: id (UUID)
- `joinSessionSchema`: sessionCode (string, length 6, uppercase), rollNo (string)

---

## 8. Tasks Module (`src/modules/tasks/`)

```
src/modules/tasks/
├── tasks.routes.ts
├── tasks.controller.ts
├── tasks.service.ts
└── tasks.schema.ts
```

### Routes
| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| POST | `/api/sessions/:id/tasks` | auth, validate(createTaskSchema) | `addTask` |
| GET | `/api/sessions/:id/tasks` | auth OR studentAuth | `listTasks` |
| PATCH | `/api/tasks/:id` | auth, validate(updateTaskSchema) | `updateTask` |
| DELETE | `/api/tasks/:id` | auth, validate(taskIdParam) | `removeTask` |

### Service Responsibilities
- **addTask**: Verify session is ACTIVE + professor owns it → auto-assign next `task_number` (max existing + 1) → create task record → create `NOT_STARTED` responses for all joined participants → emit `new-task` Socket.IO event to the session room → return task
- **listTasks**: Fetch all tasks in a session, ordered by `task_number` → include aggregated status counts per task (how many done, in progress, issue, not started)
- **updateTask**: Verify professor owns the session → update title/description → emit `task-updated` event (optional)
- **removeTask**: Verify professor owns the session + session is ACTIVE → delete task + all its responses → emit `task-removed` to the session room

### Schemas
- `createTaskSchema`: title (string, min 2), description (string, optional)
- `updateTaskSchema`: title (string, optional), description (string, optional) — at least one required
- `taskIdParam`: id (UUID)

---

## 9. Responses Module (`src/modules/responses/`)

```
src/modules/responses/
├── responses.routes.ts
├── responses.controller.ts
├── responses.service.ts
└── responses.schema.ts
```

### Routes
| Method | Path | Middleware | Handler |
|--------|------|-----------|---------|
| POST | `/api/tasks/:id/respond` | studentAuth, validate(respondSchema) | `submitResponse` |
| GET | `/api/sessions/:id/status` | auth | `getStatusGrid` |
| GET | `/api/sessions/:id/issues` | auth | `getIssues` |

### Service Responsibilities
- **submitResponse**: Verify task belongs to an ACTIVE session → verify student is a participant → check grace window if changing from DONE → upsert response (status + optional issue_text) → emit `status-update` Socket.IO event to the session room (professor receives: studentId, rollNo, name, taskId, status, issueText) → return updated response
- **getStatusGrid**: Fetch all participants × all tasks for a session → build a matrix: rows = students (sorted by roll number), columns = tasks (sorted by task_number), cells = status. Return as structured JSON for the dashboard grid
- **getIssues**: Fetch all responses with status `ISSUE` for the session → join with student name/rollNo and task title → return sorted by most recent

### Schemas
- `respondSchema`: status (enum: `IN_PROGRESS | DONE | ISSUE`), issueText (string, optional, max 500 — required when status is `ISSUE`)
- `taskIdParam`: id (UUID)

### Grace Window Logic
- When a student tries to change from `DONE` back to another status:
  - Check `updated_at` timestamp on the existing response
  - If within grace window (e.g., 120 seconds) → allow the change
  - If past grace window → reject with `403` ("Status change window has expired")

---

## 10. Socket.IO Layer (`src/socket/`)

```
src/socket/
├── socketManager.ts                   ← Socket.IO server initialization + connection handling
├── socketAuth.ts                      ← Authentication for WebSocket connections
└── sessionRooms.ts                    ← Room join/leave logic, event emission helpers
```

### `socketManager.ts` — Responsibilities
- Initialize Socket.IO server attached to the HTTP server
- Handle `connection` event → authenticate → join appropriate room
- Handle `disconnect` → clean up room membership
- Export the `io` instance for use by services (event emission)

### `socketAuth.ts` — Responsibilities
- Middleware for Socket.IO connections
- Verify JWT (professor) or student token from the handshake `auth` object
- Determine user type (professor or student) and session context
- Reject unauthorized connections

### `sessionRooms.ts` — Responsibilities
- **joinSessionRoom(socket, sessionId)**: Add socket to room `session:{sessionId}`
- **emitToSession(sessionId, event, data)**: Broadcast an event to all sockets in a session room
- **emitToProfessor(sessionId, event, data)**: Emit only to the professor's socket in that room (using a sub-room or targeted emit)
- **emitToStudents(sessionId, event, data)**: Emit to all student sockets in the room (exclude professor)

### Events Emitted by Services

| Event Name | Emitted By | Sent To | When |
|------------|-----------|---------|------|
| `new-task` | Tasks service | All students in session | Professor adds a new task |
| `task-removed` | Tasks service | All students in session | Professor removes a task |
| `status-update` | Responses service | Professor in session | Student changes a task status |
| `student-joined` | Sessions service | Professor in session | Student joins the session |
| `session-ended` | Sessions service | Everyone in session | Professor ends the session |

### Room Naming Convention
- `session:<sessionId>` — Main room for the session (all participants)
- `session:<sessionId>:professor` — Professor-only sub-room
- `session:<sessionId>:students` — Students-only sub-room

---

## 11. Utility Layer (`src/utils/`)

```
src/utils/
├── sessionCode.ts                     ← Generate unique 6-character session codes
├── csvParser.ts                       ← Parse and validate CSV roster files
├── logger.ts                          ← Pino logger instance with environment-based config
├── apiResponse.ts                     ← Standardized JSON response helpers (success, error, paginated)
└── asyncHandler.ts                    ← Wraps async route handlers to catch promise rejections
```

### `sessionCode.ts` — Responsibilities
- Generate a random 6-character code using `nanoid` with custom alphabet (A-Z, 2-9, excluding 0/O, 1/I/L)
- Accept a "check uniqueness" callback to verify against active sessions
- Retry up to N times on collision

### `csvParser.ts` — Responsibilities
- Accept a file buffer/path
- Parse with `papaparse`
- Validate expected headers exist (`roll_no`, `name`)
- Return array of `{ rollNo: string, name: string }` objects
- Collect and return parsing errors for individual rows

### `logger.ts` — Responsibilities
- Create a Pino logger instance
- Configure log level based on environment (development: `debug`, production: `info`)
- Add request context (request ID, method, path) when used in middleware
- Pretty-print in development, JSON in production

### `apiResponse.ts` — Responsibilities
- `sendSuccess(res, data, statusCode?)` — Consistent success response: `{ success: true, data }`
- `sendError(res, message, statusCode)` — Consistent error response: `{ success: false, error: message }`
- `sendPaginated(res, data, total, page, limit)` — For paginated lists (future use)

### `asyncHandler.ts` — Responsibilities
- Wraps an `async (req, res, next)` function
- Catches any thrown error and passes it to `next(error)` → which hits the global error handler
- Prevents unhandled promise rejection crashes

---

## 12. Types Layer (`src/types/`)

```
src/types/
├── express.d.ts                       ← Augment Express Request type with professor/student identity
├── models.ts                          ← Shared interfaces for API responses (not DB models — those come from Prisma)
├── socket.ts                          ← Socket.IO event types (payload shapes for all events)
└── enums.ts                           ← Status enums, role enums, session status enums
```

### `express.d.ts` — Responsibilities
- Extend `Request` interface to include:
  - `req.professorId: string` (set by auth middleware)
  - `req.student: { studentId, rollNo, name, sessionId }` (set by student auth middleware)

### `models.ts` — Responsibilities
- Define API response shapes: `SessionResponse`, `TaskResponse`, `StatusGridResponse`, `IssueListResponse`, etc.
- These are the contracts between backend and frontend — keep them precise

### `socket.ts` — Responsibilities
- Define typed event maps for Socket.IO:
  - `ServerToClientEvents`: all events the server emits
  - `ClientToServerEvents`: all events the client emits
  - `InterServerEvents`: for future multi-instance communication

### `enums.ts` — Responsibilities
- `TaskStatus`: `NOT_STARTED | IN_PROGRESS | DONE | ISSUE`
- `SessionStatus`: `ACTIVE | ENDED`
- `ProfessorRole`: `PROFESSOR | DEPT_ADMIN | INST_ADMIN` (Phase 4)
- `AccountStatus`: `PENDING | ACTIVE | SUSPENDED` (Phase 4)

---

## 13. Prisma Schema Design (`prisma/schema.prisma`)

### Models (Corresponding to DB Tables)
1. **Professor** — id, name, email, passwordHash, createdAt
2. **Class** — id, className, professorId (relation → Professor), createdAt
3. **Student** — id, rollNo, name, classId (relation → Class), unique constraint on [classId, rollNo]
4. **Session** — id, classId (relation → Class), sessionCode (unique), title, status, startedAt, endedAt
5. **Task** — id, sessionId (relation → Session), taskNumber, title, description, createdAt, unique constraint on [sessionId, taskNumber]
6. **TaskResponse** — id, taskId (relation → Task), studentId (relation → Student), status, issueText, updatedAt, unique constraint on [taskId, studentId]
7. **SessionParticipant** — sessionId + studentId (composite primary key), joinedAt

### Relations Map
```
Professor ──< Class ──< Student
                  │
                  └──< Session ──< Task ──< TaskResponse >── Student
                          │
                          └──< SessionParticipant >── Student
```
- Professor has many Classes
- Class has many Students
- Class has many Sessions
- Session has many Tasks
- Task has many TaskResponses
- Student has many TaskResponses
- Session has many SessionParticipants (joined students)

### Data Source
- Provider: `sqlite` for development, `postgresql` for production
- Switchable via environment variable `DATABASE_URL`

---

## 14. Entry Points

### `src/app.ts` — Express App Assembly
**Middleware chain (order matters):**
1. `helmet()` — security headers
2. `cors()` — origin restriction
3. `express.json()` — body parsing
4. `pino-http` — request logging
5. Rate limiter (global)
6. Static file serving (`public/` directory for student widget)
7. Mount route modules:
   - `/api/auth` → auth.routes
   - `/api/classes` → classes.routes
   - `/api/sessions` → sessions.routes
   - `/api/tasks` → tasks.routes (standalone task routes like PATCH/DELETE)
   - Task and response routes nested under sessions are mounted in their respective routers
8. `notFoundHandler` — catch unmatched routes
9. `errorHandler` — global error handler (must be last)

### `src/server.ts` — Server Startup
1. Import the Express app
2. Create HTTP server from the app
3. Initialize Socket.IO on the HTTP server
4. Connect to database (Prisma)
5. Start listening on configured port
6. Log startup message with port and environment
7. Handle graceful shutdown (SIGTERM/SIGINT → close Socket.IO → disconnect Prisma → exit)

---

## 15. Student Widget Static Files (`public/`)

```
public/
├── index.html                         ← Student join page + widget interface
├── style.css                          ← Minimal CSS for the floating widget
└── app.js                             ← Vanilla JS: Socket.IO connection, API calls, UI updates
```

These are served as static files by Express. No build step. The student opens the URL, enters the session code + roll number, and the widget loads in-browser.

---

## 16. Testing Structure (`tests/`)

```
tests/
├── unit/
│   ├── services/
│   │   ├── auth.service.test.ts       ← Password hashing, token generation
│   │   ├── sessions.service.test.ts   ← Session code generation, join validation
│   │   ├── tasks.service.test.ts      ← Task numbering, auto-notification logic
│   │   └── responses.service.test.ts  ← Grace window logic, status transitions
│   └── utils/
│       ├── sessionCode.test.ts        ← Code generation, collision handling
│       └── csvParser.test.ts          ← Valid/invalid CSV handling
│
├── integration/
│   ├── auth.test.ts                   ← Register → login → access protected route
│   ├── classes.test.ts                ← Create class → upload roster → list students
│   ├── sessions.test.ts               ← Create session → student joins → end session
│   ├── tasks.test.ts                  ← Add task → list tasks → remove task
│   ├── responses.test.ts              ← Submit response → status grid → issues list
│   └── realtime.test.ts               ← Socket.IO event emission on task/response changes
│
└── helpers/
    ├── testDb.ts                      ← Creates a fresh SQLite DB for each test run
    ├── testAuth.ts                    ← Helper to create a professor and get a JWT
    └── testFixtures.ts                ← Reusable test data (professors, classes, students, sessions)
```

### Testing Approach
- **Unit tests**: Test service logic in isolation (mock Prisma, mock Socket.IO)
- **Integration tests**: Spin up the full Express app with a test SQLite DB, make real HTTP requests via `supertest`, verify DB state and responses
- **Real-time tests**: Connect Socket.IO test clients, perform actions via API, verify that the correct events are received

---

## 17. Environment Variables (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `DATABASE_URL` | Prisma connection string | `file:./dev.db` (SQLite) or `postgresql://...` |
| `JWT_SECRET` | Secret for signing JWTs | `your-secret-key-here` |
| `JWT_EXPIRES_IN` | Token expiry duration | `24h` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `GRACE_WINDOW_SECONDS` | Status change grace period | `120` |

---

## 18. Data Flow Summary

### Professor Creates Session + Adds Task
```
Professor Dashboard                    Backend                         Database
      │                                  │                               │
      ├─ POST /api/sessions ────────────►│── create session ────────────►│
      │◄─── { sessionId, code } ────────│◄─── session record ──────────│
      │                                  │                               │
      ├─ POST /sessions/:id/tasks ──────►│── create task ──────────────►│
      │                                  │── create NOT_STARTED          │
      │                                  │   responses for all ─────────►│
      │                                  │                               │
      │                                  │── Socket.IO: 'new-task' ──────► All Students
      │◄─── { taskId, taskNumber } ─────│                               │
```

### Student Joins + Reports Issue
```
Student Widget                         Backend                         Database
      │                                  │                               │
      ├─ POST /sessions/join ───────────►│── validate code + roll ──────►│
      │                                  │── create participant ────────►│
      │◄─── { token, tasks } ───────────│── Socket.IO: 'student-joined'─► Professor
      │                                  │                               │
      ├─ POST /tasks/:id/respond ───────►│── upsert response ──────────►│
      │   { status: ISSUE,              │                               │
      │     issueText: "..." }          │── Socket.IO: 'status-update' ─► Professor
      │◄─── { confirmed } ─────────────│                               │
```

---

## 19. Startup Checklist (What `npm run dev` Does)

1. TypeScript compilation (via `ts-node-dev` or `tsx` — live reload in development)
2. Prisma client generation (`prisma generate`)
3. Database migration check (`prisma migrate dev`)
4. Express app creation with full middleware chain
5. Socket.IO server initialization
6. HTTP server starts listening
7. Log: `🚀 CodeTrack server running on port 3000 (development)`

### npm Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `tsx watch src/server.ts` | Development with hot reload |
| `build` | `tsc` | Compile TypeScript to JavaScript |
| `start` | `node dist/server.js` | Run compiled production build |
| `db:migrate` | `prisma migrate dev` | Run database migrations |
| `db:generate` | `prisma generate` | Regenerate Prisma client |
| `db:seed` | `tsx prisma/seed.ts` | Seed development data |
| `db:studio` | `prisma studio` | Open Prisma's visual DB browser |
| `test` | `jest` | Run all tests |
| `test:unit` | `jest tests/unit` | Run unit tests only |
| `test:integration` | `jest tests/integration` | Run integration tests only |
| `lint` | `eslint src/` | Lint source code |
