# AI Study Assistant

An AI-powered study assistant built with Electron, React, and Node.js. Features include voice interaction, study tools, mental health tracking, and productivity features.

## Features

- 🤖 AI-powered study tools (summarization, flashcards, quizzes)
- 🎤 Voice input and text-to-speech
- 📊 Mental health tracking and analysis
- ⏰ Pomodoro timer and study planner
- 🔒 Secure authentication and data encryption
- 💾 Local-first architecture with SQLite

## Project Structure

```
ai-study-assistant/
├── electron/          # Electron main process
├── backend/           # Node.js backend server
├── frontend/          # React frontend
├── models/            # AI models (local)
└── data/              # Local data storage
```

## Getting Started

1. Install dependencies:
```bash
npm install
cd frontend && npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`

4. Start the development server:
```bash
npm run dev
```

## License

MIT

