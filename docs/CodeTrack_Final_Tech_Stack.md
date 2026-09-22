# CodeTrack Classroom — Final Technical Stack

This document outlines the complete, production-ready technical stack for the CodeTrack Classroom system, covering both software (web/backend) and hardware (IoT) components, scalable from a single classroom up to an institution-wide deployment.

---

## 1. Backend (Application Server)
The backend is designed to be lightweight but highly scalable, favoring simplicity (Express) over heavy frameworks since the domain relies mostly on real-time WebSocket events.

*   **Runtime:** Node.js 20 LTS
*   **Language:** TypeScript (for type safety and shared DTOs with the frontend)
*   **Framework:** Express.js (handles REST API for auth, classes, sessions)
*   **Real-time Engine:** Socket.IO
    *   *Standalone Mode:* Single Socket.IO instance.
    *   *Institutional Scale:* Socket.IO with Redis Adapter for multi-instance broadcasting.
*   **Validation:** Zod (schema validation for all API inputs)
*   **Authentication:** JWT (JSON Web Tokens) via `jsonwebtoken`
*   **Password Hashing:** Argon2
*   **File Uploads:** `multer` (for handling CSV roster files) + `papaparse` (CSV parsing)
*   **Session Codes:** `nanoid` (custom alphabet for 6-character, human-readable codes)
*   **Logging:** `pino` (structured JSON logging)
*   **Security:** `helmet` (HTTP headers), `cors`, `express-rate-limit`

---

## 2. Data Layer
The database strategy allows for friction-free local development while enforcing strict relational integrity for production.

*   **ORM:** Prisma (Type-safe queries, schema management, easy migrations)
*   **Development DB:** SQLite (via `better-sqlite3` - zero setup, local file-based)
*   **Production DB:** PostgreSQL (Mandatory for institutional scale to handle concurrent writes safely)
*   **Caching & Pub/Sub:** Redis
    *   Used at institutional scale for Socket.IO event distribution, rate-limiting, and ephemeral session data.

---

## 3. Frontend (Professor & Admin Dashboards)
These interfaces are data-heavy, requiring dynamic status grids, routing, and charts.

*   **Framework:** React 18
*   **Language:** TypeScript
*   **Build Tool:** Vite (fast HMR and optimized builds)
*   **Styling:** Vanilla CSS (utilizing CSS Custom Properties/Variables) — keeps dependencies light.
*   **Real-time Client:** `socket.io-client`
*   **Data Visualization:** Recharts (used for historical analytics and completion rate trends)

---

## 4. Frontend (Student Widget)
The student UI is deliberately anti-bloat. It must not interfere with the student's primary coding environment.

*   **Framework:** None. Pure Vanilla HTML / JS.
*   **Styling:** Vanilla CSS (Zero build step, ultra-light footprint).
*   **Real-time Client:** `socket.io-client` (loaded via CDN or bundled as a single file).
*   **UI Pattern:** Draggable, floating popup widget that occupies < 15% of screen real estate and collapses into a tiny 40x40px icon.

---

## 5. IoT Hardware & Firmware (Phase 2 Hub)
The hardware component provides a glanceable, physical view of the session status for the professor without needing to look at a monitor.

*   **Microcontroller:** ESP32-WROOM-32 (Dual-core, built-in Wi-Fi)
*   **Display:** 0.96" OLED (SSD1306, via I2C interface)
*   **Status Indicator:** RGB LED (for color-coded session states: Ready/Active/Complete)
*   **Messaging Protocol:** MQTT (via `PubSubClient` library)
*   **Message Broker:** Eclipse Mosquitto (runs alongside the backend, bridges with Socket.IO)
*   **Firmware Environment:** PlatformIO (VS Code extension) for reproducible C++ builds and dependency management.
*   **Wi-Fi Provisioning:** Captive portal (e.g., `WiFiManager`) to configure network credentials dynamically on-site.
*   *(Optional)* **Student Flag Hardware:** Small LED strips or servo-actuated physical flags at individual student desks, triggered via ESP32 nodes.

---

## 6. Infrastructure & DevOps
Designed for easy deployment, starting from a single script up to a multi-container architecture.

*   **Containerization:** Docker & Docker Compose (bundles Node.js, Postgres, Redis, and Mosquitto)
*   **Reverse Proxy & TLS:** Nginx + Let's Encrypt (Certbot) for HTTPS and WebSocket routing.
*   **CI/CD:** GitHub Actions (Automated linting and test execution on push)
*   **Hosting:** Railway, AWS Lightsail, or DigitalOcean VPS (affordable, reliable cloud hosting for the central server).

---

## 7. Testing Stack

*   **Backend (Unit & Integration):** Jest + `supertest`
*   **Frontend (Unit):** Vitest + React Testing Library
*   **End-to-End (E2E):** Playwright (simulates real-time multi-user flows between Professor and Student interfaces)
