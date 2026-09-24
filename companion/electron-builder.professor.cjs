const { base } = require('./electron-builder.shared.cjs');

module.exports = base({
  root: {
    appId: 'com.codetrack.labmonitor',
    productName: 'CodeTrack Lab Monitor',
  },
  win: {
    artifactName: 'CodeTrack-LabMonitor-Setup-${version}.${ext}',
  },
  nsis: {
    shortcutName: 'CodeTrack Lab Monitor',
  },
});
