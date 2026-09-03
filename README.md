# 🌿 MindCare — Dementia Cognitive & Daily Routine Platform
> Cognitive stimulation, daily routine tracking, and caregiver assistance platform designed specifically for individuals living with dementia, Alzheimer's, or mild cognitive impairment (SIH 2026 Project).

---

## 🌟 Highlights & Dementia-Friendly Features

1. **Accessibility First (Dementia-Optimized UX)**:
   - **Calming Visual Theme**: Warm linen and sage green tones that minimize agitation and sensory overload.
   - **High-Contrast 1-Tap Toggle**: Ultra-high contrast dark mode (`#121212` with pure white text and vibrant accents) for elderly individuals with cataracts or low vision.
   - **Multi-Level Font Scaler**: Instant `A-`, `A`, and `A+` buttons to scale typography up to 140%.
   - **Extra-Large Tactile Touch Targets**: Buttons and routine cards are at least 54px high with rounded corners and distinct elevation.

2. **Temporal & Spatial Orientation**:
   - **Live Clock & Date**: Large digital time display with full day-of-week and month representation.
   - **Day Period Indicator**: Automatically identifies 🌅 Morning, ☀️ Afternoon, 🌆 Evening, or 🌙 Night to mitigate *sundowning* confusion.
   - **Reassurance Card**: *"You are safe at home"* reassurance message.
   - **Caregiver Quick Bar**: Displays active caregiver on duty with a 1-tap call button.

3. **Audio Assistance & Voice Narration**:
   - **Text-to-Speech (TTS)**: Built-in Web Speech API reads out routine instructions, daily orientations, and game prompts aloud.
   - **Gentle Acoustic Feedback**: Synthesized harmonious chime chords (Web Audio API) for completed activities with celebratory confetti.

4. **Interactive Cognitive Suite (4 Games)**:
   - **Memory Card Match**: Pairs familiar everyday items (apples, flowers, teacups, clocks) with adaptive deck sizing.
   - **Melody & Pattern Chimes**: Calming Simon-style musical chimes to stimulate working memory.
   - **Everyday Object Quiz**: Matching household items with their functional purpose.
   - **Daily Steps in Order**: Procedural memory game arranging steps like making tea or washing hands.
   - **Adaptive Difficulty**: Automatic real-time difficulty calculation (`accuracy >= 80% -> Level Up`, `< 50% -> Level Down`).

5. **Caregiver Monitoring Portal**:
   - **Routine Adherence Rate**: Real-time progress bar of completed vs pending activities.
   - **Cognitive Trend Analytics**: 7-day visual chart tracking patient accuracy and session scores.
   - **Management Tools**: Add and delete routine tasks, configure reminder alerts.
   - **Instant View Switcher**: Easily switch between Caregiver Portal and Patient View.

---

## 🚀 How to Run the Application

### Option 1: 1-Click Batch Runner (Windows)
Double-click `run-mindcare.bat` in this folder. It will:
1. Start the server on `http://localhost:5000`
2. Automatically launch the application in your default web browser

### Option 2: Terminal / Command Line
```powershell
# Navigate to the folder
cd mindcare-backend

# Start the server (serves both API & dementia frontend)
npm start
```
Then visit **`http://localhost:5000`** in your browser.

---

## ⚙️ Environment Configuration (`.env`)

The application works immediately out-of-the-box in standalone/demo mode, and connects seamlessly to MongoDB Atlas when configured:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# MongoDB connection string (Atlas or Local):
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mindcare
```

---

## 📡 API Overview

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/` | `GET` | Serves the Dementia Web Application |
| `/api/health` | `GET` | Backend server health check |
| `/api/auth/register` | `POST` | Register patient or caregiver user account |
| `/api/auth/login` | `POST` | Login and receive JWT token |
| `/api/auth/me` | `GET` | Current authenticated user profile |
| `/api/patients/me` | `GET` | Current patient profile details |
| `/api/routines/today/:patientId` | `GET` | Today's routine items |
| `/api/routines/:id/complete` | `PATCH` | Mark routine item as completed |
| `/api/games/result` | `POST` | Log game session & compute adaptive difficulty |
| `/api/games/history/:patientId` | `GET` | Historical cognitive game performance |
| `/api/caregiver/dashboard/:patientId` | `GET` | Aggregated dashboard, routine stats & charts |
| `/api/reminders/pending/:patientId` | `GET` | Fetch pending routine alerts |
