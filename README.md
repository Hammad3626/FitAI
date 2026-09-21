# FitAI — AI-Powered Fitness Guidance Platform

A complete, modern, beginner-friendly fitness web application rebuilt with **React.js**, **JavaScript**, **Tailwind CSS**, **Node.js**, **Express.js**, and **MongoDB**.

---

## Tech Stack Overview

- **Frontend**: React 18, JavaScript (ES6+), Tailwind CSS, React Router v6, Lucide Icons, React Markdown.
- **Backend**: Node.js, Express.js, JWT Authentication, bcrypt password hashing.
- **Database**: MongoDB with Mongoose ODM.
- **AI Coach**: FitAI Conversational Engine (supports external OpenAI/Lovable API or built-in intelligent coach rule engine).

---

## Directory Structure

```text
Final Project/
│
├── frontend/
│   ├── public/
│   │   ├── favicon.ico
│   │   └── robots.txt
│   ├── src/
│   │   ├── assets/
│   │   │   └── hero-athlete.jpg
│   │   ├── components/
│   │   │   ├── CoachPanel.jsx
│   │   │   ├── FloatingChat.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── RoutineBuilderChat.jsx
│   │   │   ├── RoutineDetail.jsx
│   │   │   └── Toast.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── data/
│   │   │   └── fitnessData.js
│   │   ├── pages/
│   │   │   ├── About.jsx
│   │   │   ├── Auth.jsx
│   │   │   ├── Chatbot.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── Nutrition.jsx
│   │   │   └── Workouts.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── fitnessController.js
│   │   └── routineController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── migration/
│   │   ├── migrateAll.js
│   │   └── seedData.json
│   ├── models/
│   │   ├── CustomRoutine.js
│   │   ├── FitnessData.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── fitnessRoutes.js
│   │   └── routineRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── .env.example
└── README.md
```

---

## Quick Start Guide

### 1. Backend Setup

1. Open a terminal and navigate to `Final Project/backend`:
   ```bash
   cd "Final Project/backend"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. (Optional) Run database migration / seed:
   ```bash
   npm run migrate
   ```
5. Start the backend server:
   ```bash
   npm start
   ```
   The backend starts at `http://localhost:5000`.

---

### 2. Frontend Setup

1. Open a separate terminal and navigate to `Final Project/frontend`:
   ```bash
   cd "Final Project/frontend"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend runs at `http://localhost:3000`.

---

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new user (`email`, `password`, `displayName`).
- `POST /api/auth/login` — Sign in and receive JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.

### Fitness Data
- `GET /api/fitness-data` — Get current user's goals, hydration, workout counts, and saved workouts.
- `PUT /api/fitness-data` — Update fitness goals and statistics.

### Custom Routines
- `GET /api/routines` — Get all generated routines for the logged-in user.
- `POST /api/routines` — Save a custom routine.
- `PUT /api/routines/:id` — Update routine completion and exercise checklists.
- `DELETE /api/routines/:id` — Delete a routine.
- `DELETE /api/routines/cycle/:cycleId` — Delete all routines in a weekly cycle.

### AI Coach & Routine Generation
- `POST /api/chat` — Conversational fitness coach responding with structured, scannable advice.
- `POST /api/chat/generate-routine` — Generate tailored markdown workout routine.

---

## Features

1. **User Authentication & Profiles**: Secure JWT auth with bcrypt password hashing.
2. **Interactive Dashboard**: Track goals, log workouts, update hydration, and manage saved routines.
3. **Curated & Custom Workouts**: Hand-picked starter routines + AI-generated multi-day splits.
4. **Routine Detail Runner**: Exercise checklists with real-time progress bar, cycle tracking, and HTML printing.
5. **Interactive Routine Builder**: 13-question step-by-step questionnaire.
6. **BMI Calculator**: Real-time BMI calculator with health classification indicators.
7. **24/7 AI Coach**: Floating chat bubble and dedicated AI Coach page.
8. **Responsive Design**: Dark theme with Midnight Indigo glassmorphic UI across all screen sizes.
