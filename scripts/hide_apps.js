const { execSync } = require('child_process');
const { LOCAL_IP } = require('../config/constants');

const DEVICE_ID = process.argv[2];
if (!DEVICE_ID) {
  console.error('Usage: npm run hide-apps -- "LENOVO Lenovo L19111"');
  process.exit(1);
}

const response = execSync(
  `curl -s -X POST "http://${LOCAL_IP}:3000/device/${encodeURIComponent(DEVICE_ID)}/hide-apps"`,
  { encoding: 'utf8' }
);
console.log(JSON.parse(response));