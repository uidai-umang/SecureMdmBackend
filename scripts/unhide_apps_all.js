const { execSync } = require('child_process');
const { LOCAL_IP } = require('../config/constants');

console.log('Sending UNHIDE_APPS to all devices...');

const response = execSync(
  `curl -s -X POST "http://${LOCAL_IP}:3000/device/all/unhide-apps"`,
  { encoding: 'utf8' }
);

console.log(JSON.parse(response));