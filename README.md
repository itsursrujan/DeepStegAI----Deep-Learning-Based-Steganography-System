# DeepStegAI: Enhanced Steganography & Detection Ecosystem

DeepStegAI is a dual-layered steganography platform that combines traditional adaptive embedding techniques with deep learning-based steganalysis. It offers a secure way to hide information within images while providing a robust verification system to detect hidden data.

## 🔥 Key Features

- **Adaptive Edge Steganography**: Dynamic bit-rate embedding that prioritizes high-variance (edge) regions for maximum stealth.
- **AES-256 Encryption**: All hidden payloads are encrypted with industry-standard AES-256 using user passwords and recovery tokens.
- **Deep Learning Steganalysis**: A built-in AI engine trained to detect LSB and Adaptive embedding with high accuracy.
- **Dual User Interface**:
  - **Flask Web App**: Professional dashboard with batch processing and admin controls.
  - **Streamlit App**: Research-focused interface with granular AI probability analysis.
- **Comprehensive Verification**: A modular testing suite covering 14 critical modules including security fuzzing and load testing.

## 🚀 Quick Start

### 1. Installation
```powershell
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Running the Apps
- **Flask (Main UI)**: `python web_app/app.py` -> Open http://localhost:5000
- **Streamlit (Research)**: `streamlit run app_streamlit.py`

### 3. Running Tests
```powershell
# Run the full automated suite
python run_tests.py --suite all
```

## 📂 Project Structure
- `/tests`: Modular test suite (Unit, Integration, Security, Performance).
- `/web_app`: Flask backend and frontend assets.
- `adaptive_engine.py`: Core logic for edge-based embedding.
- `steganalysis_model.py`: Architecture for the deep learning detector.
- `crypto_utils.py`: Secure AES and signature logic.

## 🛡️ Security
Pay attention to the **Recovery Token** provided during the "Hide" process. If you lose your password, this token is the only way to recover your data.

---
*Developed for Major Project Phase-I: Deep Learning for Steganography Detection.*
