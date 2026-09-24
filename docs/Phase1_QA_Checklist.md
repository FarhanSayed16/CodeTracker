# Phase 1 QA checklist (manual)

Run with API + dashboard + companion. **Do not** leave `http://localhost:3000/join` open on the student machine while testing the companion.

## Setup
1. Restart API (`cd server && npm run dev`) after pulling Phase 1 changes.
2. Dashboard: `cd dashboard && npm run dev` → create/start an ACTIVE session, note code.
3. Companion: `cd companion && npm run dev` (or Windows installer).

## Student path
- [ ] Open companion → Student → enter **full** session code → type 2+ letters → results appear (Searching…).
- [ ] PIN join succeeds; tasks list loads.
- [ ] Banner: dismissible “close /join” warning shows once.
- [ ] Status → Working / Done / Need help; Done shows grace countdown.
- [ ] Collapse ball still shows connection; expand still has tasks.
- [ ] Refresh / restart companion → restore returns to same session while ACTIVE.

## Professor path
- [ ] Companion → Professor → login → attach ACTIVE session.
- [ ] Student status change updates counts ≤ ~2s.
- [ ] New issue appears in list (+ optional sound unless muted).
- [ ] Add task from **dashboard** → student companion gets new task; professor counts refresh.
- [ ] “Open dashboard” opens browser.

## Routing / no dual UI
- [ ] `http://localhost:3000/` redirects to `/join`.
- [ ] `http://localhost:3000/?code=XXXXXX` redirects to `/join?code=XXXXXX`.
- [ ] `/join` shows lab banner about Companion.
- [ ] QR from dashboard encodes `/join?code=…`.

## Negative
- [ ] With companion student joined, closing `/join` if it was open does not break companion.
- [ ] Config → Reset to defaults recovers after bad API URL.
