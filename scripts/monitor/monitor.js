const fs = require('fs');
const { getApiClient } = require('../../lib/auth');
const { ENTERPRISE_ID, POLICY_NAME, DATA_DIR } = require('../../config/constants');

const TOKEN_FILE = `${DATA_DIR}/enrollment_token.json`;

async function main() {
  const api = await getApiClient();

  console.log('\n========================================');
  console.log('        AMAPI Device Monitor');
  console.log('========================================');
  console.log('Enterprise:', ENTERPRISE_ID);
  console.log('Checking at:', new Date().toLocaleString());
  console.log('========================================\n');

  try {
    const policy = await api.enterprises.policies.get({
      name: `${ENTERPRISE_ID}/policies/${POLICY_NAME}`
    });
    console.log('✅ Policy      :', policy.data.name);
    console.log('   Version     :', policy.data.version);
    console.log('   Camera      :', policy.data.cameraAccess);
    console.log('   Play Store  :', policy.data.playStoreMode);
  } catch (e) {
    console.log('❌ Policy check failed:', e.message);
  }

  console.log('');

  try {
    const result = await api.enterprises.devices.list({ parent: ENTERPRISE_ID });
    const devices = result.data.devices || [];

    if (devices.length === 0) {
      console.log('📱 Devices     : No enrolled devices yet');
      console.log('   Next step   : Factory reset a device and scan enrollment_qr.png');
    } else {
      console.log(`📱 Devices     : ${devices.length} enrolled\n`);
      console.log('─'.repeat(50));

      devices.forEach((device, i) => {
        const model     = device.hardwareInfo?.model || 'Unknown';
        const brand     = device.hardwareInfo?.brand || '';
        const state     = device.state || 'UNKNOWN';
        const compliant = device.policyCompliant ? '✅ YES' : '❌ NO';
        const sync      = device.lastPolicySyncTime
          ? new Date(device.lastPolicySyncTime).toLocaleString()
          : 'Never';
        const os        = device.softwareInfo?.androidVersion || 'Unknown';

        console.log(`[${String(i + 1).padStart(3, '0')}] ${brand} ${model}`);
        console.log(`     State     : ${state}`);
        console.log(`     Compliant : ${compliant}`);
        console.log(`     Android   : ${os}`);
        console.log(`     Last sync : ${sync}`);
        console.log(`     Device ID : ${device.name}`);
        console.log('─'.repeat(50));
      });

      const compliant    = devices.filter(d => d.policyCompliant).length;
      const nonCompliant = devices.length - compliant;
      console.log(`\nSummary: Total ${devices.length} | ✅ Compliant ${compliant} | ❌ Non-compliant ${nonCompliant}`);
    }
  } catch (e) {
    console.log('❌ Device list failed:', e.message);
  }

  console.log('');
  if (fs.existsSync(TOKEN_FILE)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
    const expires = new Date(token.expirationTimestamp);
    const hoursLeft = Math.round((expires - new Date()) / (1000 * 60 * 60));
    const status = hoursLeft > 0
      ? `✅ Valid (${hoursLeft}h left)`
      : '❌ Expired — run node enroll_device.js again';

    console.log('🔑 QR Token    :', status);
    console.log('   Expires     :', expires.toLocaleString());
  } else {
    console.log('🔑 QR Token    : Not generated yet — run node enroll_device.js');
  }

  console.log('\n========================================\n');
}

main().catch(console.error);