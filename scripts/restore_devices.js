const { execSync } = require('child_process');
const { LOCAL_IP } = require('../config/constants');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

console.log('═══════════════════════════════════════');
console.log('       Restore All Devices');
console.log('⚠️  This will remove Device Owner from');
console.log('   ALL enrolled devices. Are you sure?');
console.log('═══════════════════════════════════════');

const readline = require('readline').createInterface({
  input: process.stdin, output: process.stdout
});

readline.question('\nType YES to confirm: ', answer => {
  readline.close();
  if (answer !== 'YES') {
    console.log('Cancelled.');
    process.exit(0);
  }

  const response = run(
    `curl -s -X POST http://${LOCAL_IP}:3000/device/restore`
  );

  const result = JSON.parse(response);
  console.log(`\n✅ FCM sent: ${result.fcmResponse}`);
  console.log('   All devices will restore to normal');
  console.log('\n═══════════════════════════════════════\n');
});