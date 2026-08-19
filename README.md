# CDSS - Early Detection of Preeclampsia

A full-stack Clinical Decision Support System (CDSS) for the early detection and management of preeclampsia in antenatal clinics.

## Tech Stack
- **Backend**: Node.js, Express.js, Prisma ORM, PostgreSQL
- **Frontend**: React (Vite), React Router, Axios, Recharts
- **Auth**: JWT (JSON Web Tokens) with bcrypt
- **Design**: Custom pure CSS (cursor.com inspired minimalist B&W theme)

## Prerequisites
- Node.js (v18+)
- PostgreSQL installed and running on default port (5432)

## Setup Instructions

### 1. Database Setup
Create the PostgreSQL database manually:
```bash
createdb preeclampsia_cdss
# Or run in psql: CREATE DATABASE preeclampsia_cdss;
```

### 2. Backend Setup
```bash
cd backend
npm install
# The .env file should already have DATABASE_URL pointing to localhost postgres
npx prisma db push
npm run seed
npm run dev
```
*The backend will run on http://localhost:5000*

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on http://localhost:3000*

## Default Login Credentials
- **Admin**: `admin` / `admin123`
- **Doctor**: `dr.uwase` / `doctor123`
- **Nurse**: `n.keza` / `nurse123`

## Risk Scoring Engine Logic (Deterministic)
The system uses a rule-based engine capping at 100 points:
1. **Blood Pressure**: Severe (160/110) = 40 pts, High (140/90) = 25 pts, Elevated (130/85) = 10 pts
2. **Proteinuria**: 2+ or more = 20 pts, 1+ = 12 pts, trace = 5 pts
3. **Medical History**: Previous Preeclampsia (18), Chronic HTN (12), Kidney Disease (10), Diabetes (8)
4. **Other Factors**: BMI >= 30 (8), Family History (6), Age <20/>35 (5)

**Classification**:
- **HIGH** (>= 60 points)
- **MODERATE** (30 - 59 points)
- **LOW** (< 30 points)

*Note on assumptions: BMI is auto-calculated on the server. Dipstick values are normalized to a 0-4 dropdown for simplicity in the UI. Auth tokens are stored in localStorage for academic/demo scope. The chart groups data by absolute day.*
