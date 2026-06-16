const { execSync } = require('child_process');
const { LOCAL_IP } = require('../config/constants');

const APK_PATH = '/Users/macuser/AndroidStudioProjects/SecureMdmPoc/app/build/outputs/apk/release/app-release.apk';

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

console.log('═══════════════════════════════════════');
console.log('       Deploy APK to Update Server');
console.log('═══════════════════════════════════════');
console.log(`Local IP : ${LOCAL_IP}`);

// Step 1 — upload APK
console.log('\n▶ Uploading APK...');
const response = run(
  `curl -s -X POST http://${LOCAL_IP}:4000/update/upload \
    -H "Content-Type: application/json" \
    -d '{"apkPath":"${APK_PATH}"}'`
);

const result = JSON.parse(response);

if (result.error) {
  console.error('\n❌ Upload failed:', result.error);
  if (result.fix) console.error('Fix:', result.fix);
  process.exit(1);
}

console.log(`\n✅ APK deployed successfully`);
console.log(`   Version  : ${result.version} (${result.versionCode})`);
console.log(`   SHA256   : ${result.sha256}`);
console.log(`   Pushed at: ${result.pushedAt}`);
console.log('\n═══════════════════════════════════════');
console.log('Next — trigger OTA update:');
console.log('  npm run push-update');
console.log('═══════════════════════════════════════\n');