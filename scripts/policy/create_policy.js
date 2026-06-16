const { getApiClient } = require('../../lib/auth');
const { ENTERPRISE_ID, POLICY_NAME } = require('../../config/constants');

async function main() {
  const api = await getApiClient();

  const policy = {
    installUnknownSourcesAllowed: false,
    screenCaptureDisabled: true,
    defaultPermissionPolicy: "DENY",
    applications: [
      {
        packageName: "gov.uidai.securemdmpoc",
        permissionGrants: [{ permission: "android.permission.CAMERA", policy: "GRANT" }]
      }
    ],
    kioskCustomization: {
      systemNavigation: 'NAVIGATION_DISABLED',
      statusBar: 'NOTIFICATIONS_AND_SYSTEM_INFO_DISABLED',
      deviceSettings: 'SETTINGS_ACCESS_BLOCKED',
      powerButtonActions: 'POWER_BUTTON_AVAILABLE'
    },
    shortSupportMessage: { defaultMessage: 'This device is managed.' },
    longSupportMessage: { defaultMessage: 'Contact your administrator.' }
  };

  const result = await api.enterprises.policies.patch({
    name: `${ENTERPRISE_ID}/policies/${POLICY_NAME}`,
    requestBody: policy
  });

  console.log('Policy updated!');
  console.log('Policy name:', result.data.name);
  console.log('Policy version:', result.data.version);
}

main().catch(console.error);