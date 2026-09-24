# Student Enrollment & Join Flow — Improvement Plan

> [!IMPORTANT]
> This plan addresses critical usability, security, and scalability issues with how students are enrolled and how they join sessions. It covers **bulk import, smart auto-suggest join, 4-digit PIN security, and cross-class/department support**.

---

## Problem Analysis

After reviewing the attendance sheet (`Attendance Sheet for MCA I Sem. 2026-28 Batch dated 17-9-2026.xlsx`) and the current codebase, here are the identified issues:

### Current Pain Points
| # | Problem | Impact |
|---|---------|--------|
| 1 | Professors must manually add each student one-by-one | **High** — 61 students = 61 manual entries |
| 2 | Students must type their exact Roll Number to join | **High** — `17030926044` is 11 digits, easy to mistype |
| 3 | Students are scoped to a single class (`classId + rollNo` unique) | **High** — A student can't join sessions across different professors/subjects |
| 4 | No security on student join — anyone with a roll number can impersonate | **Critical** — No authentication at all |
| 5 | No name autocomplete/suggestions during join | **Medium** — Students have to remember exact roll numbers |
| 6 | No Excel/CSV bulk import for professors | **High** — Completely manual process |
| 7 | Different years/departments/divisions cannot share a student pool | **High** — Every professor re-enters the same students |

### Data Structure from Excel
```
S.No | Somaiya Member ID | Roll No.        | Name of Students
1    | 1720260947        | 17030926001     | Bharmal Zainab Huzefa
2    | 1720260944        | 17030926002     | Bhide Omkar Vinod
...
44   | 1720261116        | 17030926044     | Sayed Farhan Faizan
...
61   | 1720251596        | 17030926061     | Shinde Sahil Babasaheb
```

Key observations:
- Roll numbers follow pattern: `1703` (branch) + `0926` (year) + `001-061` (serial)
- Member IDs are institution-level unique identifiers
- Names are in "Lastname Firstname Middlename" format

---

## Solution Architecture

### Phase A: Database Schema Changes

#### A1. Create a Global Student Registry
Global `Student` pool + `ClassEnrollment` many-to-many. Roll numbers are institution-wide unique; optional `membershipId`.

#### A2. Add 4-Digit PIN to Students
- `pinHash` (argon2), `pinAttempts`, `pinLockedAt`
- First join creates PIN when `REQUIRE_STUDENT_PIN=true` (default)
- Professor can reset PIN from class roster

---

### Phase B: Bulk Import (Excel/CSV Upload)

#### B1. Backend
- `POST /api/classes/:id/import` and `/import/preview`
- Fuzzy column detection (Roll / Name / Member)
- Upsert into global pool + enroll; honest `created` / `linked` / `alreadyEnrolled` counters

#### B2. Dashboard
- Drag-and-drop upload, preview table, confirm import
- Manual add + search institution pool to enroll

---

### Phase C: Smart Student Join Flow

1. Session code → 2. Name / partial roll search (masked rolls, max 5) → 3. PIN create/verify

---

### Phase D: Security

- PIN hashed; 3 attempts → 30s lockout (lockout expiry resets attempt counter correctly)
- `REQUIRE_STUDENT_PIN` env toggle
- `pinHash` never returned to clients

---

### Phase E: Cross-Class Support

Session → Class → ClassEnrollments → global Student. Same student can be enrolled in multiple classes.

---

## Implementation Tasks

### Task 1: Schema Migration
- [x] Update `schema.prisma` with global `Student` + `ClassEnrollment`
- [x] Migration `20260924120000_global_student_enrollment`
- [x] Seed uses enrollments (no `classId` on Student)

### Task 2: Bulk Import Backend
- [x] `multer` + `xlsx`
- [x] `POST /api/classes/:id/import` (+ preview)
- [x] Auto-detect columns; create or link; normalize Excel numbers
- [x] Return `{ created, linked, alreadyEnrolled, skipped, errors }`

### Task 3: Bulk Import Dashboard UI
- [x] Import on ClassDetailPage with drag-and-drop (`RosterUpload`)
- [x] Preview before confirm
- [x] Import result summary

### Task 4: Student Search/Autocomplete API
- [x] `GET /api/sessions/:code/students?q=`
- [x] Fuzzy name + trailing roll digits
- [x] Top 5 with **masked** roll numbers

### Task 5: PIN System Backend
- [x] Argon2 hash/verify on join
- [x] First-time PIN required when `REQUIRE_STUDENT_PIN=true`
- [x] `POST /api/classes/:id/students/:studentId/reset-pin`
- [x] Rate limit 3 tries → 30s lockout

### Task 6: Student Widget UX Overhaul
- [x] Search autocomplete + PIN step
- [x] XSS-safe DOM (no `innerHTML` for names)
- [x] Loading / error handling

### Task 7: Professor Dashboard — Student Management
- [x] PIN status + Reset PIN
- [x] Enrollment count (classes)
- [x] Unenroll / manual add / pool search enroll

### Task 8: Testing & Edge Cases
- [x] Jest: pinHash leak guard, masked search, PIN set/verify/require
- [x] Integration script updated for search + PIN join
- [ ] Manual: bulk import with live Excel attendance sheet (run locally)

---

## Edge Cases & Broader Issues Addressed

| Scenario | Solution |
|----------|----------|
| Student transfers mid-semester | Global pool — enroll in new class |
| 200+ students | Bulk Excel import with preview |
| Forgot PIN | Professor reset |
| Impersonation | PIN required server-side |
| Type "farhan" / "44" | Autocomplete + trailing match |
| Same student, 3 professors | One Student, N ClassEnrollments |
| Excel column name variants | Fuzzy header detection |
| Re-import same sheet | `alreadyEnrolled` + name refresh |

---

> [!TIP]
> **Env:** set `REQUIRE_STUDENT_PIN=false` only for demos that intentionally skip student PINs.
> After pulling: `npx prisma migrate deploy` (or `migrate reset` + `db seed` on local SQLite).
