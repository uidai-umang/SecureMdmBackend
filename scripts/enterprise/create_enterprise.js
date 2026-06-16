const fs = require('fs');
const { getApiClient } = require('../../lib/auth');
const { PROJECT_ID, DATA_DIR } = require('../../config/constants');

async function main() {
  const api = await getApiClient();

  const enterprise = await api.enterprises.create({
    projectId: PROJECT_ID,
    signupUrlName: 'signupUrls/C9f630acf3134b50f',
    enterpriseToken: 'EAHp-VebOUF340XpssBgMmmz_RXuOVsGieYmukccbiUIs5j4lzgB8lW-il-ZCpryvs5agGh4H3E_fULdtuRqMag53vsVMmJkBsbS9qQdsqTPrw1Hw_pEZZQc',
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