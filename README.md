
# KaamSathi AI 🏭🎙️

### A Multilingual Voice-First Factory Assistant for Indian MSMEs

## 🚀 About the Project

KaamSathi AI is a voice-first factory assistant designed to help factory workers report machine problems and production issues easily using their voice.

Workers can report issues without typing long messages. Supervisors can view submitted reports through a dashboard and monitor reported problems.

## 🎯 Problem Statement

Factory workers often face difficulties reporting machine problems during busy production hours. Manual reporting can consume time, and important information may be missed.

## 💡 Our Solution

KaamSathi AI provides:

- Voice-based issue reporting.
- Simple worker-friendly interface.
- Machine and issue detail extraction.
- Worker confirmation before submission.
- Supervisor dashboard.
- Report status monitoring.

## 👷 Target Users

- Factory workers
- Production supervisors
- Maintenance teams
- Small and medium manufacturing industries (MSMEs)

## ⚙️ Technology Stack

- React
- TypeScript
- TanStack Start
- Tailwind CSS
- Browser Speech Recognition
- Supabase
- Bun
- Docker

## 🗣️ Voice Technology

The application uses browser-based speech recognition where supported. It also provides text input as a fallback.

Issue details are extracted using keyword-based rules.

## ▶️ Run Locally

### Requirements

- Bun
- Git

### Steps

```bash
git clone https://github.com/sheetalgondhali502-star/KaamSathi-AI.git
cd KaamSathi-AI
bun install
bun run dev
```

Open the application at:

http://localhost:3000

## 🐳 Run with Docker

Make sure Docker is installed and running.

```bash
docker compose up --build
```

Open the application at:

http://localhost:3000

## 🔐 Data Storage

KaamSathi AI includes Supabase integration for shared cloud storage.

If Supabase is unavailable or not configured, the application can use browser-based local storage as a fallback.

## 🌟 Project Goal

Our goal is to make factory communication simpler, faster, and more accessible through voice technology.

## 👩‍💻 Built for

India Runs on Voice Hackathon 2026

**Project Name: KaamSathi AI**

