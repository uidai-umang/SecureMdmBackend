const { execSync } = require('child_process');
const { LOCAL_IP } = require('../config/constants');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

console.log('═══════════════════════════════════════');
console.log('       Trigger OTA Update via FCM');
console.log('═══════════════════════════════════════');

const response = run(
  `curl -s -X POST http://${LOCAL_IP}:3000/device/update`
);

const result = JSON.parse(response);
console.log(`\n✅ FCM sent: ${result.fcmResponse}`);
console.log('   All devices will update silently');
console.log('\n═══════════════════════════════════════\n');