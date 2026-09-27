# 🚀 Nyx Backend - Startup Guide

## Overview
Your Nyx backend is ready to run! It's configured to use cloud services (MongoDB Atlas and Upstash Redis) instead of local installations. Follow these steps to get it running.

---

## Step 1: Obtain Cloud Service Credentials

### 1.1 MongoDB Atlas (Required)
1. Visit: https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a free cluster:
   - Click "Create" → Select free tier
   - Choose a region (US recommended)
   - Wait for cluster to deploy (3-5 minutes)
4. Get your connection string:
   - Click "Connect" → "Drivers"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`)
5. Replace the password and ensure the database name is `nyx`
   - Example: `mongodb+srv://myusername:mypassword@cluster0.mongodb.net/nyx?retryWrites=true&w=majority`

### 1.2 ollama API Key (Required)
1. Visit: https://platform.ollama.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. ⚠️ **Important**: Save this securely - you won't be able to view it again

### 1.3 Upstash Redis (Recommended but Optional)
1. Visit: https://upstash.com
2. Sign up for free
3. Click "Create Database"
4. Get your connection URL:
   - Copy the Redis URL (looks like: `rediss://default:password@host:port`)
5. This is optional - the app works without it but some features are enhanced with caching

### 1.4 Other API Keys (Optional)
- **ElevenLabs** (Voice): https://elevenlabs.io/app/settings/api-keys
- **D-ID** (Avatar): https://www.d-id.com/
- **NewsAPI** (Trends): https://newsapi.org/

---

## Step 2: Update Your .env File

1. Open: `C:\Users\complexb\Desktop\Nyran\nyren\backend\.env`
2. Replace the placeholder values with your credentials:

```env
# REQUIRED - MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/nyx?retryWrites=true&w=majority

# REQUIRED - ollama API Key
ollama_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE

# Optional - ElevenLabs API Key (for voice)
ELEVENLABS_API_KEY=sk_XXXXXXXXXXXX

# Optional - D-ID API Key (for avatars)
DID_API_KEY=your_api_key_here

# Optional - NewsAPI Key (for trends)
NEWSAPI_KEY=your_newsapi_key

# Optional - Upstash Redis URL
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST:6379

# Server Configuration
PORT=5000
NODE_ENV=development
```

3. Save the file (Ctrl+S)

---

## Step 3: Start the Backend Server

### Using PowerShell:

```powershell
# Navigate to backend directory
cd C:\Users\complexb\Desktop\Nyran\nyren\backend

# Start the server in development mode
npm run dev
```

### Expected Output:

When the server starts successfully, you should see:

```
============================================================
🚀 NYX BACKEND SERVER STARTED
============================================================
📍 Port: 5000
🌍 Environment: development
📊 MongoDB: ✅ Connected
📊 Redis: ✅ Connected

🔗 Health Check: http://localhost:5000/health
============================================================
```

---

## Step 4: Verify Backend is Running

Open a new PowerShell window and test the health endpoint:

```powershell
# Check if server is running
curl http://localhost:5000/health
```

### Expected Response:
```json
{
  "status": "OK",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ",
  "uptime": 2.345,
  "environment": "development",
  "database": {
    "mongodb": "connected",
    "redis": "connected"
  },
  "services": {
    "ollama": "configured",
    "elevenlabs": "configured"
  }
}
```

---

## Step 5: Test API Endpoints

Once the server is running, you can test the API endpoints. Here are some examples:

### Test Chat Endpoint:
```powershell
$headers = @{"Content-Type" = "application/json"}
$body = @{
    userId = "test-user-1"
    userInput = "Hello Nyx, how are you today?"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/chat" -Method POST -Headers $headers -Body $body
```

### Get User Memory:
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/memory/test-user-1" -Method GET
```

### Analyze Emotion:
```powershell
$headers = @{"Content-Type" = "application/json"}
$body = @{
    text = "I feel amazing today!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/emotion/analyze" -Method POST -Headers $headers -Body $body
```

---

## Troubleshooting

### Error: "Missing required environment variables"
**Solution**: 
- Verify your `.env` file has real values (not placeholders)
- Ensure `MONGODB_URI` and `ollama_API_KEY` are present
- Restart the server after updating `.env`

### Error: "Cannot connect to MongoDB"
**Solution**:
1. Check your MongoDB Atlas connection string in `.env`
2. Verify the connection string format (should start with `mongodb+srv://`)
3. Ensure your MongoDB cluster is in "Running" state
4. Check that your IP address is whitelisted in MongoDB Atlas:
   - Go to Security → Network Access
   - Add your IP address or allow from anywhere (0.0.0.0/0) for development

### Error: "Invalid API key" for ollama
**Solution**:
1. Verify the key starts with `sk-proj-` or `sk-`
2. Check that it's the full key (no truncation)
3. Ensure it has active credits in ollama account

### Error: "Port 5000 already in use"
**Solution**:
```powershell
# Find and kill the process using port 5000
Get-Process | Where-Object {$_.Handles -like "*5000*"} | Stop-Process -Force

# Or use a different port:
$env:PORT=5001
npm run dev
```

### Warning: "Redis operations will be limited"
**Solution** (Optional):
- This means REDIS_URL is not configured, but the app still works
- Redis is only for caching and task queue enhancement
- To enable: Get a Redis URL from Upstash and add to `.env`

---

## Next Steps

After the backend is running:

1. **Mobile App Setup**:
   ```powershell
   cd C:\Users\complexb\Desktop\Nyran\nyren\nyren-mobile
   npm install
   npm start
   ```

2. **Frontend Setup**:
   ```powershell
   cd C:\Users\complexb\Desktop\Nyran\nyren\frontend
   npm install
   npm start
   ```

3. **Connect Mobile to Backend**:
   - Update the API base URL in the mobile app to: `http://YOUR_COMPUTER_IP:5000`
   - On same network: Use your computer's local IP (e.g., 192.168.x.x)
   - On different network: Use your public IP or deploy to cloud

---

## Architecture Summary

```
🖥️  Ncomposed Backend (Node.js + Express)
    │
    ├── 📊 Database: MongoDB Atlas (Cloud)
    │   └── Stores: Users, Conversations, Emotions, Research, Tasks
    │
    ├── ⚡ Cache/Queue: Upstash Redis (Cloud)
    │   └── Powers: Task Queue, Caching, Real-time Events
    │
    ├── 🤖 AI Services:
    │   ├── ollama (Chat & Research)
    │   ├── ElevenLabs (Voice)
    │   ├── D-ID (Avatars)
    │   └── NewsAPI (Trends)
    │
    ├── 🔗 Real-time: Socket.io
    │   └── Mobile App ←→ Backend Communication
    │
    └── 🛡️  Security: Helmet, CORS, Authentication
```

---

## 🎉 You're Ready!

Your Nyx backend is now fully configured and ready to go. Just add your credentials and run `npm run dev`. The system will:

✅ Connect to MongoDB Atlas for data persistence
✅ Connect to Upstash Redis for caching (optional)
✅ Initialize all API routes
✅ Setup real-time Socket.io communication
✅ Start serving requests on port 5000

**Any questions?** Check the error messages - they provide actionable steps to fix issues!
