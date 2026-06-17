const { execSync } = require('child_process');
const { LOCAL_IP } = require('../config/constants');

// ═══════════════════════════════════════
// CONFIGURE POLICIES HERE
// Change true/false as needed
// ═══════════════════════════════════════

const POLICIES = {
  screenshotEnabled : null,   // true = allowed, false = blocked
  kioskEnabled      : true,   // true = kiosk on, false = kiosk off
  cameraEnabled     : null,  // true = allowed, false = blocked
};

// ═══════════════════════════════════════

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

// Build payload — only include non-null values
const payload = { action: 'SET_POLICY' };
Object.entries(POLICIES).forEach(([key, value]) => {
  if (value !== null) payload[key] = String(value);
});

console.log('═══════════════════════════════════════');
console.log('       Push Policy Update via FCM');
console.log('═══════════════════════════════════════');
console.log('\nPolicies to apply:');
Object.entries(POLICIES).forEach(([key, value]) => {
  console.log(`  ${key.padEnd(20)}: ${value}`);
});

const response = run(
  `curl -s -X POST http://${LOCAL_IP}:3000/device/policy \
    -H "Content-Type: application/json" \
    -d '${JSON.stringify(payload)}'`
);

const result = JSON.parse(response);
console.log(`\n✅ FCM sent: ${result.fcmResponse}`);
console.log('   Policy applied on all devices instantly');
console.log('\n═══════════════════════════════════════\n');