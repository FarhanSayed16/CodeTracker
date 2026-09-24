/**
 * electron-builder config for CodeTrack Student (role-locked).
 * Invoked after scripts/set-role.cjs student
 */
module.exports = {
  appId: 'com.codetrack.student',
  productName: 'CodeTrack Student',
  directories: { output: 'release' },
  files: ['dist/**/*', 'electron/**/*', 'package.json'],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    artifactName: 'CodeTrack-Student-Setup-${version}.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    shortcutName: 'CodeTrack Student',
  },
};
