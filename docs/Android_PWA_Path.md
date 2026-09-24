# Android / TWA optional path (after PWA)

**Android v1 for CodeTrack is the `/join` Progressive Web App** — no Play Store required.

Students can:

1. Open `https://your-host/join` (or QR `/open?code=`).
2. Chrome → menu → **Install app** / **Add to Home Screen**.

## When to wrap as TWA / Play Store

Only if the institution **requires** a Play Store listing:

1. Confirm PWA install + offline shell work on campus Android devices.
2. Use [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) or Android Studio **Trusted Web Activity** pointing at `https://your-host/join`.
3. Keep the same backend — no second app codebase.

**Not in scope for Phase 4 shipping:** maintaining a separate Capacitor/React Native professor app.

See also: [`Manual_Student.md`](./Manual_Student.md).
