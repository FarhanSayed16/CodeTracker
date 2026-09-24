# Production-credit acceptance checklist

Use this gate before handing CodeTrack to a real class. Check each box after a live rehearsal.

## Sync & correctness

- [ ] One ACTIVE session; student status on Quickball updates professor Quickball counts ≤ 2s
- [ ] Same update appears on dashboard grid
- [ ] New task from dashboard appears on student Quickball without refresh
- [ ] Session end disables student controls and clears professor live attach
- [ ] Student restore after PC reboot mid-lab works while session ACTIVE
- [ ] PIN wrong / lockout messages clear; no double-join needed
- [ ] Second device join disconnects the first (`session-taken-over`)

## UX / roles

- [ ] Student installer: **no** professor login, **no** role picker
- [ ] Professor installer: **no** student join flow
- [ ] Lab docs never tell students to open `/join` on lab PCs if Companion is installed
- [ ] Settings pre-filled via env / `lab-config.json` on lab images
- [ ] Phone: `/join` works; **Add to Home Screen** installs PWA

## Install & ops

- [ ] Windows installer runs on clean Win10/11 lab image
- [ ] API URL points at production host (**HTTPS**)
- [ ] Auto-start (Start with Windows) optional works
- [ ] Update path documented or auto-update works (`updateUrl`)
- [ ] `/download` links correct Student + Lab Monitor builds

## Security / hosting

- [ ] HTTPS everywhere in production
- [ ] CORS limited to real dashboard (+ companion) origins — not `*`
- [ ] `/join` vs dashboard routes do not clash
- [ ] Seed/demo passwords not used in production
- [ ] `REQUIRE_HTTPS=true` considered behind reverse proxy

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| Lab IT | | |
| Course instructor | | |

**Related:** [`Phase3_E2E_Lab_Checklist.md`](./Phase3_E2E_Lab_Checklist.md) · [`Manual_Lab_IT.md`](./Manual_Lab_IT.md)
