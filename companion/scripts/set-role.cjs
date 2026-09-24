/**
 * Writes electron/role.lock.json for packaged builds.
 * Usage: node scripts/set-role.cjs student|professor|unlocked
 */
const fs = require('fs');
const path = require('path');

const arg = (process.argv[2] || 'unlocked').toLowerCase();
const role = arg === 'student' || arg === 'professor' ? arg : null;

const out = path.join(__dirname, '../electron/role.lock.json');
fs.writeFileSync(out, JSON.stringify({ role }, null, 2) + '\n');
console.log(`Wrote ${out} → role=${role === null ? 'unlocked (dev)' : role}`);
