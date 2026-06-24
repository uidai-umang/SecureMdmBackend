const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = 4000;

// ── Config ───────────────────────────────────────────────

const APKSIGNER_PATH = '/Users/macuser/Library/Android/sdk/build-tools/36.1.0/apksigner';
const AAPT_PATH = '/Users/macuser/Library/Android/sdk/build-tools/36.1.0/aapt';
const APK_SERVE_DIR = '/Users/macuser/Desktop/SecureMdmPocApk';
const APK_FILE = path.join(APK_SERVE_DIR, 'app-release.apk');
const META_FILE = path.join(APK_SERVE_DIR, 'update-meta.json');
const DOWNLOAD_URL = require('../config/constants').DOWNLOAD_URL;
const SERVER_URL = require('../config/constants').SERVER_URL


const EXPECTED_CHECKSUM = require('../config/constants').EXPECTED_CHECKSUM;

// ── Helpers ───────────────────────────────────────────────

function loadMeta() {
  if (fs.existsSync(META_FILE)) {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
  }
  return { versionCode: 0, versionName: '1.0', pushedAt: null };
}

function saveMeta(meta) {
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
}

function verifySignature(apkPath) {
  let output = '';
  
  try {
    output = execSync(
      `${APKSIGNER_PATH} verify --print-certs "${apkPath}"`,
      { encoding: 'utf8' }
    );
  } catch (e) {
    // apksigner exits non-zero due to WARNING lines
    // but cert info is still in stdout
    output = (e.stdout || '') + (e.stderr || '') + (e.message || '');
  }

  console.log('apksigner output:', output);

  const match = output.match(/SHA-256 digest:\s+([a-f0-9]+)/i);
  if (!match) {
    return { valid: false, error: 'Could not extract SHA256 from APK' };
  }

  const hex = match[1];
  const base64url = Buffer.from(hex, 'hex')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const valid = base64url === EXPECTED_CHECKSUM;
  return {
    valid,
    actual: base64url,
    expected: EXPECTED_CHECKSUM,
    error: valid ? null : 'Keystore mismatch — wrong signing key'
  };
}

function getVersionInfo(apkPath) {
  try {
    const result = execSync(
      `${AAPT_PATH} dump badging "${apkPath}"`,
      { encoding: 'utf8' }
    );
    const codeMatch = result.match(/versionCode='(\d+)'/);
    const nameMatch = result.match(/versionName='([^']+)'/);
    return {
      versionCode: codeMatch ? parseInt(codeMatch[1]) : null,
      versionName: nameMatch ? nameMatch[1] : null
    };
  } catch (e) {
    return { versionCode: null, versionName: null, error: e.message };
  }
}

function getApkSha256(apkPath) {
  const buffer = fs.readFileSync(apkPath);
  return crypto.createHash('sha256').update(buffer).digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Routes ────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  const meta = loadMeta();
  res.json({
    status: 'ok',
    currentVersion: meta.versionName,
    versionCode: meta.versionCode,
    apkExists: fs.existsSync(APK_FILE),
    pushedAt: meta.pushedAt
  });
});

// Step 1 — Developer uploads new APK path + version
// All validations happen here before APK is deployed
app.post('/update/upload', (req, res) => {
  const { apkPath } = req.body;

  if (!apkPath) {
    return res.status(400).json({ error: 'apkPath is required' });
  }

  if (!fs.existsSync(apkPath)) {
    return res.status(404).json({
      error: `APK not found at: ${apkPath}`
    });
  }

  console.log('\n── Upload request ──────────────────────');
  console.log('APK path:', apkPath);

  // Guard 1 — verify signature / keystore
  console.log('Checking signature...');
  const sigCheck = verifySignature(apkPath);
  if (!sigCheck.valid) {
    console.error('❌ Signature check failed:', sigCheck.error);
    return res.status(400).json({
      error: 'APK signature mismatch',
      detail: sigCheck.error,
      expected: sigCheck.expected,
      actual: sigCheck.actual,
      fix: 'Rebuild APK using mdm-release.keystore'
    });
  }
  console.log('✅ Signature verified:', sigCheck.actual);

  // Guard 2 — verify version code is higher
  console.log('Checking version code...');
  const newMeta = getVersionInfo(apkPath);
  if (!newMeta.versionCode) {
    return res.status(400).json({
      error: 'Could not read versionCode from APK',
      detail: newMeta.error,
      fix: 'Ensure APK is built correctly with aapt accessible'
    });
  }

  const currentMeta = loadMeta();
  // VERSION CHECK DISABLED FOR DEVELOPMENT
  // if (newMeta.versionCode <= currentMeta.versionCode) {
  //   console.error(`❌ Version check failed: ${currentMeta.versionCode} → ${newMeta.versionCode}`);
  //   return res.status(400).json({
  //     error: 'versionCode must be higher than currently deployed',
  //     current: currentMeta.versionCode,
  //     provided: newMeta.versionCode,
  //     fix: `Set versionCode = ${currentMeta.versionCode + 1} or higher in build.gradle.kts`
  //   });
  // }
  // console.log(`✅ Version check passed: ${currentMeta.versionCode} → ${newMeta.versionCode}`);

  console.log(`✅ Version accepted: ${newMeta.versionCode}`);

  // Guard 3 — copy APK to serving location
  console.log('Deploying APK...');
  fs.copyFileSync(apkPath, APK_FILE);

  // Guard 4 — save meta
  const sha256 = getApkSha256(APK_FILE);
  const meta = {
    versionCode: newMeta.versionCode,
    versionName: newMeta.versionName,
    sha256,
    pushedAt: new Date().toISOString()
  };
  saveMeta(meta);

  console.log(`✅ APK deployed: v${newMeta.versionName} (${newMeta.versionCode})`);
  console.log(`   SHA256: ${sha256}`);
  console.log('────────────────────────────────────────\n');

  res.json({
    status: 'ok',
    message: 'APK deployed successfully',
    version: newMeta.versionName,
    versionCode: newMeta.versionCode,
    sha256,
    pushedAt: meta.pushedAt,
    nextStep: `curl -X POST ${SERVER_URL}/device/policy -H "Content-Type: application/json" -d '{"action":"CHECK_UPDATE"}'`
  });
});

// Step 2 — Device polls this to check if update is available
app.get('/update/check', (req, res) => {
  const deviceVersionCode = parseInt(req.query.versionCode || '0');
  const meta = loadMeta();

  console.log(`Update check — device: ${deviceVersionCode}, server: ${meta.versionCode}`);

  // if (deviceVersionCode >= meta.versionCode) {
  //   return res.json({ updateAvailable: false });
  // }

  res.json({
    updateAvailable: true,
    versionName: meta.versionName,
    versionCode: meta.versionCode,
    apkUrl: `${DOWNLOAD_URL}/update/download`,
    sha256: meta.sha256
  });
});

// Step 3 — Device downloads APK
app.get('/update/download', (req, res) => {
  if (!fs.existsSync(APK_FILE)) {
    return res.status(404).json({ error: 'APK not found on server' });
  }

  const stat = fs.statSync(APK_FILE);
  console.log(`APK download started — size: ${stat.size} bytes`);

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Disposition', 'attachment; filename=app-release.apk');

  const stream = fs.createReadStream(APK_FILE);
  stream.pipe(res);

  stream.on('end', () => console.log('APK download completed'));
  stream.on('error', (e) => console.error('APK download error:', e.message));
});

// ── Start ─────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  const meta = loadMeta();
  console.log(`\nUpdate server running on http://0.0.0.0:${PORT}`);
  console.log(`Current deployed version: v${meta.versionName} (${meta.versionCode})`);
  console.log(`APK exists: ${fs.existsSync(APK_FILE)}\n`);
});