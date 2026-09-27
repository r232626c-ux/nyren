# Coli AI - Quick Start Guide for Testing

## 🚀 START THE BACKEND

### Prerequisites:
- Node.js 16+ installed
- PostgreSQL running and accessible
- Environment variables configured in `.env`

### Steps:
```bash
# Navigate to backend directory
cd nyren/backend

# Install dependencies (if not already done)
npm install

# Start the server
npm start

# Expected output:
# ✓ Server running on port 5000
# ✓ Database connected
# ✓ CORS enabled
# ✓ Routes registered (chat, search, memory, trends, users)
```

### Verify Backend Health:
```bash
# In a new terminal, test the health endpoint:
curl http://localhost:5000/health

# Expected response:
# { "status": "ok", "timestamp": "2024-01-15T..." }
```

---

## 📱 START THE MOBILE APP

### Prerequisites:
- Expo CLI installed: `npm install -g expo-cli`
- Physical device with Expo Go app OR Android emulator running
- Backend running on accessible IP

### Steps:
```bash
# Navigate to mobile directory
cd nyren/nyren-mobile

# Install dependencies (if not already done)
npm install

# Start Expo development server
npm start

# You'll see a QR code in the terminal

# Option A - Physical Device:
# - Open Expo Go app
# - Scan the QR code
# - App opens on device

# Option B - Android Emulator:
# - Press 'a' in terminal to open in Android emulator
# - Emulator will auto-start if not running
```

### First Launch:
- Welcome message from Coli appears
- Check console logs for backend connection status
- App should display "Backend connected successfully" in logs

---

## 🧪 TESTING WORKFLOW

### Test 1: Chat Mode (Default)
```
1. Verify mode button shows "💬 Chat" (blue)
2. Type: "Hello, what is machine learning?"
3. Expected: Streaming response with AI explanation
4. Audio should play automatically
5. Look for log: "[CHAT] Sending message via chat mode..."
```

### Test 2: Mode Toggle
```
1. Tap the mode button with blue border (💬 Chat)
2. Confirm alert appears: "Mode Changed: Switched to SEARCH mode"
3. Button should now show "🔍 Search" with red border
4. Tap again to switch back to chat mode
```

### Test 3: Search Mode
```
1. Switch to search mode (button shows "🔍 Search")
2. Type: "What is artificial intelligence?"
3. Expected: AI answer + Sources section below
4. Sources should show:
   - Title (blue, clickable)
   - Snippet (gray text)
   - URL (blue underlined)
5. Each source should be individually clickable
6. Look for log: "[SEARCH] API Response: {...}"
```

### Test 4: Source Interaction
```
1. In search mode, get search results with sources
2. Tap on any source
3. Expected: Alert popup showing source title
4. Alert options: "Close" and "Copy URL"
5. Verify source URL displays correctly
```

### Test 5: Error Handling
```
1. Stop the backend server
2. Try to send a message in chat mode
3. Expected: Error message
   "Connection refused. Please check if the backend server is running."
4. Restart backend
5. Error should clear on next message
```

### Test 6: Confidence Score
```
1. In search mode, get results
2. Below sources, should see: "Confidence: 85%"
3. Verify score displays as percentage
4. Score should be > 0 (not always shown if 0)
```

---

## 📊 DEBUGGING & LOGS

### Enable Console Logs:
```bash
# Mobile app logs appear in Expo terminal
# Look for these prefixes:
[API REQUEST]    # Outgoing API calls
[API RESPONSE]   # Responses received
[API ERROR]      # Network/API errors
[CHAT]          # Chat mode operations
[SEARCH]        # Search mode operations
[HEALTH]        # Backend health checks
[TEST]          # Connection tests
```

### View Full Logs:
```bash
# In Expo terminal, press 'i' to open in iOS simulator
# or 'a' for Android emulator
# Logs appear in real-time as you interact with app

# For more detailed backend logs:
cd nyren/backend
npm start -- --loglevel debug
```

### Common Test Queries:
- "What is AI?" → Chat mode
- "Latest news on AI" → Search mode
- "How do neural networks work?" → Chat mode
- "Best AI tools in 2024" → Search mode

---

## ✅ VERIFICATION CHECKLIST

### Backend Setup:
- [ ] Server listening on `0.0.0.0:5000`
- [ ] `/health` endpoint responds with `{ status: "ok" }`
- [ ] `/api/search/health` responds with search service status
- [ ] Database migrations complete (no SQL errors)
- [ ] All routes mounted: chat, search, memory, trends, users

### Frontend Setup:
- [ ] App launches without crashes
- [ ] Backend URL auto-detected (check logs for ✓)
- [ ] Mode button visible with correct label
- [ ] ChatInput accepts user messages
- [ ] Messages appear in FlatList without key warnings

### Search Feature:
- [ ] Mode toggle works (Chat ↔ Search)
- [ ] Search mode returns sources array
- [ ] Sources render with title, snippet, URL
- [ ] Each source is clickable
- [ ] Confidence score displays
- [ ] No console warnings

### Error Handling:
- [ ] Backend down → shows connection error
- [ ] Invalid query → shows error message
- [ ] Network timeout → shows timeout message
- [ ] App recovers when backend comes back

---

## 🔧 TROUBLESHOOTING

### Issue: "Cannot connect to backend"
```
Solution:
1. Verify backend is running: npm start (in backend directory)
2. Check port 5000 is available: netstat -an | grep 5000
3. Check backend URL in config.js is correct
4. Try manual health check: curl http://localhost:5000/health

# If emulator:
# Use 10.0.2.2:5000 instead of localhost:5000
```

### Issue: "Search returns no sources"
```
Solution:
1. Verify response includes sources array
2. Check message type is 'search':
   Look for: type: 'search' in state
3. Verify SearchMessage component rendering:
   Look for: "📚 Sources" header in UI
4. Check backend search route:
   POST /api/search returns proper format
```

### Issue: "FlatList duplicate key warning"
```
Solution:
1. Keys use Date.now() + random string
2. Should be unique per message
3. Check keyExtractor: (item) => item.id
4. Verify message IDs are not reused
5. Clear app cache: expo start --clear
```

### Issue: "Mode toggle not responding"
```
Solution:
1. Verify TouchableOpacity wraps button
2. Check handleModeToggle function exists
3. Verify setMode state update works
4. Clear Expo cache: expo start --clear
5. Restart Expo: Ctrl+C and npm start again
```

---

## 📈 PERFORMANCE TIPS

### Optimize for Better Performance:
```javascript
// In ChatScreen.js:
// 1. FlatList already uses ref for scroll optimization
// 2. Streaming effect uses 50ms delays
// 3. Messages memoized in state

// To improve:
// - Use React.memo() for MessageBubble component
// - Implement lazy loading for long message lists
// - Cache rendered components with useMemo()
```

### Network Optimization:
```javascript
// API service already implements:
// - Request/response interceptors
// - Dynamic backend discovery
// - Health checks with caching (5-min TTL)
// - Timeout handling (15 seconds)

// To further improve:
// - Implement request debouncing
// - Add response caching layer
// - Use pagination for large result sets
```

---

## 📝 FILE REFERENCE

### Key Files for Testing:

**Backend**:
- `backend/server.js` - Main server, route registration
- `backend/routes/search.js` - Search endpoint
- `backend/services/searchService.js` - Search logic
- `backend/models/Conversation.js` - Data persistence

**Frontend**:
- `nyren-mobile/screens/ChatScreen.js` - Main UI, mode toggle
- `nyren-mobile/services/apiService.js` - API calls
- `nyren-mobile/services/config.js` - Backend discovery
- `nyren-mobile/components/ChatInput.js` - Message input

---

## 🎯 SUCCESS CRITERIA

After testing, you should see:

✅ **Chat Mode**:
- Messages stream word-by-word
- Audio plays automatically
- No errors in console

✅ **Search Mode**:
- Results show answer + sources
- Each source is clickable
- Confidence score displays
- Sources render with proper styling

✅ **Mode Switching**:
- Toggle button responsive
- Visual feedback (color change)
- Routing correctly switches modes

✅ **Error Handling**:
- Descriptive error messages
- App recovers gracefully
- Logs show proper error categorization

✅ **No Runtime Errors**:
- No duplicate key warnings
- No unhandled promise rejections
- No console errors

---

## 📞 NEXT STEPS

After verifying all tests pass:

1. **Real Search Integration**: Replace simulated results with real API
2. **Source WebView**: Implement in-app source browsing
3. **Performance Optimization**: Profile and optimize based on metrics
4. **Production Deployment**: Deploy backend and publish mobile app

---

**Status**: Ready for comprehensive testing! 🚀
