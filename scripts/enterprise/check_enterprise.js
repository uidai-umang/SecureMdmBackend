const { getApiClient } = require('../../lib/auth');

const OLD_ENTERPRISE_ID = 'enterprises/LC00j1tjmy';

async function main() {
  const api = await getApiClient();

  try {
    const result = await api.enterprises.get({ name: OLD_ENTERPRISE_ID });
    console.log('❌ Old enterprise still exists:', result.data.name);
    console.log('Delete did not work — need to try again');
  } catch (e) {
    console.log('✅ Old enterprise is gone');
    console.log('Safe to create new one');
  }
}

main().catch(console.error);