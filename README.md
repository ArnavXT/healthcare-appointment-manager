# Healthcare Appointment Manager

A modern, full-stack healthcare appointment booking system built with a decoupled MERN architecture (Express backend, Vite/React frontend, PostgreSQL database). It features role-based access control, AI-powered summaries (via Gemini 1.5 Flash), and automatic Google Calendar integration.

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Setup Guide](#setup-guide)
3. [Environment Variables (.env.example)](#environment-variables)
4. [Database Schema Overview](#database-schema-overview)
5. [API Documentation](#api-documentation)
6. [LLM Prompts (Gemini)](#llm-prompts-gemini)
7. [Google Calendar Setup](#google-calendar-setup)

---

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS (for glassmorphism UI)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (Neon.tech serverless), Prisma ORM
- **AI Integration**: `@google/generative-ai` (Gemini 1.5 Flash)
- **Authentication**: JWT with Role-Based Access Control (Admin, Doctor, Patient)

---

## Setup Guide

### 1. Prerequisites
- Node.js (v18+)
- A PostgreSQL database URL (e.g., from Neon.tech)
- Gemini API Key
- Google Cloud Project with Calendar API enabled (OAuth credentials)

### 2. Backend Setup
1. Open terminal in the `backend/` directory.
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your keys.
4. Run `npx prisma db push` to generate the tables.
5. Run `npm run dev` to start the server on `localhost:5000`.

### 3. Frontend Setup
1. Open terminal in the `frontend/` directory.
2. Run `npm install`
3. Run `npm run dev` to start the frontend on `localhost:3000`.

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# JWT Secret for Auth
JWT_SECRET="your_super_secret_key"

# Gemini LLM Integration
GEMINI_API_KEY="AIzaSy..."

# Email Notifications (Nodemailer)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Google Calendar OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"
GOOGLE_REFRESH_TOKEN="1//04..."
```

---

## Database Schema Overview
The database is managed by Prisma and contains the following core models:

- **User**: Core authentication table (`id`, `email`, `password`, `role`).
- **Role Enum**: `ADMIN`, `DOCTOR`, `PATIENT`.
- **DoctorProfile**: Links to `User`. Contains `specialization`, `workingHours`, `slotDuration`, and an array of `leaveDays`.
- **PatientProfile**: Links to `User`.
- **Appointment**: Links `patientId` and `doctorId`. Contains `date`, `status` (HOLD, SCHEDULED, COMPLETED, CANCELLED), `symptoms`, `doctorNotes`, `prescription`. 
  - *Crucial Constraint*: `@@unique([doctorId, date])` completely prevents double-booking at the database level.
  - *JSON Fields*: Stores AI outputs natively in `preVisitSummary` and `postVisitSummary`.

---

## API Documentation

### Auth & Users
- `POST /api/auth/register` - Creates a Patient account.
- `POST /api/auth/login` - Returns JWT token and role.

### Patient Routes (Requires `PATIENT` role)
- `GET /api/patient/doctors` - Fetches all doctors.
- `POST /api/patient/hold` - Puts a slot on a 10-minute hold to prevent race conditions.
- `POST /api/patient/book` - Confirms the hold, triggers LLM pre-visit summary, sends emails, and creates Calendar event.
- `GET /api/patient/appointments` - Fetches user's appointments.

### Doctor Routes (Requires `DOCTOR` role)
- `GET /api/doctor/appointments` - Fetches doctor's schedule.
- `POST /api/doctor/appointments/:id/summary` - Submits notes, triggers LLM post-visit summary, emails patient.

### Admin Routes (Requires `ADMIN` role)
- `GET /api/admin/stats` - Fetches system counts.
- `POST /api/admin/doctors` - Securely creates a new Doctor profile.
- `POST /api/admin/doctors/:id/leave` - Marks a doctor on leave, cancels conflicting appointments, emails patients, and drops calendar events.

---

## LLM Prompts (Gemini)
The system utilizes Gemini 1.5 Flash to automatically process clinical text. Fallback logic exists to prevent system crashes if the LLM is down.

**Pre-Visit Prompt:**
> "Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Format as JSON with keys: urgency, chiefComplaint, questions. Symptoms: {symptoms}"

**Post-Visit Prompt:**
> "Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps. Format as JSON with keys: patientFriendlySummary, medicationSchedule (array of strings), followUp. Notes: {notes}"

---

## Google Calendar Setup
To enable automatic calendar invitations for doctors and patients:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a Project and enable the **Google Calendar API**.
3. Create **OAuth 2.0 Client IDs** (Desktop App or Web App).
4. Extract the `Client ID` and `Client Secret` and paste them into your `.env`.
5. Use Google's OAuth Playground to generate a **Refresh Token** with the `https://www.googleapis.com/auth/calendar` scope.
6. Paste the `Refresh Token` into your `.env`. The backend `calendar.js` will automatically use this to insert/delete events seamlessly.
