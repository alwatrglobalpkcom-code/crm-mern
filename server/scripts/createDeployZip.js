/**
 * Hostinger-ready ZIP - matches Next.js style deployment.
 * ZIP contains ONE root folder "app" with package.json inside.
 * Hostinger: Root directory = app
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const SERVER = path.join(ROOT, 'server');
const DEPLOY_DIR = path.join(ROOT, 'deploy-output');
const APP_FOLDER = 'app';
const ZIP_NAME = 'crm-hostinger.zip';

function copyRecursive(src, dest, exclude) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      if (exclude && exclude(name, src)) continue;
      copyRecursive(path.join(src, name), path.join(dest, name), exclude);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function main() {
  console.log('Creating Hostinger deployment ZIP...\n');

  if (fs.existsSync(DEPLOY_DIR)) fs.rmSync(DEPLOY_DIR, { recursive: true });
  const APP_DIR = path.join(DEPLOY_DIR, APP_FOLDER);
  fs.mkdirSync(APP_DIR, { recursive: true });

  const exclude = (name) => ['node_modules', '.git', '.env', '.env.local'].includes(name);

  const items = ['config', 'controllers', 'jobs', 'middleware', 'models', 'public', 'routes', 'services', 'socket', 'utils'];
  for (const item of items) {
    const src = path.join(SERVER, item);
    if (fs.existsSync(src)) {
      copyRecursive(src, path.join(APP_DIR, item), exclude);
      console.log('  +', item);
    }
  }

  fs.copyFileSync(path.join(SERVER, 'index.js'), path.join(APP_DIR, 'index.js'));
  fs.writeFileSync(path.join(APP_DIR, 'server.js'), "require('./index.js');\n");
  console.log('  + index.js, server.js');

  const uploadsDir = path.join(APP_DIR, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, '.gitkeep'), '');
  console.log('  + uploads/');

  const scriptsDir = path.join(APP_DIR, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });
  for (const s of ['seedAdmin.js', 'seedDemo.js']) {
    const src = path.join(SERVER, 'scripts', s);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(scriptsDir, s));
    }
  }
  console.log('  + scripts/');

  const pkg = JSON.parse(fs.readFileSync(path.join(SERVER, 'package.json'), 'utf8'));
  const prodPkg = {
    name: 'crm-server',
    version: '1.0.0',
    description: 'CRM Backend',
    main: 'index.js',
    engines: { node: '>=18.x' },
    scripts: {
      build: 'node -e "process.exit(0)"',
      start: 'node index.js'
    },
    dependencies: pkg.dependencies || {}
  };
  fs.writeFileSync(path.join(APP_DIR, 'package.json'), JSON.stringify(prodPkg, null, 2), { encoding: 'utf8' });
  console.log('  + package.json');

  if (fs.existsSync(path.join(SERVER, 'package-lock.json'))) {
    fs.copyFileSync(path.join(SERVER, 'package-lock.json'), path.join(APP_DIR, 'package-lock.json'));
    console.log('  + package-lock.json');
  }

  const zipPath = path.join(ROOT, ZIP_NAME);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  const appPath = path.join(DEPLOY_DIR, APP_FOLDER);
  const zipPathNorm = zipPath.replace(/\\/g, '/');
  const appPathNorm = appPath.replace(/\\/g, '/');

  try {
    execSync(`powershell -Command "Compress-Archive -Path '${appPathNorm}' -DestinationPath '${zipPathNorm}' -Force"`, { stdio: 'inherit' });
  } catch (e) {
    try {
      execSync(`tar -a -cf "${zipPath}" -C "${DEPLOY_DIR}" "${APP_FOLDER}"`, { stdio: 'inherit' });
    } catch (e2) {
      console.error('ZIP failed. Folder ready at:', APP_DIR);
      process.exit(1);
    }
  }

  fs.rmSync(DEPLOY_DIR, { recursive: true });
  console.log('\n✓ ZIP created:', zipPath);
  console.log('\n=== HOSTINGER SETTINGS ===');
  console.log('Framework: Express');
  console.log('Root directory: ' + APP_FOLDER);
  console.log('Entry file: server.js');
  console.log('NODE_ENV: production');
  console.log('JWT_SECRET: 32+ chars');
}

main();
