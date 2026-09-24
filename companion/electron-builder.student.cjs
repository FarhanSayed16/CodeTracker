const { base } = require('./electron-builder.shared.cjs');

module.exports = base({
  root: {
    appId: 'com.codetrack.student',
    productName: 'CodeTrack Student',
  },
  win: {
    artifactName: 'CodeTrack-Student-Setup-${version}.${ext}',
  },
  nsis: {
    shortcutName: 'CodeTrack Student',
  },
});
