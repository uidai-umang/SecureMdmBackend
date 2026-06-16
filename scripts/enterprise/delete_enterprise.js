const { getApiClient } = require('../../lib/auth');

const OLD_ENTERPRISE_ID = 'enterprises/LC00j1tjmy';

async function main() {
  const api = await getApiClient();

  try {
    await api.enterprises.delete({ name: OLD_ENTERPRISE_ID });
    console.log('✅ Enterprise deleted:', OLD_ENTERPRISE_ID);
    console.log('Now run: node generate_signup_url.js');
  } catch (e) {
    console.log('❌ Delete failed:', e.message);
  }
}

main().catch(console.error);