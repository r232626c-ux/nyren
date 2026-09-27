# 📚 Nyx Backend - API Reference

## Base URL
```
http://localhost:5000
```

---

## Health Check

### Get Server Status
```
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-04-09T10:30:45.123Z",
  "uptime": 125.456,
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

## Chat Endpoint

### Send Message & Get Response
```
POST /api/chat
```

**Request Body:**
```json
{
  "userId": "user-123",
  "userInput": "Hi Nyx, what's your name?",
  "sessionContext": {
    "bondLevel": 5,
    "lastEmotionalState": "happy"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "message": "I'm Nyx, your AI companion. I'm here to help you achieve your goals.",
    "emotion": "warm",
    "tone": "encouraging",
    "emotionalMemory": {
      "userId": "user-123",
      "mood": "warm",
      "trigger": "greeting",
      "response": "engaging"
    }
  },
  "timestamp": "2024-04-09T10:30:45.123Z"
}
```

---

## Memory Endpoint

### Retrieve User Memory
```
GET /api/memory/:userId
```

**Parameters:**
- `:userId` - User identifier (e.g., "user-123")

**Response:**
```json
{
  "success": true,
  "userId": "user-123",
  "memory": {
    "conversations": [
      {
        "_id": "conv-1",
        "userInput": "Hello Nyx",
        "coliResponse": "Hello! How can I help?",
        "emotion": "friendly",
        "timestamp": "2024-04-09T10:00:00Z"
      }
    ],
    "emotionalMemory": [
      {
        "mood": "happy",
        "tone": "enthusiastic",
        "trigger": "achievement",
        "frequency": 3
      }
    ],
    "researchMemory": [
      {
        "idea": "AI ethics implications",
        "category": "technology",
        "notes": "Important for responsible AI"
      }
    ],
    "totalConversations": 42,
    "bondLevel": 8.5,
    "lastInteraction": "2024-04-09T10:30:45Z"
  }
}
```

---

## Emotion Analysis Endpoint

### Analyze Text Emotion
```
POST /api/emotion/analyze
```

**Request Body:**
```json
{
  "userId": "user-123",
  "text": "I'm feeling absolutely amazing today!",
  "context": "morning-greeting"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "primaryEmotion": "joy",
    "emotionScores": {
      "joy": 0.92,
      "surprise": 0.05,
      "trust": 0.03
    },
    "sentiment": "positive",
    "confidence": 0.96,
    "suggestedTone": "celebratory",
    "personalityAdjustment": {
      "bondLevel": "+0.2",
      "trustScore": "+0.15"
    }
  },
  "timestamp": "2024-04-09T10:30:45.123Z"
}
```

---

## Trends Endpoint

### Get Trend Predictions
```
GET /api/trends
```

**Query Parameters (Optional):**
- `category`: Filter by category (tech, business, science, health, entertainment)
- `limit`: Number of trends to return (default: 10)
- `verified`: Show only verified trends (true/false)

**Response:**
```json
{
  "success": true,
  "trends": [
    {
      "_id": "trend-1",
      "prediction": "AI will revolutionize healthcare diagnostics",
      "category": "technology",
      "confidence": 0.87,
      "verificationStatus": "verified",
      "evidenceCount": 5,
      "sources": ["arxiv.org", "nature.com"],
      "timestamp": "2024-04-09T10:30:45Z",
      "expiresAt": "2024-05-09T10:30:45Z"
    }
  ],
  "totalTrends": 1,
  "generatedAt": "2024-04-09T10:30:45Z"
}
```

---

## Tasks Endpoint

### Create New Task
```
POST /api/tasks
```

**Request Body:**
```json
{
  "userId": "user-123",
  "taskType": "research",
  "description": "Research latest machine learning papers",
  "priority": "high",
  "deadline": "2024-04-15T18:00:00Z",
  "metadata": {
    "topic": "machine learning",
    "keywords": ["neural networks", "transformers"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "task": {
    "_id": "task-1",
    "userId": "user-123",
    "taskType": "research",
    "description": "Research latest machine learning papers",
    "status": "pending",
    "priority": "high",
    "createdAt": "2024-04-09T10:30:45Z",
    "deadline": "2024-04-15T18:00:00Z",
    "executionLogs": [],
    "result": null
  }
}
```

### Get Task Status
```
GET /api/tasks/:taskId
```

**Response:**
```json
{
  "success": true,
  "task": {
    "_id": "task-1",
    "userId": "user-123",
    "taskType": "research",
    "status": "completed",
    "result": {
      "papers": [
        {
          "title": "Attention is All You Need",
          "authors": ["Vaswani et al"],
          "year": 2017,
          "summary": "Introduced transformer architecture..."
        }
      ],
      "completion": "2024-04-12T08:15:30Z"
    }
  }
}
```

---

## Research Endpoint

### Generate Research Ideas
```
POST /api/research
```

**Request Body:**
```json
{
  "userId": "user-123",
  "topic": "artificial intelligence in education",
  "depth": "deep",
  "includeAcademicPapers": true
}
```

**Response:**
```json
{
  "success": true,
  "research": {
    "_id": "research-1",
    "userId": "user-123",
    "topic": "artificial intelligence in education",
    "ideas": [
      {
        "idea": "Personalized learning paths using AI",
        "description": "Using machine learning to adapt content...",
        "keywords": ["ML", "personalization", "education"],
        "potentialImpact": "high"
      }
    ],
    "academicReferences": [
      {
        "title": "AI in Education: A Survey",
        "authors": ["Smith, J.", "Doe, A."],
        "url": "https://arxiv.org/..."
      }
    ],
    "analysis": {
      "trendingTopics": ["AI tutoring", "adaptive learning"],
      "researchGaps": ["Real-time adaptation"]
    },
    "createdAt": "2024-04-09T10:30:45Z"
  }
}
```

---

## WebSocket Events (Real-time)

### Connect to WebSocket
```javascript
const socket = io('http://localhost:5000');

// Join user room
socket.emit('join', 'user-123');

// Listen for responses
socket.on('chat-response', (data) => {
  console.log('Response:', data.message);
});

// Send chat message
socket.emit('chat-message', {
  userId: 'user-123',
  message: 'Hello Nyx'
});
```

### Available Events

**Client → Server:**
- `join` - Join user's room
- `chat-message` - Send chat message
- `typing` - Notify typing
- `disconnect` - Disconnect

**Server → Client:**
- `chat-response` - Response to user message
- `typing-indicator` - User is typing
- `notification` - Real-time notification
- `task-update` - Task status update

---

## Error Responses

All endpoints follow this error format:

```json
{
  "success": false,
  "error": "Error description",
  "errorCode": "INVALID_REQUEST",
  "timestamp": "2024-04-09T10:30:45Z"
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_REQUEST | 400 | Missing or invalid parameters |
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | User not authenticated |
| DATABASE_ERROR | 500 | Database connection issue |
| SERVICE_UNAVAILABLE | 503 | External service unavailable |

---

## Request/Response Headers

### Request Headers

```
Content-Type: application/json
```

### Response Headers

```
Content-Type: application/json
X-Powered-By: Nyx-Backend
X-Request-ID: <unique-id>
```

---

## Rate Limiting

- **Default**: 100 requests per minute per user
- **Chat endpoint**: 30 requests per minute per user
- **Research endpoint**: 5 requests per minute per user

When rate limited, you'll receive:
```json
{
  "error": "Too many requests",
  "retryAfter": 60
}
```

---

## Authentication (Coming Soon)

Future versions will include:
- JWT token authentication
- API key management
- OAuth 2.0 integration
- Role-based access control

---

## Testing with cURL

### Test Health Endpoint
```bash
curl http://localhost:5000/health
```

### Test Chat Endpoint
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "userInput": "Hello Nyx!"
  }'
```

### Test Memory Endpoint
```bash
curl http://localhost:5000/api/memory/test-user
```

---

## Testing with Postman

1. Import this collection:
   - Open Postman
   - Click "Import"
   - Paste the JSON below:

```json
{
  "info": {
    "name": "Nyx Backend API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/health"
      }
    },
    {
      "name": "Chat",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/chat",
        "body": {
          "mode": "raw",
          "raw": "{\"userId\": \"user-123\", \"userInput\": \"Hello Nyx\"}"
        }
      }
    },
    {
      "name": "Get Memory",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/memory/user-123"
      }
    }
  ]
}
```

---

## WebSocket Testing with Node.js

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('join', 'test-user');
  
  socket.emit('chat-message', {
    userId: 'test-user',
    message: 'Hello Nyx!'
  });
});

socket.on('chat-response', (data) => {
  console.log('Response:', data);
});

socket.on('error', (err) => {
  console.error('Error:', err);
});
```

---

## Performance & Limits

| Endpoint | Timeout | Max Request Size | Max Response Size |
|----------|---------|------------------|-------------------|
| `/health` | 5s | 1MB | 1MB |
| `/api/chat` | 30s | 10MB | 50MB |
| `/api/memory` | 15s | 1MB | 50MB |
| `/api/emotion/analyze` | 10s | 5MB | 10MB |
| `/api/trends` | 15s | 1MB | 50MB |
| `/api/tasks` | 10s | 5MB | 10MB |
| `/api/research` | 30s | 10MB | 100MB |

---

## Support & Documentation

- **Backend Guide**: See `STARTUP_GUIDE.md`
- **Quick Start**: See `QUICK_START.md`
- **Deployment**: See `DEPLOYMENT_CHECKLIST.md`
- **Issues?**: Check error messages - they provide actionable guidance!
