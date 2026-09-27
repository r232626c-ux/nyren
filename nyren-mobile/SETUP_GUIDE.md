# React Native Mobile App - Backend Connection Setup Guide

## Overview
This guide explains all the changes made to connect your React Native Expo app to your local backend running on `http://10.50.7.122:5000` for testing on a physical Android tablet.

---

## 📁 Files Modified

### 1. **services/config.js** (UPDATED)
**Purpose:** Central configuration for all API endpoints

**Key Changes:**
- Removed dependency on `expo-constants` (more portable)
- Hardcoded local IP: `10.50.7.122:5000`
- Support for multiple environments (development, staging, production)
- Automatic logging of configuration on app start

**Usage:**
```javascript
import { API_BASE_URL, BACKEND_URL, CONFIG } from './services/config';

console.log(CONFIG.API_BASE_URL); // http://10.50.7.122:5000/api
```

**Switching Environments:**
Edit the `CURRENT_ENV` variable in `config.js`:
```javascript
const CURRENT_ENV = __DEV__ ? 'development' : 'production';
```

---

### 2. **services/apiService.js** (ENHANCED)
**Purpose:** Axios API client with request/response interceptors

**Key Enhancements:**
- ✅ Added detailed console logging for all requests/responses
- ✅ Enhanced error handling with network failure detection
- ✅ `testBackendConnection()` - Test if backend is reachable
- ✅ `checkBackendHealth()` - Health check endpoint
- ✅ Proper timeout handling (15 seconds)

**Usage:**
```javascript
import { apiService, testBackendConnection, checkBackendHealth } from './services/apiService';

// Make API calls
const data = await apiService.getTrends();

// Test backend
const result = await testBackendConnection();
if (result.success) {
  console.log('Backend is working!');
}

// Health check
const health = await checkBackendHealth();
```

**Console Logs:**
```
[API REQUEST] GET http://10.50.7.122:5000/api/trends
[API RESPONSE] 200 GET /trends
[API ERROR] 500 GET /api/trends
[API ERROR] Network request failed - backend may be unreachable
```

---

### 3. **services/debugUtils.js** (NEW)
**Purpose:** Advanced debugging utilities for network issues

**Key Functions:**
- `debugLog(tag, message, data)` - Colored console logging
- `logNetworkRequest/Response()` - Detailed request/response logs
- `logAPIError()` - Comprehensive error logging
- `checkConnectivity()` - Detailed connectivity check with timing
- `printDebugInfo()` - Print full configuration info
- `exportDebugState()` - Export for bug reports

**Usage:**
```javascript
import { debugLog, checkConnectivity, printDebugInfo } from './services/debugUtils';

debugLog('API', 'Loading data...', { userId: '123' });
printDebugInfo(); // Shows all configuration
const connectivity = await checkConnectivity();
```

---

### 4. **screens/SettingsScreen.js** (TRANSFORMED)
**Purpose:** App settings with **backend connectivity testing**

**New Features:**
- 🔴🟢 Live backend connection status indicator
- 🧪 "Test Connection" button
- 📍 Display current API URL
- 📊 Show environment (Development/Production)
- 🔍 Real-time health check
- ✅ All existing settings preserved

**Backend Connection Details:**
```
API URL: http://10.50.7.122:5000/api
Environment: Local Development
Status: Connected/Disconnected
```

**Testing Backend:**
1. Open the **Settings** tab
2. Scroll to **"Backend Connection"** card
3. Click **"Test Connection"** button
4. See instant feedback on connection status

---

### 5. **screens/DashboardScreen.js** (ENHANCED)
**Purpose:** Main dashboard with backend status indicator

**New Features:**
- ✅ Green status bar when backend is connected
- ✗ Red status bar when backend is unreachable
- Auto-checks backend health on app load
- Non-blocking (continues loading even if backend is down)

**Status Indicator:**
```
✓ Backend Connected  (Green bar at top)
✗ Backend Disconnected  (Red bar at top)
```

---

### 6. **android/app/src/main/AndroidManifest.xml** (UPDATED)
**Purpose:** Android permissions for network access

**Permissions Added:**
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
```

These permissions are **REQUIRED** for network requests on Android.

---

### 7. **app.json** (UPDATED)
**Purpose:** Expo configuration with backend URL

**Updated Extra Config:**
```json
"extra": {
  "BACKEND_URL": "http://10.50.7.122:5000",
  "SOCKET_URL": "http://10.50.7.122:5000",
  "API_BASE_URL": "http://10.50.7.122:5000/api",
  "ENVIRONMENT": "development"
}
```

---

## ⚙️ Setup Steps

### Step 1: Update Backend IP
If your backend IP changes, update:
1. **services/config.js** - Change `LOCAL_IP = '10.50.7.122'`
2. **app.json** - Change `BACKEND_URL` in `extra`

### Step 2: Verify Backend is Running
```bash
# Test from your computer
curl http://10.50.7.122:5000/health

# Should return:
# {"status": "OK", "database": "PostgreSQL connected"}
```

### Step 3: Install Dependencies
```bash
cd nyren-mobile
npm install --legacy-peer-deps
```

### Step 4: Connect Android Tablet
```bash
# Enable USB debugging on tablet
# Connect via USB
npx react-native run-android

# OR use Expo
npx expo start
# Scan QR code with Expo Go app
```

### Step 5: Test Backend Connection
1. Open app on tablet
2. Go to **Settings** tab
3. Click **"Test Connection"** button
4. See result instantly

---

## 🧪 Testing Your Setup

### Test 1: Basic Connection
```javascript
// In SettingsScreen.js, click "Test Connection" button
// Should see: "✓ Backend connection successful!"
```

### Test 2: Fetch Data
```javascript
// Open DashboardScreen
// Should see trends, tasks, and sentiment data
// If empty, backend queries may be failing
```

### Test 3: Console Logs
```javascript
// Open Chrome DevTools (for Expo)
// Open Android Studio Logcat (for react-native)
// Look for [API REQUEST], [API RESPONSE], [API ERROR] logs
```

### Test 4: Network Debug
From SettingsScreen:
```javascript
// Import and call
import { printDebugInfo, checkConnectivity } from '../services/debugUtils';
printDebugInfo();  // Shows all URLs
checkConnectivity();  // Shows response time
```

---

## 🔍 Debugging Network Issues

### Issue: "Network request failed"

**Cause 1: Backend not running**
```bash
# On your backend machine
curl http://10.50.7.122:5000/health
# If this fails, start your backend
```

**Cause 2: IP address is different**
- Get tablet IP: `adb shell ifconfig`
- Get backend machine IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Update `config.js` with correct IP

**Cause 3: Firewall blocking**
```bash
# Windows: Open port 5000 in Windows Firewall
# Or disable firewall temporarily for testing
```

**Cause 4: App/Backend version mismatch**
- Check backend is running the latest code
- Check app is using latest `apiService.js`

### Issue: "Backend Disconnected" on Dashboard

1. Check backend health:
```bash
curl http://10.50.7.122:5000/health
```

2. Check app is calling right URL:
   - Open Settings > Backend Connection
   - Verify URL is `http://10.50.7.122:5000/api`

3. Check tablet network:
   - Open tablet WiFi settings
   - Confirm connected to same network as backend machine

### Issue: No Data Loading

1. Backend might be failing requests:
   - Check backend logs for errors
   - Verify database is connected
   - Check backend `/api` routes are working

2. API path might be wrong:
   - Verify `API_BASE_URL` in config.js
   - Check apiService.js methods call correct endpoints
   - Test with curl first

---

## 📱 Device Setup

### Android Tablet USB Debugging

1. **Developer Options:**
   - Settings > About > Build number (tap 7 times)
   - Back to Settings > Developer Options > USB Debugging (enable)

2. **Connect Device:**
```bash
adb devices  # Should list your tablet
```

3. **Run App:**
```bash
npx react-native run-android
```

4. **View Logs:**
```bash
adb logcat | grep -E "ReactNativeJS|API|Network"
```

---

## 🚀 Production Setup

To use a different backend in production:

### Option 1: Environment-based (Recommended)
```javascript
// services/config.js
const ENVIRONMENTS = {
  development: { baseURL: 'http://10.50.7.122:5000' },
  production: { baseURL: 'https://api.yourserver.com' },
};
const CURRENT_ENV = __DEV__ ? 'development' : 'production';
```

### Option 2: URL environment variable
```javascript
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://10.50.7.122:5000';
```

### Option 3: Remote config
```javascript
// Fetch from a config server
const config = await fetch('https://config.yourserver.com/config.json');
const { BACKEND_URL } = await config.json();
```

---

## 📊 API Endpoints Reference

Your backend should support these endpoints (already in apiService.js):

```
POST   /api/chat                    - Send message
GET    /api/memory                  - Get memories
POST   /api/users                   - Create user
GET    /api/users/:userId           - Get user
GET    /api/trends                  - Get trends
POST   /api/emotion/analyze         - Analyze emotion
GET    /api/tasks/:userId           - Get tasks
GET    /api/test                    - Test endpoint
GET    /health                      - Health check
```

Make sure your backend has these routes implemented!

---

## 📝 Logging Guide

### Enable Full Debug Logging

**In development**, the app automatically logs all network activity:

```
[TIME] [API REQUEST] GET http://10.50.7.122:5000/api/trends
[TIME] [API RESPONSE] 200 GET /trends
```

### View Logs

**Using Expo:**
```bash
npx expo start
# Press 'j' for logs (or check in browser console)
```

**Using Android Studio:**
```bash
adb logcat | grep -E "ReactNativeJS|API|Network|ERROR"
```

**Using Chrome DevTools (Expo):**
1. Press `j` in Expo CLI
2. Open http://localhost:19000/debugger-ui/

### Disable Logging in Production

In `apiService.js`, remove console.log calls or use:
```javascript
const isDev = __DEV__;
if (isDev) {
  console.log('[API]', message);
}
```

---

## ✅ Verification Checklist

- [ ] Backend running on http://10.50.7.122:5000
- [ ] Backend /health endpoint responds
- [ ] Android tablet connected via USB
- [ ] USB debugging enabled on tablet
- [ ] app.json has correct BACKEND_URL
- [ ] services/config.js has correct LOCAL_IP
- [ ] AndroidManifest.xml has INTERNET permission
- [ ] npm install completed successfully
- [ ] App launches on tablet
- [ ] Settings > Test Connection shows "Success"
- [ ] Dashboard shows data from backend
- [ ] Console shows API logs (no errors)

---

## 🆘 Support

If still having issues:

1. **Check Console Logs:**
   ```bash
   # Look for detailed error messages
   adb logcat | grep -i error
   ```

2. **Test Backend with curl:**
   ```bash
   curl -v http://10.50.7.122:5000/api/test
   ```

3. **Check Network:**
   - Ping backend from tablet: `ping 10.50.7.122`
   - Check both devices on same WiFi

4. **Export Debug Info:**
   - Use `printDebugInfo()` from debugUtils.js
   - Share logs with development team

---

## 📚 File Structure

```
nyren-mobile/
├── services/
│   ├── config.js           ← Backend URL configuration
│   ├── apiService.js       ← API client with interceptors
│   ├── debugUtils.js       ← Debug utilities (NEW)
│   └── ...
├── screens/
│   ├── DashboardScreen.js  ← Backend status indicator
│   ├── SettingsScreen.js   ← Backend connection testing
│   └── ...
├── app.json                ← Backend URL in extra config
├── App.js                  ← Main app
└── package.json
```

---

## 🎯 Next Steps

1. **Verify backend connection** using Settings screen
2. **Check console logs** for any API errors
3. **Test API endpoints** one by one
4. **Debug** using provided debug utilities
5. **Deploy** with production URL when ready

---

**Last Updated:** April 2026
**App Version:** 1.0.0
**Backend IP:** 10.50.7.122:5000
