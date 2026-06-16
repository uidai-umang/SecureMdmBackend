const { getApiClient } = require('../../lib/auth');
const { ENTERPRISE_ID } = require('../../config/constants');

async function main() {
  const api = await getApiClient();

  const enterprise = await api.enterprises.get({ name: ENTERPRISE_ID });

  console.log('\n========================================');
  console.log('       Enterprise Status');
  console.log('========================================');
  console.log('Name          :', enterprise.data.name);
  console.log('Display Name  :', enterprise.data.enterpriseDisplayName);
  console.log('Type          :', enterprise.data.enterpriseType);
  console.log('Enabled Notif :', enterprise.data.enabledNotificationTypes);
  console.log('\nFull details:');
  console.log(JSON.stringify(enterprise.data, null, 2));

  const devices = await api.enterprises.devices.list({ parent: ENTERPRISE_ID });
  const deviceList = devices.data.devices || [];
  console.log('\n========================================');
  console.log('       Enrolled Devices');
  console.log('========================================');
  console.log('Total enrolled:', deviceList.length);

  const tokens = await api.enterprises.enrollmentTokens.list({ parent: ENTERPRISE_ID });
  const tokenList = tokens.data.enrollmentTokens || [];
  console.log('\n========================================');
  console.log('       Enrollment Tokens');
  console.log('========================================');
  console.log('Active tokens :', tokenList.length);
  tokenList.forEach((t, i) => {
    const expires = new Date(t.expirationTimestamp);
    const valid = expires > new Date();
    console.log(`[${i+1}] ${valid ? '✅ Valid' : '❌ Expired'} — expires ${expires.toLocaleString()}`);
  });

  console.log('\n========================================');
  console.log('NOTE: Device enrollment quota limit');
  console.log('is NOT visible via API.');
  console.log('Contact Google to check:');
  console.log('https://support.google.com/googleplay/work/contact/eme_quota_increase');
  console.log('========================================\n');
}

main().catch(console.error);