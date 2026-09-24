# CodeTrack — Lab IT (1 page)

## Install (Windows images)

| Machine | Installer |
|---------|-----------|
| Student PCs | `CodeTrack-Student-Setup.exe` |
| Professor laptops | `CodeTrack-LabMonitor-Setup.exe` |

Build: `cd companion && npm run dist:all` → copy into `server/public/downloads/`.

## Configure once per image

Set env **or** ship `lab-config.json`:

- `CODETRACK_API_URL` = `https://your-host/api`
- `CODETRACK_SOCKET_URL` = `https://your-host`
- `CODETRACK_DASHBOARD_URL` = `https://dashboard-host`

Do **not** deploy the unlocked dual-role companion on lab images.

## Hosting checklist

- [ ] API + Socket over **HTTPS**
- [ ] `CORS_ORIGIN` = real dashboard (+ any companion origins); no `*` in production
- [ ] Optional: `REQUIRE_HTTPS=true` behind TLS-terminating proxy
- [ ] `/join` for phones; `/download` for installers; QR → `/open?code=`
- [ ] Seed/demo passwords removed from production

## Policy

- Lab PCs: Companion only (no bookmark to `/join`).
- Phones: `/join` PWA (“Add to Home Screen”).
- Full docs: [`Lab_Image_Install.md`](./Lab_Image_Install.md), [`Production_Credit_Checklist.md`](./Production_Credit_Checklist.md).
