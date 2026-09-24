/**
 * electron-builder config for CodeTrack Lab Monitor (professor, role-locked).
 */
module.exports = {
  appId: 'com.codetrack.labmonitor',
  productName: 'CodeTrack Lab Monitor',
  directories: { output: 'release' },
  files: ['dist/**/*', 'electron/**/*', 'package.json'],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    artifactName: 'CodeTrack-LabMonitor-Setup-${version}.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    shortcutName: 'CodeTrack Lab Monitor',
  },
};
