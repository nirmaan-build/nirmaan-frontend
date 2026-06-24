/**
 * Base URL of the Nirmaan backend.
 *
 * IMPORTANT: a real phone cannot reach "localhost" — set this to your computer's
 * LAN IP, e.g. http://192.168.1.5:3000/api/v1 (find it with `ipconfig getifaddr en0`
 * on macOS). Android emulator can use http://10.0.2.2:3000/api/v1. See
 * apps/backend/TESTING-stage4.md.
 *
 * Kept as a plain constant (no react-native-config native dependency) so the
 * bare RN CLI app builds with zero extra native linking.
 */
// Simulator / emulator (no real device):
// export const API_URL = 'http://localhost:3000/api/v1';       // iOS Simulator
// export const API_URL = 'http://10.0.2.2:3000/api/v1';       // Android Emulator

// Real device on the same WiFi — replace with your Mac's LAN IP:
//   macOS: ipconfig getifaddr en0
export const API_URL = 'http://192.168.1.5:3000/api/v1';
