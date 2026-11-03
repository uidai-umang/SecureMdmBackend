const fs = require('fs');
const { getApiClient } = require('../../lib/auth');
const { PROJECT_ID, DATA_DIR } = require('../../config/constants');

async function main() {
  const api = await getApiClient();

  const enterprise = await api.enterprises.create({
    projectId: PROJECT_ID,
    signupUrlName: process.env.SIGNUP_URL_NAME,
    enterpriseToken: process.env.ENTERPRISE_TOKEN,
    requestBody: { name: 'SecureMDMPOC' }
  });

  console.log('Enterprise Created!');
  console.log(enterprise.data.name);

  fs.writeFileSync(
    `${DATA_DIR}/enterprise.json`,
    JSON.stringify({ enterpriseId: enterprise.data.name }, null, 2)
  );

  console.log('enterprise.json saved');
}

main().catch(console.error);