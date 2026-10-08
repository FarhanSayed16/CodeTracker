const { base } = require('./electron-builder.shared.cjs');

module.exports = base({
  root: {
    appId: 'com.codetrack.labmonitor',
    productName: 'CodeTrack Professor Quickball',
  },
  win: {
    artifactName: 'CodeTrack-FOR-PROFESSOR-Setup-${version}.${ext}',
  },
  nsis: {
    shortcutName: 'CodeTrack Professor Quickball',
  },
});
