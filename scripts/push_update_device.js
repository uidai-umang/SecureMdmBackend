const { execSync } = require('child_process');
const { LOCAL_IP } = require('../config/constants');

const DEVICE_ID = process.argv.slice(2).join(' ');

if (!DEVICE_ID) {
  console.error('Usage: npm run push-update-device -- "LENOVO Lenovo L19111"');
  process.exit(1);
}

const response = execSync(
  `curl -s -X POST "http://${LOCAL_IP}:3000/device/${encodeURIComponent(DEVICE_ID)}/update"`,
  { encoding: 'utf8' }
);
console.log(JSON.parse(response));