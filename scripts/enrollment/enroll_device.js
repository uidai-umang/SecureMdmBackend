const fs = require('fs');
const { getApiClient } = require('../../lib/auth');
const { ENTERPRISE_ID, POLICY_NAME, DATA_DIR } = require('../../config/constants');

async function main() {
  const api = await getApiClient();

  const tokenResult = await api.enterprises.enrollmentTokens.create({
    parent: ENTERPRISE_ID,
    requestBody: {
      policyName: `${ENTERPRISE_ID}/policies/${POLICY_NAME}`,
      duration: '604800s',
      additionalData: 'poc-device-1'
    }
  });

  const token = tokenResult.data;
  console.log('Enrollment token created!');
  console.log('Token expires:', token.expirationTimestamp);

  fs.writeFileSync(`${DATA_DIR}/enrollment_token.json`, JSON.stringify(token, null, 2));
  console.log('enrollment_token.json saved');
}

main().catch(console.error);