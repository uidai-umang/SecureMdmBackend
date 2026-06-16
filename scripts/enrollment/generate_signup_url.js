const { getApiClient } = require('../../lib/auth');
const { PROJECT_ID } = require('../../config/constants');

async function main() {
  const api = await getApiClient();

  const signup = await api.signupUrls.create({
    projectId: PROJECT_ID,
    callbackUrl: 'https://localhost'
  });

  console.log('\n=== FULL RESPONSE ===\n');
  console.log(JSON.stringify(signup.data, null, 2));
}

main().catch(console.error);