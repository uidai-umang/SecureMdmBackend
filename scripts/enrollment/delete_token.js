const { getApiClient } = require('../../lib/auth');

const OLD_ENTERPRISE_ID = 'enterprises/LC00j1tjmy';

async function main() {
  const api = await getApiClient();

  const result = await api.enterprises.enrollmentTokens.list({ parent: OLD_ENTERPRISE_ID });
  const tokens = result.data.enrollmentTokens || [];
  console.log(`Found ${tokens.length} tokens`);

  for (const token of tokens) {
    await api.enterprises.enrollmentTokens.delete({ name: token.name });
    console.log('Deleted:', token.name);
  }

  console.log('All tokens deleted');
}

main().catch(console.error);