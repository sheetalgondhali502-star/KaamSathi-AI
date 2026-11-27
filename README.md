
# KaamSathi AI 🏭🎙️

### A Multilingual Voice-First Factory Assistant for Indian MSMEs

## 🚀 About the Project

KaamSathi AI is a voice-first factory assistant designed to help factory workers report machine problems and production issues easily using their voice.

Workers can report issues without typing long messages. Supervisors can view submitted reports through a dashboard and monitor reported problems.

## 🎯 Problem Statement

Factory workers often face difficulties reporting machine problems during busy production hours. Manual reporting can consume time and important information may be missed.

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
- Bun
- Docker

## 🗣️ Voice Technology

The application uses browser-based speech recognition where supported. It also provides text input as a fallback.

Issue details are extracted using keyword-based rules.

## ▶️ Run Locally

Requirements:
- Bun
- Git

```bash
git clone https://github.com/sheetalgondhali502-star/kaamsathi-factory-assistant.git
cd kaamsathi-factory-assistant
bun install
bun run dev
```

## 🐳 Run with Docker

```bash
docker compose up --build
```

Open:

http://localhost:3000

## 🔐 Data Storage

The application includes browser-based storage functionality. Cloud storage availability depends on the configured Supabase integration.

## 🌟 Project Goal

Our goal is to make factory communication simpler, faster and more accessible through voice technology.

## 👩‍💻 Built for

India Runs on Voice Hackathon 2026

**Project Name: KaamSathi AI**


