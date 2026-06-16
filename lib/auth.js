const { google } = require('googleapis');
const { KEY_FILE, SCOPES } = require('../config/constants');

async function getApiClient() {
  const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE, scopes: SCOPES });
  const client = await auth.getClient();
  return google.androidmanagement({ version: 'v1', auth: client });
}

module.exports = { getApiClient };