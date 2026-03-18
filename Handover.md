# DeepStegAI-V2 System Architecture & Introspection 🛰️🛡️

This document provides a deep technical analysis of the **DeepStegAI-V2** platform, structured as a handover for AI agents to understand, maintain, and improve the system.

---

## 1. SYSTEM OVERVIEW
*   **Project**: DeepStegAI-V2 (Cinematic Forensic Intelligence Suite).
*   **Problem Solved**: Provides a secure platform for **Steganography** (hiding data in images) and **Steganalysis** (AI-powered detection of hidden data). It also manages a credit-based economy for AI processing.
*   **Users**: Security researchers, digital forensics experts, and privacy-conscious users.

---

## 2. ARCHITECTURE BREAKDOWN

### 🛠️ Frontend (React & Interactive Visuals)
*   **Framework**: React 18 + Vite.
*   **State Management**: `Zustand` (Persistence via `localStorage`).
*   **Animation/UI**: `Framer Motion` for cinematic transitions; `Lucide React` for iconography.
*   **3D Experience**: `@react-three/fiber` and `@react-three/drei` for the "Neural Scanner" visuals.
*   **Flow**: Client-side routing via `react-router-dom`. Protected routes require a valid JWT stored in state.

### ⚙️ Backend (Flask & Neural Model)
*   **Framework**: Flask (Python 3.10+).
*   **Authentication**: JWT-based with a `@token_required` decorator. Passwords hashed via `bcrypt`.
*   **AI Engine**: `PyTorch` model (`stego_model.pth`) loaded into memory on startup. 
*   **Image Processing**: `PIL` (Pillow) and `numpy`.
*   **Services Layer**: Business logic separated into `FileService`, `AnalysisService`, and `CreditService`.

### 🐘 Database (PostgreSQL)
*   **Type**: Relational (PostgreSQL).
*   **ORM**: SQLAlchemy with `SessionLocal` scoping.
*   **Schema**:
    *   `users`: ID, Email, Password, Credits (Integer), Metadata.
    *   `files`: Metadata for uploaded images (Path, Size, UserID).
    *   `analysis_results`: Forensic reports (Verdict, AI Score, Metadata).
    *   `credit_transactions`: History of credit adjustments.

### 📬 External Services
*   **SMTP**: Gmail SMTP (Port 587/TLS) using Google App Passwords.
*   **Integration**: Handles "Forgot Password" tokens and "Support Message" receipts.

---

## 3. DATA FLOW (Step-by-Step)

### A. AI Steganalysis Pipeline
1.  **Request**: User uploads an image via `Analyze.tsx`. `Axios` sends a `FormData` POST to `/api/analyze`.
2.  **Auth/Credits**: Backend verifies JWT (`@token_required`) and checks if user has balance (`@require_credits`).
3.  **Deduction**: `CreditService` creates a transaction and subtracts 2 credits.
4.  **Processing**: 
    *   `PIL` loads the image.
    *   `steganalysis_model` runs the image through the PyTorch CNN.
5.  **Persistence**: `AnalysisService` saves the verdict (CLEAN/SUSPICIOUS/DETECTED) and raw score to PostgreSQL.
6.  **Response**: JSON envelope `{"success": true, "data": { verdict, credits, score... }}`.
7.  **UI Sync**: Frontend updates Zustand store; stats on `Overview.tsx` increment dynamically.

---

## 4. DEPLOYMENT & INFRASTRUCTURE
*   **Current State**: Local development (Vite dev server + Flask dev server).
*   **Configuration**: Entirely driven by `backend/.env`.
*   **Scaling**: 
    *   Stateless Backend: Can be horizontally scaled behind a Load Balancer (e.g., Nginx).
    *   Database: Cloud-managed PostgreSQL recommended for production.
*   **Storage**: Currently local filesystem. Production requires S3 or equivalent for `/uploads`.

---

## 5. KEY COMPONENTS & FILE STRUCTURE

### Backend Components
*   `backend/app.py`: Entry point; registers blueprints; initializes model.
*   `backend/routes/api.py`: Core logic for files, credits, and forensic analysis.
*   `backend/services/`: Pure business logic (DB interactions).
*   `backend/utils/email_utils.py`: SMTP-wrapper with whitespace robustness for passwords.

### Frontend Components
*   `frontend/src/services/api.ts`: Centralized `stegoApi` client with response interceptors for credit syncing.
*   `frontend/src/pages/Overview.tsx`: Main telemetry dashboard (fetches `getAnalysisList`).
*   `frontend/src/components/DashboardLayout.tsx`: Handles session restoration (`fetchUser`) and the "Digital Rain" background.

---

## 6. CURRENT LIMITATIONS / RISKS
1.  **File Storage**: Local `uploads/` folder is not persistent in multi-instance environments.
2.  **AI Latency**: Synchronous AI processing (PyTorch) might block workers during high load.
3.  **Security**: JWT secret is short in some `.env` examples; recommend 256-bit entropy.
4.  **Memory**: Loading large PyTorch models on CPU-only servers may lead to OOM or slow performance.

---

## 7. IMPROVEMENT SUGGESTIONS
*   **Architecture**: Transition to an asynchronous task queue (Celery + Redis) for AI processing.
*   **Deployment**: Containerize using Docker-Compose (Frontend, Backend, Postgres, Redis).
*   **Scalability**: Use an S3 wrapper for `FileService` to support cloud distribution.
*   **DX**: Implement a unified CLI for migrations and environment linting.

---

## 8. QUESTIONS FOR AI (Handover Focus)
1.  How can we optimize the `DigitalRain` and `Three.js` renders to reduce CPU usage without losing the "cinematic" feel?
2.  What is the most robust way to handle concurrent `CreditTransaction` updates to prevent race conditions during batch uploads?
3.  How should we implement "Incremental Model Training" in the backend to allow the model to learn from user-marked false positives?

---
*Generated by Antigravity AI Architecture Engine.*
