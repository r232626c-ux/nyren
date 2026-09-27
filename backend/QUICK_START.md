# ⚡ Nyx Backend - 5 Minute Quick Start

## The 4-Step Process:

### 1️⃣ Get Your API Keys (2 minutes)
```
✅ MongoDB URI     → https://www.mongodb.com/cloud/atlas (free tier, copy connection string)
✅ ollama API Key  → https://platform.ollama.com/api-keys (copy key starting with "sk-")
```

### 2️⃣ Update `.env` File (1 minute)
Replace these in `C:\Users\complexb\Desktop\Nyran\nyren\backend\.env`:
```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@YOUR_CLUSTER.mongodb.net/nyx?retryWrites=true&w=majority
ollama_API_KEY=sk-proj-YOUR_KEY_HERE
```
Save file (Ctrl+S)

### 3️⃣ Start Backend (1 minute)
```powershell
cd C:\Users\complexb\Desktop\Nyran\nyren\backend
npm run dev
```

### 4️⃣ Test It Works (30 seconds)
Open a new PowerShell:
```powershell
curl http://localhost:5000/health
```

---

## Expected Success Output:

```
============================================================
🚀 NYX BACKEND SERVER STARTED
============================================================
📍 Port: 5000
🌍 Environment: development
📊 MongoDB: ✅ Connected
📊 Redis: ⚠️  Optional

🔗 Health Check: http://localhost:5000/health
============================================================
```

---

## What if something fails?

| Error | Fix |
|-------|-----|
| "Missing MONGODB_URI" | Add real MongoDB connection to `.env` |
| "Invalid API key" | Verify ollama key matches exactly (starts with `sk-proj-` or `sk-`) |
| "Cannot reach MongoDB" | Check MongoDB cluster is running in Atlas + your IP is whitelisted |
| "Port 5000 in use" | Change PORT in `.env` to 5001 or kill process: `Get-Process node \| Stop-Process -Force` |
| "REDIS_URL not defined" | That's OK! Redis is optional. Either add Upstash URL or ignore |

---

## Ready for more details?
See `STARTUP_GUIDE.md` in this folder for full setup instructions and troubleshooting.

## Next: Start Your Mobile App
```powershell
cd C:\Users\complexb\Desktop\Nyran\nyren\nyren-mobile
npm install
npm start
```
