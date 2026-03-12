# DeepStegAI: Cinematic Intelligence Suite

DeepStegAI is a secure information hiding (steganography) and AI-driven detection (steganalysis) platform.
It uses an advanced PyTorch Spatial Rich Model CNN for detecting anomalies and an adaptive edge algorithm for hiding data securely.

This repository contains the split modern architecture: a React built frontend and a Python Flask backend API.

## 📁 Repository Structure

* `backend/`: Core AI logic, steganography engines, and the API-only Flask server.
* `frontend/`: Modern React (Vite+TS) UI using TailwindCSS and Three.js.

---

## 🚀 Getting Started

To run the DeepStegAI suite locally, you need two terminals—one for the backend API and one for the frontend UI.

### 1. Running the API Backend

The backend provides the AI detection models and embedding algorithms on port 5000.

```bash
# Terminal 1
cd backend
python app.py
```

*The backend now acts purely as a JSON API layer.*

### 2. Running the React Frontend

The frontend provides the main "Obsidian Industrial" interface.

```bash
# Terminal 2
cd frontend
npm install   # Only needed the first time
npm run dev
```

The frontend will start at `http://localhost:5173`. Opening this URL in your browser will automatically route API calls to the backend running on port 5000.

---

## 🛠️ Technology Stack
- **Frontend UI**: React 18, Vite, TypeScript, TailwindCSS, Zustand, React-Three-Fiber
- **Backend API**: Python 3.10+, Flask
- **Deep Learning**: PyTorch (SRM-CNN Architecture)
- **Security**: AES-256 (GCM Mode) & SHA-256

*Powered by DeepStegAI Research Group*
