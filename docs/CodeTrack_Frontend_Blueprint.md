# CodeTrack Classroom — Frontend Implementation Blueprint

**Scope:** Complete frontend architecture — all pages, component trees, navigation, design system, animations, transitions, file structures, and responsive behaviors for the Professor Dashboard (React) and the Student Widget (Vanilla HTML/CSS/JS).

---

## 1. Two Separate Frontends

CodeTrack has **two completely different frontend applications** with different philosophies:

| Frontend | Technology | Why |
|----------|-----------|-----|
| **Professor Dashboard** | React 18 + TypeScript + Vite | Complex interactive UI — real-time status grid, multi-panel layout, charts, routing |
| **Student Widget** | Vanilla HTML / CSS / JS | Ultra-lightweight floating popup — must load instantly, zero framework overhead, minimal screen footprint |

They share nothing except the same backend API and Socket.IO server.

---

## 2. Design System — "CodeTrack UI"

### 2.1 Design Philosophy

> **Professional. Calm. Functional.** The UI should feel like a polished SaaS tool that a professor would trust in front of a classroom of 50+ students on a projector. No playful colors, no gamification aesthetics — clean, confident, and data-dense when it needs to be.

**Inspirations:** Linear, Vercel Dashboard, Notion, GitHub Issues — tools that feel calm under heavy data.

---

### 2.2 Color Palette

#### Primary Palette — Deep Indigo Core

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-primary-50` | `#EEF2FF` | Lightest tint — hover states, selected backgrounds |
| `--color-primary-100` | `#E0E7FF` | Active tab background, badge backgrounds |
| `--color-primary-200` | `#C7D2FE` | Light borders, focus rings |
| `--color-primary-400` | `#818CF8` | Secondary buttons, links |
| `--color-primary-500` | `#6366F1` | **Primary brand color** — buttons, active states, nav indicators |
| `--color-primary-600` | `#4F46E5` | Button hover, deeper accents |
| `--color-primary-700` | `#4338CA` | Button pressed state |
| `--color-primary-900` | `#312E81` | Dark text on light primary backgrounds |

#### Neutral Palette — Slate (not pure gray — warmer, more professional)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-neutral-50` | `#F8FAFC` | Page background |
| `--color-neutral-100` | `#F1F5F9` | Card backgrounds, alt table rows |
| `--color-neutral-200` | `#E2E8F0` | Borders, dividers |
| `--color-neutral-300` | `#CBD5E1` | Disabled states, placeholder text |
| `--color-neutral-400` | `#94A3B8` | Secondary text, icons |
| `--color-neutral-500` | `#64748B` | Body text secondary |
| `--color-neutral-600` | `#475569` | Body text primary |
| `--color-neutral-700` | `#334155` | Headings |
| `--color-neutral-800` | `#1E293B` | Sidebar background, dark cards |
| `--color-neutral-900` | `#0F172A` | Deepest background (dark mode) |

#### Semantic Status Colors

| Token | Hex | Status | Used For |
|-------|-----|--------|----------|
| `--color-success-500` | `#22C55E` | DONE | Completed task indicators, success toasts |
| `--color-success-50` | `#F0FDF4` | — | Success background tint |
| `--color-warning-500` | `#F59E0B` | IN_PROGRESS | Working/in-progress indicators |
| `--color-warning-50` | `#FFFBEB` | — | Warning background tint |
| `--color-danger-500` | `#EF4444` | ISSUE | Issue badges, error states, alerts |
| `--color-danger-50` | `#FEF2F2` | — | Error background tint |
| `--color-muted-400` | `#94A3B8` | NOT_STARTED | Empty/default task state |

---

### 2.3 Typography

**Font Stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

Load from Google Fonts: `Inter` weights 400, 500, 600, 700.

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `--font-display` | 28px | 700 | Page titles ("Active Session", "Dashboard") |
| `--font-heading` | 20px | 600 | Section headings ("Tasks", "Issues") |
| `--font-subheading` | 16px | 600 | Card titles, table headers |
| `--font-body` | 14px | 400 | Default body text |
| `--font-body-medium` | 14px | 500 | Emphasized body text, nav items |
| `--font-small` | 12px | 400 | Timestamps, metadata, badges |
| `--font-mono` | 13px | 400 | Session codes, roll numbers (`'JetBrains Mono', monospace`) |

---

### 2.4 Spacing Scale

Based on a 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight inner padding, icon gaps |
| `--space-2` | 8px | Button padding, badge padding |
| `--space-3` | 12px | Input padding, compact card padding |
| `--space-4` | 16px | Standard card padding, section gaps |
| `--space-5` | 20px | Card body padding |
| `--space-6` | 24px | Section margins |
| `--space-8` | 32px | Page section spacing |
| `--space-10` | 40px | Major section separators |
| `--space-12` | 48px | Page top/bottom padding |

---

### 2.5 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Badges, small chips |
| `--radius-md` | 8px | Buttons, inputs, cards |
| `--radius-lg` | 12px | Modals, panels, large cards |
| `--radius-xl` | 16px | Floating widget, popovers |
| `--radius-full` | 9999px | Avatars, status dots, pills |

---

### 2.6 Shadows (Elevation System)

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle — inputs, small cards |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)` | Cards, dropdowns |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)` | Modals, floating panels |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)` | Student widget (floating) |
| `--shadow-glow-primary` | `0 0 0 3px rgba(99, 102, 241, 0.15)` | Focus ring on interactive elements |
| `--shadow-glow-danger` | `0 0 0 3px rgba(239, 68, 68, 0.15)` | Focus ring on destructive actions |

---

### 2.7 Icons

**Icon Library:** Lucide React (for Professor Dashboard) / Lucide SVG sprites (for Student Widget)

- Lightweight, consistent, MIT licensed
- Stroke-based (looks clean at small sizes)
- Tree-shakeable in React (only bundled icons that are used)

| Context | Icons |
|---------|-------|
| Navigation | `LayoutDashboard`, `Users`, `BookOpen`, `History`, `Settings` |
| Session | `Play`, `Square` (stop), `QrCode`, `Copy`, `Share2` |
| Tasks | `Plus`, `CheckCircle2`, `AlertTriangle`, `Clock`, `Circle` |
| Status | `CircleCheck` (done), `Loader2` (in progress), `AlertCircle` (issue), `Circle` (not started) |
| Actions | `Upload`, `Download`, `Trash2`, `Edit3`, `MoreVertical` |
| Feedback | `Bell`, `BellRing`, `Volume2` |

---

### 2.8 Animation & Transition Tokens

All transitions use CSS custom properties for consistency:

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | Button hover, icon color change, tooltip show |
| `--transition-base` | `200ms cubic-bezier(0.4, 0, 0.2, 1)` | Card hover, dropdown open, tab switch |
| `--transition-slow` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` | Modal enter/exit, sidebar collapse, panel slide |
| `--transition-spring` | `500ms cubic-bezier(0.34, 1.56, 0.64, 1)` | Notification pop-in, badge bounce, widget expand |

---

## 3. Animations & Micro-Interactions Catalog

### 3.1 Page-Level Transitions
| Transition | Type | Timing |
|-----------|------|--------|
| Page route change | **Fade + subtle slide up** (8px) | 200ms ease-out for enter, 150ms ease-in for exit |
| Tab switch (within a page) | **Content crossfade** — old fades out, new fades in | 150ms overlap |

### 3.2 Component-Level Animations
| Element | Animation | Trigger | Timing |
|---------|-----------|---------|--------|
| **Status cell update** (grid) | Background color pulse — flash the new status color at 40% opacity, then settle to 10% | Socket.IO `status-update` event | 600ms ease-out |
| **New task row** (grid) | Slide down from 0 height + fade in | Socket.IO `new-task` event | 300ms spring |
| **Issue alert card** (panel) | Slide in from right + subtle scale from 0.95 | New issue received | 300ms spring |
| **Student joined** (counter) | Number counter animates from old → new value | Socket.IO `student-joined` | 400ms ease-out |
| **Progress bar** | Width animates smoothly from old % to new % | Count update | 500ms ease-out |
| **Session code display** | Typewriter reveal, character by character | Session creation | 80ms per character |
| **Notification badge** (widget) | Scale from 0 → 1 with spring bounce | New task pushed | 400ms spring |
| **Toast notification** | Slide in from top-right, auto-dismiss with shrinking progress bar | Any server event | Enter: 300ms, stay: 4s, exit: 200ms |

### 3.3 Hover & Focus States
| Element | Hover | Focus |
|---------|-------|-------|
| **Buttons (primary)** | Background darkens by one shade, subtle `translateY(-1px)`, shadow-md → shadow-lg | Primary glow ring (`--shadow-glow-primary`) |
| **Buttons (ghost/secondary)** | Background goes to `neutral-100`, text color intensifies | Primary glow ring |
| **Cards** | `translateY(-2px)`, shadow-sm → shadow-md | Solid primary-200 border |
| **Table rows** | Background to `neutral-50` | — |
| **Nav items** | Left border indicator slides in (3px wide, primary-500) | Background to `primary-50` |
| **Status pills** | Slight brightness increase (`filter: brightness(1.05)`) | Status-colored glow ring |
| **Icon buttons** | Background circle appears (`neutral-100`, radius-full), icon color intensifies | Primary glow ring |

### 3.4 Loading & Skeleton States
| State | Visual |
|-------|--------|
| **Page loading** | Skeleton cards with animated shimmer gradient (left→right shine) on neutral-100 background |
| **Button loading** | Text replaced with a spinning `Loader2` icon (16px) — button stays same width |
| **Table loading** | Rows are skeleton bars with shimmer, matching row height |
| **Socket.IO connecting** | Subtle pulsing dot (amber) in the header status indicator |
| **Socket.IO connected** | Solid green dot, with a one-time pulse animation on reconnect |
| **Socket.IO disconnected** | Red dot with slow pulse, overlay banner: "Reconnecting..." |

---

## 4. Professor Dashboard — Page Map

### 4.1 Full Page List

| # | Page | Route | Purpose | Phase |
|---|------|-------|---------|-------|
| 1 | Login | `/login` | Professor authentication | P1A |
| 2 | Register | `/register` | New professor account creation | P1A |
| 3 | Dashboard Home | `/` | Overview — active sessions, recent activity, quick stats | P1A |
| 4 | Classes List | `/classes` | All professor's classes with student counts | P1A |
| 5 | Class Detail | `/classes/:id` | Class info, student roster, past sessions for this class | P1A |
| 6 | Roster Upload | `/classes/:id/roster` | CSV upload interface with preview and validation | P1A |
| 7 | Create Session | `/sessions/new` | Select class, enter title, generate session | P1A |
| 8 | **Active Session** | `/sessions/:id` | **THE core page** — live status grid, task manager, issue alerts | P1A |
| 9 | Session Summary | `/sessions/:id/summary` | Post-session report with final statuses, exportable | P1B |
| 10 | Session History | `/history` | List of all past sessions with filters and search | P3 |
| 11 | Analytics | `/analytics` | Trend charts, completion rates across sessions | P3 |
| 12 | Settings | `/settings` | Profile, password change, preferences | P3 |

---

### 4.2 Navigation Structure

#### Sidebar Navigation (always visible on desktop, collapsible on tablet)

```
┌──────────────────────────────────────────────────────────────────┐
│ ┌────────────┐                                                    │
│ │             │                                                    │
│ │  CT Logo    │  ← CodeTrack logo + wordmark                      │
│ │             │                                                    │
│ ├────────────┤                                                    │
│ │             │                                                    │
│ │ 🏠 Dashboard│  ← / (home)                                       │
│ │ 📚 Classes  │  ← /classes                                       │
│ │ 📋 History  │  ← /history (P3)                                  │
│ │ 📊 Analytics│  ← /analytics (P3)                                │
│ │             │                                                    │
│ │ ─────────── │  ← divider                                       │
│ │             │                                                    │
│ │ ⚙ Settings  │  ← /settings                                     │
│ │             │                                                    │
│ ├────────────┤                                                    │
│ │ Prof. Name  │  ← Profile area at bottom                         │
│ │ 🔴 Logout   │                                                    │
│ └────────────┘                                                    │
│                  ┌────────────────────────────────────────────┐    │
│                  │                                            │    │
│                  │              PAGE CONTENT                  │    │
│                  │                                            │    │
│                  └────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

**Sidebar behavior:**
- Desktop (≥1024px): Always visible, 240px wide
- Tablet (768–1023px): Collapsed to 64px (icons only), hover to expand with overlay
- Mobile (<768px): Hidden by default, hamburger menu to slide in as overlay

#### Top Bar (within content area)

```
┌──────────────────────────────────────────────────────────────┐
│  Page Title                         🔔 Notifications   🟢 ● │
│  Breadcrumb: Dashboard > Classes > TY-CS-A               Live│
└──────────────────────────────────────────────────────────────┘
```

- **Page title**: Dynamic, matches current route
- **Breadcrumb**: Shows navigation hierarchy (clickable)
- **Connection indicator**: Green dot = connected, amber pulse = connecting, red pulse = disconnected
- **Notification bell**: Shows count of unread issue alerts (rings with animation on new issue)

---

### 4.3 Page Layouts — Detailed

#### Page 1: Login (`/login`)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│                         ┌──────────────────┐                      │
│                         │                  │                      │
│                         │    CT Logo       │                      │
│                         │    CodeTrack     │                      │
│                         │    Classroom     │                      │
│                         │                  │                      │
│                         │  ┌────────────┐  │                      │
│                         │  │ Email      │  │                      │
│                         │  └────────────┘  │                      │
│                         │  ┌────────────┐  │                      │
│                         │  │ Password 👁│  │                      │
│                         │  └────────────┘  │                      │
│                         │                  │                      │
│                         │  [ Sign In    ]  │                      │
│                         │                  │                      │
│                         │  Don't have an   │                      │
│                         │  account?        │                      │
│                         │  Register →      │                      │
│                         │                  │                      │
│                         └──────────────────┘                      │
│                                                                    │
│             Subtle gradient background (primary-50 → neutral-50)  │
└──────────────────────────────────────────────────────────────────┘
```

**Details:**
- Centered card on a subtle gradient background
- Logo at the top of the card with the "CodeTrack" wordmark
- Email field with validation (red border + error text on invalid email)
- Password field with eye icon toggle for visibility
- "Sign In" button — full-width, primary-500, 48px height
- Loading state: button shows spinner, fields disabled
- Error toast on invalid credentials (slides in from top-right)
- Link to `/register` below the form

---

#### Page 2: Register (`/register`)

Same layout as Login, with additional fields:
- **Name** (text input)
- **Email** (email input)
- **Password** (password input, min 8 chars, strength indicator bar below)
- **Confirm Password** (must match)
- "Create Account" button
- Link to `/login`

**Password strength indicator:**
- Red bar (weak) → amber bar (medium) → green bar (strong)
- Animated width transition as user types

---

#### Page 3: Dashboard Home (`/`)

```
┌─ Sidebar ─┐┌──────────────────────────────────────────────────────┐
│            ││ Dashboard                                 🟢 Live   │
│ 🏠 Dashbrd ││ ─────────────────────────────────────────────────── │
│ 📚 Classes ││                                                     │
│ 📋 History ││ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐│
│ 📊 Analyti ││ │ 📊 Active │ │ 👥 Total │ │ 📚 Total │ │ 📋 Total││
│            ││ │ Sessions │ │ Students │ │ Classes  │ │ Sessions││
│            ││ │          │ │          │ │          │ │ (All     ││
│            ││ │    2     │ │   142    │ │    4     │ │  Time)   ││
│            ││ │          │ │          │ │          │ │   23     ││
│            ││ └──────────┘ └──────────┘ └──────────┘ └─────────┘│
│            ││                                                     │
│            ││ Active Sessions                                     │
│            ││ ┌─────────────────────────────────────────────────┐│
│            ││ │ 🟢 DOM Practical 05 · TY-CS-A                  ││
│            ││ │    Task 3 active · 32/45 joined · 2 issues     ││
│            ││ │                           [ Open Dashboard → ] ││
│            ││ ├─────────────────────────────────────────────────┤│
│            ││ │ 🟢 CSS Layouts Lab · SY-CS-B                   ││
│            ││ │    Task 1 active · 28/38 joined · 0 issues     ││
│            ││ │                           [ Open Dashboard → ] ││
│            ││ └─────────────────────────────────────────────────┘│
│            ││                                                     │
│            ││ Quick Actions                                       │
│            ││ ┌─────────────────┐  ┌─────────────────┐           │
│            ││ │  + New Session  │  │  + New Class    │           │
│            ││ └─────────────────┘  └─────────────────┘           │
│            ││                                                     │
│ ──────     ││ Recent Activity (last 7 days)                      │
│ ⚙ Settings ││ ┌─────────────────────────────────────────────────┐│
│            ││ │ Today — Ended "JS Functions Lab" (TY-CS-A)     ││
│            ││ │ Yesterday — 3 sessions, avg 82% completion     ││
│ Prof. Name ││ │ Sep 19 — Added class "FY-CS-A" (62 students)  ││
│ 🔴 Logout  ││ └─────────────────────────────────────────────────┘│
└────────────┘└──────────────────────────────────────────────────────┘
```

**Sections:**
1. **Stat cards** (top row): 4 cards with icon, label, and animated number counter. Cards have subtle hover lift.
2. **Active sessions**: Live cards for currently running sessions with key metrics. "Open Dashboard →" links to `/sessions/:id`. Green pulsing dot indicates live. These update in real-time via Socket.IO.
3. **Quick actions**: Two large ghost buttons for the most common actions.
4. **Recent activity**: Timeline-style list of recent events.

---

#### Page 4: Classes List (`/classes`)

```
┌────────────────────────────────────────────────────────────────┐
│ Classes                                    [ + Create Class ]  │
│ ──────────────────────────────────────────────────────────────  │
│                                                                 │
│ ┌───────────────────────┐  ┌───────────────────────┐           │
│ │ 📚 TY-CS-A            │  │ 📚 TY-CS-B            │           │
│ │ Third Year CS - Div A │  │ Third Year CS - Div B │           │
│ │                       │  │                       │           │
│ │ 👥 45 students        │  │ 👥 42 students        │           │
│ │ 📋 12 sessions        │  │ 📋 8 sessions         │           │
│ │ Last: 2 days ago      │  │ Last: Today           │           │
│ │                       │  │                       │           │
│ │ [View →]              │  │ [View →] [▶ Session]  │           │
│ └───────────────────────┘  └───────────────────────┘           │
│                                                                 │
│ ┌───────────────────────┐  ┌───────────────────────┐           │
│ │ 📚 SY-CS-A            │  │ 📚 FY-CS-A            │           │
│ │ Second Year CS - A    │  │ First Year CS - A     │           │
│ │ 👥 38 students        │  │ 👥 62 students        │           │
│ │ 📋 5 sessions         │  │ 📋 0 sessions         │           │
│ │ Last: 5 days ago      │  │ (No sessions yet)     │           │
│ └───────────────────────┘  └───────────────────────┘           │
└────────────────────────────────────────────────────────────────┘
```

**Grid layout:** 2 columns on desktop, 1 on mobile. Cards are clickable (navigate to class detail).

**Create Class modal** (triggered by "+ Create Class" button):
- Slides in from right as a side panel (not a centered modal — feels smoother)
- Fields: Class Name (text input)
- "Create" button at bottom
- Panel closes with slide-out animation on success

---

#### Page 5: Class Detail (`/classes/:id`)

```
┌────────────────────────────────────────────────────────────────┐
│ ← Back to Classes                                              │
│ TY-CS-A · Third Year CS - Div A                               │
│ ──────────────────────────────────────────────────────────────  │
│                                                                 │
│ ┌─── Tabs ───────────────────────────────────────────────────┐ │
│ │ [Students (45)]  [Sessions (12)]  [Upload Roster]          │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ─── Students Tab (default) ─────────────────────────────────── │
│                                                                 │
│  🔍 Search students...                                         │
│                                                                 │
│ ┌──────┬────────────────────────┐                              │
│ │ Roll │ Name                   │                              │
│ ├──────┼────────────────────────┤                              │
│ │  1   │ Aman Sharma            │                              │
│ │  2   │ Priya Desai            │                              │
│ │  3   │ Raj Patel              │                              │
│ │  4   │ Sneha Kulkarni         │                              │
│ │ ...  │ ...                    │                              │
│ │ 45   │ Zara Khan              │                              │
│ └──────┴────────────────────────┘                              │
│                                                                 │
│ ─── Sessions Tab ──────────────────────────────────────────── │
│ (List of past sessions for this class, clickable)             │
│                                                                 │
│ ─── Upload Roster Tab ─────────────────────────────────────── │
│ (CSV upload area — see section below)                         │
└────────────────────────────────────────────────────────────────┘
```

**Tab underline animation:** Active tab has a bottom border (primary-500, 2px) that slides smoothly to the selected tab position using `transform: translateX()`.

---

#### Page 6: Roster Upload (`/classes/:id/roster`)

Accessible from the "Upload Roster" tab in Class Detail.

```
┌────────────────────────────────────────────────────────────────┐
│ Upload Class Roster                                            │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │                                                            │ │
│ │        ☁ Drag & drop your CSV file here                  │ │
│ │           or click to browse                              │ │
│ │                                                            │ │
│ │        Accepted format: .csv with columns                 │ │
│ │        roll_no, name                                      │ │
│ │                                                            │ │
│ └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  After file is selected:                                       │
│                                                                 │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │  📄 roster_ty_cs_a.csv                     ✕ Remove       │ │
│ │  Preview: 45 rows detected                                │ │
│ │                                                            │ │
│ │  ┌──────┬────────────────────┬────────┐                   │ │
│ │  │ Row  │ Roll No │ Name            │ Status │             │ │
│ │  ├──────┼─────────┼─────────────────┼────────┤             │ │
│ │  │  1   │ 1       │ Aman Sharma     │ ✅ OK  │             │ │
│ │  │  2   │ 2       │ Priya Desai     │ ✅ OK  │             │ │
│ │  │  3   │         │ (missing)       │ ⚠ Error│             │ │
│ │  │  4   │ 3       │ Raj Patel       │ ✅ OK  │             │ │
│ │  └──────┴─────────┴─────────────────┴────────┘             │ │
│ │                                                            │ │
│ │  43 valid · 2 errors (will be skipped)                    │ │
│ │                                                            │ │
│ │  [ Upload 43 Students ]                                   │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Details:**
- Drag-and-drop zone with dashed border, changes to primary-100 background on drag-over
- File preview table shows parsed rows with validation status per row
- Error rows highlighted in red-50 background
- Upload button shows count of valid rows
- Success: animated checkmark + redirect to class detail (Students tab)

---

#### Page 7: Create Session (`/sessions/new`)

```
┌────────────────────────────────────────────────────────────────┐
│ Start New Session                                              │
│ ──────────────────────────────────────────────────────────────  │
│                                                                 │
│  Select Class                                                  │
│  ┌────────────────────────────────────────────┐                │
│  │ ▼ TY-CS-A (45 students)                   │                │
│  └────────────────────────────────────────────┘                │
│                                                                 │
│  Session Title                                                 │
│  ┌────────────────────────────────────────────┐                │
│  │ DOM Practical 05                           │                │
│  └────────────────────────────────────────────┘                │
│                                                                 │
│  [ Create Session & Get Code ]                                 │
│                                                                 │
│  ─── After creation ─────────────────────────────────────────  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                                                            ││
│  │     Session Code (share with students):                   ││
│  │                                                            ││
│  │           ┌─────────────────────────┐                     ││
│  │           │      X 7 K 2 M 9       │  ← Monospace, large ││
│  │           └─────────────────────────┘     typewriter anim ││
│  │                                                            ││
│  │     [ 📋 Copy Code ]  [ 📱 Show QR ]                     ││
│  │                                                            ││
│  │     URL: codetrack.app/join/X7K2M9                        ││
│  │                                                            ││
│  │     👥 0 / 45 students joined                             ││
│  │        (updates live as students join)                     ││
│  │                                                            ││
│  │     [ Open Session Dashboard → ]                          ││
│  │                                                            ││
│  └────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

**Session code display:**
- Monospace font (`JetBrains Mono`), 40px, letter-spacing 8px
- Typewriter animation: each character appears one-by-one with a subtle scale-in
- "Copy Code" button: on click, shows a brief "Copied ✓" tooltip that fades out
- QR code: modal overlay with large QR centered, optimized for projection
- Student count updates live via Socket.IO

---

#### Page 8: Active Session (`/sessions/:id`) — THE CORE PAGE

This is the most complex and important page. It has **three panels:**

```
┌─ Sidebar ─┐┌────────────────────────────────────────────────────────────────┐
│            ││ DOM Practical 05 · TY-CS-A      🟢 Live    [ End Session ⏹ ] │
│            ││ Code: X7K2M9 · 32/45 joined                                  │
│            ││ ─────────────────────────────────────────────────────────────  │
│            ││                                                                │
│            ││ ┌─ TASK PANEL ──────────────────────────────────────────────┐ │
│            ││ │                                                          │ │
│            ││ │ Tasks                                  [ + Add Task ]    │ │
│            ││ │                                                          │ │
│            ││ │  ┌─ Task 1 ────────────────────────────────────────────┐ │ │
│            ││ │  │ Create a basic HTML page                            │ │ │
│            ││ │  │ ██████████████████████████████░░░░░░  28/32 (88%)  │ │ │
│            ││ │  │ ✅ 28 Done  🔄 2 Working  ⚠ 1 Issue  ⬜ 1 N/S    │ │ │
│            ││ │  └────────────────────────────────────────────────────┘ │ │
│            ││ │  ┌─ Task 2 ────────────────────────────────────────────┐ │ │
│            ││ │  │ Add CSS styling                                     │ │ │
│            ││ │  │ ██████████████░░░░░░░░░░░░░░░░░░░░░  12/32 (38%)  │ │ │
│            ││ │  │ ✅ 12 Done  🔄 14 Working  ⚠ 3 Issues  ⬜ 3 N/S  │ │ │
│            ││ │  └────────────────────────────────────────────────────┘ │ │
│            ││ │  ┌─ Task 3 ────────────────────────────────────────────┐ │ │
│            ││ │  │ Make it responsive                    🆕 Just added│ │ │
│            ││ │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/32  (0%)  │ │ │
│            ││ │  │ ✅ 0 Done  🔄 0 Working  ⚠ 0 Issues  ⬜ 32 N/S   │ │ │
│            ││ │  └────────────────────────────────────────────────────┘ │ │
│            ││ │                                                          │ │
│            ││ └──────────────────────────────────────────────────────────┘ │
│            ││                                                                │
│            ││ ┌─ STATUS GRID ─────────────────────────────────────────────┐ │
│            ││ │                                                           │ │
│            ││ │ Student Status Grid              🔍 Search  📥 Export CSV│ │
│            ││ │                                                           │ │
│            ││ │ ┌──────┬──────────────┬─────────┬─────────┬────────────┐ │ │
│            ││ │ │ Roll │ Name         │ Task 1  │ Task 2  │ Task 3     │ │ │
│            ││ │ ├──────┼──────────────┼─────────┼─────────┼────────────┤ │ │
│            ││ │ │  1   │ Aman Sharma  │ ✅ Done │ 🔄 Work │ ⬜ N/S     │ │ │
│            ││ │ │  2   │ Priya Desai  │ ✅ Done │ ⚠ Issue│ ⬜ N/S     │ │ │
│            ││ │ │  3   │ Raj Patel    │ ✅ Done │ ✅ Done │ 🔄 Work    │ │ │
│            ││ │ │  4   │ Sneha K.     │ ⚠ Issue│ ⬜ N/S  │ ⬜ N/S     │ │ │
│            ││ │ │ ...  │ ...          │ ...     │ ...     │ ...        │ │ │
│            ││ │ └──────┴──────────────┴─────────┴─────────┴────────────┘ │ │
│            ││ │                                                           │ │
│            ││ └───────────────────────────────────────────────────────────┘ │
│            ││                                                                │
│            ││ ┌─ ISSUE ALERTS PANEL ──────────────────────────────────────┐ │
│            ││ │                                                           │ │
│            ││ │ 🔔 Issues (4)                               Clear All   │ │
│            ││ │                                                           │ │
│            ││ │ ┌─────────────────────────────────────────────────────┐  │ │
│            ││ │ │ 🔴 Roll 22 · Priya Desai                          │  │ │
│            ││ │ │    Task 2: "flexbox items not centering"           │  │ │
│            ││ │ │    2 minutes ago                     [ Resolved ✓ ]│  │ │
│            ││ │ ├─────────────────────────────────────────────────────┤  │ │
│            ││ │ │ 🔴 Roll 4 · Sneha Kulkarni                        │  │ │
│            ││ │ │    Task 1: "img tag not loading file"              │  │ │
│            ││ │ │    5 minutes ago                     [ Resolved ✓ ]│  │ │
│            ││ │ └─────────────────────────────────────────────────────┘  │ │
│            ││ │                                                           │ │
│            ││ └───────────────────────────────────────────────────────────┘ │
│            ││                                                                │
└────────────┘└────────────────────────────────────────────────────────────────┘
```

**Three panels explained:**

| Panel | Purpose | Updates |
|-------|---------|---------|
| **Task Panel** (top) | Shows all tasks with per-task progress bars and mini stat counts | Real-time: progress bars animate on every status-update |
| **Status Grid** (middle) | Full student × task matrix — every cell is a status indicator | Real-time: cells flash/pulse when status changes |
| **Issue Alerts** (bottom) | Dedicated issue feed with student name, roll, issue text, timestamp | Real-time: new issues slide in from right with spring animation |

**Status cell colors in the grid:**

| Status | Cell Background | Icon | Text |
|--------|----------------|------|------|
| NOT_STARTED | `neutral-100` | `⬜` (gray circle) | "N/S" |
| IN_PROGRESS | `warning-50` | `🔄` (amber loader) | "Working" |
| DONE | `success-50` | `✅` (green check) | "Done" |
| ISSUE | `danger-50` | `⚠` (red alert) | "Issue" |

**"Add Task" modal:** Quick inline input at the top of the task panel — click "+ Add Task", a text field appears with smooth expand animation, type title, press Enter or click "Add". Field collapses back. No heavy modal.

**"End Session" confirmation:** A dialog with "Are you sure? This will freeze all statuses." Two buttons: "Cancel" (ghost) and "End Session" (danger-500 background). Destructive action styling.

---

#### Page 9: Session Summary (`/sessions/:id/summary`)

```
┌────────────────────────────────────────────────────────────────┐
│ Session Summary                                                │
│ DOM Practical 05 · TY-CS-A · Sep 22, 2026                     │
│ Duration: 1h 23m · 32/45 students participated                │
│ ──────────────────────────────────────────────────────────────  │
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 3 Tasks  │ │ 82% Avg  │ │ 7 Issues │ │ 32/45    │           │
│ │ Created  │ │ Complete │ │ Reported │ │ Joined   │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│ Per-Task Breakdown                                             │
│ ┌────────┬────────┬──────────┬──────────┬────────┐            │
│ │ Task   │ Title  │ Done     │ Issues   │ Avg    │            │
│ ├────────┼────────┼──────────┼──────────┼────────┤            │
│ │ 1      │ HTML   │ 28 (88%)│ 1        │ 12min  │            │
│ │ 2      │ CSS    │ 24 (75%)│ 3        │ 18min  │            │
│ │ 3      │ Resp.  │ 18 (56%)│ 3        │ —      │            │
│ └────────┴────────┴──────────┴──────────┴────────┘            │
│                                                                 │
│ Full Status Report                                 [ 📥 CSV ] │
│ (Same grid as active session, but frozen/read-only)           │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Professor Dashboard — File Structure

```
dashboard/
├── public/
│   └── favicon.svg
│
├── src/
│   ├── main.tsx                       ← React root entry
│   ├── App.tsx                        ← Router setup, layout wrapper
│   │
│   ├── styles/
│   │   ├── index.css                  ← CSS reset + design tokens (all custom properties)
│   │   ├── animations.css             ← Keyframe definitions (pulse, slide, shimmer, spring)
│   │   └── utilities.css              ← Utility classes (spacing, text, flex, grid)
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx             ← Centered card layout for login/register
│   │   ├── AuthLayout.css
│   │   ├── DashboardLayout.tsx        ← Sidebar + top bar + content area
│   │   └── DashboardLayout.css
│   │
│   ├── pages/
│   │   ├── Login/
│   │   │   ├── LoginPage.tsx
│   │   │   └── LoginPage.css
│   │   ├── Register/
│   │   │   ├── RegisterPage.tsx
│   │   │   └── RegisterPage.css
│   │   ├── Home/
│   │   │   ├── HomePage.tsx           ← Dashboard overview
│   │   │   ├── HomePage.css
│   │   │   ├── StatCard.tsx
│   │   │   ├── ActiveSessionCard.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── Classes/
│   │   │   ├── ClassesListPage.tsx
│   │   │   ├── ClassesListPage.css
│   │   │   ├── ClassDetailPage.tsx
│   │   │   ├── ClassDetailPage.css
│   │   │   ├── ClassCard.tsx
│   │   │   ├── StudentTable.tsx
│   │   │   └── RosterUpload.tsx
│   │   ├── Sessions/
│   │   │   ├── CreateSessionPage.tsx
│   │   │   ├── CreateSessionPage.css
│   │   │   ├── SessionCodeDisplay.tsx ← Typewriter animation component
│   │   │   ├── ActiveSessionPage.tsx  ← THE CORE PAGE
│   │   │   ├── ActiveSessionPage.css
│   │   │   ├── TaskPanel.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── StatusGrid.tsx
│   │   │   ├── StatusCell.tsx
│   │   │   ├── IssueAlertPanel.tsx
│   │   │   ├── IssueCard.tsx
│   │   │   ├── AddTaskInput.tsx
│   │   │   ├── SessionSummaryPage.tsx
│   │   │   └── SessionSummaryPage.css
│   │   ├── History/
│   │   │   ├── HistoryPage.tsx        ← P3
│   │   │   └── HistoryPage.css
│   │   └── Analytics/
│   │       ├── AnalyticsPage.tsx      ← P3
│   │       └── AnalyticsPage.css
│   │
│   ├── components/
│   │   ├── ui/                        ← Reusable design system components
│   │   │   ├── Button.tsx
│   │   │   ├── Button.css
│   │   │   ├── Input.tsx
│   │   │   ├── Input.css
│   │   │   ├── Badge.tsx              ← Status badges (Done, Issue, etc.)
│   │   │   ├── Badge.css
│   │   │   ├── Card.tsx
│   │   │   ├── Card.css
│   │   │   ├── Modal.tsx
│   │   │   ├── Modal.css
│   │   │   ├── Tabs.tsx
│   │   │   ├── Tabs.css
│   │   │   ├── Table.tsx
│   │   │   ├── Table.css
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── ProgressBar.css
│   │   │   ├── Toast.tsx             ← Notification toasts
│   │   │   ├── Toast.css
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Dropdown.css
│   │   │   ├── Skeleton.tsx          ← Loading skeletons
│   │   │   ├── Skeleton.css
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── ConfirmDialog.css
│   │   │
│   │   ├── Sidebar.tsx
│   │   ├── Sidebar.css
│   │   ├── TopBar.tsx
│   │   ├── TopBar.css
│   │   ├── Breadcrumb.tsx
│   │   ├── ConnectionIndicator.tsx    ← Green/amber/red dot
│   │   ├── QRCodeModal.tsx
│   │   └── EmptyState.tsx            ← "No classes yet" / "No sessions" illustrations
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                 ← JWT token management, login/logout
│   │   ├── useSocket.ts              ← Socket.IO connection lifecycle
│   │   ├── useSession.ts             ← Active session data + real-time updates
│   │   ├── useClasses.ts             ← Fetch/cache class list
│   │   └── useToast.ts              ← Toast notification queue
│   │
│   ├── services/
│   │   ├── api.ts                     ← Axios/fetch instance with JWT interceptor
│   │   ├── authService.ts            ← login(), register(), getProfile()
│   │   ├── classService.ts           ← createClass(), getClasses(), uploadRoster()
│   │   ├── sessionService.ts         ← createSession(), endSession(), getStatus()
│   │   ├── taskService.ts            ← addTask(), removeTask()
│   │   └── socketService.ts          ← Socket.IO client init, event listeners, reconnect
│   │
│   ├── context/
│   │   ├── AuthContext.tsx            ← Professor auth state (logged in user, token)
│   │   └── SocketContext.tsx          ← Socket.IO instance, connection state
│   │
│   ├── router/
│   │   ├── routes.tsx                 ← Route definitions with lazy loading
│   │   └── ProtectedRoute.tsx         ← Redirects to /login if not authenticated
│   │
│   └── utils/
│       ├── formatters.ts              ← Date formatting, percentage display, truncation
│       ├── constants.ts               ← Status colors, status labels, status icons
│       └── sounds.ts                  ← Audio notifications (issue alert ping)
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 6. Student Widget — Complete Design

### 6.1 Design Philosophy

> **Invisible until needed. Instant to load. Impossible to confuse.** The widget must feel like a native OS notification panel, not a web application. It should never compete with the student's primary workspace.

---

### 6.2 Three States

#### State 1: Join Screen (full page, temporary)

The student opens the CodeTrack URL. This is the only time they see a full page.

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    ┌─────────────────────────┐                 │
│                    │                         │                 │
│                    │    ⚡ CodeTrack          │                 │
│                    │                         │                 │
│                    │  Enter Session Code     │                 │
│                    │  ┌───┬───┬───┬───┬───┬───┐              │
│                    │  │ X │ 7 │ K │ 2 │ M │ 9 │  ← 6 boxes  │
│                    │  └───┴───┴───┴───┴───┴───┘              │
│                    │                         │                 │
│                    │  Your Roll Number       │                 │
│                    │  ┌───────────────────┐  │                 │
│                    │  │ 15                │  │                 │
│                    │  └───────────────────┘  │                 │
│                    │                         │                 │
│                    │  [ Join Session → ]     │                 │
│                    │                         │                 │
│                    │  Error messages here    │                 │
│                    │                         │                 │
│                    └─────────────────────────┘                 │
│                                                                 │
│      Subtle dark background with gradient                      │
└────────────────────────────────────────────────────────────────┘
```

**Details:**
- Session code input: 6 individual character boxes, auto-advance on type, auto-uppercase
- Each box has a subtle pop animation when a character is entered
- Roll number: simple text input
- "Join Session" button: primary-500, 44px height, full-width
- Error state: red text below the button ("Invalid code" / "Roll number not found")
- On success: page transforms into the floating widget (smooth transition — the card shrinks and moves to the corner)

---

#### State 2: Collapsed Widget (default after joining)

```
Student's full screen (coding, browser, IDE):

                                              ┌──────┐
                                              │  CT  │
                                              │  🔴  │ ← notification dot
                                              └──────┘
```

- **Size:** 48×48px rounded square
- **Position:** Bottom-right corner by default (draggable to any corner)
- **Background:** `neutral-800` at 95% opacity (dark, glassy)
- **Text:** "CT" in white, Inter 600
- **Notification dot:** 10px red circle with slow pulse animation when there's a new task
- **Hover:** Slight scale (1.05) + shadow increase
- **Click:** Expands to full widget (spring animation, 400ms)

---

#### State 3: Expanded Widget

```
                                    ┌─────────────────────────┐
                                    │ CodeTrack   ━  ✕        │
                                    │─────────────────────────│
                                    │ DOM Practical 05        │
                                    │ Session: X7K2M9         │
                                    │                         │
                                    │ ┌─────────────────────┐ │
                                    │ │ ✅ 1. HTML Page     │ │
                                    │ └─────────────────────┘ │
                                    │ ┌─────────────────────┐ │
                                    │ │ 🔄 2. CSS Styling   │ │  ← selected
                                    │ │                     │ │
                                    │ │  ○ Not Started      │ │
                                    │ │  ● In Progress      │ │  ← current
                                    │ │  ○ Done ✓           │ │
                                    │ │  ○ Issue ⚠          │ │
                                    │ │                     │ │
                                    │ └─────────────────────┘ │
                                    │ ┌─────────────────────┐ │
                                    │ │ 🆕 3. Responsive    │ │  ← NEW badge
                                    │ └─────────────────────┘ │
                                    │                         │
                                    │ 🟢 Connected            │
                                    └─────────────────────────┘
```

- **Size:** 260px wide × auto height (max 420px, scrollable if more tasks)
- **Position:** Same corner as collapsed state
- **Background:** `neutral-800` with backdrop blur (glassmorphism), 96% opacity
- **Text color:** White / `neutral-200` (light-on-dark)
- **Title bar:** "CodeTrack" + minimize button (━) + close/collapse button (✕)
- **Task list:** Each task is a compact row. Click to expand and show status radio buttons
- **Status radio buttons:** Styled as pill-shaped options with status-colored left border
- **Issue flow:** When "Issue ⚠" is selected, a text area slides open below it

**Issue text area (within expanded task):**
```
                                    │ │  ● Issue ⚠          │ │
                                    │ │                     │ │
                                    │ │  ┌─────────────────┐│ │
                                    │ │  │ Describe your   ││ │
                                    │ │  │ problem...      ││ │
                                    │ │  └─────────────────┘│ │
                                    │ │  [ Submit Issue ]   │ │
```

**NEW task notification animation:**
- When a new task arrives via Socket.IO:
  1. If collapsed: red notification dot pulses
  2. If expanded: new task row slides in at the bottom with spring animation + 🆕 badge
  3. Brief subtle vibration/shake of the widget border (10ms, 2px displacement)
  4. 🆕 badge fades out after 10 seconds

---

### 6.3 Student Widget — File Structure

```
public/                                ← Served as static files by Express
├── index.html                         ← Single page: join screen + widget
├── style.css                          ← All styles: join screen, widget states, animations
└── app.js                             ← All logic: API calls, Socket.IO, UI state, drag
```

### 6.4 `index.html` Structure
- `<div id="join-screen">` — The full-page join form
- `<div id="widget-collapsed">` — The 48×48 floating icon
- `<div id="widget-expanded">` — The full widget panel
- Socket.IO client loaded via CDN (`<script src="/socket.io/socket.io.js">`)

### 6.5 `style.css` Sections
1. **CSS Variables** — Widget-specific dark theme tokens
2. **Join Screen** — Centered card, gradient background, input boxes
3. **Widget Common** — Fixed positioning, z-index (9999), border-radius
4. **Collapsed State** — 48×48, rounded, dark background, notification dot
5. **Expanded State** — 260px wide panel, glassmorphism, task list
6. **Task Items** — Compact rows, status indicators, expand/collapse
7. **Status Radio Buttons** — Pill-shaped, color-coded borders
8. **Issue Text Area** — Slide-open animation, dark-themed textarea
9. **Animations** — `@keyframes` for pulse, slide-in, spring-pop, shake, shimmer
10. **Drag** — `cursor: grab`, `cursor: grabbing`, prevent text selection during drag
11. **Responsive** — Slightly smaller widget on screens < 360px wide

### 6.6 `app.js` Sections
1. **State Management** — Simple object: `{ isExpanded, tasks[], sessionInfo, selectedTask, connectionStatus }`
2. **API Module** — `fetch()` wrappers: `joinSession()`, `submitResponse()`
3. **Socket Module** — Connect, listen for `new-task`, `session-ended`, `task-removed`, reconnect logic
4. **UI Module** — DOM manipulation: render task list, update status indicators, show/hide panels
5. **Drag Module** — Mouse/touch event handlers for dragging the widget
6. **Notification Module** — Badge dot management, 🆕 badge lifecycle
7. **Join Flow** — Form validation, API call, transition from join screen to widget

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|-----------|-------|----------------|
| **Desktop** | ≥1280px | Sidebar expanded (240px) + full content. Status grid shows all columns |
| **Laptop** | 1024–1279px | Sidebar expanded but narrower (200px). Grid may horizontally scroll |
| **Tablet** | 768–1023px | Sidebar collapsed to icons (64px). Top bar gets hamburger menu. Single-column page layouts |
| **Mobile** | <768px | Sidebar hidden (hamburger overlay). Cards stack vertically. Status grid becomes a card-per-student view instead of a table |

---

## 8. Accessibility Considerations

| Area | Approach |
|------|----------|
| **Keyboard navigation** | All interactive elements focusable via Tab. Status radio buttons navigable with arrow keys |
| **Focus indicators** | Visible glow rings on all focusable elements (never `outline: none` without replacement) |
| **Color contrast** | All text meets WCAG AA (4.5:1 for body, 3:1 for large text). Status colors are paired with icons, never color-alone |
| **Screen readers** | ARIA labels on icon-only buttons, status cells have `aria-label="Task 1: Done"`, live regions for real-time updates |
| **Reduced motion** | `@media (prefers-reduced-motion: reduce)` — all animations become instant transitions |
| **Font scaling** | All sizes in rem/em. Layout doesn't break at 150% browser zoom |

---

## 9. Performance Targets

| Metric | Target |
|--------|--------|
| **Student widget initial load** | < 50KB total (HTML + CSS + JS + Socket.IO client) |
| **Professor dashboard initial load** | < 300KB (code-split, lazy routes) |
| **Time to interactive (widget)** | < 1 second |
| **Time to interactive (dashboard)** | < 2 seconds |
| **Socket.IO event → UI update** | < 100ms |
| **Status grid render (50 students × 5 tasks)** | < 16ms (60fps) |
