# Phase 3 E2E lab rehearsal checklist

Run once on a **clean Windows lab image** (or VM) against your hosted API.

## Install
- [ ] Build: `cd companion && npm run dist:all`
- [ ] Copy installers to `server/public/downloads/` as `CodeTrack-Student-Setup.exe` and `CodeTrack-LabMonitor-Setup.exe`
- [ ] Optional: edit `lab-config.json` before packaging, or place next to the installed `.exe`, with production `apiUrl` / `socketUrl` / `dashboardUrl` / `updateUrl`
- [ ] Install **Student** on a student PC; **Lab Monitor** on professor laptop
- [ ] Confirm Start Menu + Desktop shortcuts exist; icon is CodeTrack green ball

## Deep link / QR
- [ ] From dashboard, open QR → URL is `/open?code=XXXX`
- [ ] On a PC with Student installed, QR / `/open?code=` opens companion with code filled
- [ ] Fallback: “Continue in browser” goes to `/join?code=`

## Live lab (minimum 30–60 min; prefer ~3h if possible)
- [ ] Professor creates session + tasks on **web dashboard**
- [ ] Lab Monitor attaches ACTIVE session; counts update when students change status ≤ 2s
- [ ] Student joins via Quickball only (no `/join` tab)
- [ ] Collapse ball → tray still running; Show from tray restores window
- [ ] Close (X) hides to tray; Quit only from tray menu
- [ ] Toggle **Start with Windows** in Settings or tray; reboot → app starts
- [ ] Kill Wi‑Fi 30s → reconnect → Live restores; status still works
- [ ] Reboot mid-lab → Student restore returns to same session while ACTIVE

## Updates (if `updateUrl` configured)
- [ ] Publish `latest.yml` + installer to the feed URL
- [ ] Settings → Check for updates → Download → Install & restart

## Signing
- [ ] Installer is signed (or IT exception documented) — see [`Windows_Code_Signing.md`](./Windows_Code_Signing.md)

## Pass criteria
Fresh Windows PC → install role-locked app → connect to hosted API → full lab **without** opening `:3000` widget or `:5174` in a browser.
