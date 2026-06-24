const os = require('os');

const ENTERPRISE_ID = 'enterprises/LC0427lp1p';
const POLICY_NAME   = 'kiosk-poc-policy';
const PROJECT_ID    = 'securemdmpoc';
const KEY_FILE      = './service_accounts/service-account.json';
const SCOPES        = ['https://www.googleapis.com/auth/androidmanagement'];
const DATA_DIR      = './data';
const EXPECTED_CHECKSUM = 'd9yvrEHWHOEFPAZfVieAb-9jdmL_EleeCTjat6jOPrM';

// Auto-detect local IP — no manual update needed
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIp();
const SERVER_URL  = `http://${LOCAL_IP}:3000`;
const DOWNLOAD_URL = `http://${LOCAL_IP}:4000`;

console.log(`Local IP detected: ${LOCAL_IP}`);

module.exports = {
  ENTERPRISE_ID,
  POLICY_NAME,
  PROJECT_ID,
  KEY_FILE,
  SCOPES,
  DATA_DIR,
  LOCAL_IP,
  SERVER_URL,
  DOWNLOAD_URL,
  EXPECTED_CHECKSUM
};