# 🌿 MindCare AI — Adaptive Cognitive Companion & Clinical Telemetry Platform

[![Deploy to Render](https://img.shields.io/badge/Render-Deployed%20Live-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://mindcare-ai.onrender.com)
[![React](https://img.shields.io/badge/React%2018-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js%2018-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas%20Cloud-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Cyber%20Obsidian-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SIH Prototype](https://img.shields.io/badge/SIH%202026-Problem%20SIH26003-FF9900?style=for-the-badge&logo=google-cloud&logoColor=white)]()

> **MindCare AI** is an intelligent full-stack assistive health prototype developed for **Smart India Hackathon (SIH26003)**. It bridges dementia patient daily support with real-time caregiver clinical monitoring using adaptive cognitive reinforcement, ambient orientation, voice synthesis, and telemetry tracking.

---

## 🚀 Live Demo & Evaluation Access

- 🌐 **Live Website**: [https://mindcare-ai-5mff.onrender.com](https://mindcare-ai-5mff.onrender.com) *(or your deployed Render link)*
- ⚡ **1-Click Demo Login**: The login page includes quick-fill buttons for both Patient and Caregiver test accounts.

| Role | Demo Email | Password | Primary Interface |
|---|---|---|---|
| **👤 Patient (Elderly)** | `patient.demo@mindcare.local` | `MindCareDemo123!` | Ambient Clock, Routine Checklist, 4 Brain Games |
| **🩺 Caregiver (Clinician)** | `caregiver.demo@mindcare.local` | `MindCareDemo123!` | Telemetry Dashboard, Recharts Analytics, Routine Management |

---

## ✨ Key Features

### 👤 1. Patient Companion Portal (Midnight Obsidian & Cyber-Purple)
- **🕰️ Ambient Orientation HUD**: Live digital clock with dynamic time-period detection (`🌅 Morning`, `☀️ Afternoon`, `🌆 Evening`, `🌙 Night`) and anxiety-reducing home safety reassurance.
- **📋 Interactive Daily Routine Checklist**: Time-filtered activity checklists with Web Speech TTS read-aloud, instant completion confirmation, and celebratory confetti animations.
- **🚨 One-Touch Emergency Anchor**: Reassurance modal displaying caregiver contact details and home location coordinates.
- **♿ Senior-Friendly Accessibility**: On-the-fly font size adjustment (A- / A / A+) and Cyber-Glow High Contrast mode.

### 🧠 2. Adaptive Cognitive Gaming Suite
- **🃏 Memory Card Match**: Visual recognition exercise with 3D flip animations and adaptive difficulty scaling.
- **🎵 Melody & Pattern Chimes**: Simon-style audio pattern memory utilizing browser Web Audio API sine-wave synthesizer.
- **🔍 Everyday Object Quiz**: Object identification quiz targeting daily recognition and functional cognitive retention.
- **📝 Daily Steps in Order**: Procedural memory sequencing task for familiar daily routines (e.g. making tea, bedtime prep).
- **🤖 Dynamic Adaptive Scaling**: Automatically adjusts difficulty level (Easy → Medium → Hard) based on historical accuracy.

### 🩺 3. Caregiver Telemetry & Clinical Console
- **📊 Real-time Adherence Gauge**: Tracks daily routine completion percentage and missed safety reminders.
- **📈 Cognitive Trends Telemetry**: Interactive Recharts graphs plotting precision trajectory and sessions by domain.
- **⏰ Live Routine & Reminder Dispatch**: Caregivers can add scheduled medicine/meal routines and safety alerts in real time.
- **🌙 Deep Clinical Dark Theme**: Modern obsidian theme with real-time patient session indicators.

---

## 🛠️ Architecture & Tech Stack

```
mindcare-ai/
├── frontend/                # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/            # Axios instance with JWT interceptors
│   │   ├── components/     # Confetti, Spinners, Accessibility tools
│   │   ├── context/        # AuthContext (Role-based JWT handling)
│   │   ├── hooks/          # Web Audio & Web Speech API synthesis
│   │   ├── layouts/        # Patient & Caregiver dual layout wrappers
│   │   └── pages/          # Authentication, Games, Telemetry Dashboards
├── config/                 # MongoDB Atlas connection setup
├── controllers/            # Auth, Patient, Game, Routine, Caregiver APIs
├── middleware/             # JWT authentication & Role-based access control
├── models/                 # Mongoose schemas (User, Patient, GameResult, Routine, Reminder)
├── routes/                 # REST API endpoints
└── server.js               # Unified Express server & static asset pipeline
```

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express.js, REST API
- **Database**: MongoDB Atlas Cloud, Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcrypt.js password hashing
- **Audio & Speech**: Browser Web Audio API & Web Speech Recognition/Synthesis

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/siddharth187-max/mindcare-ai.git
cd mindcare-ai
```

### 2. Install dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### 4. Seed demo accounts & run
```bash
# Seed demo accounts to MongoDB Atlas
npm run seed

# Build the frontend and launch unified production server
npm run build
node server.js
```

Open `http://localhost:5000` in your browser.

---

## 🏆 Smart India Hackathon 2026
- **Problem Statement**: SIH26003 — Cognitive Support & Assistive Platform for Dementia Care
- **Developer**: Siddharth Rathod
- **Repository**: [https://github.com/siddharth187-max/mindcare-ai](https://github.com/siddharth187-max/mindcare-ai)

---

## 📄 License
This project is licensed under the MIT License — feel free to use and build upon this prototype.
