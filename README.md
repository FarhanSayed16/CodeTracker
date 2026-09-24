# CodeTracker Classroom

CodeTracker is a real-time classroom orchestration tool for programming labs: professors push tasks, students update Done / Issue status, and the live grid stays in sync.

## Features
- Real-time task monitoring and issue streaming
- Excel / CSV roster import with global student pool + PIN join
- QR / session-code join (no student accounts)
- Session summary + CSV export
- Optional ESP32 MQTT hub (off by default)

## Technology Stack
- **Backend**: Node.js, Express, Socket.IO, Prisma, **Supabase Postgres**, optional **Upstash Redis**, optional MQTT
- **Professor Dashboard**: React + Vite (`dashboard/`)
- **Student Client**: Vanilla JS/CSS (`server/public/`)
- **Desktop Companion**: Electron quickball (`companion/`) — always-on-top for professors & students

## Free-tier setup (recommended)

### 1. Supabase (database)
1. Create a free project at [supabase.com](https://supabase.com)
2. **Project Settings → Database** → copy:
   - **Transaction pooler** URL → `DATABASE_URL` (port `6543`, add `?pgbouncer=true`)
   - **Direct** URL → `DIRECT_URL` (port `5432`, used by Prisma migrations)

### 2. Upstash Redis (optional cache)
1. Create a free Redis DB at [upstash.com](https://upstash.com)
2. Copy REST URL + token into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
3. If omitted, the API uses in-memory rate limits and skips caching (still fine for a single Node process)

### 3. Backend
```bash
cd server
npm install
cp .env.example .env
# Fill DATABASE_URL, DIRECT_URL, JWT_SECRET
# Leave ENABLE_MQTT=false until hardware work
npx prisma migrate deploy
npm run db:seed
npm run dev
```
API: `http://localhost:3000` · Student join: `http://localhost:3000/join` · QR links use `/join?code=`

Seed professor: `john.doe@example.com` / `password123`

> **Lab PCs:** use the desktop Companion Quickball for live status. The `/join` page is for phones / fallback — do not run both on the same machine.

### 4. Dashboard
```bash
cd dashboard
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:3000/api
npm run dev
```
Dashboard: `http://localhost:5173`

### 5. Desktop companion (optional)
Always-on-top quickball for live labs (works over VS Code). See [`companion/README.md`](companion/README.md).

```bash
cd companion
npm install
npm run dev          # development
npm run dist         # Windows installer → companion/release/
```

## Classroom sessions
- Student JWTs last **`STUDENT_JWT_EXPIRES_IN`** (default **4h**) so a 3–3.5h lab does not expire mid-class
- The student widget restores from `localStorage` after a tab refresh while the session is still ACTIVE

## IoT / MQTT
`ENABLE_MQTT=false` by default — no broker connection. Set `ENABLE_MQTT=true` and `MQTT_URL` when attaching ESP32 hubs (see `hardware/README.md`).

## Docker
Optional. Day-to-day work does **not** require Docker — use local Node + Supabase/Upstash. Compose remains available for Mosquitto demos later.

## Tests
```bash
cd server
npm test
```

## Environment (see `server/.env.example`)
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` / `DIRECT_URL` | Supabase Postgres |
| `JWT_SECRET` | Token signing |
| `JWT_EXPIRES_IN` | Professor tokens (default 24h) |
| `STUDENT_JWT_EXPIRES_IN` | Student lab tokens (default 4h) |
| `UPSTASH_REDIS_REST_*` | Optional cache + distributed rate limits |
| `ENABLE_MQTT` | IoT bridge (default false) |
| `REQUIRE_STUDENT_PIN` | PIN on join (default true) |

## License
MIT
