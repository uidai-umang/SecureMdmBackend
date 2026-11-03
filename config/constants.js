require('dotenv').config();
const os = require('os');

const ENTERPRISE_ID = process.env.ENTERPRISE_ID;
const POLICY_NAME   = process.env.POLICY_NAME;
const PROJECT_ID    = process.env.PROJECT_ID;
const KEY_FILE      = process.env.KEY_FILE;
const SCOPES        = ['https://www.googleapis.com/auth/androidmanagement'];
const DATA_DIR      = process.env.DATA_DIR;
const EXPECTED_CHECKSUM = process.env.EXPECTED_CHECKSUM;

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