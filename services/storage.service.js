const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config/constants');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FILES = {
  devices:       path.join(DATA_DIR, 'devices.json'),
  errors:        path.join(DATA_DIR, 'errors.json'),
  updateSuccess: path.join(DATA_DIR, 'update_success.json'),
  appsReport:    path.join(DATA_DIR, 'apps_report.json'),
  fcmConfirm:    path.join(DATA_DIR, 'fcm_confirm.json')
};

function load(file) {
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return [];
}

function save(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function append(file, record) {
  const records = load(file);
  records.push(record);
  save(file, records);
}

function clear(file) {
  save(file, []);
}

module.exports = { FILES, load, save, append, clear };