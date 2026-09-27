# Coli - Advanced AI Companion System

Coli is a production-ready mobile AI companion system featuring emotional intelligence, long-term memory, voice interaction, avatar-based communication, research + trend prediction engine, and autonomous task execution.

## 🚀 Features

- **Emotional Intelligence**: Detects and adapts to user emotions
- **Long-term Memory**: Stores all conversations and builds relationship over time
- **Voice Interaction**: Speech-to-text and text-to-speech capabilities
- **Avatar System**: Emotional avatar that reacts to conversations
- **Research Engine**: AI-powered research suggestions and analysis
- **Trend Prediction**: Analyzes news and research for future predictions
- **Task Automation**: Background task execution with BullMQ
- **Real-time Communication**: Socket.io for live updates

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Database**: MongoDB with structured collections
- **AI**: ollama API integration
- **Voice**: ElevenLabs TTS
- **Avatar**: D-ID API integration
- **Queue**: BullMQ with Redis
- **Real-time**: Socket.io

### Frontend (React Native - Android First)
- **Navigation**: React Navigation
- **Voice**: react-native-voice
- **UI**: Clean, modern design with real-time updates

## 📋 Prerequisites

- Node.js 18+
- MongoDB
- Redis
- Expo CLI (for mobile development)
- API Keys:
  - ollama API Key
  - ElevenLabs API Key
  - D-ID API Key
  - NewsAPI Key

## 🛠️ Installation & Setup

### 1. Backend Setup

```bash
cd nyren/backend

# Install dependencies
npm install

# Create .env file with your API keys
cp .env.example .env
# Edit .env with your actual keys

# Start MongoDB and Redis services
# On Windows, you can use MongoDB Community Server and Redis for Windows

# Start the backend server
npm run dev
```

### 2. Mobile App Setup

```bash
cd nyren-mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android device/emulator
npm run android
```

### 3. Environment Configuration

Create `.env` files in both backend and mobile directories:

**Backend .env:**
```
MONGODB_URI=mongodb://localhost:27017/coli
ollama_API_KEY=your_ollama_key
ELEVENLABS_API_KEY=your_elevenlabs_key
DID_API_KEY=your_did_key
NEWSAPI_KEY=your_newsapi_key
REDIS_URL=redis://localhost:6379
PORT=5000
NODE_ENV=development
```

**Mobile `.env` for offline Ollama:**
```
# Android emulator uses 10.0.2.2 to reach the development PC.
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:5000
EXPO_PUBLIC_OLLAMA_MODEL=qwen2.5:0.5b
```

For a physical phone, set `EXPO_PUBLIC_API_BASE_URL` to the development PC's Wi-Fi/LAN address, for example `http://192.168.1.20:5000`. Keep the phone and PC on the same local network and allow inbound TCP port 5000 through Windows Firewall. The backend listens on the network interface and calls Ollama on the PC at `http://127.0.0.1:11434`; Ollama itself does not need to be exposed to the network. Install the default compact model once with `ollama pull qwen2.5:0.5b`, then start Ollama and the backend before using the app. Offline chat requests are sent to the backend in local-only mode, so they do not fall back to cloud providers. Set `OLLAMA_MODEL` in the backend environment and `EXPO_PUBLIC_OLLAMA_MODEL` in the mobile environment to select a different model already installed locally.

## 🗄️ Database Schema

### Collections:
- **users**: User profiles and preferences
- **conversations**: Chat history with emotional context
- **emotional_memory**: Mood tracking and adaptation data
- **research_memory**: Saved ideas and experiments
- **trend_history**: Predictions and outcomes
- **tasks_queue**: Scheduled and background tasks

## 📱 Mobile App Screens

1. **Dashboard**: Overview of trends, emotional status, tasks, and insights
2. **Voice Screen**: Live conversation with avatar and voice controls
3. **Research Screen**: AI-generated research ideas and trend predictions
4. **Memory Screen**: Emotional journey and conversation history
5. **Settings**: Voice, avatar, and personality customization

## 🔧 API Endpoints

### Chat
- `POST /api/chat` - Send message and get AI response

### Memory
- `GET /api/memory/conversations/:userId` - Get conversation history
- `GET /api/memory/emotional/:userId` - Get emotional memory
- `GET /api/memory/research/:userId` - Get research memory

### Emotion
- `POST /api/emotion/analyze` - Analyze text emotion
- `GET /api/emotion/bond/:userId` - Get bond level

### Trends
- `GET /api/trends` - Get trend predictions
- `POST /api/trends/generate` - Generate new predictions

### Tasks
- `GET /api/tasks/:userId` - Get user tasks
- `POST /api/tasks` - Create new task

### Research
- `POST /api/research/suggest/:userId` - Generate research ideas

## 🎯 Usage

1. **Start Backend**: `npm run dev` in backend directory
2. **Start Mobile App**: `npm start` in nyren-mobile directory
3. **Connect**: Ensure mobile app points to correct backend URL
4. **Interact**: Use voice or text to communicate with Nyx
5. **Explore**: Check research suggestions and trend predictions

## 🔒 Security Notes

- Store API keys securely (use environment variables)
- Implement proper authentication for production
- Validate all user inputs
- Use HTTPS in production
- Rate limit API calls

## 🚀 Deployment

### Backend Deployment
- Use services like Heroku, Railway, or AWS
- Set up MongoDB Atlas for database
- Configure Redis (Redis Labs or AWS ElastiCache)
- Set environment variables

### Mobile Deployment
- Build APK for Android: `expo build:android`
- Submit to Google Play Store
- Configure production API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- ollama for GPT models
- ElevenLabs for text-to-speech
- D-ID for avatar technology
- NewsAPI for news data
- Expo for React Native development

---

**Nyx** - Your intelligent companion for the future. 🌌