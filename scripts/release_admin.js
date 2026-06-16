const { execSync } = require('child_process');
const { LOCAL_IP } = require('../config/constants');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('═══════════════════════════════════════');
console.log('       Release Device Admin');
console.log('⚠️  This will remove Device Owner from');
console.log('   ALL enrolled devices permanently.');
console.log('   This cannot be undone.');
console.log('═══════════════════════════════════════');

readline.question('\nType RELEASE to confirm: ', answer => {
  readline.close();

  if (answer !== 'RELEASE') {
    console.log('Cancelled.');
    process.exit(0);
  }

  const response = run(
    `curl -s -X POST http://${LOCAL_IP}:3000/device/restore`
  );

  const result = JSON.parse(response);
  console.log(`\n✅ FCM sent: ${result.fcmResponse}`);
  console.log('   Device Owner will be removed on all devices');
  console.log('   All policies will be cleared');
  console.log('   Devices will return to normal state');
  console.log('\n═══════════════════════════════════════\n');
});