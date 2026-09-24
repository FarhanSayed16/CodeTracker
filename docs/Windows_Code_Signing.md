# Windows code signing (Phase 3)

SmartScreen blocks unsigned Electron apps. For lab trust, sign the NSIS installers.

## Option A — CI / local with a `.pfx`

```bash
# PowerShell
$env:CSC_LINK = "D:\certs\codetrack.pfx"
$env:CSC_KEY_PASSWORD = "••••••••"
cd companion
npm run dist:all
```

electron-builder picks these up automatically (`signingHashAlgorithms: sha256` is already set).

## Option B — Azure / DigiCert cloud

Use your vendor’s `signtool` / EV token docs; set `CSC_LINK` to the certificate file or use `WIN_CSC_LINK` per electron-builder docs.

## Option C — Lab intranet only (temporary)

If PCs are domain-locked and IT allows unsigned internal apps, document an exception. Prefer signing before campus-wide rollout.

## Verify

After install, Properties → Digital Signatures should show your publisher name.

## Related

- Installers: `npm run dist:student` / `dist:professor`
- Lab image: [`Lab_Image_Install.md`](./Lab_Image_Install.md)
