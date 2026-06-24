# SecureMdmBackend

Node.js/Express backend and command-and-control plane for [SecureMdmPoc](https://github.com/uidai-umang/SecureMdmPoc), UIDAI's custom Device Policy Controller (DPC) proof-of-concept. Handles device registration, fleet-wide policy commands via Firebase Cloud Messaging, and silent OTA distribution — no third-party MDM/EMM vendor involved.

---

## Architecture

```
SecureMdmBackend/
├── server/
│   ├── server.js                     Main backend entry point — port 3000
│   └── update_server.js              OTA update server — port 4000
├── config/
│   └── constants.js                  Auto-detects local IP, enterprise/checksum config
├── routes/                           HTTP layer only — delegates to controllers
│   ├── devices.js                    /device/checkin, /device/token, /device/fcm/confirm
│   ├── policy.js                     /device/policy, /device/kiosk, /device/restore
│   ├── updates.js                    /device/update, /device/:id/update, success reporting
│   ├── apps.js                       hide/unhide (bulk + per-device + per-app), Bluetooth
│   │                                 block/unblock, debug-check endpoints
│   └── logs.js                       Error reporting, log clearing
├── controllers/                      Business logic — no direct I/O
│   ├── device.controller.js          Check-in deduplication (token-then-model priority match)
│   ├── policy.controller.js
│   ├── update.controller.js
│   ├── apps.controller.js
│   └── logs.controller.js
├── services/                         All side effects live here
│   ├── fcm.service.js                sendToAll / sendToDevice / sendToToken — wraps
│   │                                 Firebase Admin SDK, high-priority FCM, structured logging
│   └── storage.service.js            Flat-JSON device/error/report storage
├── middleware/
│   └── errorHandler.js               Centralized async error handling
├── scripts/                          CLI tooling — deploy, push commands, provisioning QR
└── service_accounts/                 Firebase + GCP service account keys (gitignored)
```

This mirrors the same separation used on the Android side: **routes** are the View layer (HTTP in/out only), **controllers** are the ViewModel layer (orchestration), **services** are the Repository layer (the only code that touches Firebase Admin SDK or the filesystem directly).

---

## Command & control model

Commands are dispatched over FCM using a **topic broadcast with optional `targetDevice` filtering**, rather than per-device token addressing:

```
sendToAll(data)            → topic: 'all-devices', no filter
sendToDevice(name, data)   → topic: 'all-devices', data.targetDevice = name
```

Every subscribed device receives every message; the Android client checks `targetDevice` against its own model string and ignores anything not addressed to it. This was a deliberate choice over per-token sends: FCM tokens rotate, and a token-keyed device registry drifted out of sync in practice (duplicate device records, stale tokens). Topic subscription survives token rotation transparently — the device just resubscribes on `onNewToken()`.

All sends use `android.priority: 'high'` to bypass Doze-mode delivery delays — confirmed against official Firebase documentation, and verified to resolve multi-minute delivery delays observed on OEM builds with aggressive battery management.

---

## Endpoints (summary)

| Method | Path | Purpose |
|---|---|---|
| POST | `/device/checkin` | Device registration / heartbeat, dedup by token then model |
| POST | `/device/token` | FCM token update on rotation |
| POST | `/device/fcm/confirm` | Device-side acknowledgment of FCM receipt (round-trip confirmation — FCM's own `send()` success only means *accepted by Google*, not *delivered*) |
| GET | `/devices` | List all registered devices |
| POST | `/device/policy` | Generic policy push (kiosk, screen capture, camera) |
| POST | `/device/kiosk` | Kiosk mode toggle, all devices |
| POST | `/device/restore` | Full device release — restores policy state, clears Device Owner |
| POST | `/device/all/hide-apps` `/device/all/unhide-apps` | Fleet-wide app hide/unhide |
| POST | `/device/:id/hide-apps` `/device/:id/unhide-apps` | Per-device app hide/unhide |
| POST | `/device/:id/hide-app/:pkg` `/device/:id/unhide-app/:pkg` | Single-app hide/unhide |
| POST | `/device/all/block-bluetooth` `/device/all/unblock-bluetooth` | Fleet-wide Bluetooth restriction |
| POST | `/device/:id/block-bluetooth` `/device/:id/unblock-bluetooth` | Per-device Bluetooth restriction |
| POST | `/device/:id/debug/check-permission` | On-demand `DevicePolicyManager.getPermissionGrantState()` query |
| POST | `/device/:id/debug/check-restrictions` | On-demand `DevicePolicyManager.getUserRestrictions()` query |
| POST | `/device/update` `/device/:id/update` | Trigger OTA check (fleet / per-device) |
| GET | `/device/update/success` | OTA install success log |
| GET | `/device/errors` | Device-reported error log |
| DELETE | `/logs/clear` | Clear all stored logs |

**Route ordering matters.** Literal-path routes (`/all/hide-apps`) must be registered before wildcard routes (`/:deviceId/hide-apps`) in the same router — Express performs first-match-wins linear scanning with no automatic specificity prioritization, and a `:deviceId` wildcard will happily match the literal string `"all"`.

---

## OTA update pipeline

`update_server.js` (port 4000) handles APK upload, verification, and serving, independent of the main command server:

1. `POST /update/upload` — accepts a local APK path, verifies signature (via `apksigner`) against `EXPECTED_CHECKSUM`, extracts version info (via `aapt`), copies to the serving directory.
2. `GET /update/check` — device polls with its current `versionCode`.
3. `GET /update/download` — streams the APK.

**`apksigner`/`aapt` paths are hardcoded to a specific Android SDK build-tools version** in `config.js`. This must match an actually-installed build-tools version on the host machine — a mismatch fails silently inside a `try/catch` that swallows the "command not found" error and reports it as a generic signature-check failure, which is the actual root cause if you ever see `"Could not extract SHA256 from APK"` despite a correctly signed build.

---

## Setup

```bash
npm install
```

Place two credential files (not committed — see `.gitignore`):

```
service_accounts/firebase-service-account.json   — Firebase Console → Project Settings →
                                                     Service Accounts → Generate new private key
service_accounts/service-account.json            — Google Cloud Console → IAM & Admin →
                                                     Service Accounts → Keys → Create new key (JSON)
```

Update `config/constants.js`'s `KEY_FILE` path and `services/fcm.service.js`'s require path if your credential filenames/locations differ.

Confirm installed build-tools version and update `update-server` config accordingly:

```bash
ls $ANDROID_HOME/build-tools/
```

Start both servers:

```bash
node server/server.js          # command & control — port 3000
node server/update_server.js   # OTA distribution — port 4000
```

---

## Deploying an update

```bash
node scripts/deploy.js          # uploads APK, verifies signature + version
npm run push-update             # triggers CHECK_UPDATE via FCM, fleet-wide
npm run push-update-device -- "LENOVO Lenovo L19111"   # single device
```

A signature mismatch here almost always means one of: (a) the APK was built with a different keystore than the one used for original device provisioning, or (b) the hardcoded `apksigner` build-tools path in `update_server.js` doesn't exist on this machine and the verification silently failed for an unrelated reason. Check both before assuming the build itself is wrong.

---

## Known platform limitations affecting backend design

- **FCM `send()` success only confirms acceptance by Google's infrastructure, not delivery to the device.** There is no native delivery-confirmation API. The `/device/fcm/confirm` round-trip exists specifically to close this gap at the application level.
- **FCM does not guarantee in-order delivery across multiple independently-sent messages.** Commands that must execute in a specific order should not rely on transport-level ordering alone (the Android client serializes execution via a single-threaded coroutine dispatcher, but this only protects against same-process race conditions, not out-of-order delivery from FCM itself).
- **The provisioning QR's `PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME` must exactly match the live `DeviceAdminReceiver`'s fully-qualified class path.** If the Android app's package structure changes, this value (in `generate_provisioning_qr.js`) must be updated before re-provisioning any device — a stale value here will re-register a Device Owner binding that the running app code can no longer satisfy, surfacing as `SecurityException: Admin ComponentInfo{...} does not exist or is not owned by uid ...` on every subsequent policy call.

---

## Related repository

Android Custom DPC client: [SecureMdmPoc](https://github.com/uidai-umang/SecureMdmPoc)
