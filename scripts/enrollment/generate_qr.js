const QRCode = require('qrcode');
const fs = require('fs');
const { DATA_DIR } = require('../../config/constants');

const TOKEN_FILE = `${DATA_DIR}/enrollment_token.json`;

async function main() {
  if (!fs.existsSync(TOKEN_FILE)) {
    console.error('enrollment_token.json not found. Run node enroll_device.js first.');
    process.exit(1);
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));

  if (!token.qrCode) {
    console.error('No QR code data in token. Token may be expired or invalid.');
    process.exit(1);
  }

  await QRCode.toFile(`../output/enrollment_qr.png`, token.qrCode, {
    width: 800,
    margin: 3,
    errorCorrectionLevel: 'H'
  });

  console.log('QR code saved: enrollment_qr.png');
  console.log('Token expires:', token.expirationTimestamp);
  console.log('\nPrint enrollment_qr.png and:');
  console.log('1. Factory reset device');
  console.log('2. Tap welcome screen 6 times');
  console.log('3. Scan QR code');
  console.log('4. Wait 2-3 minutes for policy to apply');
}

main().catch(console.error);