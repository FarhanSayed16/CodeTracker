/**
 * Shared electron-builder pieces for role-locked Windows builds.
 */
function base(overrides) {
  return {
    directories: { output: 'release', buildResources: 'build' },
    files: ['dist/**/*', 'electron/**/*', 'package.json'],
    extraResources: [
      { from: 'electron/lab-config.json', to: 'lab-config.json' },
      { from: 'build/icon.png', to: 'icon.png' },
    ],
    icon: 'build/icon.png',
    protocols: [
      {
        name: 'CodeTrack',
        schemes: ['codetrack'],
      },
    ],
    publish: null,
    win: {
      target: [{ target: 'nsis', arch: ['x64'] }],
      // Signing: set CSC_LINK + CSC_KEY_PASSWORD (or WIN_CSC_LINK) in CI — see docs/Windows_Code_Signing.md
      signingHashAlgorithms: ['sha256'],
      ...overrides.win,
    },
    nsis: {
      oneClick: false,
      allowToChangeInstallationDirectory: true,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      runAfterFinish: true,
      ...overrides.nsis,
    },
    ...overrides.root,
  };
}

module.exports = { base };
