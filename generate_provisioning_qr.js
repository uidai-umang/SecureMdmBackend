const QRCode = require('qrcode');
const { LOCAL_IP, DOWNLOAD_URL, EXPECTED_CHECKSUM } = require('./config/constants');

const APK_URL = `http://${LOCAL_IP}:8080/app-release.apk`;

const provisioningData = {
  "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME":
    "gov.uidai.securemdmpoc/.receivers.MyDeviceAdminReceiver",

  "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION":
    APK_URL,

  "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM":
    EXPECTED_CHECKSUM,

  "android.app.extra.PROVISIONING_WIFI_SSID":
    "Airtel-MyWiFi-PQR-C100-C38E",

  "android.app.extra.PROVISIONING_WIFI_PASSWORD":
    "25250912",

  "android.app.extra.PROVISIONING_WIFI_SECURITY_TYPE":
    "WPA",

  "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": false,

  "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
};

async function main() {
  const qrData = JSON.stringify(provisioningData);

  console.log('Generating QR code...');
  console.log('Local IP  :', LOCAL_IP);
  console.log('APK URL   :', APK_URL);
  console.log('Checksum  :', EXPECTED_CHECKSUM);
  console.log('WiFi      : Airtel-MyWiFi-PQR-C100-C38E');
  console.log('Component : gov.uidai.securemdmpoc/.receivers.MyDeviceAdminReceiver');

  await QRCode.toFile('./provisioning_qr.png', qrData, {
    width: 1024,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  console.log('\nQR code saved: provisioning_qr.png');
  console.log('\nProvisioning steps:');
  console.log('1. Factory reset device');
  console.log('2. Tap welcome screen 6 times quickly');
  console.log('3. Scan provisioning_qr.png');
  console.log('4. Wait 3-5 minutes');
  console.log('5. App installs as Device Owner automatically');
}

main().catch(console.error);