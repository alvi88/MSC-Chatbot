# 🔬 MagnifiScience AI Chat Assistant

A modern, interactive chatbot powered by Ollama that serves as a science assistant for the MagnifiScience Centre. Built with React and Node.js, featuring a beautiful, branded interface with AI-powered responses.

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Docker Deployment](#-docker-deployment)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Customization](#-customization)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## 🎯 Overview

The MagnifiScience AI Chat Assistant is an intelligent conversational agent designed to help visitors explore scientific concepts, learn about exhibits, and engage with science in an interactive way. It combines:

- **Local AI Models** - Powered by Ollama for fast, private responses
- **Modern Web Interface** - Built with React for seamless user experience
- **Science-Focused Design** - Branded to match the MagnifiScience Centre
- **Container Ready** - Fully Dockerized for easy deployment

---

## ✨ Features

### Core Features
- 🤖 **AI-Powered Conversations** - Local Ollama integration for fast, private responses
- 🎨 **Branded Interface** - Styled to match the MagnifiScience Centre identity
- 💬 **Real-time Chat** - Smooth, responsive messaging experience
- 🌊 **Markdown Support** - Rich text formatting with code syntax highlighting
- 🔄 **Conversation Memory** - Maintains context throughout the chat session
- 🖼️ **Branded Watermark** - Custom logo appears on AI responses
- 🧹 **Chat Management** - Clear conversation with disabled button when empty
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

### Technical Features
- 🔌 **Ollama Integration** - Free, local AI models with web search capability
- 🐳 **Docker Ready** - Easy deployment with Docker and Docker Compose
- 🔒 **Secure by Default** - Non-root user in containers, environment variables
- ⚡ **Optimized Performance** - Nginx caching, Gzip compression
- 🔄 **Health Checks** - Automatic monitoring and recovery
- 📊 **Token Usage Tracking** - Monitor AI response length and costs

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Ollama](https://ollama.com/) (for local AI models)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### One-Click Setup (With Docker)

```bash
# Clone the repository
git clone https://github.com/yourusername/msc-chatbot.git
cd msc-chatbot

# Start everything with Docker
docker-compose up -d --build

# Pull the AI model
docker exec -it msc-ollama ollama pull qwen3:4b

# Open your browser at http://localhost
```

### Manual Setup (Without Docker)

```bash
# Clone the repository
git clone https://github.com/yourusername/msc-chatbot.git
cd msc-chatbot

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start Ollama
ollama serve

# Pull the model
ollama pull qwen3:4b

# Start backend (in one terminal)
cd backend
npm start

# Start frontend (in another terminal)
cd frontend
npm start

# Open your browser at http://localhost:3000
```

---

## 📦 Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/msc-chatbot.git
cd msc-chatbot
```

### Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 3: Configure Environment Variables

```bash
# Copy example .env file
cp backend/.env.example backend/.env

# Edit with your settings
nano backend/.env
```

### Step 4: Install Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from [ollama.com/download/windows](https://ollama.com/download/windows)

### Step 5: Pull AI Model

```bash
# Recommended model for tool calling
ollama pull qwen3:4b

# Alternative models
ollama pull llama3.1
ollama pull mistral
ollama pull gemma2
```

### Step 6: Start the Application

```bash
# Start Ollama (keep running)
ollama serve

# Start backend (in a new terminal)
cd backend
npm start

# Start frontend (in a new terminal)
cd frontend
npm start
```

### Step 7: Access Your Chatbot

Open your browser and navigate to: `http://localhost:3000`

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
PORT=3001
NODE_ENV=production

# Model Configuration
DEFAULT_MODEL=qwen3:4b

# Optional: Web Search API Key
OLLAMA_API_KEY=your_api_key_here
```

### Available Models

| Model | Description | Command |
|-------|-------------|---------|
| `qwen3:4b` | Best for tool calling & web search (Recommended) | `ollama pull qwen3:4b` |
| `llama3.1` | General purpose, good for chat | `ollama pull llama3.1` |
| `mistral` | Fast and capable | `ollama pull mistral` |
| `gemma2` | Google's open model | `ollama pull gemma2` |
| `phi3` | Lightweight, runs on any hardware | `ollama pull phi3` |
| `codellama` | Specialized for code generation | `ollama pull codellama` |

### Changing Default Model

**Option 1: Environment Variable**
```bash
# In backend/.env
DEFAULT_MODEL=llama3.1
```

**Option 2: Docker Compose**
```yaml
# In docker-compose.yml
backend:
  environment:
    - DEFAULT_MODEL=llama3.1
```

**Option 3: API Request**
```javascript
// In frontend
await sendMessage({
  message: "Hello",
  model: "mistral"  // Override default
});
```

---

## 🐳 Docker Deployment

### Prerequisites
- [Docker](https://www.docker.com/) (24.x or higher)
- [Docker Compose](https://docs.docker.com/compose/) (v2.x or higher)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/yourusername/msc-chatbot.git
cd msc-chatbot

# Build and start all containers
docker-compose up -d --build

# Pull the AI model
docker exec -it msc-ollama ollama pull qwen3:4b

# Access at http://localhost
```

### Docker Services

| Service | Container Name | Port | Purpose |
|---------|---------------|------|---------|
| **Backend** | `msc-backend` | 3001 | Node.js API server |
| **Frontend** | `msc-frontend` | 80 | React web interface |
| **Ollama** | `msc-ollama` | 11434 | AI model server |

### Docker Commands

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (deletes models)
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

### Docker Production Configuration

Create `docker-compose.prod.yml` for production:

```yaml
version: '3.8'

services:
  backend:
    restart: always
    environment:
      - NODE_ENV=production
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    restart: always

  ollama:
    restart: always
    volumes:
      - ollama_data:/root/.ollama
```

---

## 📁 Project Structure

```
msc-chatbot/
├── backend/
│   ├── server.js              # Express server with Ollama integration
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
│   └── .env.example           # Example environment file
├── frontend/
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API services
│   │   │   └── chatService.js # Backend communication
│   │   ├── App.js             # Main application
│   │   ├── App.css            # Styling
│   │   ├── index.js           # Application entry
│   │   └── logo.png           # Brand logo
│   ├── package.json           # Frontend dependencies
│   └── .env                   # Frontend environment
├── Dockerfile.backend         # Backend Docker image
├── Dockerfile.frontend        # Frontend Docker image
├── docker-compose.yml         # Docker orchestration
├── nginx.conf                 # Nginx configuration
├── .dockerignore              # Docker ignore rules
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

---

## 🔌 API Reference

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "ollama": "connected",
  "models": ["qwen3:4b", "llama3.1"],
  "defaultModel": "qwen3:4b"
}
```

### Send Message
```http
POST /api/chat
```

**Request Body:**
```json
{
  "message": "What is the water cycle?",
  "conversationId": "conv_1234567890",
  "model": "qwen3:4b",
  "temperature": 0.7,
  "maxTokens": 512,
  "systemPrompt": "You are a helpful science assistant"
}
```

**Response:**
```json
{
  "success": true,
  "conversationId": "conv_1234567890",
  "reply": "The water cycle describes how water moves...",
  "usage": {
    "total_tokens": 256,
    "prompt_tokens": 120,
    "completion_tokens": 136
  },
  "model": "qwen3:4b"
}
```

### Get Conversation
```http
GET /api/conversations/:id
```

### Clear Conversation
```http
DELETE /api/conversations/:id
```

---

## 🎨 Customization

### Changing Colors and Branding

Update `frontend/src/App.css`:

```css
/* Primary Colors */
:root {
  --primary-teal: #0A4B5C;
  --primary-yellow: #F5B041;
  --bg-light: #f8fafc;
  --text-dark: #1a2b3c;
}

/* Header Logo */
.app-logo {
  height: 40px;
  width: auto;
}
```

### Modifying AI Behavior

Update `frontend/src/App.js`:

```javascript
const settings = {
  model: 'qwen3:4b',           // Change default model
  temperature: 0.7,            // 0-1 (higher = more creative)
  maxTokens: 512,              // Max response length
  systemPrompt: 'You are a helpful science assistant at the MagnifiScience Centre.'
};
```

### Adding Custom Suggestions

```javascript
// In App.js, update the suggestions
const suggestions = [
  { text: 'What is the water cycle?', emoji: '💧' },
  { text: 'Explain gravity like I\'m 5', emoji: '🌍' },
  { text: 'How do volcanoes erupt?', emoji: '🌋' },
  // Add your own suggestions
];
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Port 3001 is already in use"**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
```

**2. "Ollama connection refused"**
```bash
# Start Ollama
ollama serve

# Check if running
ps aux | grep ollama
```

**3. "Model not found"**
```bash
# List installed models
ollama list

# Pull the model
ollama pull qwen3:4b
```

**4. "Docker build fails"**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**5. "Frontend not connecting to backend"**
```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Check frontend proxy settings
# In frontend/package.json
"proxy": "http://localhost:3001"
```

### Logs and Debugging

```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# Ollama logs
docker-compose logs ollama

# All logs in real-time
docker-compose logs -f
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style

- Use ESLint and Prettier
- Follow React best practices
- Write meaningful commit messages
- Update documentation for new features

---

## 📝 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

© 2026 MagnifiScience Centre. All rights reserved.

---

## 🙏 Acknowledgments

- [MagnifiScience Centre](https://www.magnifiscience.org/) for the brand inspiration
- [Ollama](https://ollama.com/) for the amazing local AI platform
- [React](https://reactjs.org/) for the UI framework
- [Node.js](https://nodejs.org/) for the backend runtime
- [Docker](https://www.docker.com/) for containerization
- All open-source contributors

---

## 📊 Project Status

- [x] Initial setup
- [x] Chat functionality
- [x] Brand styling
- [x] Watermark integration
- [x] Docker containerization
- [ ] Web search integration
- [ ] User authentication
- [ ] Conversation history storage
- [ ] Analytics and monitoring
- [ ] Multi-language support

---

## 🚀 Roadmap

### Version 1.0 (Current)
- ✅ Basic chat functionality
- ✅ Branded interface
- ✅ Docker deployment
- ✅ Markdown support

### Version 1.1 (Upcoming)
- 🔄 Web search integration
- 🔄 Conversation history
- 🔄 Multiple model selection

---

Made with ❤️ for the MagnifiScience Centre

---

**Happy coding! 🚀**