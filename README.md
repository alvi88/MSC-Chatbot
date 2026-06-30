```markdown
# 🔬 MagnifiScience AI Chat Assistant

A modern, interactive chatbot powered by Ollama that serves as a science assistant for the MagnifiScience Centre. Built with React and Node.js, featuring a beautiful, branded interface with AI-powered responses.

![MagnifiScience Chatbot](https://via.placeholder.com/800x400/0A4B5C/FFFFFF?text=MagnifiScience+AI+Chat)

## ✨ Features

- 🤖 **AI-Powered Conversations** - Local Ollama integration for fast, private responses
- 🎨 **Branded Interface** - Styled to match the MagnifiScience Centre identity
- 💬 **Real-time Chat** - Smooth, responsive messaging experience
- 🌊 **Markdown Support** - Rich text formatting with code syntax highlighting
- 🔄 **Conversation Memory** - Maintains context throughout the chat session
- 🖼️ **Branded Watermark** - Custom logo appears on AI responses
- 🧹 **Chat Management** - Clear conversation with disabled button when empty
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- 🔌 **Ollama Integration** - Free, local AI models with web search capability

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Ollama](https://ollama.com/) (for local AI models)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/magnifiscience-chatbot.git
cd magnifiscience-chatbot
```

2. **Install dependencies**
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Set up environment variables**
```bash
# In the backend directory
cp .env.example .env
# Edit .env and add your configuration
```

4. **Install and run Ollama**
```bash
# Install Ollama (macOS)
brew install ollama

# Pull a model (recommended: qwen3 for tool calling)
ollama pull qwen3:4b

# Start Ollama server
ollama serve
```

5. **Run the application**
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm start
```

6. **Open your browser**
Navigate to `http://localhost:3000`

## 📁 Project Structure

```
magnifiscience-chatbot/
├── backend/
│   ├── server.js          # Express server with Ollama integration
│   ├── package.json       # Backend dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── public/
│   │   └── index.html     # HTML template
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── App.js         # Main application
│   │   ├── App.css        # Styling
│   │   └── index.js       # Application entry
│   ├── package.json       # Frontend dependencies
│   └── logo.png           # Brand logo
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_API_KEY=your_api_key_here  # Optional: for web search

# Server Configuration
PORT=3001
```

### Available Models

Recommended models for this application:

| Model | Description | Command |
|-------|-------------|---------|
| `llama3.1` | General purpose, good for chat | `ollama pull llama3.1` |
| `mistral` | Fast and capable | `ollama pull mistral` |
| `qwen3:4b` | Best for tool calling & web search | `ollama pull qwen3:4b` |
| `gemma2` | Google's open model | `ollama pull gemma2` |

## 🌐 Web Search Integration

To enable internet search capabilities:

1. **Get an Ollama API Key**
   - Create a free account at [ollama.com](https://ollama.com)
   - Generate an API key from your dashboard

2. **Set the API Key**
   ```bash
   export OLLAMA_API_KEY="your_api_key_here"
   ```

3. **Use a tool-capable model**
   ```bash
   ollama pull qwen3:4b
   ```

4. **The chatbot will automatically search the web when needed**

## 🎨 Customization

### Changing the Logo

1. Replace `frontend/src/logo.png` with your own logo
2. Maintain the same file name or update imports in `App.js`

### Modifying Colors

Update the CSS variables in `frontend/src/App.css`:

```css
/* Primary Colors */
:root {
  --primary-teal: #0A4B5C;
  --primary-yellow: #F5B041;
  --bg-light: #f8fafc;
  --text-dark: #1a2b3c;
}
```

### Adjusting AI Settings

In `frontend/src/App.js`, modify the `settings` object:

```javascript
const settings = {
  model: 'qwen3:4b',        // Change default model
  temperature: 0.7,          // 0-1 (higher = more creative)
  maxTokens: 512,            // Max response length
  systemPrompt: 'You are a helpful science assistant at the MagnifiScience Centre.'
};
```

## 🚢 Deployment

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# The build will be in frontend/build/
```

### Deploy with Docker

Create a `Dockerfile`:

```dockerfile
# Multi-stage build
FROM node:18 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM node:18
WORKDIR /app
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend/build ./frontend/build
EXPOSE 3001
CMD ["node", "backend/server.js"]
```

## 📸 Screenshots

| Empty State | Chat View |
|-------------|-----------|
| ![Empty State](https://via.placeholder.com/400x300/0A4B5C/FFFFFF?text=Empty+State) | ![Chat View](https://via.placeholder.com/400x300/0A4B5C/FFFFFF?text=Chat+View) |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## 🙏 Acknowledgments

- [MagnifiScience Centre](https://www.magnifiscience.org/) for the brand inspiration
- [Ollama](https://ollama.com/) for the amazing local AI platform
- [React](https://reactjs.org/) for the UI framework
- All open-source contributors

## 🆘 Support

For support, email [support@magnifiscience.org](mailto:support@magnifiscience.org) or open an issue in the repository.

## 📊 Project Status

- [x] Initial setup
- [x] Chat functionality
- [x] Brand styling
- [x] Watermark integration
- [ ] Web search integration
- [ ] User authentication
- [ ] Conversation history storage

---

Made with ❤️ for the MagnifiScience Centre
```

---

## 📝 Additional README Templates

### Option 1: Simple README (Minimal)

```markdown
# MagnifiScience AI Chat Assistant

AI-powered science chatbot for the MagnifiScience Centre.

## Installation

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Set up environment
cp backend/.env.example backend/.env

# Run
cd backend && npm start
cd ../frontend && npm start
```

## Tech Stack

- React.js
- Node.js/Express
- Ollama
- CSS3

## License

Proprietary - All rights reserved
```

### Option 2: Interactive README with Badges

```markdown
# 🔬 MagnifiScience AI Chat

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/magnifiscience-chatbot)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Node-18.x-339933.svg)](https://nodejs.org/)
[![Ollama](https://img.shields.io/badge/Ollama-0.1.x-000000.svg)](https://ollama.com/)

## Features

- 🤖 Local AI with Ollama
- 🎨 MagnifiScience branding
- 💬 Real-time chat
- 🌊 Markdown & code highlighting
- 🖼️ Branded watermarks
- 📱 Responsive design

## Quick Start

```bash
# Clone and install
git clone <repo>
cd magnifiscience-chatbot
npm run setup  # Custom setup script

# Start development
npm run dev
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

Proprietary
```

---

## 🔧 README Setup Script

Create a script to generate the README automatically:

```bash
#!/bin/bash
# generate-readme.sh

cat > README.md << 'EOF'
[Insert the complete README content from above]
EOF

echo "✅ README.md generated successfully!"
```

---

## ✅ Checklist

- [ ] Project name and description
- [ ] Installation instructions
- [ ] Configuration details
- [ ] Screenshots
- [ ] Tech stack
- [ ] Contributing guidelines
- [ ] License information
- [ ] Contact/support info
- [ ] Project status

Your README is now complete and ready to help users understand and set up your MagnifiScience Chatbot project!