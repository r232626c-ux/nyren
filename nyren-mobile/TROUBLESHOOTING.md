// QUICK REFERENCE - Android Network Troubleshooting
// =================================================

// 1. TEST IF BACKEND IS REACHABLE FROM TABLET
// ============================================
adb shell
ping 10.50.7.122  // Should get responses
curl http://10.50.7.122:5000/health  // Should return JSON

// 2. COMMON NETWORK ERRORS & FIXES
// =================================

// ERROR: "Network request failed"
// FIX: 
// - Verify backend is running: curl http://10.50.7.122:5000/health
// - Check IP is correct in config.js
// - Restart backend
// - Check firewall on backend machine

// ERROR: "Cannot connect to X.X.X.X"
// FIX:
// - Get correct IP: ipconfig (desktop) or ip addr (tablet)
// - Update services/config.js with correct IP
// - Verify both devices on same network

// ERROR: "ECONNREFUSED"
// FIX:
// - Backend not running
// - Wrong port (should be 5000)
// - Wrong IP address

// ERROR: "ETIMEDOUT"
// FIX:
// - Network is slow
// - Backend not responding
// - Firewall blocking

// 3. ENABLE DETAILED LOGGING
// ==========================

// In the app:
import { printDebugInfo, checkConnectivity } from './services/debugUtils';

// Call from any screen component:
useEffect(() => {
  printDebugInfo();        // Shows all config
  checkConnectivity();     // Tests backend
}, []);

// Console will show:
// [CONFIG] Environment: Local Development
// [CONFIG] API Base URL: http://10.50.7.122:5000/api
// [DEBUG] === DEBUG INFO === { ... detailed config ... }
// [SUCCESS] Backend is reachable (245ms) { status: "OK", database: "PostgreSQL connected" }

// 4. CHECK DEVICE NETWORK
// =======================
adb shell ifconfig  // Get tablet IP
adb shell getprop ro.com.google.clientidbase  // Device info

// Verify tablet can reach backend:
adb shell ping -c 4 10.50.7.122

// 5. REAL-TIME LOG VIEWING
// ========================
adb logcat | grep -E "ReactNativeJS|API|Network|ERROR"
// or for all logs:
adb logcat

// 6. TEST API ENDPOINTS MANUALLY
// ==============================

// Test health endpoint:
curl http://10.50.7.122:5000/health

// Test API endpoint:
curl http://10.50.7.122:5000/api/test

// Test with headers:
curl -H "Content-Type: application/json" http://10.50.7.122:5000/api/trends

// 7. CONFIGURATION CHANGES
// ========================

// STEP 1: Update IP if changed
// File: services/config.js
const LOCAL_IP = '10.50.7.122';  // ← Change this
const LOCAL_PORT = 5000;

// STEP 2: Update app.json
// File: app.json
"extra": {
  "BACKEND_URL": "http://10.50.7.122:5000"  // ← Change this
}

// STEP 3: Reload app
npx expo start
// Press 'r' in terminal to reload

// 8. DATABASE CONNECTION CHECK
// ============================

// Backend should report in /health:
{
  "status": "OK",
  "database": "PostgreSQL connected"
}

// If shows "Not connected", restart backend database

// 9. FIREWALL TROUBLESHOOTING
// ===========================

// Windows:
// 1. Open Windows Defender Firewall
// 2. Click "Allow an app through firewall"
// 3. Find Node.js or your backend service
// 4. Check both Private and Public

// macOS:
sudo lsof -i :5000  // See what's using port 5000

// Linux:
sudo ufw allow 5000/tcp

// 10. BACKEND LOGS
// ================

// From backend machine, check if requests are coming in:
// Look for lines like:
// [API REQUEST] GET /api/trends
// [API RESPONSE] 200 GET /api/trends

// If no requests appear, network is not connecting

// 11. PERFORMANCE TIPS
// ====================

// Monitor response times:
import { checkConnectivity } from './services/debugUtils';
const { responseTime } = await checkConnectivity();
console.log(`Backend response time: ${responseTime}ms`);

// Slow if > 1000ms, check network or backend performance

// 12. RESET TO DEFAULT CONFIG
// ===========================

// If completely broken, reset to factory settings:

// services/config.js:
const LOCAL_IP = '10.50.7.122';
const LOCAL_PORT = 5000;

// app.json:
"BACKEND_URL": "http://10.50.7.122:5000"

// Then rebuild app:
npm install
npx expo start

// 13. USEFUL COMMANDS
// ===================

// View device list:
adb devices -l

// Install and run app:
adb reverse tcp:8081 tcp:8081
npx react-native run-android

// Access tablet shell:
adb shell

// Clear app cache:
adb shell pm clear com.anonymous.colimobile

// Reset all adb connections:
adb kill-server
adb start-server

// 14. ENVIRONMENT VARIABLES
// ==========================

// Development (automatic):
NODE_ENV=development npx expo start

// Production:
NODE_ENV=production npx expo start

// Both use config.js to switch environment

// 15. ASKED QUESTIONS CHECKLIST
// ==============================

// Q: App says "Backend Disconnected" - what do I do?
// A: 
// 1. Check backend is running: curl http://10.50.7.122:5000/health
// 2. Verify IP in config.js matches your backend machine
// 3. Check tablet is on same WiFi
// 4. Click Settings > Test Connection

// Q: Tablets can't reach backend - where's the problem?
// A:
// 1. Check connectivity: adb shell ping 10.50.7.122
// 2. Test backend: curl http://10.50.7.122:5000/health
// 3. Check firewall on backend machine
// 4. Verify correct IP address

// Q: How do I know if backend is working?
// A:
// adb shell curl http://10.50.7.122:5000/health
// Should return: {"status":"OK","database":"PostgreSQL connected"}

// Q: Data not loading - is it network or backend?
// A:
// 1. Settings > Test Connection (if success, network is OK)
// 2. Check backend logs for API errors
// 3. Verify database in backend is running

// Q: How do I change the backend IP?
// A:
// 1. Update services/config.js (LOCAL_IP)
// 2. Update app.json (extra.BACKEND_URL)
// 3. Restart app: npm run android or npx expo start

// 16. KEY FILES TO CHECK
// ======================

println("services/config.js");        // Backend IP/URL
println("services/apiService.js");    // API client
println("screens/SettingsScreen.js"); // Test connection feature
println("app.json");                   // Config variables

// 17. LAST RESORT DEBUGGING
// ==========================

// Export full debug state:
import { exportDebugState } from './services/debugUtils';
const state = exportDebugState();
console.log('DEBUG STATE:', JSON.stringify(state, null, 2));
// Share this with the team for debugging
