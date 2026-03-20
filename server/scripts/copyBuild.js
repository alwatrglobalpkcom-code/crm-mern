/**
 * Copies client/build to server/public for production deploy.
 * Run: cd client && npm run build && cd ../server && node scripts/copyBuild.js
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '../../client/build');
const dest = path.join(__dirname, '../public');

if (!fs.existsSync(src)) {
  console.error('Error: client/build not found. Run: cd client && npm run build');
  process.exit(1);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, name);
    const destPath = path.join(destDir, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(src, dest);
console.log('✓ Build copied to server/public');
