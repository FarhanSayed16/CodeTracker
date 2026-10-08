const { base } = require('./electron-builder.shared.cjs');

module.exports = base({
  root: {
    appId: 'com.codetrack.student',
    productName: 'CodeTrack Student Quickball',
  },
  win: {
    artifactName: 'CodeTrack-FOR-STUDENTS-Setup-${version}.${ext}',
  },
  nsis: {
    shortcutName: 'CodeTrack Student Quickball',
  },
});
